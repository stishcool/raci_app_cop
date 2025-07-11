from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Notification

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Получение списка уведомлений текущего пользователя (доступно любому авторизованному пользователю)."""
    current_user_id = int(get_jwt_identity())
    notifications = Notification.query.filter_by(user_id=current_user_id).order_by(Notification.created_at.desc()).all()
    
    return jsonify([{
        'id': n.id,
        'message': n.message,
        'is_read': n.is_read,
        'related_entity': n.related_entity,
        'related_entity_id': n.related_entity_id,
        'created_at': n.created_at.isoformat()
    } for n in notifications])