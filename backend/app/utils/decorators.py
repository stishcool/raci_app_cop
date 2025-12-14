from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User, SystemRole
from app.models.project import ProjectUser
from app.database import db


def role_required(*roles):
    """Декоратор для проверки системной роли пользователя"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = db.session.get(User, current_user_id)
            
            if not user or not user.is_active:
                return jsonify({'error': 'User not found or inactive'}), 403
            
            if user.system_role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def admin_required(fn):
    """Декоратор для проверки прав администратора"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 403
        
        if user.system_role != SystemRole.ADMIN:
            return jsonify({'error': 'Admin access required'}), 403
        
        return fn(*args, **kwargs)
    return wrapper


def project_member_required(fn):
    """Декоратор для проверки членства в проекте"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        project_id = kwargs.get('project_id')
        
        if not project_id:
            return jsonify({'error': 'Project ID required'}), 400
        
        user = db.session.get(User, current_user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 403
        
        if user.system_role == SystemRole.ADMIN:
            return fn(*args, **kwargs)
        
        membership = ProjectUser.query.filter_by(
            project_id=project_id,
            user_id=current_user_id
        ).first()
        
        if not membership:
            return jsonify({'error': 'Access denied: not a project member'}), 403
        
        return fn(*args, **kwargs)
    return wrapper
