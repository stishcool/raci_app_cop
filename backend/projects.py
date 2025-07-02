from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Project, ProjectMember, User

projects_bp = Blueprint('projects', __name__, url_prefix='/projects')

@projects_bp.route('/', methods=['GET'])
@jwt_required()
def get_projects():
    current_user_id = get_jwt_identity() 
    projects = Project.query.join(ProjectMember).filter(
    ProjectMember.user_id == int(current_user_id)  
    ).all()
    
    return jsonify([{
        'id': p.id,
        'title': p.title,
        'description': p.description,
        'manager_id': p.manager_id
    } for p in projects])

@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    data = request.get_json()
    current_user_id = get_jwt_identity()  
    
    project = Project(
        title=data['title'],
        description=data.get('description'),
        manager_id=int(current_user_id)  
    )
    db.session.add(project)
    db.session.commit()
    
    return jsonify({'id': project.id}), 201

@projects_bp.route('/<int:project_id>', methods=['PATCH'])
@jwt_required()
def update_project(project_id):
    data = request.get_json()
    project = Project.query.get_or_404(project_id)
    if 'title' in data: project.title = data['title']
    if 'description' in data: project.description = data['description']
    db.session.commit()
    return jsonify({'message': 'Project updated'})

@projects_bp.route('/<int:project_id>/archive', methods=['POST'])
@jwt_required()
def archive_project(project_id):
    project = Project.query.get_or_404(project_id)
    project.is_archived = True
    db.session.commit()
    return jsonify({'message': 'Project archived'})