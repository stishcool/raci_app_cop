from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.notification_service import NotificationService

bp = Blueprint('notifications', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    """Получить уведомления текущего пользователя"""
    current_user_id = get_jwt_identity()
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    notifications = NotificationService.get_user_notifications(current_user_id, unread_only)
    
    return jsonify({
        'notifications': [n.to_dict() for n in notifications]
    }), 200


@bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Отметить уведомление как прочитанное"""
    current_user_id = get_jwt_identity()
    
    notification, error = NotificationService.mark_as_read(notification_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 404
    
    return jsonify({
        'message': 'Notification marked as read',
        'notification': notification.to_dict()
    }), 200


@bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    """Отметить все уведомления как прочитанные"""
    current_user_id = get_jwt_identity()
    
    NotificationService.mark_all_as_read(current_user_id)
    
    return jsonify({
        'message': 'All notifications marked as read'
    }), 200


@bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Получить количество непрочитанных уведомлений"""
    current_user_id = get_jwt_identity()
    
    from app.models.notification import Notification
    count = Notification.query.filter_by(user_id=current_user_id, is_read=False).count()
    
    return jsonify({
        'unread_count': count
    }), 200
