from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task, RACIAssignment, ProjectMember

tasks_bp = Blueprint('tasks', __name__, url_prefix='/tasks')

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    data = request.get_json()
    
    if not all(key in data for key in ['title', 'project_id']):
        return jsonify({'error': 'Missing required fields (title, project_id)'}), 400
    
    current_user_id = get_jwt_identity()
    
    from models import Project  
    if not Project.query.get(data['project_id']):
        return jsonify({'error': 'Project not found'}), 404
    
    if not ProjectMember.query.filter_by(
        user_id=int(current_user_id),
        project_id=data['project_id']
    ).first():
        return jsonify({'error': 'Access denied. You are not a project member'}), 403
    
    if not all(key in data for key in ['title', 'project_id']):
        return jsonify({'error': 'Missing required fields (title, project_id)'}), 400
    
    current_user_id = get_jwt_identity()  
    
    if not ProjectMember.query.filter_by(
        user_id=int(current_user_id), 
        project_id=data['project_id']
    ).first():
        return jsonify({'error': 'Access denied or project not found'}), 403
    
    task = Task(
        title=data['title'],
        description=data.get('description'),
        project_id=data['project_id'],
        status='todo',
        priority=data.get('priority', 'medium')
    )
    db.session.add(task)
    db.session.commit()
    
    for assignment in data.get('raci_assignments', []):
        raci = RACIAssignment(
            task_id=task.id,
            user_id=assignment['user_id'],
            role=assignment['role']
        )
        db.session.add(raci)
    
    db.session.commit()
    
    return jsonify({'id': task.id}), 201

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    project_id = request.args.get('project_id')
    status = request.args.get('status')
    current_user_id = get_jwt_identity()
    
    if project_id:
        if not ProjectMember.query.filter_by(
            user_id=int(current_user_id),
            project_id=project_id
        ).first():
            return jsonify({'error': 'Access denied'}), 403
    
    query = Task.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    if status:
        query = query.filter_by(status=status)
    
    tasks = query.all()
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'status': t.status,
        'priority': t.priority
    } for t in tasks])

@tasks_bp.route('/<int:task_id>/raci', methods=['GET'])
@jwt_required()
def get_task_raci(task_id):
    task = Task.query.get_or_404(task_id)
    current_user_id = get_jwt_identity()
    
    if not ProjectMember.query.filter_by(
        user_id=int(current_user_id),
        project_id=task.project_id
    ).first():
        return jsonify({'error': 'Access denied'}), 403
    
    raci_assignments = RACIAssignment.query.filter_by(task_id=task_id).all()
    
    return jsonify([{
        'user_id': a.user_id,
        'role': a.role
    } for a in raci_assignments])

@tasks_bp.route('/<int:task_id>/status', methods=['PATCH'])
@jwt_required()
def update_status(task_id):
    data = request.get_json()
    
    if 'status' not in data:
        return jsonify({"error": "Status is required"}), 400
    
    if data['status'] not in ['todo', 'in_progress', 'done']:
        return jsonify({"error": "Invalid status"}), 400
    
    task = Task.query.get_or_404(task_id)
    current_user_id = get_jwt_identity()
    
    if not ProjectMember.query.filter_by(
        user_id=int(current_user_id),
        project_id=task.project_id
    ).first():
        return jsonify({'error': 'Access denied'}), 403
    
    task.status = data['status']
    db.session.commit()
    
    return jsonify({"message": "Status updated"})

@tasks_bp.route('/<int:task_id>/raci', methods=['PUT'])
@jwt_required()
def update_raci(task_id):
    data = request.get_json()
    
    if 'assignments' not in data:
        return jsonify({"error": "Assignments are required"}), 400
    
    if sum(1 for a in data['assignments'] if a['role'] == 'A') != 1:
        return jsonify({"error": "Must have exactly one Accountable (A)"}), 400
    
    task = Task.query.get_or_404(task_id)
    current_user_id = get_jwt_identity()
    
    if not ProjectMember.query.filter_by(
        user_id=int(current_user_id),
        project_id=task.project_id
    ).first():
        return jsonify({'error': 'Access denied'}), 403
    
    RACIAssignment.query.filter_by(task_id=task_id).delete()
    
    for assignment in data['assignments']:
        raci = RACIAssignment(
            task_id=task_id,
            user_id=assignment['user_id'],
            role=assignment['role']
        )
        db.session.add(raci)
    
    db.session.commit()
    return jsonify({"message": "RACI assignments updated"})