from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.tag_service import TagService

bp = Blueprint('tags', __name__)


@bp.route('/tags', methods=['GET'])
@jwt_required()
def get_all_tags():
    """Получить все теги"""
    tags, error = TagService.get_all_tags()
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'tags': [tag.to_dict() for tag in tags]
    }), 200


@bp.route('/tags', methods=['POST'])
@jwt_required()
def create_tag():
    """Создать тег"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    tag, error = TagService.create_tag(data)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Tag created successfully',
        'tag': tag.to_dict()
    }), 201


@bp.route('/tags/<int:tag_id>', methods=['GET'])
@jwt_required()
def get_tag(tag_id):
    """Получить тег по ID"""
    tag, error = TagService.get_tag(tag_id)
    
    if error:
        return jsonify({'error': error}), 404
    
    return jsonify({
        'tag': tag.to_dict()
    }), 200


@bp.route('/tags/<int:tag_id>', methods=['PUT'])
@jwt_required()
def update_tag(tag_id):
    """Обновить тег"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    tag, error = TagService.update_tag(tag_id, data)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Tag updated successfully',
        'tag': tag.to_dict()
    }), 200


@bp.route('/tags/<int:tag_id>', methods=['DELETE'])
@jwt_required()
def delete_tag(tag_id):
    """Удалить тег"""
    success, error = TagService.delete_tag(tag_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Tag deleted successfully'
    }), 200


@bp.route('/tasks/<int:task_id>/tags/<int:tag_id>', methods=['POST'])
@jwt_required()
def add_tag_to_task(task_id, tag_id):
    """Добавить тег к задаче"""
    current_user_id = get_jwt_identity()
    
    task, error = TagService.add_tag_to_task(task_id, tag_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Tag added to task successfully',
        'task': task.to_dict(include_tags=True)
    }), 200


@bp.route('/tasks/<int:task_id>/tags/<int:tag_id>', methods=['DELETE'])
@jwt_required()
def remove_tag_from_task(task_id, tag_id):
    """Удалить тег из задачи"""
    current_user_id = get_jwt_identity()
    
    task, error = TagService.remove_tag_from_task(task_id, tag_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Tag removed from task successfully',
        'task': task.to_dict(include_tags=True)
    }), 200


@bp.route('/tags/<int:tag_id>/tasks', methods=['GET'])
@jwt_required()
def get_tasks_by_tag(tag_id):
    """Получить все задачи с определенным тегом"""
    current_user_id = get_jwt_identity()
    
    tasks, error = TagService.get_tasks_by_tag(tag_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 404
    
    return jsonify({
        'tasks': [task.to_dict(include_tags=True) for task in tasks]
    }), 200
