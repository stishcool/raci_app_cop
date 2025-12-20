from app.database import db
from datetime import datetime
import enum


class MilestoneStatus(enum.Enum):
    """Статусы этапа"""
    NOT_STARTED = 'NOT_STARTED'
    IN_PROGRESS = 'IN_PROGRESS'
    COMPLETED = 'COMPLETED'
    BLOCKED = 'BLOCKED'


class Milestone(db.Model):
    """Модель этапа проекта"""
    __tablename__ = 'milestones'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    order = db.Column(db.Integer, nullable=False, default=0)  # Порядок выполнения
    status = db.Column(db.Enum(MilestoneStatus), default=MilestoneStatus.NOT_STARTED, nullable=False)
    start_date = db.Column(db.DateTime)
    deadline = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project = db.relationship('Project', backref=db.backref('milestones', lazy='dynamic', order_by='Milestone.order', cascade='all, delete-orphan'))
    
    def to_dict(self, include_tasks=False):
        """Преобразовать в словарь"""
        data = {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'description': self.description,
            'order': self.order,
            'status': self.status.value,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_tasks:
            from app.models.task import Task
            tasks = Task.query.filter_by(milestone_id=self.id).all()
            data['tasks'] = [t.to_dict() for t in tasks]
            data['tasks_count'] = len(tasks)
            data['completed_tasks'] = sum(1 for t in tasks if t.status.value == 'DONE')
            data['progress'] = (data['completed_tasks'] / data['tasks_count'] * 100) if data['tasks_count'] > 0 else 0
        
        return data
    
    def update_status(self):
        """Автоматически обновить статус на основе задач"""
        from app.models.task import Task, TaskStatus
        
        tasks = Task.query.filter_by(milestone_id=self.id).all()
        
        if not tasks:
            self.status = MilestoneStatus.NOT_STARTED
            return
        
        completed = sum(1 for t in tasks if t.status == TaskStatus.DONE)
        in_progress = sum(1 for t in tasks if t.status in [TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW])
        blocked = sum(1 for t in tasks if t.status == TaskStatus.BLOCKED)
        
        if completed == len(tasks):
            self.status = MilestoneStatus.COMPLETED
            if not self.completed_at:
                self.completed_at = datetime.utcnow()
        elif blocked > 0:
            self.status = MilestoneStatus.BLOCKED
        elif in_progress > 0:
            self.status = MilestoneStatus.IN_PROGRESS
        else:
            self.status = MilestoneStatus.NOT_STARTED
