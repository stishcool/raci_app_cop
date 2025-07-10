from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Project, ProjectMember, User, ProjectStage
from datetime import datetime

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/', methods=['GET'])
@jwt_required()
def get_projects():
    current_user_id = int(get_jwt_identity())
    projects = Project.query.join(ProjectMember).filter(
        ProjectMember.user_id == current_user_id
    ).all()
    
    return jsonify([{
        'id': p.id,
        'title': p.title,
        'description': p.description,
        'created_by': p.created_by,
        'deadline': p.deadline.isoformat() if p.deadline else None,
        'is_archived': p.is_archived
    } for p in projects])

@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    data = request.get_json()
    current_user_id = int(get_jwt_identity())
    
    project = Project(
        title=data['title'],
        description=data.get('description'),
        created_by=current_user_id,
        deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None
    )
    db.session.add(project)
    
    # Автоматически добавляем создателя как участника
    db.session.add(ProjectMember(
        project_id=project.id,
        user_id=current_user_id
    ))
    
    db.session.commit()
    return jsonify({'id': project.id}), 201

@projects_bp.route('/<int:project_id>', methods=['PATCH'])
@jwt_required()
def update_project(project_id):
    data = request.get_json()
    project = Project.query.get_or_404(project_id)
    
    if 'title' in data: project.title = data['title']
    if 'description' in data: project.description = data['description']
    if 'deadline' in data: 
        project.deadline = datetime.fromisoformat(data['deadline']) if data['deadline'] else None
    
    db.session.commit()
    return jsonify({'message': 'Проект обновлен'})

@projects_bp.route('/<int:project_id>/archive', methods=['POST'])
@jwt_required()
def archive_project(project_id):
    project = Project.query.get_or_404(project_id)
    project.is_archived = True
    db.session.commit()
    return jsonify({'message': 'Проект заархивирован'})

@projects_bp.route('/<int:project_id>/members', methods=['GET'])
@jwt_required()
def get_project_members(project_id):
    members = ProjectMember.query.filter_by(project_id=project_id).all()
    return jsonify([{
        'user_id': m.user_id,
        'username': m.user.username,
        'full_name': m.user.full_name
    } for m in members])

@projects_bp.route('/<int:project_id>/members', methods=['POST'])
@jwt_required()
def add_project_member(project_id):
    data = request.get_json()
    member = ProjectMember(
        project_id=project_id,
        user_id=data['user_id']
    )
    db.session.add(member)
    db.session.commit()
    return jsonify({'message': 'Пользователь добавлен'}), 201

@projects_bp.route('/<int:project_id>/members/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_project_member(project_id, user_id):
    member = ProjectMember.query.filter_by(
        project_id=project_id,
        user_id=user_id
    ).first_or_404()
    
    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': 'Пользователь удален'})

@projects_bp.route('/<int:project_id>/stages', methods=['POST'])
@jwt_required()
def create_project_stage(project_id):
    data = request.get_json()
    stage = ProjectStage(
        project_id=project_id,
        title=data['title'],
        status=data.get('status', 'planned'),
        deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None,
        sequence=data.get('sequence', 0)
    )
    db.session.add(stage)
    db.session.commit()
    return jsonify({'id': stage.id}), 201

@projects_bp.route('/<int:project_id>/stages', methods=['GET'])
@jwt_required()
def get_project_stages(project_id):
    stages = ProjectStage.query.filter_by(project_id=project_id).order_by(ProjectStage.sequence).all()
    return jsonify([{
        'id': s.id,
        'title': s.title,
        'status': s.status,
        'deadline': s.deadline.isoformat() if s.deadline else None,
        'sequence': s.sequence
    } for s in stages])

@projects_bp.route('/<int:project_id>/stages/<int:stage_id>', methods=['PATCH'])
@jwt_required()
def update_project_stage(project_id, stage_id):
    data = request.get_json()
    stage = ProjectStage.query.filter_by(id=stage_id, project_id=project_id).first_or_404()
    
    if 'title' in data: stage.title = data['title']
    if 'status' in data: stage.status = data['status']
    if 'deadline' in data: 
        stage.deadline = datetime.fromisoformat(data['deadline']) if data['deadline'] else None
    if 'sequence' in data: stage.sequence = data['sequence']
    
    db.session.commit()
    return jsonify({'message': 'Этап обновлен'})