from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, User, AuditLog, Position, UserPosition
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from marshmallow import Schema, fields, validate, ValidationError
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

class UserCreateSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    password = fields.Str(required=True, validate=validate.Length(min=3, max=128))
    full_name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    phone = fields.Str(allow_none=True, validate=validate.Length(max=30))
    email = fields.Str(allow_none=True, validate=validate.Email())
    is_active = fields.Boolean()

class UserUpdateSchema(Schema):
    username = fields.Str(validate=validate.Length(min=3, max=100))
    full_name = fields.Str(validate=validate.Length(min=1, max=100))
    phone = fields.Str(allow_none=True, validate=validate.Length(max=30))
    email = fields.Str(allow_none=True, validate=validate.Email())
    is_active = fields.Boolean()
    new_password = fields.Str(allow_none=True, validate=validate.Length(min=3, max=128))

def is_admin(user_id):
    """Проверяет, является ли пользователь администратором."""
    admin_position = Position.query.filter_by(title='Администратор').first()
    if not admin_position:
        return False
    return UserPosition.query.filter_by(
        user_id=user_id,
        position_id=admin_position.id
    ).first() is not None

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():

    """Получение списка всех пользователей (только для администраторов)."""
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'full_name': u.full_name,
        'email': u.email,
        'is_active': u.is_active,
        'positions': [p.title for p in u.positions]
    } for u in users])

@admin_bp.route('/users', methods=['POST'])
@jwt_required()

def add_user():
    """Создание нового пользователя (только для администраторов)."""
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403

    try:
        schema = UserCreateSchema()
        data = schema.load(request.get_json())

        if User.query.filter_by(username=data['username']).first():
            return jsonify({"error": "Имя пользователя уже существует"}), 400

        user = User(
            username=data['username'],
            full_name=data['full_name'],
            phone=data.get('phone'),
            email=data.get('email'),
            is_active=data.get('is_active', True),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        user.set_password(data['password'])
        db.session.add(user)
        
        audit_log = AuditLog(
            user_id=current_user_id,
            action='create_user',
            entity_type='user',
            entity_id=user.id,
            new_values={
                'username': user.username,
                'full_name': user.full_name,
                'email': user.email,
                'is_active': user.is_active
            },
            timestamp=datetime.utcnow()
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({"message": f"Пользователь {user.username} успешно создан", "id": user.id}), 201
    
    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Имя пользователя или email уже существуют"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка сервера", "details": str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PATCH'])
@jwt_required()
def update_user(user_id):
    """Обновление данных пользователя, включая пароль (только для администраторов)."""
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({"error": "Требуются права администратора"}), 403

    user = User.query.get_or_404(user_id)
    
    try:
        schema = UserUpdateSchema()
        data = schema.load(request.get_json(), partial=True)

        old_values = {
            'username': user.username,
            'full_name': user.full_name,
            'phone': user.phone,
            'email': user.email,
            'is_active': user.is_active
        }

        if 'username' in data:
            if User.query.filter_by(username=data['username']).filter(User.id != user_id).first():
                return jsonify({"error": "Имя пользователя уже существует"}), 400
            user.username = data['username']
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'email' in data:
            user.email = data['email']
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'new_password' in data:
            user.set_password(data['new_password'])

        user.updated_at = datetime.utcnow()

        new_values = {
            'username': user.username,
            'full_name': user.full_name,
            'phone': user.phone,
            'email': user.email,
            'is_active': user.is_active
        }
        if 'new_password' in data:
            new_values['password'] = 'changed'

        audit_log = AuditLog(
            user_id=current_user_id,
            action='update_user',
            entity_type='user',
            entity_id=user.id,
            old_values=old_values,
            new_values=new_values,
            timestamp=datetime.utcnow()
        )
        db.session.add(audit_log)
        db.session.commit()

        return jsonify({"message": f"Пользователь {user.username} обновлен"})

    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка сервера", "details": str(e)}), 500
