from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.utils.decorators import admin_required
from app.models.project import Project, ProjectStatus
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.database import db
from datetime import datetime
from app.services.admin_service import AdminService

bp = Blueprint('admin', __name__)


@bp.route('/pending-projects', methods=['GET'])
@jwt_required()
@admin_required
def get_pending_projects():
    """Получить проекты ожидающие одобрения"""
    projects = Project.query.filter_by(status=ProjectStatus.PENDING_APPROVAL).all()
    
    return jsonify({
        'projects': [p.to_dict(include_team=True) for p in projects]
    }), 200


@bp.route('/approve-project/<int:project_id>', methods=['POST'])
@jwt_required()
@admin_required
def approve_project(project_id):
    """Одобрить проект"""
    from flask_jwt_extended import get_jwt_identity
    from app.models.project import Project, ProjectStatus
    
    current_user_id = get_jwt_identity()
    
    project = db.session.get(Project, project_id)
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    if project.status != ProjectStatus.PENDING_APPROVAL:
        return jsonify({'error': 'Project is not pending approval'}), 400
    
    project.status = ProjectStatus.ACTIVE
    
    log = ActivityLog(
        user_id=current_user_id,
        project_id=project_id,
        action='APPROVE',
        entity_type='PROJECT',
        entity_id=project_id,
        description=f'Approved project "{project.name}"'
    )
    db.session.add(log)
    
    db.session.commit()
    
    from app.services.notification_service import NotificationService
    NotificationService.notify_project_approved(project)
    
    return jsonify({
        'message': 'Project approved successfully',
        'project': project.to_dict()
    }), 200


@bp.route('/reject-project/<int:project_id>', methods=['POST'])
@jwt_required()
@admin_required
def reject_project(project_id):
    """Отклонить проект"""
    from flask_jwt_extended import get_jwt_identity
    from app.models.project import Project, ProjectStatus
    
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    reason = data.get('reason', 'No reason provided') if data else 'No reason provided'
    
    project = db.session.get(Project, project_id)
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    if project.status != ProjectStatus.PENDING_APPROVAL:
        return jsonify({'error': 'Project is not pending approval'}), 400
    
    project.status = ProjectStatus.REJECTED
    
    log = ActivityLog(
        user_id=current_user_id,
        project_id=project_id,
        action='REJECT',
        entity_type='PROJECT',
        entity_id=project_id,
        description=f'Rejected project "{project.name}". Reason: {reason}'
    )
    db.session.add(log)
    
    db.session.commit()
    
    from app.services.notification_service import NotificationService
    NotificationService.notify_project_rejected(project, reason)
    
    return jsonify({
        'message': 'Project rejected successfully',
        'reason': reason
    }), 200


@bp.route('/logs', methods=['GET'])
@jwt_required()
@admin_required
def get_all_logs():
    """Получить логи активности с фильтрами"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    user_id = request.args.get('user_id', type=int)
    action = request.args.get('action')
    entity_type = request.args.get('entity_type')
    project_id = request.args.get('project_id', type=int)
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    result, error = AdminService.get_all_logs(
        page=page,
        per_page=per_page,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        project_id=project_id,
        date_from=date_from,
        date_to=date_to
    )
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify(result), 200


@bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    """Получить всех пользователей с фильтрами"""
    role = request.args.get('role')
    is_active = request.args.get('is_active')
    search = request.args.get('search')
    
    if is_active is not None:
        is_active = is_active.lower() in ['true', '1', 'yes']
    
    users, error = AdminService.get_all_users_filtered(
        role=role,
        is_active=is_active,
        search=search
    )
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'users': [user.to_dict() for user in users]
    }), 200

@bp.route('/users/create', methods=['POST'])
@jwt_required()
@admin_required
def create_user():
    """Создать нового пользователя (только админ)"""
    from flask_jwt_extended import get_jwt_identity
    from app.models.user import User, SystemRole
    from app.utils.validators import validate_email, validate_password, validate_username
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    
    is_valid, message = validate_username(username)
    if not is_valid:
        return jsonify({'error': message}), 400
    
    is_valid, message = validate_password(password)
    if not is_valid:
        return jsonify({'error': message}), 400
    
    email = data.get('email', '').strip().lower()
    if not email:
        email = f"{username}@example.com"
    
    is_valid, email_or_error = validate_email(email)
    if not is_valid:
        return jsonify({'error': email_or_error}), 400
    email = email_or_error
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    system_role = SystemRole.TEAM_MEMBER
    if 'system_role' in data:
        try:
            system_role = SystemRole[data['system_role'].upper()]
        except KeyError:
            return jsonify({'error': f'Invalid system role. Must be one of: {", ".join([r.name for r in SystemRole])}'}), 400
    
    first_name = data.get('first_name', '').strip() or 'New'
    last_name = data.get('last_name', '').strip() or 'User'
    
    user = User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone=data.get('phone', '').strip(),
        system_role=system_role,
        is_active=data.get('is_active', True)
    )
    user.set_password(password)
    
    db.session.add(user)
    
    current_user_id = get_jwt_identity()
    log = ActivityLog(
        user_id=current_user_id,
        action='CREATE',
        entity_type='USER',
        entity_id=user.id,
        description=f'Created user "{user.username}" with role {system_role.value}'
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict(include_email=True)
    }), 201

@bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user_admin(user_id):
    """Обновить пользователя (только админ)"""
    from flask_jwt_extended import get_jwt_identity
    from app.models.user import User, SystemRole
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if 'first_name' in data:
        user.first_name = data['first_name'].strip()
    
    if 'last_name' in data:
        user.last_name = data['last_name'].strip()
    
    if 'phone' in data:
        user.phone = data['phone'].strip()
    
    if 'email' in data:
        email = data['email'].strip().lower()
        existing = User.query.filter(User.email == email, User.id != user_id).first()
        if existing:
            return jsonify({'error': 'Email already exists'}), 400
        user.email = email
    
    if 'system_role' in data:
        try:
            user.system_role = SystemRole[data['system_role'].upper()]
        except KeyError:
            return jsonify({'error': f'Invalid system role. Must be one of: {", ".join([r.name for r in SystemRole])}'}), 400
    
    if 'is_active' in data:
        user.is_active = bool(data['is_active'])
    
    if 'password' in data:
        from app.utils.validators import validate_password
        is_valid, message = validate_password(data['password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        user.set_password(data['password'])
    
    current_user_id = get_jwt_identity()
    log = ActivityLog(
        user_id=current_user_id,
        action='UPDATE',
        entity_type='USER',
        entity_id=user.id,
        description=f'Updated user "{user.username}"'
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict(include_email=True)
    }), 200


@bp.route('/users/<int:user_id>/deactivate', methods=['PATCH'])
@jwt_required()
@admin_required
def deactivate_user(user_id):
    """Удалить/деактивировать пользователя (только админ)"""
    from flask_jwt_extended import get_jwt_identity
    from app.models.user import User
    
    current_user_id = get_jwt_identity()
    
    if current_user_id == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    username = user.username
    
    user.is_active = False
    
    log = ActivityLog(
        user_id=current_user_id,
        action='DEACTIVATE',
        entity_type='USER',
        entity_id=user.id,
        description=f'Deactivated user "{username}"'
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({
        'message': 'User deactivated successfully'
    }), 200

@bp.route('/users/<int:user_id>/activate', methods=['PATCH'])
@jwt_required()
@admin_required
def activate_user(user_id):
    """Активировать пользователя (только админ)"""
    from flask_jwt_extended import get_jwt_identity
    from app.models.user import User
    
    current_user_id = get_jwt_identity()
    
    if current_user_id == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    username = user.username
    
    user.is_active = True
    
    log = ActivityLog(
        user_id=current_user_id,
        action='ACTIVATE',
        entity_type='USER',
        entity_id=user.id,
        description=f'Activated user "{username}"'
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({
        'message': 'User deactivated successfully'
    }), 200
    
@bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    """Удалить пользователя (только админ)"""
    from flask_jwt_extended import get_jwt_identity
    from app.models.user import User
    
    current_user_id = get_jwt_identity()
    
    if current_user_id == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    username = user.username
    
    db.session.delete(user)
    
    log = ActivityLog(
        user_id=current_user_id,
        action='DELETE',
        entity_type='USER',
        entity_id=user_id,
        description=f'Deleted user "{username}"'
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({
        'message': 'User deleted successfully'
    }), 200
