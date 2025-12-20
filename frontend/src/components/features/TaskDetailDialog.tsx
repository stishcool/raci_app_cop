import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Calendar, User, Tag as TagIcon, CheckSquare, MessageSquare } from "lucide-react";
import { tasksApi } from "@/api/tasks";
import { Task } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { TaskComments } from "@/components/features/TaskComments";
import { TaskChecklist } from "@/components/features/TaskChecklist";
import { TaskTags } from "@/components/features/TaskTags";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TaskDetailDialogProps {
  taskId: number;
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

function TaskDetailDialog({ taskId, projectId, isOpen, onClose }: TaskDetailDialogProps) {
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => tasksApi.getTask(taskId),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold mb-2">{task?.title}</h2>
            {task?.description && (
              <p className="text-muted-foreground">{task.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              {task?.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(task.deadline), "d MMM yyyy", { locale: ru })}
                </span>
              )}
              {task?.raci_assignments && task.raci_assignments.length > 0 && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {task.raci_assignments.length} исполнителей
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Загрузка...</p>
          ) : (
            <Tabs defaultValue="comments" className="space-y-4">
              <TabsList>
                <TabsTrigger value="comments">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Комментарии {task?.comments_count ? `(${task.comments_count})` : ""}
                </TabsTrigger>
                <TabsTrigger value="checklist">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Чеклист
                </TabsTrigger>
                <TabsTrigger value="tags">
                  <TagIcon className="h-4 w-4 mr-2" />
                  Теги
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comments">
                <TaskComments taskId={taskId} />
              </TabsContent>

              <TabsContent value="checklist">
                <TaskChecklist taskId={taskId} />
              </TabsContent>

              <TabsContent value="tags">
                <TaskTags taskId={taskId} projectId={projectId} currentTags={task?.tags} />
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end">
          <Button onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    </div>
  );
}

export { TaskDetailDialog };
