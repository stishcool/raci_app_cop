from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.utils.decorators import admin_required
from app.models.project import Project, ProjectStatus
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.database import db
from datetime import datetime

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
    current_user_id = get_jwt_identity()
    
    project = db.session.get(Project, project_id)
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    if project.status != ProjectStatus.PENDING_APPROVAL:
        return jsonify({'error': 'Project is not pending approval'}), 400
    
    project.status = ProjectStatus.ACTIVE
    project.published_at = datetime.utcnow()
    
    log = ActivityLog(
        user_id=current_user_id,
        project_id=project.id,
        action='APPROVE',
        entity_type='PROJECT',
        entity_id=project.id,
        description=f'Approved project "{project.name}"'
    )
    db.session.add(log)
    
    db.session.commit()
    
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
    current_user_id = get_jwt_identity()
    
    project = db.session.get(Project, project_id)
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    if project.status != ProjectStatus.PENDING_APPROVAL:
        return jsonify({'error': 'Project is not pending approval'}), 400
    
    data = request.get_json() or {}
    reason = data.get('reason', 'No reason provided')
    
    project.status = ProjectStatus.REJECTED
    
    log = ActivityLog(
        user_id=current_user_id,
        project_id=project.id,
        action='REJECT',
        entity_type='PROJECT',
        entity_id=project.id,
        description=f'Rejected project "{project.name}". Reason: {reason}'
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Project rejected',
        'project': project.to_dict()
    }), 200


@bp.route('/logs', methods=['GET'])
@jwt_required()
@admin_required
def get_activity_logs():
    """Получить логи активности"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    user_id = request.args.get('user_id', type=int)
    
    query = ActivityLog.query
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    
    logs = query.order_by(ActivityLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'logs': [log.to_dict() for log in logs.items],
        'total': logs.total,
        'pages': logs.pages,
        'current_page': page
    }), 200


@bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    """Получить всех пользователей (админ)"""
    users = User.query.all()
    
    return jsonify({
        'users': [u.to_dict(include_email=True) for u in users]
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


@bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
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
