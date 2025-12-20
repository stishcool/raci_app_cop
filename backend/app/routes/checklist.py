from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.checklist_service import ChecklistService

bp = Blueprint('checklist', __name__)


@bp.route('/tasks/<int:task_id>/checklist', methods=['GET'])
@jwt_required()
def get_task_checklist(task_id):
    """Получить чеклист задачи"""
    current_user_id = get_jwt_identity()
    
    items, error = ChecklistService.get_task_checklist(task_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 404
    
    return jsonify({
        'checklist': [item.to_dict() for item in items],
        'progress': {
            'total': len(items),
            'completed': sum(1 for item in items if item.is_completed),
            'percentage': (sum(1 for item in items if item.is_completed) / len(items) * 100) if items else 0
        }
    }), 200


@bp.route('/tasks/<int:task_id>/checklist', methods=['POST'])
@jwt_required()
def create_checklist_item(task_id):
    """Создать элемент чеклиста"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    item, error = ChecklistService.create_checklist_item(task_id, data, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Checklist item created successfully',
        'item': item.to_dict()
    }), 201


@bp.route('/checklist/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_checklist_item(item_id):
    """Обновить элемент чеклиста"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    item, error = ChecklistService.update_checklist_item(item_id, data, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Checklist item updated successfully',
        'item': item.to_dict()
    }), 200


@bp.route('/checklist/<int:item_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_checklist_item(item_id):
    """Переключить статус выполнения элемента"""
    current_user_id = get_jwt_identity()
    
    item, error = ChecklistService.toggle_checklist_item(item_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Checklist item toggled successfully',
        'item': item.to_dict()
    }), 200


@bp.route('/checklist/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_checklist_item(item_id):
    """Удалить элемент чеклиста"""
    current_user_id = get_jwt_identity()
    
    success, error = ChecklistService.delete_checklist_item(item_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Checklist item deleted successfully'
    }), 200


@bp.route('/tasks/<int:task_id>/checklist/reorder', methods=['POST'])
@jwt_required()
def reorder_checklist_items(task_id):
    """Изменить порядок элементов чеклиста"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'items' not in data:
        return jsonify({'error': 'Items order data required'}), 400
    
    success, error = ChecklistService.reorder_checklist_items(task_id, data['items'], current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Checklist items reordered successfully'
    }), 200
