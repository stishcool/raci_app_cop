from datetime import datetime
from app.database import db


class File(db.Model):
    """Модель файла"""
    __tablename__ = 'files'
    
    id = db.Column(db.Integer, primary_key=True)
    
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50))
    file_size = db.Column(db.Integer)  # размер в байтах
    file_path = db.Column(db.String(500), nullable=False)
    
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), index=True)
    
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    project = db.relationship('Project', back_populates='files')
    task = db.relationship('Task', back_populates='files')
    uploaded_by_user = db.relationship('User', back_populates='uploaded_files')
    
    def to_dict(self):
        """Преобразовать в словарь"""
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'project_id': self.project_id,
            'task_id': self.task_id,
            'uploaded_by': self.uploaded_by,
            'uploaded_by_user': self.uploaded_by_user.to_dict() if self.uploaded_by_user else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }
    
    def __repr__(self):
        return f'<File {self.original_filename}>'
