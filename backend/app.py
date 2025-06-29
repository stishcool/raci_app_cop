from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from models import db

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'
    app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Для разработки

    @app.route('/')
    def home():
        return jsonify({
            "status": "API is working",
            "endpoints": {
                "auth": {
                    "register": "POST /auth/register",
                    "login": "POST /auth/login"
                }
            }
        })

    # Инициализация расширений
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Регистрация Blueprint
    from auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')
    
    # Создание таблиц
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)