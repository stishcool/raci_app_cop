from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.milestone_service import MilestoneService

bp = Blueprint('milestones', __name__)


@bp.route('/milestones', methods=['POST'])
@jwt_required()
def create_milestone():
    """Создать этап"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    project_id = data.get('project_id')
    
    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    
    milestone, error = MilestoneService.create_milestone(project_id, data, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify(milestone.to_dict()), 201



@bp.route('/milestones/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_milestones(project_id):
    """Получить все этапы проекта"""
    current_user_id = get_jwt_identity()
    
    milestones, error = MilestoneService.get_project_milestones(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify([m.to_dict() for m in milestones]), 200


@bp.route('/milestones/<int:milestone_id>', methods=['GET'])
@jwt_required()
def get_milestone(milestone_id):
    """Получить один этап"""
    current_user_id = get_jwt_identity()
    
    milestone, error = MilestoneService.get_milestone(milestone_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 404
    
    return jsonify(milestone.to_dict()), 200


@bp.route('/milestones/<int:milestone_id>', methods=['PUT'])
@jwt_required()
def update_milestone(milestone_id):
    """Обновить этап"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    milestone, error = MilestoneService.update_milestone(milestone_id, data, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify(milestone.to_dict()), 200


@bp.route('/milestones/<int:milestone_id>', methods=['DELETE'])
@jwt_required()
def delete_milestone(milestone_id):
    """Удалить этап"""
    current_user_id = get_jwt_identity()
    
    success, error = MilestoneService.delete_milestone(milestone_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({'message': 'Milestone deleted successfully'}), 200


@bp.route('/milestones/<int:milestone_id>/reorder', methods=['POST'])
@jwt_required()
def reorder_milestone(milestone_id):
    """Изменить порядок этапа"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    new_order = data.get('order')
    
    if new_order is None:
        return jsonify({'error': 'Order is required'}), 400
    
    milestone, error = MilestoneService.reorder_milestone(milestone_id, new_order, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify(milestone.to_dict()), 200


@bp.route('/milestones/<int:milestone_id>/status', methods=['PUT'])
@jwt_required()
def update_milestone_status(milestone_id):
    """Обновить статус этапа"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    status = data.get('status')
    
    if not status:
        return jsonify({'error': 'Status is required'}), 400
    
    milestone, error = MilestoneService.update_milestone_status(milestone_id, status, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify(milestone.to_dict()), 200
