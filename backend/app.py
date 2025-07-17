from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from models import db
from datetime import timedelta
from flask_cors import CORS
from dotenv import load_dotenv
import os
from werkzeug.exceptions import HTTPException

def create_app():
    app = Flask(__name__)
    app.url_map.strict_slashes = False

    load_dotenv()
    
    app.config.update({
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///db.sqlite',
        'JWT_SECRET_KEY': os.getenv('JWT_SECRET_KEY'),
        'JWT_ALGORITHM': 'HS256',
        'JWT_HEADER_TYPE': 'Bearer',
        'JWT_TOKEN_LOCATION': ['headers'],
        'JWT_IDENTITY_CLAIM': 'sub',  
        'JWT_ACCESS_TOKEN_EXPIRES': timedelta(hours=5)
    })
    
    db.init_app(app)
    jwt = JWTManager(app)
    migrate = Migrate(app, db)  

    CORS(app, resources={r"/*": {"origins": "*"}}) #на время тестирования
    #CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://192.168.194.0/24", "http://192.168.194.174:3000"]}})
    
    from auth import auth_bp
    from projects import projects_bp
    from admin import admin_bp
    from tasks import tasks_bp
    from notifications import notifications_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(projects_bp, url_prefix='/projects')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(tasks_bp, url_prefix='/tasks')
    app.register_blueprint(notifications_bp, url_prefix='/notifications')

    @app.route("/")
    def helloWorld():

        return jsonify({"status": "API is working"})
    
    @app.before_request
    def log_request():
        print(f"Request: {request.method} {request.path} from {request.origin}")
        if request.method == "OPTIONS":
            print("Handling OPTIONS request")

    @app.errorhandler(Exception)
    def handle_error(error):
        if isinstance(error, HTTPException):
            return jsonify({"error": error.description}), error.code
        return jsonify({"error": "Внутренняя ошибка сервера", "details": str(error)}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all() 

    app.run(host='0.0.0.0', port=5000, debug=True)
