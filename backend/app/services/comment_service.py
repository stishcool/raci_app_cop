from app.models.comment import Comment
from app.models.task import Task
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.database import db
from datetime import datetime
import re


class CommentService:
    """Сервис для работы с комментариями"""
    
    @staticmethod
    def create_comment(task_id, data, user_id):
        """Создать комментарий к задаче"""
        from app.services.task_service import TaskService
        
        task, error = TaskService.get_task(task_id, user_id)
        if error:
            return None, error
        
        content = data.get('content', '').strip()
        
        if not content:
            return None, "Comment content is required"
        
        comment = Comment(
            task_id=task_id,
            user_id=user_id,
            content=content
        )
        
        db.session.add(comment)
        
        log = ActivityLog(
            user_id=user_id,
            project_id=task.project_id,
            action='COMMENT',
            entity_type='TASK',
            entity_id=task_id,
            description=f'Commented on task "{task.title}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        CommentService.notify_mentions(comment, task)
        
        return comment, None
    
    @staticmethod
    def get_task_comments(task_id, user_id):
        """Получить все комментарии задачи"""
        from app.services.task_service import TaskService
        
        task, error = TaskService.get_task(task_id, user_id)
        if error:
            return None, error
        
        comments = Comment.query.filter_by(task_id=task_id)\
            .order_by(Comment.created_at.desc())\
            .all()
        
        return comments, None
    
    @staticmethod
    def update_comment(comment_id, data, user_id):
        """Обновить комментарий"""
        comment = db.session.get(Comment, comment_id)
        
        if not comment:
            return None, "Comment not found"
        
        if comment.user_id != user_id:
            return None, "You can only edit your own comments"
        
        content = data.get('content', '').strip()
        
        if not content:
            return None, "Comment content is required"
        
        comment.content = content
        comment.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return comment, None
    
    @staticmethod
    def delete_comment(comment_id, user_id):
        """Удалить комментарий"""
        comment = db.session.get(Comment, comment_id)
        
        if not comment:
            return None, "Comment not found"
        
        from app.models.user import User, SystemRole
        user = db.session.get(User, user_id)
        
        if comment.user_id != user_id and user.system_role != SystemRole.ADMIN:
            return None, "You can only delete your own comments"
        
        task_id = comment.task_id
        
        db.session.delete(comment)
        db.session.commit()
        
        return True, None
    
    @staticmethod
    def notify_mentions(comment, task):
        """Уведомить упомянутых пользователей"""
        from app.services.notification_service import NotificationService
        
        mentions = comment.extract_mentions()
        
        for username in mentions:
            user = User.query.filter_by(username=username).first()
            if user and user.id != comment.user_id:
                NotificationService.create_notification(
                    user_id=user.id,
                    title=f'{comment.user.username} упомянул вас',
                    message=f'В комментарии к задаче "{task.title}": {comment.content[:100]}...',
                    notification_type='INFO',
                    related_entity_type='TASK',
                    related_entity_id=task.id
                )
