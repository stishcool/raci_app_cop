from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.file_service import FileService
from app.utils.validators import allowed_file
import os

bp = Blueprint('files', __name__)


@bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """Загрузить файл"""
    current_user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    project_id = request.form.get('project_id', type=int)
    task_id = request.form.get('task_id', type=int)
    
    file_record, error = FileService.upload_file(file, current_user_id, project_id, task_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'File uploaded successfully',
        'file': file_record.to_dict()
    }), 201


@bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_files(project_id):
    """Получить файлы проекта"""
    current_user_id = get_jwt_identity()
    
    files, error = FileService.get_project_files(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'files': [f.to_dict() for f in files]
    }), 200


@bp.route('/task/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task_files(task_id):
    """Получить файлы задачи"""
    current_user_id = get_jwt_identity()
    
    files, error = FileService.get_task_files(task_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'files': [f.to_dict() for f in files]
    }), 200


@bp.route('/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(file_id):
    """Удалить файл"""
    current_user_id = get_jwt_identity()
    
    result, error = FileService.delete_file_record(file_id, current_user_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'File deleted successfully'
    }), 200


@bp.route('/download/<int:file_id>', methods=['GET'])
@jwt_required()
def download_file(file_id):
    """Скачать файл"""
    from app.models.file import File
    from app.database import db
    
    file_record = db.session.get(File, file_id)
    
    if not file_record:
        return jsonify({'error': 'File not found'}), 404
    
    try:
        directory = os.path.join(current_app.config['UPLOAD_FOLDER'], os.path.dirname(file_record.file_path))
        filename = os.path.basename(file_record.file_path)
        
        return send_from_directory(
            directory,
            filename,
            as_attachment=True,
            download_name=file_record.original_filename
        )
    except Exception as e:
        return jsonify({'error': f'File download failed: {str(e)}'}), 500
