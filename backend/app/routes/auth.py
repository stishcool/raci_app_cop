from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.auth_service import AuthService

bp = Blueprint('auth', __name__)


@bp.route('/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    user, error = AuthService.register_user(data)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(include_email=True)
    }), 201


@bp.route('/login', methods=['POST'])
def login():
    """Вход пользователя"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    username_or_email = data.get('username') or data.get('email', '')
    password = data.get('password', '')
    
    if not username_or_email or not password:
        return jsonify({'error': 'Username/email and password are required'}), 400
    
    result, error = AuthService.login_user(username_or_email, password)
    
    if error:
        return jsonify({'error': error}), 401
    
    return jsonify(result), 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Получить данные текущего пользователя"""
    current_user_id = get_jwt_identity()
    
    user, error = AuthService.get_current_user(current_user_id)
    
    if error:
        return jsonify({'error': error}), 404
    
    return jsonify({'user': user.to_dict(include_email=True)}), 200


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Обновление access token"""
    current_user_id = get_jwt_identity()
    
    result, error = AuthService.refresh_access_token(current_user_id)
    
    if error:
        return jsonify({'error': error}), 401
    
    return jsonify(result), 200

@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Обновить профиль текущего пользователя"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    from app.models.user import User
    from app.database import db
    
    user = db.session.get(User, current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if 'first_name' in data:
        user.first_name = data['first_name'].strip()
    
    if 'last_name' in data:
        user.last_name = data['last_name'].strip()
    
    if 'phone' in data:
        user.phone = data['phone'].strip()
    
    if 'current_password' in data and 'new_password' in data:
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        from app.utils.validators import validate_password
        is_valid, message = validate_password(data['new_password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        user.set_password(data['new_password'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict(include_email=True)
    }), 200
    
@bp.route('/profile/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    """Загрузить аватар"""
    current_user_id = get_jwt_identity()
    
    if 'avatar' not in request.files:
        return jsonify({'error': 'No avatar file provided'}), 400
    
    file = request.files['avatar']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if '.' not in file.filename or \
       file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({'error': 'Only image files are allowed (png, jpg, jpeg, gif)'}), 400
    
    from app.models.user import User
    from app.database import db
    from app.utils.helpers import save_file, delete_file
    
    user = db.session.get(User, current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.avatar:
        delete_file(user.avatar)
    
    file_path, error = save_file(file, 'avatars')
    
    if error:
        return jsonify({'error': error}), 400
    
    user.avatar = file_path
    db.session.commit()
    
    return jsonify({
        'message': 'Avatar uploaded successfully',
        'avatar': user.avatar,
        'user': user.to_dict(include_email=True)
    }), 200


@bp.route('/profile/avatar', methods=['DELETE'])
@jwt_required()
def delete_avatar():
    """Удалить аватар"""
    current_user_id = get_jwt_identity()
    
    from app.models.user import User
    from app.database import db
    from app.utils.helpers import delete_file
    
    user = db.session.get(User, current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.avatar:
        delete_file(user.avatar)
        user.avatar = None
        db.session.commit()
    
    return jsonify({
        'message': 'Avatar deleted successfully',
        'user': user.to_dict(include_email=True)
    }), 200
