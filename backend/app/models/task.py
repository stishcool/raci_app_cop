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
    milestone_id = db.Column(db.Integer, db.ForeignKey('milestones.id', ondelete='SET NULL'))
    
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    status = db.Column(db.Enum(TaskStatus), default=TaskStatus.TODO, nullable=False, index=True)
    priority = db.Column(db.Integer, default=0)  
    
    deadline = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    project = db.relationship('Project', back_populates='tasks')
    raci_assignments = db.relationship('RACIAssignment', back_populates='task', cascade='all, delete-orphan')
    files = db.relationship('File', back_populates='task', cascade='all, delete-orphan')
    milestone = db.relationship('Milestone', backref=db.backref('tasks', lazy='dynamic'))
    tags = db.relationship('Tag', secondary='task_tags', back_populates='tasks')  
    
    def to_dict(self, include_raci=False, include_files=False, include_checklist=False, include_tags=True):  
        """Преобразовать в словарь"""
        data = {
            'id': self.id,
            'project_id': self.project_id,
            'milestone_id': self.milestone_id,
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
        
        if include_files:
            data['files'] = [f.to_dict() for f in self.files]
            data['files_count'] = len(self.files)
        
        if include_checklist:
            from app.models.checklist import ChecklistItem
            items = ChecklistItem.query.filter_by(task_id=self.id).order_by(ChecklistItem.order).all()
            data['checklist'] = [item.to_dict() for item in items]
            completed_count = sum(1 for item in items if item.is_completed)
            data['checklist_progress'] = {
                'total': len(items),
                'completed': completed_count,
                'percentage': (completed_count / len(items) * 100) if items else 0
            }
        
        if include_tags:  
            data['tags'] = [tag.to_dict() for tag in self.tags]
        
        return data
    
    def __repr__(self):
        return f'<Task {self.title}>'
