from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.export_service import ExportService

bp = Blueprint('export', __name__)


@bp.route('/export/project/<int:project_id>/excel', methods=['GET'])
@jwt_required()
def export_project_excel(project_id):
    """Экспортировать проект в Excel"""
    current_user_id = get_jwt_identity()
    
    output, filename, error = ExportService.export_project_to_excel(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 404
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )


@bp.route('/export/project/<int:project_id>/pdf', methods=['GET'])
@jwt_required()
def export_project_pdf(project_id):
    """Экспортировать проект в PDF"""
    current_user_id = get_jwt_identity()
    
    output, filename, error = ExportService.export_project_to_pdf(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 404
    
    return send_file(
        output,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )
