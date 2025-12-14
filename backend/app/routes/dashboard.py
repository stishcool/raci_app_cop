from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.task import Task, TaskStatus
from app.models.raci import RACIAssignment, RACIRole
from app.models.project import Project, ProjectStatus
from app.database import db
from sqlalchemy import func

bp = Blueprint('dashboard', __name__)


@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Получить статистику для дашборда"""
    current_user_id = get_jwt_identity()
    
    my_tasks = db.session.query(Task).join(RACIAssignment).filter(
        RACIAssignment.user_id == current_user_id,
        RACIAssignment.role == RACIRole.RESPONSIBLE,
        Task.status != TaskStatus.DONE
    ).all()
    
    task_stats = db.session.query(
        Task.status,
        func.count(Task.id)
    ).join(RACIAssignment).filter(
        RACIAssignment.user_id == current_user_id,
        RACIAssignment.role == RACIRole.RESPONSIBLE
    ).group_by(Task.status).all()
    
    status_breakdown = {status.value: 0 for status in TaskStatus}
    for status, count in task_stats:
        status_breakdown[status.value] = count
    
    from app.models.project import ProjectUser
    my_projects = db.session.query(Project).join(ProjectUser).filter(
        ProjectUser.user_id == current_user_id,
        Project.status == ProjectStatus.ACTIVE
    ).count()
    
    from datetime import datetime, timedelta
    urgent_tasks = [t for t in my_tasks if t.deadline and t.deadline < datetime.utcnow() + timedelta(days=3)]
    
    return jsonify({
        'my_tasks_count': len(my_tasks),
        'my_projects_count': my_projects,
        'urgent_tasks_count': len(urgent_tasks),
        'status_breakdown': status_breakdown,
        'my_tasks': [t.to_dict(include_raci=True) for t in my_tasks[:10]],  
        'urgent_tasks': [t.to_dict() for t in urgent_tasks]
    }), 200


@bp.route('/team-workload', methods=['GET'])
@jwt_required()
def get_team_workload():
    """Получить загруженность команды"""
    from app.models.user import User
    
    workload = db.session.query(
        User.id,
        User.username,
        User.first_name,
        User.last_name,
        func.count(Task.id).label('task_count')
    ).join(RACIAssignment, User.id == RACIAssignment.user_id)\
     .join(Task, RACIAssignment.task_id == Task.id)\
     .filter(
         RACIAssignment.role == RACIRole.RESPONSIBLE,
         Task.status != TaskStatus.DONE
     ).group_by(User.id).all()
    
    result = []
    for user_id, username, first_name, last_name, task_count in workload:
        result.append({
            'user_id': user_id,
            'username': username,
            'full_name': f"{first_name or ''} {last_name or ''}".strip() or username,
            'task_count': task_count
        })
    
    return jsonify({
        'workload': result
    }), 200
