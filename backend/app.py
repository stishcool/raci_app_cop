from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from models import db
from datetime import timedelta

def create_app():
    app = Flask(__name__)
    
# Конфигурация JWT 
    app.config.update({
    'SQLALCHEMY_DATABASE_URI': 'sqlite:///db.sqlite',
    'JWT_SECRET_KEY': 'your-256-bit-secret-must-be-32-chars-long!', # Поместить в .env
    'JWT_ALGORITHM': 'HS256',
    'JWT_HEADER_TYPE': 'Bearer',
    'JWT_TOKEN_LOCATION': ['headers'],
    'JWT_IDENTITY_CLAIM': 'sub',  
    'JWT_ACCESS_TOKEN_EXPIRES': timedelta(hours=1)
    })
    
    db.init_app(app)
    jwt = JWTManager(app)
    
    from auth import auth_bp
    from projects import projects_bp
    from tasks import tasks_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(projects_bp, url_prefix='/projects')
    app.register_blueprint(tasks_bp, url_prefix='/tasks')

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
    
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)