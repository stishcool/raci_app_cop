from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.task_service import TaskService

bp = Blueprint('tasks', __name__)


@bp.route('', methods=['POST'])
@jwt_required()
def create_task():
    """Создать новую задачу"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    task, error = TaskService.create_task(data, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Task created successfully',
        'task': task.to_dict()
    }), 201


@bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_tasks(project_id):
    """Получить задачи проекта"""
    current_user_id = get_jwt_identity()
    status_filter = request.args.get('status')
    
    tasks, error = TaskService.get_tasks(project_id, current_user_id, status_filter)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'tasks': [t.to_dict(include_raci=True) for t in tasks]
    }), 200


@bp.route('/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    """Получить задачу по ID"""
    current_user_id = get_jwt_identity()
    
    task, error = TaskService.get_task(task_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 404
    
    return jsonify({
        'task': task.to_dict(include_raci=True)
    }), 200


@bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    """Обновить задачу"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    task, error = TaskService.update_task(task_id, data, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Task updated successfully',
        'task': task.to_dict(include_raci=True)
    }), 200


@bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """Удалить задачу"""
    current_user_id = get_jwt_identity()
    
    result, error = TaskService.delete_task(task_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Task deleted successfully'
    }), 200


@bp.route('/my-tasks', methods=['GET'])
@jwt_required()
def get_my_tasks():
    """Получить мои задачи"""
    current_user_id = get_jwt_identity()
    role_filter = request.args.get('role', 'RESPONSIBLE')
    
    tasks, error = TaskService.get_user_tasks(current_user_id, role_filter)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'tasks': [t.to_dict(include_raci=True) for t in tasks]
    }), 200
