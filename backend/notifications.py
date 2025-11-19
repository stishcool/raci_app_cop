from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Notification, db
from datetime import datetime

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
    
@notifications_bp.route('/<int:notification_id>', methods=['PATCH'])
@jwt_required()
def update_notification(notification_id):
    """Обновляет уведомление (например, is_read). Доступно владельцу."""
    current_user_id = int(get_jwt_identity())
    notification = Notification.query.filter_by(id=notification_id, user_id=current_user_id).first_or_404()
    
    try:
        data = request.get_json()
        if 'is_read' in data:
            notification.is_read = data['is_read']
        notification.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({"message": "Уведомление обновлено"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Ошибка обновления", "details": str(e)}), 500