from app.models.user import User, SystemRole
from app.models.project import Project, ProjectStatus
from app.models.activity_log import ActivityLog
from app.database import db
from datetime import datetime


class AdminService:
    """Сервис для административных функций"""
    
    @staticmethod
    def get_all_users_filtered(role=None, is_active=None, search=None):
        """Получить пользователей с фильтрами"""
        query = User.query
        
        if role:
            try:
                role_enum = SystemRole[role.upper()]
                query = query.filter_by(system_role=role_enum)
            except KeyError:
                pass
        
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.username.ilike(search_pattern),
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern),
                    User.email.ilike(search_pattern)
                )
            )
        
        users = query.order_by(User.created_at.desc()).all()
        
        return users, None
    
    @staticmethod
    def get_all_logs(page=1, per_page=50, user_id=None, action=None, entity_type=None, project_id=None, date_from=None, date_to=None):
        """Получить логи активности с фильтрами"""
        query = ActivityLog.query
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        if action:
            query = query.filter_by(action=action)
        
        if entity_type:
            query = query.filter_by(entity_type=entity_type)
        
        if project_id:
            query = query.filter_by(project_id=project_id)
        
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(ActivityLog.created_at >= date_from_obj)
            except:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(ActivityLog.created_at <= date_to_obj)
            except:
                pass
        
        logs = query.order_by(ActivityLog.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'logs': [log.to_dict() for log in logs.items],
            'total': logs.total,
            'pages': logs.pages,
            'current_page': logs.page,
            'per_page': per_page
        }, None
    
    @staticmethod
    def update_user_role(user_id, new_role, admin_id):
        """Изменить роль пользователя"""
        user = db.session.get(User, user_id)
        
        if not user:
            return None, "User not found"
        
        try:
            role_enum = SystemRole[new_role.upper()]
        except KeyError:
            return None, f"Invalid role. Must be one of: {', '.join([r.name for r in SystemRole])}"
        
        old_role = user.system_role.value
        user.system_role = role_enum
        
        log = ActivityLog(
            user_id=admin_id,
            action='UPDATE',
            entity_type='USER',
            entity_id=user_id,
            description=f'Changed user {user.username} role from {old_role} to {new_role}'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return user, None
    
    @staticmethod
    def toggle_user_status(user_id, admin_id):
        """Активировать/деактивировать пользователя"""
        user = db.session.get(User, user_id)
        
        if not user:
            return None, "User not found"
        
        user.is_active = not user.is_active
        
        action = 'ACTIVATE' if user.is_active else 'DEACTIVATE'
        log = ActivityLog(
            user_id=admin_id,
            action=action,
            entity_type='USER',
            entity_id=user_id,
            description=f'{action.capitalize()}d user {user.username}'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return user, None
    
    @staticmethod
    def approve_project(project_id, admin_id):
        """Одобрить проект"""
        project = db.session.get(Project, project_id)
        
        if not project:
            return None, "Project not found"
        
        if project.status != ProjectStatus.PENDING_APPROVAL:
            return None, "Project is not pending approval"
        
        project.status = ProjectStatus.ACTIVE
        project.published_at = datetime.utcnow()
        
        log = ActivityLog(
            user_id=admin_id,
            project_id=project_id,
            action='APPROVE',
            entity_type='PROJECT',
            entity_id=project_id,
            description=f'Approved project "{project.name}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        from app.services.notification_service import NotificationService
        NotificationService.create_notification(
            user_id=project.creator_id,
            title='Проект одобрен',
            message=f'Ваш проект "{project.name}" был одобрен администратором',
            notification_type='SUCCESS',
            related_entity_type='PROJECT',
            related_entity_id=project_id
        )
        
        return project, None
    
    @staticmethod
    def reject_project(project_id, admin_id, reason=None):
        """Отклонить проект"""
        project = db.session.get(Project, project_id)
        
        if not project:
            return None, "Project not found"
        
        if project.status != ProjectStatus.PENDING_APPROVAL:
            return None, "Project is not pending approval"
        
        project.status = ProjectStatus.REJECTED
        
        log = ActivityLog(
            user_id=admin_id,
            project_id=project_id,
            action='REJECT',
            entity_type='PROJECT',
            entity_id=project_id,
            description=f'Rejected project "{project.name}". Reason: {reason or "No reason provided"}'
        )
        db.session.add(log)
        
        db.session.commit()
        
        from app.services.notification_service import NotificationService
        NotificationService.create_notification(
            user_id=project.creator_id,
            title='Проект отклонен',
            message=f'Ваш проект "{project.name}" был отклонен. Причина: {reason or "Не указана"}',
            notification_type='ERROR',
            related_entity_type='PROJECT',
            related_entity_id=project_id
        )
        
        return project, None
    
    @staticmethod
    def get_pending_projects():
        """Получить проекты на одобрение"""
        projects = Project.query.filter_by(status=ProjectStatus.PENDING_APPROVAL)\
            .order_by(Project.created_at.desc()).all()
        
        return projects, None
    
    @staticmethod
    def delete_user(user_id, admin_id):
        """Удалить пользователя"""
        user = db.session.get(User, user_id)
        
        if not user:
            return None, "User not found"
        
        if user.id == admin_id:
            return None, "Cannot delete yourself"
        
        username = user.username
        
        db.session.delete(user)
        
        log = ActivityLog(
            user_id=admin_id,
            action='DELETE',
            entity_type='USER',
            description=f'Deleted user {username}'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return True, None
