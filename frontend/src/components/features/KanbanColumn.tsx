import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task } from "@/types";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  projectId: number;
  isReadOnly?: boolean;  
}

function KanbanColumn({ id, title, color, tasks, projectId, isReadOnly = false }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    disabled: isReadOnly  
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg p-4 min-h-[500px] transition-colors",
        color,
        !isReadOnly && isOver && "ring-2 ring-primary" 
      )}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{tasks.length} задач</p>
      </div>

      {/* Tasks */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 flex-1">
          {tasks.map((task) => (
            <KanbanTaskCard 
              key={task.id} 
              task={task} 
              projectId={projectId} 
              isReadOnly={isReadOnly} 
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export { KanbanColumn };
