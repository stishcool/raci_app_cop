from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.analytics_service import AnalyticsService

bp = Blueprint('analytics', __name__)


@bp.route('/analytics/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_analytics(project_id):
    """Получить аналитику проекта"""
    current_user_id = get_jwt_identity()
    
    analytics, error = AnalyticsService.get_project_analytics(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify(analytics), 200
