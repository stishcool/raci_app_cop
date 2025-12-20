from datetime import datetime
from app.models.project import Project, ProjectStatus, ProjectUser
from app.models.user import User, SystemRole
from app.models.activity_log import ActivityLog
from app.database import db
from sqlalchemy import or_


class ProjectService:
    """Сервис для работы с проектами"""
    
    @staticmethod
    def create_project(data, creator_id):
        """Создать новый проект"""
        name = data.get('name', '').strip()
        
        if not name:
            return None, "Project name is required"
        
        project = Project(
            name=name,
            description=data.get('description', '').strip(),
            creator_id=creator_id,
            status=ProjectStatus.DRAFT
        )
        
        if data.get('deadline'):
            try:
                from dateutil import parser
                project.deadline = parser.parse(data['deadline'])
            except:
                pass
        
        db.session.add(project)
        db.session.flush()
        
        project_user = ProjectUser(
            project_id=project.id,
            user_id=creator_id
        )
        db.session.add(project_user)
        
        log = ActivityLog(
            user_id=creator_id,
            project_id=project.id,
            action='CREATE',
            entity_type='PROJECT',
            entity_id=project.id,
            description=f'Created project "{project.name}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return project, None
    
    @staticmethod
    def get_projects(user_id, filter_type='all'):
        """Получить проекты с фильтрацией"""
        from app.models.user import User, SystemRole
        
        user = db.session.get(User, user_id)
        
        if not user:
            return None, "User not found"
        
        if user.system_role == SystemRole.ADMIN:
            query = Project.query
        else:
            accessible_project_ids = db.session.query(ProjectUser.project_id)\
                .filter_by(user_id=user_id).all()
            accessible_project_ids = [p[0] for p in accessible_project_ids]
            
            created_project_ids = db.session.query(Project.id)\
                .filter_by(creator_id=user_id).all()
            created_project_ids = [p[0] for p in created_project_ids]
            
            all_project_ids = list(set(accessible_project_ids + created_project_ids))
            
            query = Project.query.filter(Project.id.in_(all_project_ids))
        
        if filter_type == 'active':
            query = query.filter_by(status=ProjectStatus.ACTIVE)
        elif filter_type == 'my':
            query = query.filter_by(creator_id=user_id)
        elif filter_type == 'archived': 
            query = query.filter_by(status=ProjectStatus.ARCHIVED)
        
        projects = query.order_by(Project.priority.desc(), Project.created_at.desc()).all()  
        
        return projects, None
    
    @staticmethod
    def get_project(project_id, user_id):
        """Получить проект по ID"""
        project = db.session.get(Project, project_id)
        
        if not project:
            return None, "Project not found"
        
        user = db.session.get(User, user_id)
        if user.system_role != SystemRole.ADMIN:
            is_member = ProjectUser.query.filter_by(
                project_id=project_id,
                user_id=user_id
            ).first()
            
            if not is_member:
                return None, "Access denied"
        
        return project, None
    
    @staticmethod
    def update_project(project_id, data, user_id):
        """Обновить проект"""
        project, error = ProjectService.get_project(project_id, user_id)
        
        if error:
            return None, error
        
        if 'name' in data:
            project.name = data['name'].strip()
        
        if 'description' in data:
            project.description = data['description'].strip()
        
        if 'deadline' in data:
            try:
                from dateutil import parser
                project.deadline = parser.parse(data['deadline'])
            except:
                pass
        
        if 'priority' in data: 
            project.priority = data['priority']
        
        log = ActivityLog(
            user_id=user_id,
            project_id=project_id,
            action='UPDATE',
            entity_type='PROJECT',
            entity_id=project_id,
            description=f'Updated project "{project.name}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return project, None
    
    @staticmethod
    def request_publication(project_id, user_id):
        """Запросить публикацию проекта"""
        project, error = ProjectService.get_project(project_id, user_id)
        
        if error:
            return None, error
        
        if project.creator_id != user_id:
            return None, "Only project creator can request publication"
        
        if project.status != ProjectStatus.DRAFT:
            return None, "Project is not in DRAFT status"
        
        project.status = ProjectStatus.PENDING_APPROVAL
        project.updated_at = datetime.utcnow()
        
        log = ActivityLog(
            user_id=user_id,
            project_id=project.id,
            action='STATUS_CHANGE',
            entity_type='PROJECT',
            entity_id=project.id,
            description=f'Requested publication for project "{project.name}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return project, None
    
    @staticmethod
    def add_team_member(project_id, user_id_to_add, current_user_id):
        """Добавить участника в команду проекта"""
        project, error = ProjectService.get_project(project_id, current_user_id)
        
        if error:
            return None, error
        
        user_to_add = db.session.get(User, user_id_to_add)
        if not user_to_add:
            return None, "User not found"
        
        existing = ProjectUser.query.filter_by(
            project_id=project_id,
            user_id=user_id_to_add
        ).first()
        
        if existing:
            return None, "User is already a team member"
        
        project_user = ProjectUser(
            project_id=project_id,
            user_id=user_id_to_add
        )
        db.session.add(project_user)
        
        log = ActivityLog(
            user_id=current_user_id,
            project_id=project.id,
            action='ADD_MEMBER',
            entity_type='PROJECT',
            entity_id=project.id,
            description=f'Added {user_to_add.username} to project team'
        )
        db.session.add(log)
        
        db.session.commit()
        
        from app.services.notification_service import NotificationService
        NotificationService.notify_added_to_project(project, project_user)
        
        return project_user, None
    
    @staticmethod
    def remove_team_member(project_id, user_id_to_remove, current_user_id):
        """Удалить участника из команды проекта"""
        project, error = ProjectService.get_project(project_id, current_user_id)
        
        if error:
            return None, error
        
        if user_id_to_remove == project.creator_id:
            return None, "Cannot remove project creator"
        
        project_user = ProjectUser.query.filter_by(
            project_id=project_id,
            user_id=user_id_to_remove
        ).first()
        
        if not project_user:
            return None, "User is not a team member"
        
        db.session.delete(project_user)
        
        log = ActivityLog(
            user_id=current_user_id,
            project_id=project.id,
            action='REMOVE_MEMBER',
            entity_type='PROJECT',
            entity_id=project.id,
            description=f'Removed user from project team'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return True, None

    @staticmethod
    def archive_project(project_id, user_id):
        """Архивировать проект"""
        project, error = ProjectService.get_project(project_id, user_id)
        
        if error:
            return None, error
        
        from app.models.user import User, SystemRole
        user = db.session.get(User, user_id)
        
        if project.creator_id != user_id and user.system_role not in [SystemRole.ADMIN, SystemRole.PROJECT_MANAGER]:
            return None, "Only project creator, PM or admin can archive project"
        
        if project.status not in [ProjectStatus.ACTIVE, ProjectStatus.COMPLETED]:
            return None, "Only active or completed projects can be archived"
        
        project.status = ProjectStatus.ARCHIVED
        project.archived_at = datetime.utcnow()
        
        log = ActivityLog(
            user_id=user_id,
            project_id=project_id,
            action='ARCHIVE',
            entity_type='PROJECT',
            entity_id=project_id,
            description=f'Archived project "{project.name}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return project, None

    @staticmethod
    def restore_project(project_id, user_id):
        """Восстановить проект из архива"""
        project, error = ProjectService.get_project(project_id, user_id)
        
        if error:
            return None, error
        
        from app.models.user import User, SystemRole
        user = db.session.get(User, user_id)
        
        if project.creator_id != user_id and user.system_role not in [SystemRole.ADMIN, SystemRole.PROJECT_MANAGER]:
            return None, "Only project creator, PM or admin can restore project"
        
        if project.status != ProjectStatus.ARCHIVED:
            return None, "Only archived projects can be restored"
        
        from app.models.milestone import Milestone, MilestoneStatus
        milestones = Milestone.query.filter_by(project_id=project_id).all()
        
        all_completed = all(m.status == MilestoneStatus.COMPLETED for m in milestones) if milestones else False
        
        project.status = ProjectStatus.COMPLETED if all_completed else ProjectStatus.ACTIVE
        project.archived_at = None
        
        log = ActivityLog(
            user_id=user_id,
            project_id=project_id,
            action='RESTORE',
            entity_type='PROJECT',
            entity_id=project_id,
            description=f'Restored project "{project.name}" from archive'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return project, None

    @staticmethod
    def complete_project(project_id, user_id):
        """Завершить проект (для админа)"""
        project, error = ProjectService.get_project(project_id, user_id)
        
        if error:
            return None, error
        
        from app.models.user import User, SystemRole
        user = db.session.get(User, user_id)
        
        if user.system_role != SystemRole.ADMIN:
            return None, "Only admin can complete projects"
        
        if project.status != ProjectStatus.ACTIVE:
            return None, "Only active projects can be completed"
        
        from app.models.milestone import Milestone, MilestoneStatus
        milestones = Milestone.query.filter_by(project_id=project_id).all()
        
        if milestones:
            incomplete_milestones = [m for m in milestones if m.status != MilestoneStatus.COMPLETED]
            if incomplete_milestones:
                return None, f"Cannot complete project: {len(incomplete_milestones)} milestone(s) not completed"
        
        project.status = ProjectStatus.COMPLETED
        
        log = ActivityLog(
            user_id=user_id,
            project_id=project_id,
            action='COMPLETE',
            entity_type='PROJECT',
            entity_id=project_id,
            description=f'Completed project "{project.name}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        ProjectService.archive_project(project_id, user_id)
        
        return project, None