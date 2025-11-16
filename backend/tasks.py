from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task, RACIAssignment, ProjectMember, ProjectStage, Role, Notification, TaskDependency
from datetime import datetime
from admin import is_admin
from marshmallow import Schema, fields, validate, ValidationError
from sqlalchemy.sql import func
from datetime import timedelta

tasks_bp = Blueprint('tasks', __name__)

class TaskDependencySchema(Schema):
    dependencies = fields.List(fields.Str(), allow_none=True)  
    
def check_cyclic_dependency(task_id, depends_on_task_id, db_session):
    """Проверка на циклические зависимости с помощью рекурсивного поиска."""
    visited = set()
    def has_cycle(current_task_id, target_task_id):
        if current_task_id in visited:
            return False
        visited.add(current_task_id)
        dependencies = TaskDependency.query.filter_by(task_id=current_task_id).all()
        for dep in dependencies:
            if dep.depends_on_task_id == target_task_id:
                return True
            if has_cycle(dep.depends_on_task_id, target_task_id):
                return True
        return False
    
    return has_cycle(depends_on_task_id, task_id)

class TaskCreateSchema(Schema):
    stage_id = fields.Int(required=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    priority = fields.Str(allow_none=True, validate=validate.OneOf(['low', 'medium', 'high']))
    is_completed = fields.Boolean(allow_none=True)
    deadline = fields.DateTime(allow_none=True, validate=lambda x: x >= datetime.utcnow())

class TaskUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    priority = fields.Str(allow_none=True, validate=validate.OneOf(['low', 'medium', 'high']))
    deadline = fields.DateTime(allow_none=True)

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    """Создание новой задачи в этапе проекта (доступно участникам проекта)."""
    current_user_id = int(get_jwt_identity())
    
    try:
        schema = TaskCreateSchema()
        data = schema.load(request.get_json())
        
        stage = ProjectStage.query.get_or_404(data['stage_id'])
        if not ProjectMember.query.filter_by(
            user_id=current_user_id,
            project_id=stage.project_id
        ).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
        
        task = Task(
            stage_id=data['stage_id'],
            title=data['title'],
            description=data.get('description'),
            priority=data.get('priority', 'medium'),
            is_completed=data.get('is_completed', False),
            deadline=data.get('deadline')
        )
        db.session.add(task)
        db.session.commit()
        
        dependencies = Task.query.filter(
            Task.stage_id == data['stage_id'],
            Task.id != task.id,
            Task.is_completed == False,
            Task.created_at < task.created_at
        ).all()
        
        for dep_task in dependencies:
            dependency = TaskDependency(
                task_id=task.id,
                depends_on_task_id=dep_task.id
            )
            db.session.add(dependency)
        
        if data.get('deadline'):
            notification = Notification(
                user_id=current_user_id,
                message=f"Создана задача '{task.title}' с дедлайном {task.deadline.isoformat()}",
                related_entity='task',
                related_entity_id=task.id,
                created_at=datetime.utcnow()
            )
            db.session.add(notification)
            
            accountable_users = RACIAssignment.query.filter_by(
                stage_id=stage.id,
                role_id=Role.query.filter_by(title='A').first().id
            ).all()
            for assignment in accountable_users:
                if assignment.user_id != current_user_id:
                    notification = Notification(
                        user_id=assignment.user_id,
                        message=f"Создана задача '{task.title}' с дедлайном {task.deadline.isoformat()} в этапе {stage.title}",
                        related_entity='task',
                        related_entity_id=task.id,
                        created_at=datetime.utcnow()
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
    "Получение списка задач (доступно участникам проекта)."
    stage_id = request.args.get('stage_id')
    project_id = request.args.get('project_id')
    current_user_id = int(get_jwt_identity())
    
    query = Task.query.join(ProjectStage)
    
    if stage_id:
        query = query.filter(Task.stage_id == stage_id)
    elif project_id:
        query = query.filter(ProjectStage.project_id == project_id)
    
    if project_id and not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=project_id
    ).first():
        return jsonify({'error': 'Доступ закрыт'}), 403

    
    tasks = query.all()
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'stage_id': t.stage_id,
        'priority': t.priority,
        'is_completed': t.is_completed,
        'deadline': t.deadline.isoformat() if t.deadline else None
    } for t in tasks])

@tasks_bp.route('/<int:task_id>', methods=['PATCH'])
@jwt_required()
def update_task(task_id):
    """Редактирование задачи (доступно участникам проекта)."""
    current_user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    
    stage = ProjectStage.query.get(task.stage_id)
    if not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=stage.project_id
    ).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    try:
        schema = TaskUpdateSchema()
        data = schema.load(request.get_json(), partial=True)
        
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'priority' in data:
            task.priority = data['priority']
        if 'deadline' in data:
            task.deadline = datetime.fromisoformat(data['deadline']) if data['deadline'] else None
        
        task.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Задача обновлена'})
    
    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка", "details": str(e)}), 500

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """Удаление задачи (доступно администратору)."""
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'message': 'Задача удалена'})

@tasks_bp.route('/<int:task_id>/raci', methods=['GET'])
@jwt_required()
def get_task_raci(task_id):
    """Получение RACI-матрицы для задачи (доступно участникам проекта)."""
    task = Task.query.get_or_404(task_id)
    current_user_id = int(get_jwt_identity())
    
    stage = ProjectStage.query.get(task.stage_id)
    if not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=stage.project_id
    ).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    raci_assignments = RACIAssignment.query.filter_by(stage_id=task.stage_id).all()
    return jsonify([{
        'user_id': a.user_id,
        'username': a.user.username,
        'role': a.role.title if a.role else None
    } for a in raci_assignments])

@tasks_bp.route('/<int:task_id>/raci', methods=['PUT'])
@jwt_required()
def update_task_raci(task_id):
    """Обновление RACI-матрицы для задачи (доступно ответственному по RACI или администратору)."""
    current_user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    
    stage = ProjectStage.query.get(task.stage_id)
    if not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=stage.project_id
    ).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    if not is_admin(current_user_id):
        if not RACIAssignment.query.filter_by(
            stage_id=stage.id,
            user_id=current_user_id,
            role_id=Role.query.filter_by(title='A').first().id
        ).first():
            return jsonify({'error': 'Только руководитель или админ могут изменять RACI'}), 403
    
    data = request.get_json()
    RACIAssignment.query.filter_by(stage_id=stage.id).delete()
    
    for assignment in data['assignments']:
        raci = RACIAssignment(
            stage_id=stage.id,
            user_id=assignment['user_id'],
            role_id=assignment['role_id']
        )
        db.session.add(raci)
    
    db.session.commit()
    return jsonify({'message': 'RACI матрица обновлена'})

@tasks_bp.route('/<int:task_id>/status', methods=['PATCH'])
@jwt_required()
def update_task_status(task_id):
    "Обновление статуса задачи (доступно ответственному за этап или администратору)."
    data = request.get_json()
    task = Task.query.get_or_404(task_id)
    current_user_id = int(get_jwt_identity())
    
    stage = ProjectStage.query.get(task.stage_id)
    if not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=stage.project_id
    ).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    if not is_admin(current_user_id):
        if not RACIAssignment.query.filter_by(
            stage_id=stage.id,
            user_id=current_user_id,
            role_id=Role.query.filter_by(title='A').first().id
        ).first():
            return jsonify({'error': 'Только руководитель или админ могут изменять статус задачи'}), 403
    
    if 'is_completed' in data and data['is_completed']:
        dependencies = TaskDependency.query.filter_by(task_id=task.id).all()
        for dep in dependencies:
            dep_task = Task.query.get(dep.depends_on_task_id)
            if not dep_task.is_completed:
                return jsonify({'error': f'Задача "{task.title}" не может быть завершена, так как зависимая задача "{dep_task.title}" не завершена'}), 400
    
    if 'is_completed' in data:
        task.is_completed = data['is_completed']
   
    db.session.commit()
    return jsonify({'message': 'Статус задачи обновлен'})

@tasks_bp.route('/<int:task_id>/dependencies', methods=['GET'])
@jwt_required()
def get_task_dependencies(task_id):
    "Получение списка зависимостей задачи (доступно участникам проекта)."
    task = Task.query.get_or_404(task_id)
    current_user_id = int(get_jwt_identity())
    
    stage = ProjectStage.query.get(task.stage_id)
    if not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=stage.project_id
    ).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    dependencies = TaskDependency.query.filter_by(task_id=task.id).all()
    return jsonify([{
        'id': dep.depends_on_task_id,
        'title': Task.query.get(dep.depends_on_task_id).title
    } for dep in dependencies])

@tasks_bp.route('/<int:task_id>/dependencies', methods=['PUT'])
@jwt_required()
def update_task_dependencies(task_id):
    """Обновление зависимостей задачи (доступно ответственному за этап или администратору)."""
    current_user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    
    stage = ProjectStage.query.get(task.stage_id)
    if not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=stage.project_id
    ).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    if not is_admin(current_user_id):
        if not RACIAssignment.query.filter_by(
            stage_id=stage.id,
            user_id=current_user_id,
            role_id=Role.query.filter_by(title='A').first().id
        ).first():
            return jsonify({'error': 'Только руководитель или админ могут изменять зависимости'}), 403
    
    try:
        schema = TaskDependencySchema()
        data = schema.load(request.get_json())
        
        dependencies = data.get('dependencies', [])
        dependency_tasks = []
        for dep_title in dependencies:
            dep_task = Task.query.filter_by(stage_id=task.stage_id, title=dep_title).first()
            if not dep_task:
                return jsonify({'error': f'Задача с названием "{dep_title}" не найдена в этапе'}), 400
            if dep_task.id == task.id:
                return jsonify({'error': 'Задача не может зависеть от самой себя'}), 400
            if check_cyclic_dependency(task.id, dep_task.id, db.session):
                return jsonify({'error': f'Добавление зависимости "{dep_title}" создаёт циклическую зависимость'}), 400
            dependency_tasks.append(dep_task)
        
        TaskDependency.query.filter_by(task_id=task.id).delete()
        
        for dep_task in dependency_tasks:
            dependency = TaskDependency(
                task_id=task.id,
                depends_on_task_id=dep_task.id
            )
            db.session.add(dependency)
        
        accountable_users = RACIAssignment.query.filter_by(
            stage_id=stage.id,
            role_id=Role.query.filter_by(title='A').first().id
        ).all()
        for assignment in accountable_users:
            if assignment.user_id != current_user_id:
                notification = Notification(
                    user_id=assignment.user_id,
                    message=f"Зависимости задачи '{task.title}' обновлены",
                    related_entity='task',
                    related_entity_id=task.id,
                    created_at=datetime.utcnow()
                )
                db.session.add(notification)
        
        db.session.commit()
        return jsonify({'message': 'Зависимости задачи обновлены'})
    
    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка", "details": str(e)}), 500