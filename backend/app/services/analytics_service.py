from app.models.project import Project
from app.models.task import Task, TaskStatus
from app.models.milestone import Milestone, MilestoneStatus
from app.models.raci import RACIAssignment, RACIRole
from app.models.user import User
from app.database import db
from datetime import datetime, timedelta
from sqlalchemy import func


class AnalyticsService:
    """Сервис для аналитики проектов"""
    
    @staticmethod
    def get_project_analytics(project_id, user_id):
        """Получить аналитику проекта"""
        from app.services.project_service import ProjectService
        
        project, error = ProjectService.get_project(project_id, user_id)
        if error:
            return None, error
        
        tasks = Task.query.filter_by(project_id=project_id).all()
        total_tasks = len(tasks)
        
        tasks_by_status = {
            'TODO': 0,
            'IN_PROGRESS': 0,
            'IN_REVIEW': 0,
            'DONE': 0,
            'BLOCKED': 0
        }
        
        for task in tasks:
            tasks_by_status[task.status.value] += 1
        
        completion_rate = (tasks_by_status['DONE'] / total_tasks * 100) if total_tasks > 0 else 0
        
        milestones = Milestone.query.filter_by(project_id=project_id).order_by(Milestone.order).all()
        milestones_data = []
        
        for milestone in milestones:
            milestone_tasks = Task.query.filter_by(milestone_id=milestone.id).all()
            completed = sum(1 for t in milestone_tasks if t.status == TaskStatus.DONE)
            total = len(milestone_tasks)
            
            milestones_data.append({
                'id': milestone.id,
                'name': milestone.name,
                'status': milestone.status.value,
                'total_tasks': total,
                'completed_tasks': completed,
                'progress': (completed / total * 100) if total > 0 else 0,
                'deadline': milestone.deadline.isoformat() if milestone.deadline else None
            })
        
        team_stats = []
        
        if tasks:
            team_user_ids = db.session.query(RACIAssignment.user_id)\
                .filter(RACIAssignment.task_id.in_([t.id for t in tasks]))\
                .distinct().all()
            
            team_user_ids = [uid[0] for uid in team_user_ids]
            
            for user_id_item in team_user_ids:
                member = db.session.get(User, user_id_item)
                
                if not member:
                    continue
                
                responsible_tasks = db.session.query(Task)\
                    .join(RACIAssignment, Task.id == RACIAssignment.task_id)\
                    .filter(
                        Task.project_id == project_id,
                        RACIAssignment.user_id == member.id,
                        RACIAssignment.role == RACIRole.RESPONSIBLE
                    ).all()
                
                completed = sum(1 for t in responsible_tasks if t.status == TaskStatus.DONE)
                in_progress = sum(1 for t in responsible_tasks if t.status == TaskStatus.IN_PROGRESS)
                
                team_stats.append({
                    'user_id': member.id,
                    'username': member.username,
                    'full_name': f"{member.first_name or ''} {member.last_name or ''}".strip() or member.username,
                    'assigned_tasks': len(responsible_tasks),
                    'completed_tasks': completed,
                    'in_progress_tasks': in_progress,
                    'completion_rate': (completed / len(responsible_tasks) * 100) if responsible_tasks else 0
                })
        
        completed_tasks = [t for t in tasks if t.status == TaskStatus.DONE and t.completed_at]
        avg_completion_time = None
        
        if completed_tasks:
            total_time = sum((t.completed_at - t.created_at).total_seconds() for t in completed_tasks)
            avg_completion_time = total_time / len(completed_tasks) / 3600  
        
        now = datetime.utcnow()
        overdue_tasks = [t for t in tasks if t.deadline and t.deadline < now and t.status != TaskStatus.DONE]
        
        tasks_by_priority = {
            'low': sum(1 for t in tasks if t.priority == 0),
            'medium': sum(1 for t in tasks if t.priority == 1),
            'high': sum(1 for t in tasks if t.priority == 2)
        }
        
        seven_days_ago = now - timedelta(days=7)
        recent_activity = db.session.query(
            func.date(Task.created_at).label('date'),
            func.count(Task.id).label('count')
        ).filter(
            Task.project_id == project_id,
            Task.created_at >= seven_days_ago
        ).group_by(func.date(Task.created_at)).all()
        
        activity_chart = [
            {
                'date': str(item.date),
                'tasks_created': item.count
            }
            for item in recent_activity
        ]
        
        return {
            'project': project.to_dict(),
            'summary': {
                'total_tasks': total_tasks,
                'completion_rate': round(completion_rate, 2),
                'overdue_tasks': len(overdue_tasks),
                'avg_completion_time_hours': round(avg_completion_time, 2) if avg_completion_time else None
            },
            'tasks_by_status': tasks_by_status,
            'tasks_by_priority': tasks_by_priority,
            'milestones': milestones_data,
            'team_performance': team_stats,
            'activity_chart': activity_chart
        }, None
