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
    positions = fields.List(fields.Int(), allow_none=True)

class UserUpdateSchema(Schema):
    username = fields.Str(validate=validate.Length(min=3, max=100))
    full_name = fields.Str(validate=validate.Length(min=1, max=100))
    phone = fields.Str(allow_none=True, validate=validate.Length(max=30))
    email = fields.Str(allow_none=True, validate=validate.Email())
    is_active = fields.Boolean()
    new_password = fields.Str(allow_none=True, validate=validate.Length(min=3, max=128))
    positions = fields.List(fields.Int(), allow_none=True)

class PositionCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=100))

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
        db.session.flush()

        positions = data.get('positions', [])
        for pos_id in positions:
            pos = Position.query.get(pos_id)
            if pos:
                db.session.add(UserPosition(user_id=user.id, position_id=pos_id, assigned_at=datetime.utcnow()))

        db.session.commit()

        audit_log = AuditLog(
            user_id=current_user_id,
            action='create_user',
            entity_type='user',
            entity_id=user.id,
            old_values={},
            new_values=data,
            timestamp=datetime.utcnow()
        )
        db.session.add(audit_log)
        db.session.commit()

        return jsonify({"message": f"Пользователь {user.username} создан"})

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
            'is_active': user.is_active,
            'positions': [p.title for p in user.positions]
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

        if 'positions' in data:
            UserPosition.query.filter_by(user_id=user.id).delete()
            for pos_id in data['positions']:
                pos = Position.query.get(pos_id)
                if pos:
                    db.session.add(UserPosition(user_id=user.id, position_id=pos_id, assigned_at=datetime.utcnow()))

        user.updated_at = datetime.utcnow()

        new_values = {
            'username': user.username,
            'full_name': user.full_name,
            'phone': user.phone,
            'email': user.email,
            'is_active': user.is_active,
            'positions': [p.title for p in user.positions]
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

@admin_bp.route('/positions', methods=['GET'])
@jwt_required(optional=True)
def get_positions():
    try:
        positions = Position.query.all()
        return jsonify([{
            'id': p.id,
            'title': p.title
        } for p in positions]), 200

    except Exception as e:
        print(f"Error in get_positions: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Внутренняя ошибка сервера"}), 500

@admin_bp.route('/positions', methods=['POST'])
@jwt_required(optional=True)
def create_position():
    try:
        identity = get_jwt_identity()
        if not identity:
            return jsonify({"error": "Требуется авторизация"}), 401
        
        try:
            current_user_id = int(identity)
        except (ValueError, TypeError) as e:
            print(f"JWT identity error in create_position: {str(e)}")
            return jsonify({"error": "Некорректный токен", "details": str(e)}), 401
        
        if not is_admin(current_user_id):
            return jsonify({"error": "Требуются права администратора"}), 403

        data = request.get_json()
        if not data or 'title' not in data:
            return jsonify({"error": "Поле 'title' обязательно"}), 400

        title = data['title'].strip()
        if not title:
            return jsonify({"error": "Название должности не может быть пустым"}), 400

        if Position.query.filter_by(title=title).first():
            return jsonify({"error": "Должность с таким названием уже существует"}), 400

        position = Position(
            title=title,
            created_at=datetime.utcnow()
        )
        db.session.add(position)
        db.session.commit()

        return jsonify({
            "id": position.id,
            "title": position.title,
            "created_at": position.created_at.isoformat()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error in create_position: {str(e)}")
        return jsonify({"error": "Внутренняя ошибка", "details": str(e)}), 500

@admin_bp.route('/positions/<int:position_id>', methods=['DELETE'])
@jwt_required(optional=True)
def delete_position(position_id):
    try:
        identity = get_jwt_identity()
        if not identity:
            return jsonify({"error": "Требуется авторизация"}), 401
        
        current_user_id = int(identity)
        if not is_admin(current_user_id):
            return jsonify({"error": "Требуются права администратора"}), 403

        position = Position.query.get_or_404(position_id)
        if position.title == 'Администратор':
            return jsonify({"error": "Нельзя удалить системную должность"}), 403

        UserPosition.query.filter_by(position_id=position_id).delete()
        db.session.delete(position)
        db.session.commit()

        return jsonify({"message": "Должность удалена"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_position: {str(e)}")
        return jsonify({"error": "Ошибка удаления", "details": str(e)}), 500