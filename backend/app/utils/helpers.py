import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import current_app


def get_file_extension(filename):
    """Получить расширение файла"""
    if '.' in filename:
        return filename.rsplit('.', 1)[1].lower()
    return ''


def generate_unique_filename(original_filename):
    """Генерировать уникальное имя файла"""
    ext = get_file_extension(original_filename)
    unique_name = f"{uuid.uuid4().hex}_{int(datetime.utcnow().timestamp())}"
    return f"{unique_name}.{ext}" if ext else unique_name


def save_file(file, subfolder='general'):
    """Сохранить загруженный файл"""
    if not file:
        return None, "No file provided"
    
    original_filename = secure_filename(file.filename)
    
    filename = generate_unique_filename(original_filename)
    
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], subfolder)
    os.makedirs(upload_folder, exist_ok=True)
    
    file_path = os.path.join(upload_folder, filename)
    
    try:
        file.save(file_path)
        relative_path = f"{subfolder}/{filename}"  
        return relative_path, None
    except Exception as e:
        return None, f"Failed to save file: {str(e)}"

def delete_file(file_path):
    """Удалить файл"""
    if not file_path:
        return False
    
    full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], file_path)
    
    try:
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    return False


def format_file_size(size_bytes):
    """Форматировать размер файла"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"


def calculate_deadline_status(deadline):
    """Рассчитать статус дедлайна"""
    if not deadline:
        return 'none'
    
    now = datetime.utcnow()
    delta = deadline - now
    
    if delta.total_seconds() < 0:
        return 'overdue'
    elif delta.days < 3:
        return 'urgent'
    elif delta.days < 7:
        return 'soon'
    else:
        return 'normal'
