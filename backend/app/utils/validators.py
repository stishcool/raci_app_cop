import re
from email_validator import validate_email as email_validate, EmailNotValidError
from flask import current_app


def validate_email(email):
    """Валидация email адреса"""
    try:
        valid = email_validate(email, check_deliverability=False)
        return True, valid.normalized
    except EmailNotValidError as e:
        return False, str(e)


def validate_password(password):
    """Валидация пароля"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    
    if len(password) > 128:
        return False, "Password is too long"
    
    return True, "Password is valid"


def validate_username(username):
    """Валидация имени пользователя"""
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    
    if len(username) > 80:
        return False, "Username is too long"
    
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False, "Username can only contain letters, numbers, underscores and hyphens"
    
    return True, "Username is valid"


def allowed_file(filename):
    """Проверка допустимого расширения файла"""
    if '.' not in filename:
        return False
    
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in current_app.config['ALLOWED_EXTENSIONS']


def validate_project_data(data):
    """Валидация данных проекта"""
    errors = []
    
    if not data.get('name') or len(data.get('name', '').strip()) == 0:
        errors.append('Project name is required')
    
    if data.get('name') and len(data['name']) > 200:
        errors.append('Project name is too long (max 200 characters)')
    
    return len(errors) == 0, errors


def validate_task_data(data):
    """Валидация данных задачи"""
    errors = []
    
    if not data.get('title') or len(data.get('title', '').strip()) == 0:
        errors.append('Task title is required')
    
    if data.get('title') and len(data['title']) > 200:
        errors.append('Task title is too long (max 200 characters)')
    
    if not data.get('project_id'):
        errors.append('Project ID is required')
    
    return len(errors) == 0, errors
