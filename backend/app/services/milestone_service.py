from app.models.milestone import Milestone, MilestoneStatus
from app.models.project import Project
from app.models.task import Task
from app.models.activity_log import ActivityLog
from app.database import db
from datetime import datetime


class MilestoneService:
    """Сервис для управления этапами проекта"""
    
    @staticmethod
    def create_milestone(project_id, data, user_id):
        """Создать этап"""
        from app.services.project_service import ProjectService
        
        project, error = ProjectService.get_project(project_id, user_id)
        if error:
            return None, error
        
        if project.creator_id != user_id:
            from app.models.user import User
            user = db.session.get(User, user_id)
            if not user or user.system_role.value != 'ADMIN':
                return None, "Access denied"
        
        name = data.get('name', '').strip()
        if not name:
            return None, "Name is required"
        
        max_order = db.session.query(db.func.max(Milestone.order))\
            .filter_by(project_id=project_id).scalar()
        order = (max_order or 0) + 1
        
        milestone = Milestone(
            project_id=project_id,
            name=name,
            description=data.get('description', '').strip(),
            order=order,
            status=MilestoneStatus.NOT_STARTED
        )
        
        if data.get('deadline'):
            try:
                milestone.deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
            except:
                pass
        
        db.session.add(milestone)
        
        log = ActivityLog(
            user_id=user_id,
            project_id=project_id,
            action='CREATE',
            entity_type='MILESTONE',
            entity_id=milestone.id,
            description=f'Created milestone "{name}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return milestone, None
    
    @staticmethod
    def get_project_milestones(project_id, user_id):
        """Получить все этапы проекта"""
        from app.services.project_service import ProjectService
        
        project, error = ProjectService.get_project(project_id, user_id)
        if error:
            return None, error
        
        milestones = Milestone.query.filter_by(project_id=project_id)\
            .order_by(Milestone.order).all()
        
        return milestones, None
    
    @staticmethod
    def get_milestone(milestone_id, user_id):
        """Получить один этап"""
        milestone = db.session.get(Milestone, milestone_id)
        
        if not milestone:
            return None, "Milestone not found"
        
        from app.services.project_service import ProjectService
        project, error = ProjectService.get_project(milestone.project_id, user_id)
        if error:
            return None, error
        
        return milestone, None
    
    @staticmethod
    def update_milestone(milestone_id, data, user_id):
        """Обновить этап"""
        milestone = db.session.get(Milestone, milestone_id)
        
        if not milestone:
            return None, "Milestone not found"
        
        from app.services.project_service import ProjectService
        project, error = ProjectService.get_project(milestone.project_id, user_id)
        if error:
            return None, error
        
        if project.creator_id != user_id:
            from app.models.user import User
            user = db.session.get(User, user_id)
            if not user or user.system_role.value != 'ADMIN':
                return None, "Access denied"
        
        if 'name' in data:
            milestone.name = data['name'].strip()
        
        if 'description' in data:
            milestone.description = data['description'].strip()
        
        if 'deadline' in data:
            if data['deadline']:
                try:
                    milestone.deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
                except:
                    pass
            else:
                milestone.deadline = None
        
        log = ActivityLog(
            user_id=user_id,
            project_id=milestone.project_id,
            action='UPDATE',
            entity_type='MILESTONE',
            entity_id=milestone_id,
            description=f'Updated milestone "{milestone.name}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return milestone, None
    
    @staticmethod
    def delete_milestone(milestone_id, user_id):
        """Удалить этап"""
        milestone = db.session.get(Milestone, milestone_id)
        
        if not milestone:
            return None, "Milestone not found"
        
        from app.services.project_service import ProjectService
        project, error = ProjectService.get_project(milestone.project_id, user_id)
        if error:
            return None, error
        
        if project.creator_id != user_id:
            from app.models.user import User
            user = db.session.get(User, user_id)
            if not user or user.system_role.value != 'ADMIN':
                return None, "Access denied"
        
        tasks_count = Task.query.filter_by(milestone_id=milestone_id).count()
        if tasks_count > 0:
            return None, f"Cannot delete milestone with {tasks_count} tasks. Please reassign or delete tasks first."
        
        name = milestone.name
        project_id = milestone.project_id
        
        db.session.delete(milestone)
        
        log = ActivityLog(
            user_id=user_id,
            project_id=project_id,
            action='DELETE',
            entity_type='MILESTONE',
            description=f'Deleted milestone "{name}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        remaining_milestones = Milestone.query.filter_by(project_id=project_id)\
            .order_by(Milestone.order).all()
        
        for idx, m in enumerate(remaining_milestones, start=1):
            m.order = idx
        
        db.session.commit()
        
        return True, None
    
    @staticmethod
    def reorder_milestone(milestone_id, new_order, user_id):
        """Изменить порядок этапа"""
        milestone = db.session.get(Milestone, milestone_id)
        
        if not milestone:
            return None, "Milestone not found"
        
        from app.services.project_service import ProjectService
        project, error = ProjectService.get_project(milestone.project_id, user_id)
        if error:
            return None, error
        
        if project.creator_id != user_id:
            from app.models.user import User
            user = db.session.get(User, user_id)
            if not user or user.system_role.value != 'ADMIN':
                return None, "Access denied"
        
        old_order = milestone.order
        
        if old_order == new_order:
            return milestone, None
        
        milestones = Milestone.query.filter_by(project_id=milestone.project_id)\
            .order_by(Milestone.order).all()
        
        milestones = [m for m in milestones if m.id != milestone_id]
        
        milestones.insert(new_order - 1, milestone)
        
        for idx, m in enumerate(milestones, start=1):
            m.order = idx
        
        db.session.commit()
        
        return milestone, None
    
    @staticmethod
    def update_milestone_status(milestone_id, status, user_id):
        """Обновить статус этапа"""
        milestone = db.session.get(Milestone, milestone_id)
        
        if not milestone:
            return None, "Milestone not found"
        
        from app.services.project_service import ProjectService
        project, error = ProjectService.get_project(milestone.project_id, user_id)
        if error:
            return None, error
        
        if project.creator_id != user_id:
            from app.models.user import User
            user = db.session.get(User, user_id)
            if not user or user.system_role.value != 'ADMIN':
                return None, "Access denied"
        
        try:
            milestone.status = MilestoneStatus[status.upper()]
        except KeyError:
            return None, f"Invalid status. Must be one of: {', '.join([s.name for s in MilestoneStatus])}"
        
        log = ActivityLog(
            user_id=user_id,
            project_id=milestone.project_id,
            action='UPDATE',
            entity_type='MILESTONE',
            entity_id=milestone_id,
            description=f'Changed milestone "{milestone.name}" status to {status}'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return milestone, None
