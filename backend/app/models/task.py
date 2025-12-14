from datetime import datetime
from app.database import db
import enum


class TaskStatus(enum.Enum):
    """Статусы задачи"""
    TODO = 'TODO'
    IN_PROGRESS = 'IN_PROGRESS'
    IN_REVIEW = 'IN_REVIEW'
    DONE = 'DONE'
    BLOCKED = 'BLOCKED'


class Task(db.Model):
    """Модель задачи"""
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, index=True)
    
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    status = db.Column(db.Enum(TaskStatus), default=TaskStatus.TODO, nullable=False, index=True)
    priority = db.Column(db.Integer, default=0)  # 0-низкий, 1-средний, 2-высокий
    
    deadline = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    project = db.relationship('Project', back_populates='tasks')
    raci_assignments = db.relationship('RACIAssignment', back_populates='task', cascade='all, delete-orphan')
    files = db.relationship('File', back_populates='task', cascade='all, delete-orphan')
    
    def to_dict(self, include_raci=False):
        """Преобразовать в словарь"""
        data = {
            'id': self.id,
            'project_id': self.project_id,
            'title': self.title,
            'description': self.description,
            'status': self.status.value,
            'priority': self.priority,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }
        
        if include_raci:
            data['raci_assignments'] = [assignment.to_dict() for assignment in self.raci_assignments]
        
        return data
    
    def __repr__(self):
        return f'<Task {self.title}>'
