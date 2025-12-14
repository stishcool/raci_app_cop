from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.utils.decorators import admin_required

bp = Blueprint('users', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    """Получить список пользователей"""
    users = User.query.filter_by(is_active=True).all()
    
    return jsonify({
        'users': [u.to_dict() for u in users]
    }), 200


@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Получить пользователя по ID"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_dict(include_email=True)
    }), 200


@bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Обновить пользователя"""
    current_user_id = get_jwt_identity()
    
    current_user = User.query.get(current_user_id)
    if current_user_id != user_id and current_user.system_role.value != 'ADMIN':
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if 'first_name' in data:
        user.first_name = data['first_name'].strip()
    
    if 'last_name' in data:
        user.last_name = data['last_name'].strip()
    
    if 'phone' in data:
        user.phone = data['phone'].strip()
    
    if 'system_role' in data and current_user.system_role.value == 'ADMIN':
        from app.models.user import SystemRole
        try:
            user.system_role = SystemRole[data['system_role'].upper()]
        except KeyError:
            pass
    
    from app.database import db
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict(include_email=True)
    }), 200
