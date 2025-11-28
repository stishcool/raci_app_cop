from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy import Index, Enum, ForeignKeyConstraint
from sqlalchemy.orm import relationship, validates

db = SQLAlchemy()

StageStatus = Enum('planned', 'in_progress', 'completed', name='stage_status')
TaskPriority = Enum('low', 'medium', 'high', name='task_priority')
RACIRole = Enum('R', 'A', 'C', 'I', name='raci_role')
NotificationEntity = Enum('project', 'stage', 'task', name='notification_entity')
ProjectStatus = Enum('draft', 'approved', 'rejected', name='project_status')

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
    
    projects = relationship(
        'Project', 
        backref='created_by_user', 
        foreign_keys='Project.created_by',
        lazy=True,
        cascade='all, delete-orphan'
    )
    
    members = relationship(
        'ProjectMember', 
        backref='user', 
        lazy=True, 
        cascade='all, delete-orphan'
    )
    
    raci_assignments = relationship(
        'RACIAssignment', 
        foreign_keys='RACIAssignment.user_id',
        back_populates='user', 
        lazy=True,
        cascade='all, delete-orphan'
    )
    
    assigned_raci_assignments = relationship(
        'RACIAssignment',
        foreign_keys='RACIAssignment.assigned_by',
        back_populates='assigner', 
        lazy=True,
        cascade='all, delete-orphan'
    )
    
    positions = relationship('Position', secondary='user_position', back_populates='users')
    
    notifications = relationship('Notification', backref='user', lazy=True)
    
    audit_logs = relationship('AuditLog', backref='user', lazy=True)
    
    uploaded_files = relationship('File', backref='uploader', lazy=True)

class Position(db.Model):
    __tablename__ = 'position'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    users = relationship('User', secondary='user_position', back_populates='positions')

class UserPosition(db.Model):
    __tablename__ = 'user_position'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    position_id = db.Column(db.Integer, db.ForeignKey('position.id'), nullable=False)
    
    __table_args__ = (
        Index('idx_user_position', 'user_id', 'position_id', unique=True),
    )

class Project(db.Model):
    __tablename__ = 'project'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deadline = db.Column(db.DateTime)
    is_archived = db.Column(db.Boolean, default=False)
    status = db.Column(ProjectStatus, default='draft')
    
    __table_args__ = (
        Index('idx_project_title', 'title'),
        Index('idx_project_creator', 'created_by'),
    )
    
    members = relationship('ProjectMember', backref='project', lazy=True, cascade='all, delete-orphan')
    stages = relationship('ProjectStage', backref='project', lazy=True, cascade='all, delete-orphan')

class ProjectMember(db.Model):
    __tablename__ = 'project_member'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_project_member', 'project_id', 'user_id', unique=True),
    )

class ProjectStage(db.Model):
    __tablename__ = 'project_stage'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    status = db.Column(StageStatus, default='planned')
    deadline = db.Column(db.DateTime)
    sequence = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_stage_project', 'project_id', 'sequence'),
    )
    
    tasks = relationship('Task', backref='stage', lazy=True, cascade='all, delete-orphan')
    raci_assignments = relationship('RACIAssignment', back_populates='stage', lazy=True, cascade='all, delete-orphan')

class Task(db.Model):
    __tablename__ = 'task'
    
    id = db.Column(db.Integer, primary_key=True)
    stage_id = db.Column(db.Integer, db.ForeignKey('project_stage.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(TaskPriority, default='medium')
    is_completed = db.Column(db.Boolean, default=False)
    deadline = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_task_stage', 'stage_id'),
    )
    
    dependencies = relationship(
        'TaskDependency', 
        foreign_keys='TaskDependency.task_id',
        backref='task', 
        lazy=True,
        cascade='all, delete-orphan'
    )
    
    dependent_on = relationship(
        'TaskDependency', 
        foreign_keys='TaskDependency.depends_on_task_id',
        backref='depends_on_task', 
        lazy=True,
        cascade='all, delete-orphan'
    )
    
    raci_assignments = relationship('RACIAssignment', backref='task', lazy=True, cascade='all, delete-orphan')
    
    files = relationship('TaskFile', backref='task', lazy=True, cascade='all, delete-orphan')

class Role(db.Model):
    __tablename__ = 'role'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(RACIRole, unique=True, nullable=False)
    description = db.Column(db.String(200))

class RACIAssignment(db.Model):
    __tablename__ = 'raci_assignment'
    
    id = db.Column(db.Integer, primary_key=True)
    stage_id = db.Column(db.Integer, db.ForeignKey('project_stage.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['user.id'], name='fk_raci_user'),
        ForeignKeyConstraint(['assigned_by'], ['user.id'], name='fk_raci_assigned_by'),
    )
    
    user = relationship(
        'User', 
        foreign_keys=[user_id],
        back_populates='raci_assignments'
    )
    
    assigner = relationship(
        'User', 
        foreign_keys=[assigned_by],
        back_populates='assigned_raci_assignments'
    )
    
    role = relationship(
        'Role', 
        backref='raci_role_assignments',  
        lazy=True
    )
    
    stage = relationship(
        'ProjectStage', 
        back_populates='raci_assignments',  
        lazy=True
    )

class Notification(db.Model):
    """Система уведомлений"""
    __tablename__ = 'notification'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    related_entity = db.Column(NotificationEntity)
    related_entity_id = db.Column(db.Integer)
    
    __table_args__ = (
        Index('idx_notification_user', 'user_id', 'is_read'),
    )

class AuditLog(db.Model):
    """Полноценное логирование действий"""
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
    
class TaskDependency(db.Model):
    """Зависимости между задачами"""
    __tablename__ = 'task_dependency'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    depends_on_task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    
    __table_args__ = (
        Index('idx_task_dependency_task', 'task_id'),
        Index('idx_task_dependency_depends_on', 'depends_on_task_id'),
        db.UniqueConstraint('task_id', 'depends_on_task_id', name='uq_task_dependency')
    )

class File(db.Model):
    __tablename__ = 'file'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    mimetype = db.Column(db.String(100), nullable=False)
    data = db.Column(db.LargeBinary, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    __table_args__ = (
        Index('idx_file_uploaded_by', 'uploaded_by'),
    )
    
    task_files = relationship('TaskFile', backref='file', cascade='all, delete-orphan')

class TaskFile(db.Model):
    __tablename__ = 'task_file'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    file_id = db.Column(db.Integer, db.ForeignKey('file.id'), nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('task_id', 'file_id', name='uq_task_file'),
    )