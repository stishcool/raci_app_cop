from datetime import datetime
from flask_jwt_extended import create_access_token, create_refresh_token
from app.models.user import User
from app.database import db
from app.utils.validators import validate_email, validate_password, validate_username


class AuthService:
    """Сервис аутентификации"""
    
    @staticmethod
    def register_user(data):
        """Регистрация нового пользователя"""
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        is_valid, message = validate_username(username)
        if not is_valid:
            return None, message
        
        is_valid, email_or_error = validate_email(email)
        if not is_valid:
            return None, email_or_error
        email = email_or_error
        
        is_valid, message = validate_password(password)
        if not is_valid:
            return None, message
        
        if User.query.filter_by(username=username).first():
            return None, "Username already exists"
        
        if User.query.filter_by(email=email).first():
            return None, "Email already exists"
        
        user = User(
            username=username,
            email=email,
            first_name=data.get('first_name', '').strip(),
            last_name=data.get('last_name', '').strip(),
            is_active=True
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return user, None
    
    @staticmethod
    def login_user(username_or_email, password):
        """Вход пользователя"""
        user = User.query.filter(
            (User.username == username_or_email) | 
            (User.email == username_or_email.lower())
        ).first()
        
        if not user or not user.check_password(password):
            return None, "Invalid credentials"
        
        if not user.is_active:
            return None, "User account is inactive"
        
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict(include_email=True)
        }, None
    
    @staticmethod
    def refresh_access_token(user_id):
        """Обновление access token"""
        user = db.session.get(User, user_id)
        
        if not user or not user.is_active:
            return None, "User not found or inactive"
        
        access_token = create_access_token(identity=user.id)
        
        return {'access_token': access_token}, None
    
    @staticmethod
    def get_current_user(user_id):
        """Получить текущего пользователя"""
        user = db.session.get(User, user_id)
        
        if not user or not user.is_active:
            return None, "User not found or inactive"
        
        return user, None
