from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, Position, UserPosition
from datetime import datetime
from werkzeug.security import generate_password_hash

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({"error": "Данные введены неверно"}), 401
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify(access_token=access_token, token_type="Bearer")

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    return jsonify({
        'id': user.id,
        'username': user.username,
        'full_name': user.full_name,
        'email': user.email,
        'positions': [p.title for p in user.positions]
    })
    
@auth_bp.route('/add-user', methods=['POST'])
@jwt_required()
def add_user():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    admin_position = Position.query.filter_by(title='Администратор').first()
    if not admin_position or not UserPosition.query.filter_by(
        user_id=current_user_id,
        position_id=admin_position.id
    ).first():
        return jsonify({"error": "Для этого действия необходимо быть администратором"}), 403

    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Необходимо ввести имя пользователя или пароль"}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Такое имя пользователя уже существует"}), 400

    try:
        user = User(
            username=data['username'],
            full_name=data.get('full_name', 'Unnamed User'),
            phone=data.get('phone', ''),
            is_active=data.get('is_active', True),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": f"Пользователь {data['username']} успешно создан"}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Не удалось создать пользователя"}), 500
    
@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    data = request.get_json()
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user.check_password(data['old_password']):
        return jsonify({"error": "Неверный текущий пароль"}), 400
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({"message": "Пароль успешно изменен"})