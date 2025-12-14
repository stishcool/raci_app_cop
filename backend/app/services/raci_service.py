from app.models.raci import RACIAssignment, RACIRole
from app.models.task import Task
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.database import db
from app.services.task_service import TaskService


class RACIService:
    """Сервис для работы с RACI назначениями"""
    
    @staticmethod
    def assign_role(data, user_id):
        """Назначить RACI роль пользователю на задачу"""
        task_id = data.get('task_id')
        assigned_user_id = data.get('user_id')
        role_name = data.get('role', '').upper()
        
        if not task_id or not assigned_user_id or not role_name:
            return None, "Task ID, User ID and Role are required"
        
        task, error = TaskService.get_task(task_id, user_id)
        if error:
            return None, error
        
        try:
            role = RACIRole[role_name]
        except KeyError:
            return None, f"Invalid role. Must be one of: {', '.join([r.name for r in RACIRole])}"
        
        assigned_user = db.session.get(User, assigned_user_id)
        if not assigned_user:
            return None, "User not found"
        
        existing = RACIAssignment.query.filter_by(
            task_id=task_id,
            user_id=assigned_user_id,
            role=role
        ).first()
        
        if existing:
            return None, "This RACI assignment already exists"
        
        if role == RACIRole.ACCOUNTABLE:
            existing_accountable = RACIAssignment.query.filter_by(
                task_id=task_id,
                role=RACIRole.ACCOUNTABLE
            ).first()
            
            if existing_accountable:
                return None, "Task already has an ACCOUNTABLE person. Only one ACCOUNTABLE is allowed per task."
        
        assignment = RACIAssignment(
            task_id=task_id,
            user_id=assigned_user_id,
            role=role,
            assigned_by=user_id
        )
        
        db.session.add(assignment)
        
        log = ActivityLog(
            user_id=user_id,
            project_id=task.project_id,
            action='ASSIGN_RACI',
            entity_type='RACI',
            entity_id=assignment.id,
            description=f'Assigned {role.value} role to {assigned_user.username} on task "{task.title}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return assignment, None
    
    @staticmethod
    def remove_assignment(assignment_id, user_id):
        """Удалить RACI назначение"""
        assignment = db.session.get(RACIAssignment, assignment_id)
        
        if not assignment:
            return None, "Assignment not found"
        
        task, error = TaskService.get_task(assignment.task_id, user_id)
        if error:
            return None, error
        
        role_name = assignment.role.value
        username = assignment.user.username if assignment.user else "User"
        
        db.session.delete(assignment)
        
        log = ActivityLog(
            user_id=user_id,
            project_id=task.project_id,
            action='REMOVE_RACI',
            entity_type='RACI',
            entity_id=assignment_id,
            description=f'Removed {role_name} role from {username} on task "{task.title}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return True, None
    
    @staticmethod
    def get_task_assignments(task_id, user_id):
        """Получить все RACI назначения для задачи"""
        task, error = TaskService.get_task(task_id, user_id)
        if error:
            return None, error
        
        assignments = RACIAssignment.query.filter_by(task_id=task_id).all()
        
        return assignments, None
    
    @staticmethod
    def get_project_raci_matrix(project_id, user_id):
        """Получить RACI матрицу для проекта"""
        from app.services.project_service import ProjectService
        
        project, error = ProjectService.get_project(project_id, user_id)
        if error:
            return None, error
        
        tasks = Task.query.filter_by(project_id=project_id).all()
        
        from app.models.project import ProjectUser
        team_members = db.session.query(User).join(ProjectUser).filter(
            ProjectUser.project_id == project_id
        ).all()
        
        matrix = []
        for task in tasks:
            task_data = {
                'task_id': task.id,
                'task_title': task.title,
                'assignments': {}
            }
            
            assignments = RACIAssignment.query.filter_by(task_id=task.id).all()
            
            for member in team_members:
                user_roles = [a.role.value for a in assignments if a.user_id == member.id]
                task_data['assignments'][member.id] = {
                    'user': member.to_dict(),
                    'roles': user_roles
                }
            
            matrix.append(task_data)
        
        return {
            'project': project.to_dict(),
            'team_members': [m.to_dict() for m in team_members],
            'matrix': matrix
        }, None
    
    @staticmethod
    def validate_task_raci(task_id):
        """Валидация RACI назначений для задачи"""
        assignments = RACIAssignment.query.filter_by(task_id=task_id).all()
        
        warnings = []
        
        has_responsible = any(a.role == RACIRole.RESPONSIBLE for a in assignments)
        if not has_responsible:
            warnings.append("No RESPONSIBLE assigned")
        
        accountable_count = sum(1 for a in assignments if a.role == RACIRole.ACCOUNTABLE)
        if accountable_count == 0:
            warnings.append("No ACCOUNTABLE assigned")
        elif accountable_count > 1:
            warnings.append("Multiple ACCOUNTABLE assigned (should be only one)")
        
        return {
            'task_id': task_id,
            'is_valid': len(warnings) == 0,
            'warnings': warnings
        }
