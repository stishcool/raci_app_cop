from datetime import datetime
from app.database import db
import enum


class ProjectStatus(enum.Enum):
    """Статусы проекта"""
    DRAFT = 'DRAFT'
    PENDING_APPROVAL = 'PENDING_APPROVAL'
    ACTIVE = 'ACTIVE'
    REJECTED = 'REJECTED'
    COMPLETED = 'COMPLETED'
    ARCHIVED = 'ARCHIVED'


class Project(db.Model):
    """Модель проекта"""
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    deadline = db.Column(db.DateTime)
    
    status = db.Column(db.Enum(ProjectStatus), default=ProjectStatus.DRAFT, nullable=False, index=True)
    
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = db.Column(db.DateTime)
    archived_at = db.Column(db.DateTime)
    
    creator = db.relationship('User', back_populates='created_projects', foreign_keys=[creator_id])
    team_members = db.relationship('ProjectUser', back_populates='project', cascade='all, delete-orphan')
    tasks = db.relationship('Task', back_populates='project', cascade='all, delete-orphan')
    files = db.relationship('File', back_populates='project', cascade='all, delete-orphan')
    activity_logs = db.relationship('ActivityLog', back_populates='project', cascade='all, delete-orphan')
    
    def to_dict(self, include_team=False, include_tasks=False):
        """Преобразовать в словарь"""
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'status': self.status.value,
            'creator_id': self.creator_id,
            'creator': self.creator.to_dict() if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None,
        }
        
        if include_team:
            data['team'] = [member.to_dict() for member in self.team_members]
            data['team_count'] = len(self.team_members)
        
        if include_tasks:
            data['tasks'] = [task.to_dict() for task in self.tasks]
            data['tasks_count'] = len(self.tasks)
        
        return data
    
    def __repr__(self):
        return f'<Project {self.name}>'


class ProjectUser(db.Model):
    """Связь пользователей с проектами (команда проекта)"""
    __tablename__ = 'project_users'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    joined_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    project = db.relationship('Project', back_populates='team_members')
    user = db.relationship('User', back_populates='project_memberships')
    
    __table_args__ = (
        db.UniqueConstraint('project_id', 'user_id', name='unique_project_user'),
    )
    
    def to_dict(self):
        """Преобразовать в словарь"""
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None
        }
    
    def __repr__(self):
        return f'<ProjectUser project_id={self.project_id} user_id={self.user_id}>'
