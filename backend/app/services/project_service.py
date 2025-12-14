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
        """Получить список проектов"""
        user = db.session.get(User, user_id)
        
        if user.system_role == SystemRole.ADMIN:
            query = Project.query
        else:
            query = Project.query.join(ProjectUser).filter(
                ProjectUser.user_id == user_id
            )
        
        if filter_type == 'active':
            query = query.filter(Project.status == ProjectStatus.ACTIVE)
        elif filter_type == 'my':
            query = query.filter(Project.creator_id == user_id)
        
        projects = query.order_by(Project.created_at.desc()).all()
        
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
                project.deadline = parser.parse(data['deadline']) if data['deadline'] else None
            except:
                pass
        
        project.updated_at = datetime.utcnow()
        
        log = ActivityLog(
            user_id=user_id,
            project_id=project.id,
            action='UPDATE',
            entity_type='PROJECT',
            entity_id=project.id,
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
