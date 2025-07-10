from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task, RACIAssignment, ProjectMember, ProjectStage, Role
from datetime import datetime

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    data = request.get_json()
    current_user_id = int(get_jwt_identity())
    
    stage = ProjectStage.query.get_or_404(data['stage_id'])
    if not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=stage.project_id
    ).first():
        return jsonify({'error': 'Access denied'}), 403
    
    task = Task(
        stage_id=data['stage_id'],
        title=data['title'],
        description=data.get('description'),
        priority=data.get('priority', 'medium'),
        is_completed=data.get('is_completed', False)
    )
    db.session.add(task)
    db.session.commit()
    
    return jsonify({'id': task.id}), 201

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    stage_id = request.args.get('stage_id')
    project_id = request.args.get('project_id')
    current_user_id = int(get_jwt_identity())
    
    query = Task.query.join(ProjectStage)
    
    if stage_id:
        query = query.filter(Task.stage_id == stage_id)
    elif project_id:
        query = query.filter(ProjectStage.project_id == project_id)
    
    if project_id and not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=project_id
    ).first():
        return jsonify({'error': 'Access denied'}), 403
    
    tasks = query.all()
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'stage_id': t.stage_id,
        'priority': t.priority,
        'is_completed': t.is_completed
    } for t in tasks])

@tasks_bp.route('/<int:task_id>/raci', methods=['GET'])
@jwt_required()
def get_task_raci(task_id):
    task = Task.query.get_or_404(task_id)
    current_user_id = int(get_jwt_identity())
    
    stage = ProjectStage.query.get(task.stage_id)
    if not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=stage.project_id
    ).first():
        return jsonify({'error': 'Access denied'}), 403
    
    raci_assignments = RACIAssignment.query.filter_by(stage_id=task.stage_id).all()
    return jsonify([{
        'user_id': a.user_id,
        'username': a.user.username,
        'role': a.role.title if a.role else None
    } for a in raci_assignments])

@tasks_bp.route('/<int:task_id>/status', methods=['PATCH'])
@jwt_required()
def update_task_status(task_id):
    data = request.get_json()
    task = Task.query.get_or_404(task_id)
    current_user_id = int(get_jwt_identity())
    
    stage = ProjectStage.query.get(task.stage_id)
    if not ProjectMember.query.filter_by(
        user_id=current_user_id,
        project_id=stage.project_id
    ).first():
        return jsonify({'error': 'Access denied'}), 403
    
    if 'is_completed' in data:
        task.is_completed = data['is_completed']
    
    db.session.commit()
    return jsonify({'message': 'Статус задачи обновлен'})

@tasks_bp.route('/<int:task_id>/raci', methods=['PUT'])
@jwt_required()
def update_task_raci(task_id):
    data = request.get_json()
    task = Task.query.get_or_404(task_id)
    current_user_id = int(get_jwt_identity())
    
    # Проверка доступа (только ответственный может менять RACI)
    stage = ProjectStage.query.get(task.stage_id)
    if not RACIAssignment.query.filter_by(
        stage_id=stage.id,
        user_id=current_user_id,
        role_id=Role.query.filter_by(title='A').first().id
    ).first():
        return jsonify({'error': 'Only accountable can update RACI'}), 403
    
    RACIAssignment.query.filter_by(stage_id=stage.id).delete()
    
    for assignment in data['assignments']:
        raci = RACIAssignment(
            stage_id=stage.id,
            user_id=assignment['user_id'],
            role_id=assignment['role_id']
        )
        db.session.add(raci)
    
    db.session.commit()
    return jsonify({'message': 'RACI матрица обновлена'})