from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Project, ProjectMember, User, ProjectStage, Task, Notification, AuditLog, Role
from datetime import datetime
from marshmallow import Schema, fields, validate, ValidationError
from admin import is_admin
from sqlalchemy.exc import IntegrityError

class ProjectCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str(allow_none=True)
    deadline = fields.DateTime(allow_none=True)
    
class ProjectUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=100))
    description = fields.Str(allow_none=True)
    deadline = fields.DateTime(allow_none=True)
    is_archived = fields.Boolean()
    
class ProjectMemberSchema(Schema):
    user_id = fields.Int(required=True)

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    try:
        schema = ProjectCreateSchema()
        data = schema.load(request.get_json())
        
        project = Project(
            title=data['title'],
            description=data.get('description'),
            created_by=current_user_id,
            deadline=data.get('deadline')
        )
        db.session.add(project)
        db.session.commit()  
        
        db.session.add(ProjectMember(
            project_id=project.id,
            user_id=current_user_id,
            added_at=datetime.utcnow()
        ))
        
        notification = Notification(
            user_id=current_user_id,
            message=f"Создан проект: {project.title}",
            related_entity='project',
            related_entity_id=project.id,
            created_at=datetime.utcnow()
        )
        db.session.add(notification)
        
        db.session.commit()
        return jsonify({'id': project.id}), 201
    
    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Проект с таким названием уже существует"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка", "details": str(e)}), 500

@projects_bp.route('/<int:project_id>', methods=['PATCH'])
@jwt_required()
def update_project(project_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    project = Project.query.get_or_404(project_id)
    
    try:
        schema = ProjectUpdateSchema()
        data = schema.load(request.get_json(), partial=True)
        
        old_values = {
            'title': project.title,
            'description': project.description,
            'deadline': project.deadline.isoformat() if project.deadline else None,
            'is_archived': project.is_archived
        }
        
        if 'title' in data:
            project.title = data['title']
        if 'description' in data:
            project.description = data['description']
        if 'deadline' in data:
            project.deadline = data['deadline']
        if 'is_archived' in data:
            project.is_archived = data['is_archived']
        
        project.updated_at = datetime.utcnow()
        
        audit_log = AuditLog(
            user_id=current_user_id,
            action='update_project',
            entity_type='project',
            entity_id=project.id,
            old_values=old_values,
            new_values={
                'title': project.title,
                'description': project.description,
                'deadline': project.deadline.isoformat() if project.deadline else None,
                'is_archived': project.is_archived
            },
            timestamp=datetime.utcnow()
        )
        db.session.add(audit_log)
        
        members = ProjectMember.query.filter_by(project_id=project.id).all()
        for member in members:
            notification = Notification(
                user_id=member.user_id,
                message=f"Проект {project.title} обновлен",
                related_entity='project',
                related_entity_id=project.id,
                created_at=datetime.utcnow()
            )
            db.session.add(notification)
        
        db.session.commit()
        return jsonify({'message': 'Проект обновлен'})
    
    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Проект с таким названием уже существует"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка", "details": str(e)}), 500

@projects_bp.route('/<int:project_id>/archive', methods=['POST'])
@jwt_required()
def archive_project(project_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    project = Project.query.get_or_404(project_id)
    project.is_archived = True
    db.session.commit()
    return jsonify({'message': 'Проект заархивирован'})

@projects_bp.route('/<int:project_id>/members', methods=['POST'])
@jwt_required()
def add_project_member(project_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    project = Project.query.get_or_404(project_id)
    
    try:
        schema = ProjectMemberSchema()
        data = schema.load(request.get_json())
        
        user = User.query.get_or_404(data['user_id'])
        
        if ProjectMember.query.filter_by(project_id=project_id, user_id=data['user_id']).first():
            return jsonify({"error": "Пользователь уже в проекте"}), 400
        
        member = ProjectMember(
            project_id=project_id,
            user_id=data['user_id'],
            added_at=datetime.utcnow()
        )
        db.session.add(member)
        
        notification = Notification(
            user_id=data['user_id'],
            message=f"Вы добавлены в проект: {project.title}",
            related_entity='project',
            related_entity_id=project.id,
            created_at=datetime.utcnow()
        )
        db.session.add(notification)
        
        audit_log = AuditLog(
            user_id=current_user_id,
            action='add_project_member',
            entity_type='project_member',
            entity_id=member.id,
            new_values={'project_id': project_id, 'user_id': data['user_id']},
            timestamp=datetime.utcnow()
        )
        db.session.add(audit_log)
        
        db.session.commit()
        return jsonify({'message': 'Пользователь добавлен'}), 201
    
    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка", "details": str(e)}), 500

@projects_bp.route('/<int:project_id>/members/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_project_member(project_id, user_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    member = ProjectMember.query.filter_by(
        project_id=project_id,
        user_id=user_id
    ).first_or_404()
    
    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': 'Пользователь удален'})

@projects_bp.route('/<int:project_id>/stages', methods=['POST'])
@jwt_required()
def create_project_stage(project_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    data = request.get_json()
    stage = ProjectStage(
        project_id=project_id,
        title=data['title'],
        status=data.get('status', 'planned'),
        deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None,
        sequence=data.get('sequence', 0)
    )
    db.session.add(stage)
    db.session.commit()
    return jsonify({'id': stage.id}), 201

@projects_bp.route('/<int:project_id>/stages/<int:stage_id>', methods=['PATCH'])
@jwt_required()
def update_project_stage(project_id, stage_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    data = request.get_json()
    stage = ProjectStage.query.filter_by(id=stage_id, project_id=project_id).first_or_404()
    
    if 'title' in data: stage.title = data['title']
    if 'status' in data: stage.status = data['status']
    if 'deadline' in data: 
        stage.deadline = datetime.fromisoformat(data['deadline']) if data['deadline'] else None
    if 'sequence' in data: stage.sequence = data['sequence']
    
    db.session.commit()
    return jsonify({'message': 'Этап обновлен'})

@projects_bp.route('/', methods=['GET'])
@jwt_required()
def get_projects():
    current_user_id = int(get_jwt_identity())
    projects = Project.query.join(ProjectMember).filter(
        ProjectMember.user_id == current_user_id
    ).all()
    
    return jsonify([{
        'id': p.id,
        'title': p.title,
        'description': p.description,
        'created_by': p.created_by,
        'deadline': p.deadline.isoformat() if p.deadline else None,
        'is_archived': p.is_archived
    } for p in projects])

@projects_bp.route('/<int:project_id>/members', methods=['GET'])
@jwt_required()

def get_project_members(project_id):
    current_user_id = int(get_jwt_identity())
    if not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=project_id
    ).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    members = ProjectMember.query.filter_by(project_id=project_id).all()
    return jsonify([{
        'user_id': m.user_id,
        'username': m.user.username,
        'full_name': m.user.full_name
    } for m in members])

@projects_bp.route('/<int:project_id>/stages', methods=['GET'])
@jwt_required()
def get_project_stages(project_id):
    current_user_id = int(get_jwt_identity())
    if not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=project_id
    ).first():
        return jsonify({'error': 'Доступ закрыт'}), 403
    
    stages = ProjectStage.query.filter_by(project_id=project_id).order_by(ProjectStage.sequence).all()
    return jsonify([{
        'id': s.id,
        'title': s.title,
        'status': s.status,
        'deadline': s.deadline.isoformat() if s.deadline else None,
        'sequence': s.sequence
    } for s in stages])

@projects_bp.route('/dashboard', methods=['GET'])
@jwt_required()

def get_dashboard():
    current_user_id = int(get_jwt_identity())
    
    projects = Project.query.join(ProjectMember).filter(
        ProjectMember.user_id == current_user_id
    ).all()
    
    notifications = Notification.query.filter_by(
        user_id=current_user_id,
        is_read=False
    ).count()
    
    dashboard_data = {
        'projects': [],
        'unread_notifications': notifications,
        'total_incomplete_tasks': 0
    }
    
    for project in projects:
        stages = ProjectStage.query.filter_by(project_id=project.id).all()
        total_tasks = 0
        completed_tasks = 0
        
        for stage in stages:
            tasks = Task.query.filter_by(stage_id=stage.id).all()
            total_tasks += len(tasks)
            completed_tasks = sum(1 for task in tasks if task.is_completed)
        
        dashboard_data['projects'].append({
            'id': project.id,
            'title': project.title,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'progress': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            'is_archived': project.is_archived
        })
        dashboard_data['total_incomplete_tasks'] += total_tasks - completed_tasks
    
    return jsonify(dashboard_data)

@projects_bp.route('/roles', methods=['GET'])
@jwt_required()

def get_roles():
    roles = Role.query.all()
    return jsonify([{
        'id': r.id,
        'title': r.title,
        'is_custom': r.is_custom
    } for r in roles])
