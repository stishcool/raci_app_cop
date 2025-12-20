from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.project_service import ProjectService

bp = Blueprint('projects', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_projects():
    """Получить список проектов"""
    current_user_id = get_jwt_identity()
    filter_type = request.args.get('filter', 'all')  
    
    projects, error = ProjectService.get_projects(current_user_id, filter_type)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'projects': [p.to_dict(include_team=True) for p in projects]
    }), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_project():
    """Создать новый проект"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    project, error = ProjectService.create_project(data, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Project created successfully',
        'project': project.to_dict(include_team=True)
    }), 201


@bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    """Получить проект по ID"""
    current_user_id = get_jwt_identity()
    
    project, error = ProjectService.get_project(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 404
    
    return jsonify({
        'project': project.to_dict(include_team=True, include_tasks=True)
    }), 200


@bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    """Обновить проект"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    project, error = ProjectService.update_project(project_id, data, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Project updated successfully',
        'project': project.to_dict(include_team=True)
    }), 200


@bp.route('/<int:project_id>/request-publication', methods=['POST'])
@jwt_required()
def request_publication(project_id):
    """Запросить публикацию проекта"""
    current_user_id = get_jwt_identity()
    
    project, error = ProjectService.request_publication(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Publication requested successfully',
        'project': project.to_dict()
    }), 200


@bp.route('/<int:project_id>/team', methods=['POST'])
@jwt_required()
def add_team_member(project_id):
    """Добавить участника в команду"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    result, error = ProjectService.add_team_member(project_id, user_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Team member added successfully',
        'member': result.to_dict()
    }), 201


@bp.route('/<int:project_id>/team/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_team_member(project_id, user_id):
    """Удалить участника из команды"""
    current_user_id = get_jwt_identity()
    
    result, error = ProjectService.remove_team_member(project_id, user_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Team member removed successfully'
    }), 200
    
@bp.route('/<int:project_id>/logs', methods=['GET'])
@jwt_required()
def get_project_logs(project_id):
    """Получить логи активности проекта"""
    current_user_id = get_jwt_identity()
    
    project, error = ProjectService.get_project(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 404
    
    from app.models.activity_log import ActivityLog
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    logs = ActivityLog.query.filter_by(project_id=project_id)\
        .order_by(ActivityLog.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'logs': [log.to_dict() for log in logs.items],
        'total': logs.total,
        'pages': logs.pages,
        'current_page': page
    }), 200


@bp.route('/projects/<int:project_id>/archive', methods=['POST'])
@jwt_required()
def archive_project(project_id):
    """Архивировать проект"""
    current_user_id = get_jwt_identity()
    
    project, error = ProjectService.archive_project(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Project archived successfully',
        'project': project.to_dict()
    }), 200


@bp.route('/projects/<int:project_id>/restore', methods=['POST'])
@jwt_required()
def restore_project(project_id):
    """Восстановить проект из архива"""
    current_user_id = get_jwt_identity()
    
    project, error = ProjectService.restore_project(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Project restored successfully',
        'project': project.to_dict()
    }), 200


@bp.route('/projects/<int:project_id>/complete', methods=['POST'])
@jwt_required()
def complete_project(project_id):
    """Завершить проект (только админ)"""
    current_user_id = get_jwt_identity()
    
    project, error = ProjectService.complete_project(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'Project completed and archived successfully',
        'project': project.to_dict()
    }), 200