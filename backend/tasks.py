from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task, RACIAssignment, ProjectMember, ProjectStage, Role, User, Notification, Project
from datetime import datetime
import pytz
from admin import is_admin
from marshmallow import Schema, fields, validate, ValidationError

tasks_bp = Blueprint('tasks', __name__)

class TaskCreateSchema(Schema):
    stage_id = fields.Int(required=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    priority = fields.Str(allow_none=True, validate=validate.OneOf(['low', 'medium', 'high']))
    is_completed = fields.Boolean(allow_none=True)
    deadline = fields.DateTime(allow_none=True, validate=lambda x: x >= datetime.now(pytz.UTC))

class TaskDependencySchema(Schema):
    dependencies = fields.List(fields.Int(), allow_none=True)

def check_cyclic_dependency(task_id, depends_on_task_id, visited=None):
    if visited is None:
        visited = set()
    if task_id in visited:
        return False
    visited.add(task_id)
    task = Task.query.get(task_id)
    for dep_id in task.depends_on_tasks:
        if dep_id == depends_on_task_id:
            return True
        if check_cyclic_dependency(dep_id, depends_on_task_id, visited.copy()):
            return True
    return False

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    current_user_id = int(get_jwt_identity())
    try:
        schema = TaskCreateSchema()
        data = schema.load(request.get_json())
        
        stage = ProjectStage.query.get_or_404(data['stage_id'])
        if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=stage.project_id).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
        
        task = Task(
            stage_id=data['stage_id'],
            title=data['title'],
            description=data.get('description'),
            priority=data.get('priority', 'medium'),
            is_completed=data.get('is_completed', False),
            deadline=data.get('deadline'),
            created_at=datetime.now(pytz.UTC),
            updated_at=datetime.now(pytz.UTC)
        )
        db.session.add(task)
        db.session.commit()
        
        project = Project.query.get(stage.project_id)
        if project.created_by != current_user_id:
            notification = Notification(
                user_id=project.created_by,
                message=f"Создана задача '{task.title}' в проекте {project.title}",
                related_entity='task',
                related_entity_id=task.id,
                created_at=datetime.now(pytz.UTC)
            )
            db.session.add(notification)
            db.session.commit()
        
        return jsonify({'id': task.id}), 201
    
    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка", "details": str(e)}), 500

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    stage_id = request.args.get('stage_id')
    project_id = request.args.get('project_id')
    current_user_id = int(get_jwt_identity())
    
    query = Task.query.join(ProjectStage)
    if stage_id:
        query = query.filter(Task.stage_id == stage_id)
    elif project_id:
        query = query.filter(ProjectStage.project_id == project_id)
    
    if project_id and not ProjectMember.query.filter_by(user_id=current_user_id, project_id=project_id).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    tasks = query.all()
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'stage_id': t.stage_id,
        'priority': t.priority,
        'is_completed': t.is_completed,
        'deadline': t.deadline.isoformat() if t.deadline else None,
        'depends_on_tasks': t.depends_on_tasks
    } for t in tasks])

@tasks_bp.route('/<int:task_id>/raci', methods=['PUT'])
@jwt_required()
def update_task_raci(task_id):
    current_user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    stage = ProjectStage.query.get(task.stage_id)
    project = Project.query.get(stage.project_id)
    
    if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=stage.project_id).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    if not is_admin(current_user_id) and project.created_by != current_user_id:
        return jsonify({'error': 'Только руководитель проекта или админ могут изменять RACI'}), 403
    
    try:
        data = request.get_json()
        if not isinstance(data.get('assignments'), list):
            return jsonify({'error': 'Поле assignments должно быть списком'}), 400
        
        RACIAssignment.query.filter_by(task_id=task.id).delete()
        
        for assignment in data['assignments']:
            if not all(k in assignment for k in ['user_id', 'role_id']):
                return jsonify({'error': 'Некорректный формат назначения RACI'}), 400
            raci = RACIAssignment(
                task_id=task.id,
                user_id=assignment['user_id'],
                role_id=assignment['role_id'],
                assigned_by=current_user_id,
                assigned_at=datetime.now(pytz.UTC),
                created_at=datetime.now(pytz.UTC),
                updated_at=datetime.now(pytz.UTC)
            )
            db.session.add(raci)
        
        db.session.commit()
        return jsonify({'message': 'RACI матрица обновлена'})
    
    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка", "details": str(e)}), 500

@tasks_bp.route('/<int:task_id>/raci', methods=['GET'])
@jwt_required()
def get_task_raci(task_id):
    task = Task.query.get_or_404(task_id)
    current_user_id = int(get_jwt_identity())
    stage = ProjectStage.query.get(task.stage_id)
    
    if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=stage.project_id).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    raci_assignments = RACIAssignment.query.filter_by(task_id=task.id).all()
    return jsonify([{
        'user_id': a.user_id,
        'username': User.query.get(a.user_id).username,
        'role': Role.query.get(a.role_id).title
    } for a in raci_assignments])

@tasks_bp.route('/raci_matrix', methods=['GET'])
@jwt_required()
def get_raci_matrix():
    stage_id = request.args.get('stage_id')
    project_id = request.args.get('project_id')
    current_user_id = int(get_jwt_identity())
    
    if not stage_id and not project_id:
        return jsonify({'error': 'Необходимо указать stage_id или project_id'}), 400
    
    if project_id:
        if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=project_id).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
        tasks = Task.query.join(ProjectStage).filter(ProjectStage.project_id == project_id).all()
    elif stage_id:
        stage = ProjectStage.query.get_or_404(stage_id)
        if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=stage.project_id).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
        tasks = Task.query.filter_by(stage_id=stage_id).all()
    
    project_id = project_id or stage.project_id
    users = ProjectMember.query.filter_by(project_id=project_id).join(User).all()
    
    matrix = []
    for task in tasks:
        row = []
        raci_assignments = {a.user_id: a.role_id for a in RACIAssignment.query.filter_by(task_id=task.id).all()}
        for user in users:
            role_id = raci_assignments.get(user.user_id)
            role_title = Role.query.get(role_id).title if role_id else ""
            row.append(role_title)
        matrix.append(row)
    
    return jsonify({
        'tasks': [{'task_id': t.id, 'title': t.title} for t in tasks],
        'users': [{'user_id': u.user_id, 'username': u.user.username} for u in users],
        'matrix': matrix
    })

@tasks_bp.route('/<int:task_id>/status', methods=['PATCH'])
@jwt_required()
def update_task_status(task_id):
    data = request.get_json()
    task = Task.query.get_or_404(task_id)
    current_user_id = int(get_jwt_identity())
    stage = ProjectStage.query.get(task.stage_id)
    
    if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=stage.project_id).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    if not is_admin(current_user_id):
        roles = Role.query.filter(Role.title.in_(['R', 'A'])).all()
        role_ids = [role.id for role in roles]
        if not RACIAssignment.query.filter(RACIAssignment.task_id == task.id, RACIAssignment.user_id == current_user_id, RACIAssignment.role_id.in_(role_ids)).first():
            return jsonify({'error': 'Только исполнитель, ответственный или админ могут изменять статус'}), 403
    
    if 'is_completed' in data and data['is_completed']:
        for dep_id in task.depends_on_tasks:
            dep_task = Task.query.get(dep_id)
            if dep_task and not dep_task.is_completed:
                return jsonify({'error': f'Задача "{task.title}" зависит от незавершенной задачи "{dep_task.title}"'}), 400
    
    if 'is_completed' in data:
        task.is_completed = data['is_completed']
    db.session.commit()
    return jsonify({'message': 'Статус задачи обновлен'})

@tasks_bp.route('/<int:task_id>/dependencies', methods=['GET'])
@jwt_required()
def get_task_dependencies(task_id):
    task = Task.query.get_or_404(task_id)
    current_user_id = int(get_jwt_identity())
    stage = ProjectStage.query.get(task.stage_id)
    
    if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=stage.project_id).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    dependencies = [{'id': dep_id, 'title': Task.query.get(dep_id).title if Task.query.get(dep_id) else 'Неизвестно'} for dep_id in task.depends_on_tasks]
    return jsonify(dependencies)

@tasks_bp.route('/<int:task_id>/dependencies', methods=['PUT'])
@jwt_required()
def update_task_dependencies(task_id):
    current_user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    stage = ProjectStage.query.get(task.stage_id)
    
    if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=stage.project_id).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    if not is_admin(current_user_id):
        accountable_role = Role.query.filter_by(title='A').first()
        if not RACIAssignment.query.filter_by(task_id=task.id, user_id=current_user_id, role_id=accountable_role.id).first():
            return jsonify({'error': 'Только ответственный или админ могут изменять зависимости'}), 403
    
    try:
        schema = TaskDependencySchema()
        data = schema.load(request.get_json())
        dependencies = data.get('dependencies', [])
        
        for dep_id in dependencies:
            dep_task = Task.query.get(dep_id)
            if not dep_task or dep_task.stage_id != task.stage_id:
                return jsonify({'error': f'Задача с ID {dep_id} не найдена в этапе'}), 400
            if dep_id == task.id:
                return jsonify({'error': 'Задача не может зависеть от самой себя'}), 400
            if check_cyclic_dependency(task.id, dep_id):
                return jsonify({'error': f'Добавление зависимости на задачу {dep_id} создает цикл'}), 400
        
        task.depends_on_tasks = dependencies
        db.session.commit()
        return jsonify({'message': 'Зависимости задачи обновлены'})
    
    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка", "details": str(e)}), 500
    
@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    current_user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    stage = ProjectStage.query.get(task.stage_id)
    if not is_admin(current_user_id):
        accountable_role = Role.query.filter_by(title='A').first()
        if not RACIAssignment.query.filter_by(task_id=task.id, user_id=current_user_id, role_id=accountable_role.id).first():
            return jsonify({'error': 'Только ответственный или админ могут удалять задачи'}), 403
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': f'Задача {task.title} удалена'})