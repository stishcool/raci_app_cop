from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, Position, UserPosition
from datetime import datetime
from marshmallow import Schema, fields, validate, ValidationError

auth_bp = Blueprint('auth', __name__)

class UserUpdateSchema(Schema):
    full_name = fields.Str(validate=validate.Length(min=1, max=100))
    phone = fields.Str(allow_none=True, validate=validate.Length(max=30))
    email = fields.Str(allow_none=True, validate=validate.Email())

@auth_bp.route('/login', methods=['POST'])
def login():
    """Авторизация пользователя. Принимает имя пользователя и пароль, возвращает JWT-токен."""
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({"error": "Данные введены неверно"}), 401
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify(access_token=access_token, token_type="Bearer")

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():

    """Возвращает данные текущего авторизованного пользователя (ID, имя, email, должности)."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    return jsonify({
        'id': user.id,
        'username': user.username,
        'full_name': user.full_name,
        'email': user.email,
        'positions': [p.title for p in user.positions]
    })

@auth_bp.route('/me', methods=['PATCH'])
@jwt_required()
def update_current_user():
    """Обновляет данные текущего пользователя (имя, телефон, email)."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    try:
        schema = UserUpdateSchema()
        data = schema.load(request.get_json(), partial=True)

        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'email' in data:
            user.email = data['email']

        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({"message": "Информация о пользователе обновлена"})

    except ValidationError as e:
        return jsonify({"error": "Некорректные данные", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Внутренняя ошибка сервера", "details": str(e)}), 500

@auth_bp.route('/me/positions', methods=['PATCH'])
@jwt_required()
def update_my_positions():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        data = request.get_json()
        requested_positions = data.get('positions', [])

        admin_position = Position.query.filter_by(title='Администратор').first()
        admin_position_id = admin_position.id if admin_position else None

        current_positions = {up.position_id for up in UserPosition.query.filter_by(user_id=user_id).all()}
        is_currently_admin = admin_position_id in current_positions

        if is_currently_admin and admin_position_id not in requested_positions:
            return jsonify({"error": "Нельзя снять должность Администратора"}), 403

        if not is_currently_admin and admin_position_id in requested_positions:
            return jsonify({"error": "Нельзя назначить себе должность Администратора"}), 403

        valid_positions = Position.query.filter(Position.id.in_(requested_positions)).all()
        if len(valid_positions) != len(requested_positions):
            return jsonify({"error": "Одна или несколько должностей не существуют"}), 400

        UserPosition.query.filter_by(user_id=user_id).delete()

        for pos_id in requested_positions:
            up = UserPosition(user_id=user_id, position_id=pos_id)
            db.session.add(up)

        db.session.commit()

        return jsonify({"message": "Должности обновлены"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating positions: {str(e)}")
        return jsonify({"error": "Ошибка сервера"}), 500