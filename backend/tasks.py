from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task, RACIAssignment, ProjectMember, ProjectStage, Role, Notification, TaskDependency, ProjectStatus, Project, File, TaskFile
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
    deadline = fields.DateTime(allow_none=True, validate=lambda x: x >= datetime.utcnow() if x else True)  

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
        project = Project.query.get(stage.project_id)
        
        if project.status == 'approved':
            if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=project.id).first():
                return jsonify({'error': 'Доступ закрыт'}), 403
        else:
            if not (current_user_id == project.created_by or is_admin(current_user_id)):
                return jsonify({'error': 'Доступ закрыт для черновика'}), 403
        
        task = Task(
            stage_id=stage.id,
            title=data['title'],
            description=data.get('description'),
            priority=data.get('priority', 'medium'),
            is_completed=data.get('is_completed', False),
            deadline=data.get('deadline')
        )
        db.session.add(task)
        db.session.commit()
        
        notification = Notification(
            user_id=current_user_id,
            message=f"Создана задача '{task.title}' в этапе {stage.title}",
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

@tasks_bp.route('/<int:task_id>', methods=['PATCH'])
@jwt_required()
def update_task(task_id):
    """Обновление задачи (доступно участникам проекта)."""
    current_user_id = int(get_jwt_identity())
    
    task = Task.query.get_or_404(task_id)
    stage = task.stage
    project = stage.project
    
    if project.status == 'approved':
        if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=project.id).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
    else:
        if not (current_user_id == project.created_by or is_admin(current_user_id)):
            return jsonify({'error': 'Доступ закрыт для черновика'}), 403
    
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
            task.deadline = data['deadline']
        
        task.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({"message": "Задача обновлена"})
    
    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка", "details": str(e)}), 500

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """Удаление задачи (доступно админу или создателю)."""
    current_user_id = int(get_jwt_identity())
    
    task = Task.query.get_or_404(task_id)
    stage = task.stage
    project = stage.project
    
    if project.status == 'approved':
        if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=project.id).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
        if not is_admin(current_user_id):
            return jsonify({"error": "Требуются права администратора"}), 403
    else:
        if not (current_user_id == project.created_by or is_admin(current_user_id)):
            return jsonify({'error': 'Доступ закрыт для черновика'}), 403
    
    try:
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Задача удалена"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Ошибка удаления", "details": str(e)}), 500

@tasks_bp.route('/<int:stage_id>/tasks', methods=['GET'])
@jwt_required()
def get_stage_tasks(stage_id):
    """Получение задач этапа (доступно участникам проекта)."""
    current_user_id = int(get_jwt_identity())
    
    stage = ProjectStage.query.get_or_404(stage_id)
    project = stage.project
    
    if project.status == 'approved':
        if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=project.id).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
    else:
        if not (current_user_id == project.created_by or is_admin(current_user_id)):
            return jsonify({'error': 'Доступ закрыт для черновика'}), 403
    
    tasks = Task.query.filter_by(stage_id=stage_id).all()
    
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'description': t.description,
        'priority': t.priority,
        'is_completed': t.is_completed,
        'deadline': t.deadline.isoformat() if t.deadline else None
    } for t in tasks])

@tasks_bp.route('/<int:task_id>/dependencies', methods=['PUT'])
@jwt_required()
def update_task_dependencies(task_id):
    """Обновление зависимостей задачи (доступно админу или ответственному)."""
    current_user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    stage = task.stage
    project = stage.project
    
    if project.status == 'approved':
        if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=project.id).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
    else:
        if not (current_user_id == project.created_by or is_admin(current_user_id)):
            return jsonify({'error': 'Доступ закрыт для черновика'}), 403
    
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    try:
        schema = TaskDependencySchema()
        data = schema.load(request.get_json())
        dependencies = data.get('dependencies', [])
        
        dependency_tasks = []
        for dep_title in dependencies:
            dep_task = Task.query.filter_by(title=dep_title, stage_id=stage.id).first()
            if not dep_task:
                return jsonify({'error': f'Задача "{dep_title}" не найдена в этапе'}), 404
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

@tasks_bp.route('/<int:stage_id>/raci', methods=['PUT'])
@jwt_required()
def update_raci(stage_id):
    """Обновление RACI матрицы для этапа (доступно админу или руководителю)."""
    current_user_id = int(get_jwt_identity())
    stage = ProjectStage.query.get_or_404(stage_id)
    project = Project.query.get(stage.project_id)
    
    if project.status == 'approved':
        if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=project.id).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
    else:
        if not (current_user_id == project.created_by or is_admin(current_user_id)):
            return jsonify({'error': 'Доступ закрыт для черновика'}), 403
    
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    data = request.get_json()
    assignments = data.get('assignments', [])
    
    RACIAssignment.query.filter_by(stage_id=stage_id).delete()
    
    for assignment in assignments:
        raci = RACIAssignment(
            stage_id=stage_id,
            user_id=assignment['user_id'],
            role_id=assignment['role_id']
        )
        db.session.add(raci)
    
    db.session.commit()
    return jsonify({'message': 'RACI матрица обновлена'})

@tasks_bp.route('/<int:task_id>/files', methods=['POST'])
@jwt_required()
def upload_file_to_task(task_id):
    """Загрузка файла к задаче."""
    current_user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    stage = task.stage
    project = stage.project
    
    if project.status == 'approved':
        if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=project.id).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
    else:
        if not (current_user_id == project.created_by or is_admin(current_user_id)):
            return jsonify({'error': 'Доступ закрыт для черновика'}), 403
    
    if 'file' not in request.files:
        return jsonify({'error': 'Файл не предоставлен'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Имя файла пустое'}), 400
    
    try:
        new_file = File(
            filename=file.filename,
            mimetype=file.mimetype,
            data=file.read(),
            uploaded_by=current_user_id
        )
        db.session.add(new_file)
        db.session.commit()
        
        task_file = TaskFile(
            task_id=task_id,
            file_id=new_file.id
        )
        db.session.add(task_file)
        db.session.commit()
        
        return jsonify({'message': 'Файл загружен', 'file_id': new_file.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка", "details": str(e)}), 500

@tasks_bp.route('/<int:task_id>/files', methods=['GET'])
@jwt_required()
def get_task_files(task_id):
    """Получение списка файлов задачи."""
    current_user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    stage = task.stage
    project = stage.project
    
    if project.status == 'approved':
        if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=project.id).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
    else:
        if not (current_user_id == project.created_by or is_admin(current_user_id)):
            return jsonify({'error': 'Доступ закрыт для черновика'}), 403
    
    task_files = TaskFile.query.filter_by(task_id=task_id).all()
    
    return jsonify([{
        'id': tf.file.id,
        'filename': tf.file.filename,
        'uploaded_at': tf.file.uploaded_at.isoformat(),
        'uploaded_by': tf.file.uploader.full_name
    } for tf in task_files])

@tasks_bp.route('/files/<int:file_id>', methods=['GET'])
@jwt_required()
def download_file(file_id):
    """Скачивание файла."""
    file = File.query.get_or_404(file_id)
    task_file = TaskFile.query.filter_by(file_id=file_id).first_or_404()
    task = task_file.task
    stage = task.stage
    project = stage.project
    current_user_id = int(get_jwt_identity())
    
    if project.status == 'approved':
        if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=project.id).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
    else:
        if not (current_user_id == project.created_by or is_admin(current_user_id)):
            return jsonify({'error': 'Доступ закрыт для черновика'}), 403
    
    return Response(file.data, mimetype=file.mimetype, headers={"Content-Disposition": f"attachment; filename={file.filename}"})

@tasks_bp.route('/<int:task_id>/files/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_task_file(task_id, file_id):
    """Удаление файла от задачи."""
    current_user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    stage = task.stage
    project = stage.project
    
    if project.status == 'approved':
        if not ProjectMember.query.filter_by(user_id=current_user_id, project_id=project.id).first():
            return jsonify({'error': 'Доступ закрыт'}), 403
    else:
        if not (current_user_id == project.created_by or is_admin(current_user_id)):
            return jsonify({'error': 'Доступ закрыт для черновика'}), 403
    
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора для удаления"}), 403
    
    task_file = TaskFile.query.filter_by(task_id=task_id, file_id=file_id).first_or_404()
    file = task_file.file
    
    try:
        db.session.delete(task_file)
        db.session.delete(file)
        db.session.commit()
        return jsonify({"message": "Файл удален"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Ошибка удаления", "details": str(e)}), 500