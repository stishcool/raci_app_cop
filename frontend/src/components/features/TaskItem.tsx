import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  projectId: number;  
  onClick?: () => void;
}

function TaskItem({ task, projectId, onClick }: TaskItemProps) {
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return <Badge variant="danger">Критично</Badge>;
      case TaskPriority.HIGH:
        return <Badge variant="warning">Высокий</Badge>;
      case TaskPriority.MEDIUM:
        return <Badge variant="default">Средний</Badge>;
      case TaskPriority.LOW:
        return <Badge variant="secondary">Низкий</Badge>;
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    if (status === TaskStatus.DONE) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return <Badge variant="secondary">К выполнению</Badge>;
      case TaskStatus.IN_PROGRESS:
        return <Badge variant="default">В работе</Badge>;
      case TaskStatus.IN_REVIEW:
        return <Badge variant="warning">На проверке</Badge>;
      case TaskStatus.DONE:
        return <Badge variant="success">Готово</Badge>;
      case TaskStatus.BLOCKED:
        return <Badge variant="danger">Заблокировано</Badge>;
    }
  };

  return (
    <TaskDetailSheet task={task} projectId={projectId}>
      <div
        className={cn(
          "flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer",
          task.status === TaskStatus.DONE && "opacity-60"
        )}
      >
        {/* Иконка статуса */}
        <div className="mt-0.5">{getStatusIcon(task.status)}</div>

        {/* Основная информация */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4
              className={cn(
                "font-medium",
                task.status === TaskStatus.DONE && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h4>
            {getPriorityBadge(task.priority)}
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {/* Статус */}
            <div>{getStatusBadge(task.status)}</div>

            {/* Дедлайн */}
            {task.deadline && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(task.deadline), "d MMM", { locale: ru })}
              </div>
            )}

            {/* RACI роли */}
            {task.raci_assignments && task.raci_assignments.length > 0 && (
              <div className="flex items-center gap-1">
                <span>{task.raci_assignments.length} назначений</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </TaskDetailSheet>
  );
}

export { TaskItem };
