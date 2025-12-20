from app.database import db
from datetime import datetime


task_tags = db.Table('task_tags',
    db.Column('task_id', db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)


class Tag(db.Model):
    """Модель тега для задач"""
    __tablename__ = 'tags'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True, index=True)
    color = db.Column(db.String(7), default='#3B82F6') 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    tasks = db.relationship('Task', secondary=task_tags, back_populates='tags')
    
    def to_dict(self):
        """Преобразовать в словарь"""
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'tasks_count': len(self.tasks)
        }
    
    def __repr__(self):
        return f'<Tag {self.name}>'
