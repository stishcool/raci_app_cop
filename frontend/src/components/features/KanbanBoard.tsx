import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DropAnimation,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { Task, TaskStatus } from "@/types";
import { tasksApi } from "@/api/tasks";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTaskCard } from "./KanbanTaskCard";

interface KanbanBoardProps {
  tasks: Task[];
  projectId: number;
}

const columns = [
  { id: "TODO", title: "К выполнению", color: "bg-gray-100 dark:bg-gray-800", status: TaskStatus.TODO },
  { id: "IN_PROGRESS", title: "В работе", color: "bg-blue-100 dark:bg-blue-900/30", status: TaskStatus.IN_PROGRESS },
  { id: "IN_REVIEW", title: "На проверке", color: "bg-yellow-100 dark:bg-yellow-900/30", status: TaskStatus.IN_REVIEW },
  { id: "DONE", title: "Готово", color: "bg-green-100 dark:bg-green-900/30", status: TaskStatus.DONE },
];

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
  duration: 50,
  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
};

function KanbanBoard({ tasks, projectId }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      tasksApi.updateTask(taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["project-tasks", projectId] });
      const previousTasks = queryClient.getQueryData<Task[]>(["project-tasks", projectId]);
      if (previousTasks) {
        const updatedTasks = previousTasks.map((task: Task) =>
          task.id === taskId ? { ...task, status } : task
        );
        queryClient.setQueryData(["project-tasks", projectId], updatedTasks);
      }
      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["project-tasks", projectId], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
    },
  });

  const tasksByStatus = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.status] = tasks.filter((task) => task.status === column.status);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as number;
    const columnId = over.id as string;
    const column = columns.find((col) => col.id === columnId);

    if (!column) return;

    const newStatus = column.status;
    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;

    updateTaskMutation.mutate({ taskId, status: newStatus });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            tasks={tasksByStatus[column.status] || []}
            projectId={projectId}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? <KanbanTaskCard task={activeTask} projectId={projectId} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

export { KanbanBoard };
