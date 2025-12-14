from app.models.file import File
from app.models.activity_log import ActivityLog
from app.database import db
from app.utils.helpers import save_file, delete_file, get_file_extension
from app.services.project_service import ProjectService
from app.services.task_service import TaskService


class FileService:
    """Сервис для работы с файлами"""
    
    @staticmethod
    def upload_file(file, user_id, project_id=None, task_id=None):
        """Загрузить файл"""
        if not file:
            return None, "No file provided"
        
        if project_id:
            project, error = ProjectService.get_project(project_id, user_id)
            if error:
                return None, error
        
        if task_id:
            task, error = TaskService.get_task(task_id, user_id)
            if error:
                return None, error
            project_id = task.project_id
        
        subfolder = f"project_{project_id}" if project_id else "general"
        file_path, error = save_file(file, subfolder)
        
        if error:
            return None, error
        
        file_record = File(
            filename=file_path.split('/')[-1],
            original_filename=file.filename,
            file_type=get_file_extension(file.filename),
            file_size=file.content_length or 0,
            file_path=file_path,
            project_id=project_id,
            task_id=task_id,
            uploaded_by=user_id
        )
        
        db.session.add(file_record)
        
        if project_id:
            log = ActivityLog(
                user_id=user_id,
                project_id=project_id,
                action='UPLOAD',
                entity_type='FILE',
                entity_id=file_record.id,
                description=f'Uploaded file "{file.filename}"'
            )
            db.session.add(log)
        
        db.session.commit()
        
        return file_record, None
    
    @staticmethod
    def get_project_files(project_id, user_id):
        """Получить файлы проекта"""
        project, error = ProjectService.get_project(project_id, user_id)
        if error:
            return None, error
        
        files = File.query.filter_by(project_id=project_id).order_by(File.uploaded_at.desc()).all()
        
        return files, None
    
    @staticmethod
    def get_task_files(task_id, user_id):
        """Получить файлы задачи"""
        task, error = TaskService.get_task(task_id, user_id)
        if error:
            return None, error
        
        files = File.query.filter_by(task_id=task_id).order_by(File.uploaded_at.desc()).all()
        
        return files, None
    
    @staticmethod
    def delete_file_record(file_id, user_id):
        """Удалить файл"""
        file_record = db.session.get(File, file_id)
        
        if not file_record:
            return None, "File not found"
        
        if file_record.project_id:
            project, error = ProjectService.get_project(file_record.project_id, user_id)
            if error:
                return None, error
        
        delete_file(file_record.file_path)
        
        if file_record.project_id:
            log = ActivityLog(
                user_id=user_id,
                project_id=file_record.project_id,
                action='DELETE',
                entity_type='FILE',
                entity_id=file_id,
                description=f'Deleted file "{file_record.original_filename}"'
            )
            db.session.add(log)
        
        db.session.delete(file_record)
        db.session.commit()
        
        return True, None
