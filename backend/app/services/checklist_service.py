from app.models.checklist import ChecklistItem
from app.models.activity_log import ActivityLog
from app.database import db
from datetime import datetime


class ChecklistService:
    """Сервис для работы с чеклистами"""
    
    @staticmethod
    def create_checklist_item(task_id, data, user_id):
        """Создать элемент чеклиста"""
        from app.services.task_service import TaskService
        
        task, error = TaskService.get_task(task_id, user_id)
        if error:
            return None, error
        
        title = data.get('title', '').strip()
        
        if not title:
            return None, "Checklist item title is required"
        
        max_order = db.session.query(db.func.max(ChecklistItem.order))\
            .filter_by(task_id=task_id).scalar() or 0
        
        item = ChecklistItem(
            task_id=task_id,
            title=title,
            order=data.get('order', max_order + 1)
        )
        
        db.session.add(item)
        
        log = ActivityLog(
            user_id=user_id,
            project_id=task.project_id,
            action='CREATE',
            entity_type='CHECKLIST_ITEM',
            entity_id=item.id,
            description=f'Added checklist item to task "{task.title}"'
        )
        db.session.add(log)
        
        db.session.commit()
        
        return item, None
    
    @staticmethod
    def get_task_checklist(task_id, user_id):
        """Получить чеклист задачи"""
        from app.services.task_service import TaskService
        
        task, error = TaskService.get_task(task_id, user_id)
        if error:
            return None, error
        
        items = ChecklistItem.query.filter_by(task_id=task_id)\
            .order_by(ChecklistItem.order).all()
        
        return items, None
    
    @staticmethod
    def update_checklist_item(item_id, data, user_id):
        """Обновить элемент чеклиста"""
        item = db.session.get(ChecklistItem, item_id)
        
        if not item:
            return None, "Checklist item not found"
        
        from app.services.task_service import TaskService
        task, error = TaskService.get_task(item.task_id, user_id)
        if error:
            return None, error
        
        if 'title' in data:
            item.title = data['title'].strip()
        
        if 'is_completed' in data:
            item.is_completed = data['is_completed']
            
            if item.is_completed:
                item.completed_by_id = user_id
                item.completed_at = datetime.utcnow()
            else:
                item.completed_by_id = None
                item.completed_at = None
        
        if 'order' in data:
            item.order = data['order']
        
        db.session.commit()
        
        return item, None
    
    @staticmethod
    def delete_checklist_item(item_id, user_id):
        """Удалить элемент чеклиста"""
        item = db.session.get(ChecklistItem, item_id)
        
        if not item:
            return None, "Checklist item not found"
        
        from app.services.task_service import TaskService
        task, error = TaskService.get_task(item.task_id, user_id)
        if error:
            return None, error
        
        db.session.delete(item)
        db.session.commit()
        
        return True, None
    
    @staticmethod
    def toggle_checklist_item(item_id, user_id):
        """Переключить статус выполнения элемента чеклиста"""
        item = db.session.get(ChecklistItem, item_id)
        
        if not item:
            return None, "Checklist item not found"
        
        from app.services.task_service import TaskService
        task, error = TaskService.get_task(item.task_id, user_id)
        if error:
            return None, error
        
        item.is_completed = not item.is_completed
        
        if item.is_completed:
            item.completed_by_id = user_id
            item.completed_at = datetime.utcnow()
        else:
            item.completed_by_id = None
            item.completed_at = None
        
        db.session.commit()
        
        return item, None
    
    @staticmethod
    def reorder_checklist_items(task_id, item_orders, user_id):
        """Изменить порядок элементов чеклиста"""
        from app.services.task_service import TaskService
        
        task, error = TaskService.get_task(task_id, user_id)
        if error:
            return None, error
        
        for item_data in item_orders:
            item = db.session.get(ChecklistItem, item_data['id'])
            if item and item.task_id == task_id:
                item.order = item_data['order']
        
        db.session.commit()
        
        return True, None
