from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, AuditLog
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from marshmallow import Schema, fields, validate, ValidationError
from models import Position, UserPosition

admin_bp = Blueprint('admin', __name__)

class UserCreateSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128))
    full_name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    phone = fields.Str(allow_none=True, validate=validate.Length(max=30))
    is_admin = fields.Boolean()

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user = User.query.get(int(get_jwt_identity()))
    if not is_admin(current_user.id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'full_name': u.full_name,
        'is_admin': u.is_admin,
        'is_active': u.is_active
    } for u in users])

@admin_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    current_user = User.query.get(int(get_jwt_identity()))
    if not is_admin(current_user.id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    try:
        schema = UserCreateSchema()
        data = schema.load(request.get_json())
        
        is_admin = data.get('is_admin', False)
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({"error": "Имя пользователя уже существует"}), 400
        
        user = User(
            username=data['username'],
            full_name=data['full_name'],
            phone=data.get('phone'),
            is_admin=is_admin
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.flush()
        
        audit_log = AuditLog(
            user_id=current_user.id,
            action='create_user',
            entity_type='user',
            entity_id=user.id,
            new_values={
                'username': user.username,
                'full_name': user.full_name,
                'is_admin': user.is_admin
            }
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({'id': user.id}), 201
    
    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Ошибка базы данных: имя пользователя уже существует"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка сервера", "details": str(e)}), 500

@admin_bp.route('/users/<int:user_id>/role', methods=['PATCH'])
@jwt_required()
def update_user_role(user_id):
    current_user = User.query.get(int(get_jwt_identity()))
    if not is_admin(current_user.id):
        return jsonify({"error": "Требуются права администратора"}), 403
    
    try:
        data = request.get_json()
        if 'is_admin' not in data:
            return jsonify({"error": "Поле is_admin обязательно"}), 400
        
        user = User.query.get_or_404(user_id)
        old_is_admin = user.is_admin
        user.is_admin = data['is_admin']
        
        audit_log = AuditLog(
            user_id=current_user.id,
            action='update_user_role',
            entity_type='user',
            entity_id=user.id,
            old_values={'is_admin': old_is_admin},
            new_values={'is_admin': user.is_admin}
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({'message': 'Роль пользователя обновлена'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка сервера", "details": str(e)}), 500
    
def is_admin(user_id):
    admin_position = Position.query.filter_by(title='Администратор').first()
    if not admin_position:
        return False
    return UserPosition.query.filter_by(
        user_id=user_id,
        position_id=admin_position.id
    ).first() is not None