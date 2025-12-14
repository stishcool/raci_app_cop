from datetime import datetime
from app.database import db


class ActivityLog(db.Model):
    """Модель логирования действий (Audit Trail)"""
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True)
    
    action = db.Column(db.String(100), nullable=False)  # CREATE, UPDATE, DELETE, STATUS_CHANGE и т.д.
    entity_type = db.Column(db.String(50), nullable=False)  # PROJECT, TASK, RACI, FILE
    entity_id = db.Column(db.Integer)
    
    description = db.Column(db.Text, nullable=False)
    extra_data = db.Column(db.Text)  # JSON строка с дополнительными данными
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    user = db.relationship('User', back_populates='activity_logs')
    project = db.relationship('Project', back_populates='activity_logs')
    
    def to_dict(self):
        """Преобразовать в словарь"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'project_id': self.project_id,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'description': self.description,
            'extra_data': self.extra_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<ActivityLog {self.action} {self.entity_type}>'
