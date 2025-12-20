from app.database import db
from datetime import datetime


class ChecklistItem(db.Model):
    """Модель элемента чеклиста"""
    __tablename__ = 'checklist_items'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    is_completed = db.Column(db.Boolean, default=False, nullable=False)
    order = db.Column(db.Integer, nullable=False, default=0)
    completed_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    task = db.relationship('Task', backref=db.backref('checklist_items', lazy='dynamic', order_by='ChecklistItem.order', cascade='all, delete-orphan'))
    completed_by = db.relationship('User', backref=db.backref('completed_checklist_items', lazy='dynamic'))
    
    def to_dict(self):
        """Преобразовать в словарь"""
        return {
            'id': self.id,
            'task_id': self.task_id,
            'title': self.title,
            'is_completed': self.is_completed,
            'order': self.order,
            'completed_by': {
                'id': self.completed_by.id,
                'username': self.completed_by.username,
                'full_name': f"{self.completed_by.first_name or ''} {self.completed_by.last_name or ''}".strip() or self.completed_by.username
            } if self.completed_by else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
