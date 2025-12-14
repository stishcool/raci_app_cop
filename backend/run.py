import os
from app import create_app
from app.database import db
from app.models.user import User, SystemRole

app = create_app(os.getenv('FLASK_ENV', 'development'))


@app.cli.command()
def init_db():
    """Инициализация базы данных"""
    print("Creating database tables...")
    db.create_all()
    print("Database tables created successfully!")


@app.cli.command()
def create_admin():
    """Создать администратора по умолчанию"""
    admin = User.query.filter_by(username='admin').first()
    
    if admin:
        print("Admin user already exists!")
        return
    
    admin = User(
        username='admin',
        email='admin@crm.local',
        first_name='Admin',
        last_name='User',
        system_role=SystemRole.ADMIN,
        is_active=True
    )
    admin.set_password('admin123')
    
    db.session.add(admin)
    db.session.commit()
    
    print(f"Admin user created successfully!")
    print(f"Username: admin")
    print(f"Password: admin123")
    print(f"Email: admin@crm.local")


@app.cli.command()
def seed_data():
    """Заполнить тестовыми данными"""
    print("Seeding database with test data...")
    
    users_data = [
        {
            'username': 'ivanov',
            'email': 'ivanov@crm.local',
            'first_name': 'Иван',
            'last_name': 'Иванов',
            'system_role': SystemRole.PROJECT_MANAGER,
            'password': 'password123'
        },
        {
            'username': 'petrov',
            'email': 'petrov@crm.local',
            'first_name': 'Петр',
            'last_name': 'Петров',
            'system_role': SystemRole.TEAM_MEMBER,
            'password': 'password123'
        },
        {
            'username': 'sidorov',
            'email': 'sidorov@crm.local',
            'first_name': 'Сидор',
            'last_name': 'Сидоров',
            'system_role': SystemRole.TEAM_MEMBER,
            'password': 'password123'
        },
        {
            'username': 'kozlov',
            'email': 'kozlov@crm.local',
            'first_name': 'Кузьма',
            'last_name': 'Козлов',
            'system_role': SystemRole.TEAM_MEMBER,
            'password': 'password123'
        },
        {
            'username': 'morozov',
            'email': 'morozov@crm.local',
            'first_name': 'Михаил',
            'last_name': 'Морозов',
            'system_role': SystemRole.TEAM_MEMBER,
            'password': 'password123'
        }
    ]
    
    for user_data in users_data:
        existing_user = User.query.filter_by(username=user_data['username']).first()
        if not existing_user:
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                system_role=user_data['system_role'],
                is_active=True
            )
            user.set_password(user_data['password'])
            db.session.add(user)
            print(f"Created user: {user_data['username']}")
    
    db.session.commit()
    print("Test data seeded successfully!")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
