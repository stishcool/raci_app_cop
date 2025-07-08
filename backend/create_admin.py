from app import create_app
from models import db, User, Position, UserPosition
from datetime import datetime

app = create_app()
with app.app_context():
    # Создаем админскую должность если ее нет
    admin_position = Position.query.filter_by(title='Администратор').first()
    if not admin_position:
        admin_position = Position(
            title='Администратор',
            created_at=datetime.utcnow()
        )
        db.session.add(admin_position)
        db.session.commit()

    # Проверяем существование пользователя admin
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            full_name='Системный администратор',
            email='admin@example.com',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        admin.set_password('12345678')
        db.session.add(admin)
        db.session.commit()

    # Назначаем должность если не назначена
    if not UserPosition.query.filter_by(user_id=admin.id, position_id=admin_position.id).first():
        db.session.add(UserPosition(
            user_id=admin.id,
            position_id=admin_position.id,
            assigned_at=datetime.utcnow()
        ))
        db.session.commit()