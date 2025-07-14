from app import create_app
from models import db, Task, Notification, ProjectStage, RACIAssignment, Role
from datetime import datetime, timedelta

app = create_app()

def check_task_deadlines():
    with app.app_context():
        now = datetime.utcnow()
        three_days_later = now + timedelta(days=3)
        
        tasks = Task.query.filter(
            Task.deadline != None,
            Task.is_completed == False
        ).all()
        
        for task in tasks:
            stage = ProjectStage.query.get(task.stage_id)
            message = None
            
            if task.deadline < now:
                message = f"Задача '{task.title}' просрочена (дедлайн: {task.deadline.isoformat()})"
            elif now <= task.deadline <= three_days_later:
                message = f"Задача '{task.title}' имеет дедлайн через 3 дня ({task.deadline.isoformat()})"
            
            if message:
                accountable_users = RACIAssignment.query.filter_by(
                    stage_id=stage.id,
                    role_id=Role.query.filter_by(title='A').first().id
                ).all()
                for assignment in accountable_users:
                    notification = Notification(
                        user_id=assignment.user_id,
                        message=message,
                        related_entity='task',
                        related_entity_id=task.id,
                        created_at=datetime.utcnow()
                    )
                    db.session.add(notification)
        
        db.session.commit()

if __name__ == '__main__':
    check_task_deadlines()