from datetime import datetime
from app.database import db
import enum


class RACIRole(enum.Enum):
    """RACI роли"""
    RESPONSIBLE = 'RESPONSIBLE'  # Исполнитель
    ACCOUNTABLE = 'ACCOUNTABLE'  # Ответственный
    CONSULTED = 'CONSULTED'      # Консультант
    INFORMED = 'INFORMED'        # Информируемый


class RACIAssignment(db.Model):
    """Назначение RACI ролей пользователям на задачи"""
    __tablename__ = 'raci_assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    role = db.Column(db.Enum(RACIRole), nullable=False)
    
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    task = db.relationship('Task', back_populates='raci_assignments')
    user = db.relationship('User', back_populates='raci_assignments', foreign_keys=[user_id])
    assigner = db.relationship('User', foreign_keys=[assigned_by])
    
    __table_args__ = (
        db.UniqueConstraint('task_id', 'user_id', 'role', name='unique_task_user_role'),
        db.Index('idx_task_role', 'task_id', 'role'),
    )
    
    def to_dict(self):
        """Преобразовать в словарь"""
        return {
            'id': self.id,
            'task_id': self.task_id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'role': self.role.value,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None
        }
    
    def __repr__(self):
        return f'<RACIAssignment task_id={self.task_id} user_id={self.user_id} role={self.role.value}>'
