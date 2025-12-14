from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os

from app.config import config
from app.database import db, migrate, init_db


def create_app(config_name='development'):
    """Фабрика приложения Flask"""
    
    app = Flask(__name__)
    
    app.config.from_object(config[config_name])
    
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    jwt = JWTManager(app)
    
    init_db(app)
    
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    from app.routes import auth, users, projects, tasks, raci, files, dashboard, admin
    
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(users.bp, url_prefix='/api/users')
    app.register_blueprint(projects.bp, url_prefix='/api/projects')
    app.register_blueprint(tasks.bp, url_prefix='/api/tasks')
    app.register_blueprint(raci.bp, url_prefix='/api/raci')
    app.register_blueprint(files.bp, url_prefix='/api/files')
    app.register_blueprint(dashboard.bp, url_prefix='/api/dashboard')
    app.register_blueprint(admin.bp, url_prefix='/api/admin')
    
    from flask import send_from_directory
    
    @app.route('/uploads/<path:filename>')
    def serve_uploads(filename):
        """Раздача загруженных файлов"""
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    @app.route('/avatars/<path:filename>')
    def serve_avatars(filename):
        """Раздача аватаров"""
        import os
        avatars_path = os.path.join(app.config['UPLOAD_FOLDER'], 'avatars')
        return send_from_directory(avatars_path, filename)

    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token is missing'}), 401
    
    return app
