import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Clock } from "lucide-react";
import { Task, TaskPriority } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface KanbanTaskCardProps {
  task: Task;
  projectId: number;
  isDragging?: boolean;
}

function KanbanTaskCard({ task, projectId, isDragging = false }: KanbanTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return "border-l-4 border-l-red-500 dark:border-l-red-400";
      case TaskPriority.HIGH:
        return "border-l-4 border-l-orange-500 dark:border-l-orange-400";
      case TaskPriority.MEDIUM:
        return "border-l-4 border-l-blue-500 dark:border-l-blue-400";
      default:
        return "border-l-4 border-l-gray-300 dark:border-l-gray-600";
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Критично</Badge>;
      case TaskPriority.HIGH:
        return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">Высокий</Badge>;
      case TaskPriority.MEDIUM:
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Средний</Badge>;
      default:
        return <Badge variant="secondary">Низкий</Badge>;
    }
  };

  return (
    <TaskDetailSheet task={task} projectId={projectId}>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow",
          getPriorityColor(task.priority),
          isSortableDragging && "opacity-50 cursor-grabbing",
          "dark:bg-card dark:border-border"
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab hover:bg-accent rounded p-1 mt-0.5"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <h4 className="text-sm font-medium flex-1 line-clamp-2">{task.title}</h4>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 ml-7">
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 ml-7">
          {getPriorityBadge(task.priority)}
          {task.deadline && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(new Date(task.deadline), "d MMM", { locale: ru })}
            </div>
          )}
        </div>

        {/* RACI assignments count */}
        {Array.isArray(task.raci_assignments) && task.raci_assignments.length > 0 && (
          <div className="mt-2 ml-7 text-xs text-muted-foreground">
            👥 {task.raci_assignments.length} назначений
          </div>
        )}
      </div>
    </TaskDetailSheet>
  );
}

export { KanbanTaskCard };
