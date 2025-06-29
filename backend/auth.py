from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models import db, User  # Явно импортируем нужные зависимости

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 400
    
    new_user = User(email=data['email'])
    new_user.set_password(data['password'])  # Используем метод класса
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User created"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({"error": "Invalid credentials"}), 401
    
    token = create_access_token(identity={"id": user.id, "email": user.email})
    return jsonify({"token": token})