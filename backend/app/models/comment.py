from app.database import db
from datetime import datetime


class Comment(db.Model):
    """Модель комментария к задаче"""
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    task = db.relationship('Task', backref=db.backref('comments', lazy='dynamic', cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('comments', lazy='dynamic'))
    
    def to_dict(self):
        """Преобразовать в словарь"""
        return {
            'id': self.id,
            'task_id': self.task_id,
            'user_id': self.user_id,
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'full_name': f"{self.user.first_name or ''} {self.user.last_name or ''}".strip() or self.user.username,
                'avatar': self.user.avatar
            },
            'content': self.content,
            'mentions': self.extract_mentions(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def extract_mentions(self):
        """Извлечь упоминания пользователей из текста"""
        import re
        mentions = re.findall(r'@(\w+)', self.content)
        return mentions
