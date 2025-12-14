from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

def init_db(app):
    """Инициализация базы данных"""
    db.init_app(app)
    migrate.init_app(app, db)
    
    with app.app_context():
        from app.models import user, project, task, raci, file, activity_log, notification
        db.create_all()
