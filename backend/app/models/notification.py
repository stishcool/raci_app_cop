from datetime import datetime
from app.database import db


class Notification(db.Model):
    """Модель уведомлений"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    
    notification_type = db.Column(db.String(50))  # INFO, SUCCESS, WARNING, ERROR
    
    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    
    related_entity_type = db.Column(db.String(50))  # PROJECT, TASK
    related_entity_id = db.Column(db.Integer)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    read_at = db.Column(db.DateTime)
    
    user = db.relationship('User', back_populates='notifications')
    
    def to_dict(self):
        """Преобразовать в словарь"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'is_read': self.is_read,
            'related_entity_type': self.related_entity_type,
            'related_entity_id': self.related_entity_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None
        }
    
    def __repr__(self):
        return f'<Notification {self.title}>'
