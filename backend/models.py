from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy import Index, Enum, ForeignKeyConstraint
from sqlalchemy.orm import relationship, validates

db = SQLAlchemy()

StageStatus = Enum('planned', 'in_progress', 'completed', name='stage_status')
TaskPriority = Enum('low', 'medium', 'high', name='task_priority')
NotificationEntity = Enum('project', 'stage', 'task', name='notification_entity')

class User(db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(30))
    email = db.Column(db.String(100), unique=True, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_user_username', 'username'),
    )
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    @validates('username')
    def validate_username(self, key, username):
        if not username or len(username) < 3:
            raise ValueError('Имя пользователя должно быть длиннее 3 символов')
        return username
    
    @validates('phone')
    def validate_phone(self, key, phone):
        if phone and not phone.replace('+', '').isdigit():
            raise ValueError('Телефон может содержать только цифры и "+"')
        return phone
    
    projects = relationship('Project', backref='created_by_user', foreign_keys='Project.created_by', lazy=True, cascade='all, delete-orphan')
    members = relationship('ProjectMember', backref='user', lazy=True, cascade='all, delete-orphan')
    raci_assignments = relationship('RACIAssignment', backref='assigned_user', foreign_keys='RACIAssignment.user_id', lazy=True, cascade='all, delete-orphan')
    assigned_raci = relationship('RACIAssignment', backref='assigner_user', foreign_keys='RACIAssignment.assigned_by', lazy=True)
    notifications = relationship('Notification', backref='user', lazy=True, cascade='all, delete-orphan')
    audit_logs = relationship('AuditLog', backref='user', lazy=True, cascade='all, delete-orphan')
    positions = relationship('Position', secondary='user_position', backref='users', lazy='dynamic')

class Position(db.Model):
    __tablename__ = 'position'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserPosition(db.Model):
    __tablename__ = 'user_position'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    position_id = db.Column(db.Integer, db.ForeignKey('position.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'position_id', name='uq_user_position'),)

class Role(db.Model):
    __tablename__ = 'role'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(50), nullable=False, unique=True)
    is_custom = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    raci_assignments = relationship('RACIAssignment', backref='role', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (Index('idx_role_title', 'title'),)

class Project(db.Model):
    __tablename__ = 'project'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    deadline = db.Column(db.DateTime)
    is_archived = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    stages = relationship('ProjectStage', backref='project', lazy=True, cascade='all, delete-orphan')
    members = relationship('ProjectMember', backref='project', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (
        Index('idx_project_creator', 'created_by'),
        Index('idx_project_title', 'title')
    )

class ProjectStage(db.Model):
    __tablename__ = 'project_stage'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    status = db.Column(StageStatus, default='planned')
    deadline = db.Column(db.DateTime)
    sequence = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tasks = relationship('Task', backref='stage', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (
        Index('idx_stage_project', 'project_id'),
        Index('idx_stage_sequence', 'project_id', 'sequence'),
    )

class Task(db.Model):
    __tablename__ = 'task'
    
    id = db.Column(db.Integer, primary_key=True)
    stage_id = db.Column(db.Integer, db.ForeignKey('project_stage.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(TaskPriority)
    is_completed = db.Column(db.Boolean, default=False)
    deadline = db.Column(db.DateTime, nullable=True)
    depends_on_tasks = db.Column(db.JSON, default=lambda: [], nullable=False)  # Список ID зависимых задач
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    raci_assignments = relationship('RACIAssignment', backref='task', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (Index('idx_task_stage', 'stage_id'),)

class ProjectMember(db.Model):
    __tablename__ = 'project_member'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (Index('idx_member_unique', 'project_id', 'user_id', unique=True),)

class RACIAssignment(db.Model):
    __tablename__ = 'raci_assignment'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_raci_task_user', 'task_id', 'user_id', unique=True),
        ForeignKeyConstraint(['assigned_by'], ['user.id'], name='fk_raci_assigned_by'),
    )

class Notification(db.Model):
    __tablename__ = 'notification'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    related_entity = db.Column(NotificationEntity)
    related_entity_id = db.Column(db.Integer)
    
    __table_args__ = (Index('idx_notification_user', 'user_id', 'is_read'),)

class AuditLog(db.Model):
    __tablename__ = 'audit_log'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    action = db.Column(db.String(50), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.Integer)
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_audit_entity', 'entity_type', 'entity_id'),
        Index('idx_audit_user', 'user_id'),
        Index('idx_audit_timestamp', 'timestamp'),
    )