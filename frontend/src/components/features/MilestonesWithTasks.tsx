import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { milestonesApi } from "@/api/milestones";
import { tasksApi } from "@/api/tasks";
import { Task } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TaskItem } from "@/components/features/TaskItem";
import { CreateTaskDialog } from "@/components/features/CreateTaskDialog";
import { CreateMilestoneInline } from "./CreateMilestoneInline";

interface MilestonesWithTasksProps {
  projectId: number;
  isReadOnly?: boolean;
}

function MilestonesWithTasks({ projectId, isReadOnly = false }: MilestonesWithTasksProps) {
  const [showCreateMilestone, setShowCreateMilestone] = useState(false);

  const { 
    data: milestones = [], 
    isLoading: milestonesLoading 
  } = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: () => milestonesApi.getProjectMilestones(projectId),
  });

  const { 
    data: allTasks = [], 
    isLoading: tasksLoading 
  } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: () => tasksApi.getProjectTasks(projectId),
  });

  const tasksByMilestone: Record<number, Task[]> = {};
  allTasks.forEach((task: Task) => {
    const milestoneId = task.milestone_id || 0;
    if (!tasksByMilestone[milestoneId]) {
      tasksByMilestone[milestoneId] = [];
    }
    tasksByMilestone[milestoneId].push(task);
  });

  const sortedMilestones = [...milestones].sort((a, b) => a.id - b.id);

  if (milestonesLoading || tasksLoading) {
    return <div className="text-center text-muted-foreground py-8">Загрузка этапов и задач...</div>;
  }

  const hasMilestones = milestones.length > 0;
  const unassignedTasks = tasksByMilestone[0] || [];

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            Этапы ({sortedMilestones.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            {allTasks.length} задач всего
          </p>
        </div>
        
        {!isReadOnly && (
          <div className="flex items-center gap-2 flex-wrap">
            {hasMilestones && (
              <CreateTaskDialog projectId={projectId}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать задачу
                </Button>
              </CreateTaskDialog>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCreateMilestone(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Создать этап
            </Button>
          </div>
        )}
      </div>

      {/* Inline форма создания этапа */}
      {!isReadOnly && showCreateMilestone && (
        <CreateMilestoneInline 
          projectId={projectId}
          onClose={() => setShowCreateMilestone(false)}
        />
      )}

      {/* Без этапа */}
      {unassignedTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Без этапа</Badge>
            <span className="text-sm text-muted-foreground">
              {unassignedTasks.length} задач
            </span>
          </div>
          <div className="space-y-3">
            {unassignedTasks.map((task: Task) => (
              <TaskItem 
                key={task.id} 
                task={task} 
                projectId={projectId} 
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        </div>
      )}

      {/* Этапы с задачами */}
      {sortedMilestones.map((milestone) => {
        const milestoneTasks = tasksByMilestone[milestone.id] || [];
        
        return (
          <div key={milestone.id} className="border border-border rounded-lg">
            {/* Заголовок этапа */}
            <div className="p-4 border-b border-border bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={
                      milestone.status === "COMPLETED" 
                        ? "success" 
                        : milestone.status === "IN_PROGRESS" 
                        ? "default" 
                        : "secondary"
                    }
                  >
                    {milestone.status === "NOT_STARTED" && "Не начат"}
                    {milestone.status === "IN_PROGRESS" && "В работе"}
                    {milestone.status === "COMPLETED" && "Завершён"}
                    {milestone.status === "BLOCKED" && "Заблокирован"}
                  </Badge>
                  <h3 className="font-semibold">{milestone.name}</h3>
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground max-w-md">
                      {milestone.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{milestoneTasks.length} задач</span>
                  {milestone.deadline && (
                    <span>
                      {new Date(milestone.deadline).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Задачи этапа */}
            {milestoneTasks.length > 0 ? (
              <div className="p-4 space-y-3">
                {milestoneTasks.map((task: Task) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    projectId={projectId} 
                    isReadOnly={isReadOnly}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground py-8">
                Задач пока нет
                {!isReadOnly && (
                  <CreateTaskDialog projectId={projectId}>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Создать первую задачу
                    </Button>
                  </CreateTaskDialog>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Нет этапов */}
      {!hasMilestones && unassignedTasks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <div className="text-muted-foreground mb-4">
            <p className="text-lg">Этапов пока нет</p>
            <p className="text-sm">Создайте первый этап для организации задач</p>
          </div>
          {!isReadOnly && (
            <Button onClick={() => setShowCreateMilestone(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать первый этап
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export { MilestonesWithTasks };
