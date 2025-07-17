from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, AuditLog, Position, UserPosition, Role, RACIAssignment, ProjectMember
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from marshmallow import Schema, fields, validate, ValidationError
from datetime import datetime
import pytz  

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
    
class RoleCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=50))

class PositionCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    
class UserPositionSchema(Schema):
    position_id = fields.Int(required=True)

def is_admin(user_id):
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
    
@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({'error': 'Только админ может просматривать информацию о пользователе'}), 403
    
    user = User.query.get_or_404(user_id)
    return jsonify({
        'id': user.id,
        'username': user.username,
        'full_name': user.full_name,
        'email': user.email,
        'phone': user.phone,
        'is_active': user.is_active,
        'positions': [pos.title for pos in user.positions],
        'created_at': user.created_at.isoformat(),
        'updated_at': user.updated_at.isoformat()
    })

@admin_bp.route('/roles', methods=['POST'])
@jwt_required()
def create_role():
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({'error': 'Только админ может создавать роли'}), 403
    
    try:
        schema = RoleCreateSchema()
        data = schema.load(request.get_json())
        
        if Role.query.filter_by(title=data['title']).first():
            return jsonify({'error': f'Роль с названием "{data["title"]}" уже существует'}), 400
        
        role = Role(
            title=data['title'],
            created_at=datetime.now(pytz.UTC),
            updated_at=datetime.now(pytz.UTC)
        )
        db.session.add(role)
        db.session.commit()
        return jsonify({'message': f'Роль {role.title} успешно создана', 'id': role.id}), 201
    
    except ValidationError as e:
        return jsonify({'error': 'Некорректные данные', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Внутренняя ошибка', 'details': str(e)}), 500

@admin_bp.route('/positions', methods=['POST'])
@jwt_required()
def create_position():
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({'error': 'Только админ может создавать должности'}), 403
    
    try:
        schema = PositionCreateSchema()
        data = schema.load(request.get_json())
        
        if Position.query.filter_by(title=data['title']).first():
            return jsonify({'error': f'Должность с названием "{data["title"]}" уже существует'}), 400
        
        position = Position(
            title=data['title'],
            created_at=datetime.now(pytz.UTC)
        )
        db.session.add(position)
        db.session.commit()
        return jsonify({'message': f'Должность {position.title} успешно создана', 'id': position.id}), 201
    
    except ValidationError as e:
        return jsonify({'error': 'Некорректные данные', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Внутренняя ошибка', 'details': str(e)}), 500
    
@admin_bp.route('/users/<int:user_id>/positions', methods=['POST'])
@jwt_required()
def add_user_position(user_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({'error': 'Только админ может назначать должности'}), 403
    try:
        schema = UserPositionSchema()
        data = schema.load(request.get_json())
        user = User.query.get_or_404(user_id)
        position = Position.query.get_or_404(data['position_id'])
        if position in user.positions:
            return jsonify({'error': f'Должность "{position.title}" уже назначена пользователю'}), 400
        user.positions.append(position)
        db.session.commit()
        return jsonify({'message': f'Должность {position.title} добавлена пользователю {user.username}'}), 201
    except ValidationError as e:
        return jsonify({'error': 'Некорректные данные', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Внутренняя ошибка', 'details': str(e)}), 500
    
@admin_bp.route('/positions', methods=['GET'])
@jwt_required()
def get_positions():
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({'error': 'Только админ может просматривать должности'}), 403
    positions = Position.query.all()
    return jsonify([{'id': p.id, 'title': p.title, 'created_at': p.created_at.isoformat()} for p in positions])

@admin_bp.route('/users/<int:user_id>/positions/<int:position_id>', methods=['DELETE'])
@jwt_required()
def remove_user_position(user_id, position_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({'error': 'Только админ может удалять должности'}), 403
    try:
        user = User.query.get_or_404(user_id)
        position = Position.query.get_or_404(position_id)
        if position not in user.positions:
            return jsonify({'error': f'Должность "{position.title}" не назначена пользователю'}), 400
        user.positions.remove(position)
        db.session.commit()
        return jsonify({'message': f'Должность {position.title} удалена у пользователя {user.username}'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Внутренняя ошибка', 'details': str(e)}), 500
    
@admin_bp.route('/roles', methods=['GET'])
@jwt_required()
def get_roles():
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({'error': 'Только админ может просматривать роли'}), 403
    roles = Role.query.all()
    return jsonify([{'id': r.id, 'title': r.title, 'created_at': r.created_at.isoformat(), 'is_custom': r.is_custom,'updated_at': r.updated_at.isoformat()} for r in roles])

@admin_bp.route('/roles/<int:role_id>', methods=['DELETE'])
@jwt_required()
def delete_role(role_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({'error': 'Только админ может удалять роли'}), 403
    try:
        role = Role.query.get_or_404(role_id)
        RACIAssignment.query.filter_by(role_id=role_id).delete()
        db.session.delete(role)
        db.session.commit()
        return jsonify({'message': f'Роль {role.title} удалена'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Внутренняя ошибка', 'details': str(e)}), 500
    
@admin_bp.route('/positions/<int:position_id>', methods=['DELETE'])
@jwt_required()
def delete_position(position_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({'error': 'Только админ может удалять должности'}), 403
    try:
        position = Position.query.get_or_404(position_id)
        db.session.execute(db.delete(UserPosition).where(UserPosition.position_id == position_id))
        db.session.delete(position)
        db.session.commit()
        return jsonify({'message': f'Должность {position.title} удалена'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Внутренняя ошибка', 'details': str(e)}), 500
    
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = int(get_jwt_identity())
    if not is_admin(current_user_id):
        return jsonify({'error': 'Только админ может удалять пользователей'}), 403
    try:
        user = User.query.get_or_404(user_id)
        db.session.execute(db.delete(UserPosition).where(UserPosition.user_id == user_id))
        ProjectMember.query.filter_by(user_id=user_id).delete()
        RACIAssignment.query.filter_by(user_id=user_id).delete()
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': f'Пользователь {user.username} удален'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Внутренняя ошибка', 'details': str(e)}), 500