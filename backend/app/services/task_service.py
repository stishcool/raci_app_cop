from datetime import datetime
from app.models.task import Task, TaskStatus
from app.models.project import Project, ProjectUser
from app.models.user import User, SystemRole
from app.models.activity_log import ActivityLog
from app.database import db
from app.services.project_service import ProjectService


class TaskService:
    """Сервис для работы с задачами"""
    
    @staticmethod
    def create_task(data, user_id):
        """Создать новую задачу"""
        project_id = data.get('project_id')
        title = data.get('title', '').strip()
        
        if not project_id:
            return None, "Project ID is required"
        
        if not title:
            return None, "Task title is required"
        
        project, error = ProjectService.get_project(project_id, user_id)
        if error:
            return None, error
        
        task = Task(
            project_id=project_id,
            title=title,
            description=data.get('description', '').strip(),
            status=TaskStatus.TODO,
            priority=data.get('priority', 0)
        )
        
        if data.get('deadline'):
            try:
                from dateutil import parser
                task.deadline = parser.parse(data['deadline'])
            except:
                pass
        
        db.session.add(task)
        db.session.flush()
        
        log = ActivityLog(
            user_id=user_id,
            project_id=project_id,
            action='CREATE',
            entity_type='TASK',
            entity_id=task.id,
            description=f'Created task "{task.title}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return task, None
    
    @staticmethod
    def get_tasks(project_id, user_id, status_filter=None):
        """Получить задачи проекта"""
        project, error = ProjectService.get_project(project_id, user_id)
        if error:
            return None, error
        
        query = Task.query.filter_by(project_id=project_id)
        
        if status_filter:
            try:
                status = TaskStatus[status_filter.upper()]
                query = query.filter_by(status=status)
            except KeyError:
                pass
        
        tasks = query.order_by(Task.created_at.desc()).all()
        
        return tasks, None
    
    @staticmethod
    def get_task(task_id, user_id):
        """Получить задачу по ID"""
        task = db.session.get(Task, task_id)
        
        if not task:
            return None, "Task not found"
        
        project, error = ProjectService.get_project(task.project_id, user_id)
        if error:
            return None, error
        
        return task, None
    
    @staticmethod
    def update_task(task_id, data, user_id):
        """Обновить задачу"""
        task, error = TaskService.get_task(task_id, user_id)
        
        if error:
            return None, error
        
        old_status = task.status
        
        if 'title' in data:
            task.title = data['title'].strip()
        
        if 'description' in data:
            task.description = data['description'].strip()
        
        if 'status' in data:
            try:
                task.status = TaskStatus[data['status'].upper()]
                if task.status == TaskStatus.DONE and old_status != TaskStatus.DONE:
                    task.completed_at = datetime.utcnow()
            except KeyError:
                pass
        
        if 'priority' in data:
            task.priority = data['priority']
        
        if 'deadline' in data:
            try:
                from dateutil import parser
                task.deadline = parser.parse(data['deadline']) if data['deadline'] else None
            except:
                pass
        
        task.updated_at = datetime.utcnow()
        
        log = ActivityLog(
            user_id=user_id,
            project_id=task.project_id,
            action='UPDATE',
            entity_type='TASK',
            entity_id=task.id,
            description=f'Updated task "{task.title}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return task, None
    
    @staticmethod
    def delete_task(task_id, user_id):
        """Удалить задачу"""
        task, error = TaskService.get_task(task_id, user_id)
        
        if error:
            return None, error
        
        project_id = task.project_id
        task_title = task.title
        
        db.session.delete(task)
        
        log = ActivityLog(
            user_id=user_id,
            project_id=project_id,
            action='DELETE',
            entity_type='TASK',
            entity_id=task_id,
            description=f'Deleted task "{task_title}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return True, None
    
    @staticmethod
    def get_user_tasks(user_id, role_filter='RESPONSIBLE'):
        """Получить задачи пользователя по RACI роли"""
        from app.models.raci import RACIAssignment, RACIRole
        
        try:
            role = RACIRole[role_filter.upper()]
        except KeyError:
            role = RACIRole.RESPONSIBLE
        
        tasks = db.session.query(Task).join(RACIAssignment).filter(
            RACIAssignment.user_id == user_id,
            RACIAssignment.role == role,
            Task.status != TaskStatus.DONE
        ).order_by(Task.deadline.asc()).all()
        
        return tasks, None
