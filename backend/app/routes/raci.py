from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.raci_service import RACIService

bp = Blueprint('raci', __name__)


@bp.route('/assign', methods=['POST'])
@jwt_required()
def assign_role():
    """Назначить RACI роль"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    assignment, error = RACIService.assign_role(data, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'RACI role assigned successfully',
        'assignment': assignment.to_dict()
    }), 201


@bp.route('/assignment/<int:assignment_id>', methods=['DELETE'])
@jwt_required()
def remove_assignment(assignment_id):
    """Удалить RACI назначение"""
    current_user_id = get_jwt_identity()
    
    result, error = RACIService.remove_assignment(assignment_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'RACI assignment removed successfully'
    }), 200


@bp.route('/task/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task_assignments(task_id):
    """Получить RACI назначения для задачи"""
    current_user_id = get_jwt_identity()
    
    assignments, error = RACIService.get_task_assignments(task_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'assignments': [a.to_dict() for a in assignments]
    }), 200


@bp.route('/project/<int:project_id>/matrix', methods=['GET'])
@jwt_required()
def get_project_matrix(project_id):
    """Получить RACI матрицу проекта"""
    current_user_id = get_jwt_identity()
    
    matrix, error = RACIService.get_project_raci_matrix(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify(matrix), 200


@bp.route('/task/<int:task_id>/validate', methods=['GET'])
@jwt_required()
def validate_task_raci(task_id):
    """Валидация RACI назначений задачи"""
    validation = RACIService.validate_task_raci(task_id)
    
    return jsonify(validation), 200
