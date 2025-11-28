from app import create_app
from models import db, User, Position, UserPosition, Role
from datetime import datetime

app = create_app()
with app.app_context():
    db.create_all()

    default_roles = ['R', 'A', 'C', 'I']
    for title in default_roles:
        role = Role.query.filter_by(title=title).first()
        if not role:
            role = Role(
                title=title,
                description=f"Standard RACI role: {title}"
            )
            db.session.add(role)
    db.session.commit()

    admin_position = Position.query.filter_by(title='Администратор').first()
    if not admin_position:
        admin_position = Position(
            title='Администратор',
            created_at=datetime.utcnow()
        )
        db.session.add(admin_position)
        db.session.commit()

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

    if not UserPosition.query.filter_by(user_id=admin.id, position_id=admin_position.id).first():
        db.session.add(UserPosition(
            user_id=admin.id,
            position_id=admin_position.id
        ))
        db.session.commit()

    created_admin = User.query.filter_by(username='admin').first()
    if created_admin:
        print(f"Admin created: ID={created_admin.id}, Position=Администратор")
    else:
        print("Admin not created!")

    roles = Role.query.all()
    print("Created roles:", [(r.id, r.title) for r in roles])