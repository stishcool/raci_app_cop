from datetime import datetime
from app.database import db
from werkzeug.security import generate_password_hash, check_password_hash
import enum


class SystemRole(enum.Enum):
    """Системные роли пользователей"""
    ADMIN = 'ADMIN'
    PROJECT_MANAGER = 'PROJECT_MANAGER'
    TEAM_MEMBER = 'TEAM_MEMBER'


class User(db.Model):
    """Модель пользователя"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    avatar = db.Column(db.String(255))
    
    system_role = db.Column(db.Enum(SystemRole), default=SystemRole.TEAM_MEMBER, nullable=False)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    created_projects = db.relationship('Project', back_populates='creator', foreign_keys='Project.creator_id')
    project_memberships = db.relationship('ProjectUser', back_populates='user', cascade='all, delete-orphan')
    raci_assignments = db.relationship('RACIAssignment', back_populates='user', foreign_keys='RACIAssignment.user_id', cascade='all, delete-orphan')
    activity_logs = db.relationship('ActivityLog', back_populates='user')
    notifications = db.relationship('Notification', back_populates='user', cascade='all, delete-orphan')
    uploaded_files = db.relationship('File', back_populates='uploaded_by_user')
    
    def set_password(self, password):
        """Установить хеш пароля"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Проверить пароль"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_email=False):
        """Преобразовать в словарь"""
        from flask import request
        
        avatar_url = None
        if self.avatar:
            base_url = request.host_url.rstrip('/')
            avatar_url = f"{base_url}/uploads/{self.avatar}"
        
        data = {
            'id': self.id,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name or ''} {self.last_name or ''}".strip() or self.username,
            'avatar': avatar_url,  
            'system_role': self.system_role.value,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_email:
            data['email'] = self.email
            data['phone'] = self.phone
        return data

    def __repr__(self):
        return f'<User {self.username}>'


class Role(db.Model):
    """Модель роли в системе (дополнительная таблица для расширения)"""
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Role {self.name}>'
