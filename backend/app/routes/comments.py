from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.comment_service import CommentService

bp = Blueprint('comments', __name__)


@bp.route('/tasks/<int:task_id>/comments', methods=['GET'])
@jwt_required()
def get_task_comments(task_id):
    """Получить все комментарии задачи"""
    current_user_id = get_jwt_identity()
    
    comments, error = CommentService.get_task_comments(task_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 404
    
    return jsonify({
        'comments': [c.to_dict() for c in comments]
    }), 200


@bp.route('/tasks/<int:task_id>/comments', methods=['POST'])
@jwt_required()
def create_comment(task_id):
    """Создать комментарий к задаче"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    comment, error = CommentService.create_comment(task_id, data, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Comment created successfully',
        'comment': comment.to_dict()
    }), 201


@bp.route('/comments/<int:comment_id>', methods=['PUT'])
@jwt_required()
def update_comment(comment_id):
    """Обновить комментарий"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    comment, error = CommentService.update_comment(comment_id, data, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Comment updated successfully',
        'comment': comment.to_dict()
    }), 200


@bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    """Удалить комментарий"""
    current_user_id = get_jwt_identity()
    
    success, error = CommentService.delete_comment(comment_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Comment deleted successfully'
    }), 200
