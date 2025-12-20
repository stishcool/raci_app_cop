from app.models.user import User, SystemRole
from app.models.project import Project, ProjectUser, ProjectStatus
from app.models.task import Task, TaskStatus
from app.models.raci import RACIAssignment, RACIRole
from app.models.file import File
from app.models.activity_log import ActivityLog
from app.models.notification import Notification
from app.models.comment import Comment
from app.models.milestone import Milestone, MilestoneStatus
from app.models.checklist import ChecklistItem
from app.models.tag import Tag, task_tags  # ← ДОБАВИТЬ

__all__ = [
    'User',
    'SystemRole',
    'Project',
    'ProjectUser',
    'ProjectStatus',
    'Task',
    'TaskStatus',
    'RACIAssignment',
    'RACIRole',
    'File',
    'ActivityLog',
    'Notification',
    'Comment',
    'Milestone',
    'MilestoneStatus',
    'ChecklistItem',
    'Tag',  # ← ДОБАВИТЬ
    'task_tags',  # ← ДОБАВИТЬ
]
