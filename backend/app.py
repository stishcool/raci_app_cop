from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from models import db
from datetime import timedelta

def create_app():
    app = Flask(__name__)
    
    app.config.update({
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///db.sqlite',
        'JWT_SECRET_KEY': 'your-256-bit-secret-must-be-32-chars-long!', # Поместить в .env
        'JWT_ALGORITHM': 'HS256',
        'JWT_HEADER_TYPE': 'Bearer',
        'JWT_TOKEN_LOCATION': ['headers'],
        'JWT_IDENTITY_CLAIM': 'sub',  
        'JWT_ACCESS_TOKEN_EXPIRES': timedelta(hours=5)
    })
    
    db.init_app(app)
    jwt = JWTManager(app)
    migrate = Migrate(app, db)  
    
    from auth import auth_bp
    from projects import projects_bp
    from admin import admin_bp
    from tasks import tasks_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(projects_bp, url_prefix='/projects')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(tasks_bp, url_prefix='/tasks')

    @app.route('/')
    def home():
        return jsonify({"status": "API is working"})
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all() 
    app.run(debug=True)