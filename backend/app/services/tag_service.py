from app.models.tag import Tag
from app.models.task import Task
from app.database import db


class TagService:
    """Сервис для работы с тегами"""
    
    @staticmethod
    def create_tag(data):
        """Создать тег"""
        name = data.get('name', '').strip().lower()
        
        if not name:
            return None, "Tag name is required"
        
        existing_tag = Tag.query.filter_by(name=name).first()
        if existing_tag:
            return existing_tag, None  
        
        tag = Tag(
            name=name,
            color=data.get('color', '#3B82F6')
        )
        
        db.session.add(tag)
        db.session.commit()
        
        return tag, None
    
    @staticmethod
    def get_all_tags():
        """Получить все теги"""
        tags = Tag.query.order_by(Tag.name).all()
        return tags, None
    
    @staticmethod
    def get_tag(tag_id):
        """Получить тег по ID"""
        tag = db.session.get(Tag, tag_id)
        
        if not tag:
            return None, "Tag not found"
        
        return tag, None
    
    @staticmethod
    def update_tag(tag_id, data):
        """Обновить тег"""
        tag = db.session.get(Tag, tag_id)
        
        if not tag:
            return None, "Tag not found"
        
        if 'name' in data:
            name = data['name'].strip().lower()
            if name:
                existing = Tag.query.filter(Tag.name == name, Tag.id != tag_id).first()
                if existing:
                    return None, "Tag with this name already exists"
                tag.name = name
        
        if 'color' in data:
            tag.color = data['color']
        
        db.session.commit()
        
        return tag, None
    
    @staticmethod
    def delete_tag(tag_id):
        """Удалить тег"""
        tag = db.session.get(Tag, tag_id)
        
        if not tag:
            return None, "Tag not found"
        
        db.session.delete(tag)
        db.session.commit()
        
        return True, None
    
    @staticmethod
    def add_tag_to_task(task_id, tag_id, user_id):
        """Добавить тег к задаче"""
        from app.services.task_service import TaskService
        
        task, error = TaskService.get_task(task_id, user_id)
        if error:
            return None, error
        
        tag = db.session.get(Tag, tag_id)
        if not tag:
            return None, "Tag not found"
        
        if tag in task.tags:
            return task, None  
        
        task.tags.append(tag)
        db.session.commit()
        
        return task, None
    
    @staticmethod
    def remove_tag_from_task(task_id, tag_id, user_id):
        """Удалить тег из задачи"""
        from app.services.task_service import TaskService
        
        task, error = TaskService.get_task(task_id, user_id)
        if error:
            return None, error
        
        tag = db.session.get(Tag, tag_id)
        if not tag:
            return None, "Tag not found"
        
        if tag in task.tags:
            task.tags.remove(tag)
            db.session.commit()
        
        return task, None
    
    @staticmethod
    def get_tasks_by_tag(tag_id, user_id):
        """Получить все задачи с определенным тегом"""
        tag = db.session.get(Tag, tag_id)
        
        if not tag:
            return None, "Tag not found"
        
        from app.models.project import ProjectUser
        from app.models.user import User, SystemRole
        
        user = db.session.get(User, user_id)
        
        if user.system_role == SystemRole.ADMIN:
            tasks = tag.tasks
        else:
            accessible_project_ids = db.session.query(ProjectUser.project_id)\
                .filter_by(user_id=user_id).all()
            accessible_project_ids = [p[0] for p in accessible_project_ids]
            
            tasks = [t for t in tag.tasks if t.project_id in accessible_project_ids]
        
        return tasks, None
