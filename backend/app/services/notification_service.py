from app.models.notification import Notification
from app.database import db
from datetime import datetime


class NotificationService:
    """Сервис для создания уведомлений"""
    
    @staticmethod
    def create_notification(user_id, title, message, notification_type='INFO', 
                          related_entity_type=None, related_entity_id=None):
        """Создать уведомление для пользователя"""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return notification
    
    @staticmethod
    def notify_task_assigned(task, user, role):
        """Уведомление о назначении на задачу"""
        role_names = {
            'RESPONSIBLE': 'исполнителем',
            'ACCOUNTABLE': 'ответственным',
            'CONSULTED': 'консультантом',
            'INFORMED': 'информируемым'
        }
        
        NotificationService.create_notification(
            user_id=user.id,
            title=f'Вы назначены {role_names.get(role, "на задачу")}',
            message=f'Задача: "{task.title}" в проекте "{task.project.name}"',
            notification_type='INFO',
            related_entity_type='TASK',
            related_entity_id=task.id
        )
    
    @staticmethod
    def notify_task_status_changed(task, old_status, new_status, changed_by_user):
        """Уведомление об изменении статуса задачи"""
        from app.models.raci import RACIAssignment, RACIRole
        
        assignments = RACIAssignment.query.filter(
            RACIAssignment.task_id == task.id,
            RACIAssignment.role.in_([RACIRole.ACCOUNTABLE, RACIRole.INFORMED])
        ).all()
        
        for assignment in assignments:
            if assignment.user_id != changed_by_user.id:
                NotificationService.create_notification(
                    user_id=assignment.user_id,
                    title=f'Статус задачи изменен',
                    message=f'"{task.title}": {old_status} → {new_status} (изменил: {changed_by_user.username})',
                    notification_type='INFO',
                    related_entity_type='TASK',
                    related_entity_id=task.id
                )
    
    @staticmethod
    def notify_project_approved(project):
        """Уведомление об одобрении проекта"""
        from app.models.project import ProjectUser
        
        team = ProjectUser.query.filter_by(project_id=project.id).all()
        
        for member in team:
            NotificationService.create_notification(
                user_id=member.user_id,
                title='Проект одобрен!',
                message=f'Проект "{project.name}" одобрен администратором и теперь активен',
                notification_type='SUCCESS',
                related_entity_type='PROJECT',
                related_entity_id=project.id
            )
    
    @staticmethod
    def notify_project_rejected(project, reason):
        """Уведомление об отклонении проекта"""
        NotificationService.create_notification(
            user_id=project.creator_id,
            title='Проект отклонен',
            message=f'Проект "{project.name}" отклонен. Причина: {reason}',
            notification_type='ERROR',
            related_entity_type='PROJECT',
            related_entity_id=project.id
        )
    
    @staticmethod
    def notify_added_to_project(project, user):
        """Уведомление о добавлении в проект"""
        NotificationService.create_notification(
            user_id=user.id,
            title='Добавлен в проект',
            message=f'Вы добавлены в команду проекта "{project.name}"',
            notification_type='INFO',
            related_entity_type='PROJECT',
            related_entity_id=project.id
        )
    
    @staticmethod
    def get_user_notifications(user_id, unread_only=False):
        """Получить уведомления пользователя"""
        query = Notification.query.filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        return query.order_by(Notification.created_at.desc()).all()
    
    @staticmethod
    def mark_as_read(notification_id, user_id):
        """Отметить уведомление как прочитанное"""
        notification = db.session.get(Notification, notification_id)
        
        if not notification or notification.user_id != user_id:
            return None, "Notification not found"
        
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        
        db.session.commit()
        
        return notification, None
    
    @staticmethod
    def mark_all_as_read(user_id):
        """Отметить все уведомления как прочитанные"""
        Notification.query.filter_by(user_id=user_id, is_read=False).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        
        db.session.commit()
        
        return True, None
