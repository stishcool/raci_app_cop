import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Calendar, Clock, Trash2 } from "lucide-react";  
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { tasksApi } from "@/api/tasks";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TaskDetailSheetProps {
  task: Task;
  projectId: number;
  children: React.ReactNode;
}

interface UpdateTaskForm {
  title: string;
  description: string;
  priority: number;
  status: TaskStatus;
  deadline?: string;
}

function TaskDetailSheet({ task, projectId, children }: TaskDetailSheetProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateTaskForm>({
    defaultValues: {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd'T'HH:mm") : undefined,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Task>) => tasksApi.updateTask(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast.success("Задача обновлена!");
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка при обновлении");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.deleteTask(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast.success("Задача удалена");
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка при удалении");
    },
  });

  const onSubmit = (data: UpdateTaskForm) => {
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm(`Удалить задачу "${task.title}"?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
          <SheetHeader>
            <SheetTitle>Редактирование задачи</SheetTitle>
            <SheetDescription>
              ID: {task.id} • Проект #{projectId}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Метаданные */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Создано: {format(new Date(task.created_at), "d MMM yyyy", { locale: ru })}</span>
              </div>
              {task.deadline && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{format(new Date(task.deadline), "d MMM", { locale: ru })}</span>
                </div>
              )}
            </div>

            {/* Название */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Название <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...register("title", {
                  required: "Введите название задачи",
                  minLength: { value: 3, message: "Минимум 3 символа" },
                })}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Описание */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Описание <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="description"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("description", {
                  required: "Введите описание",
                  minLength: { value: 10, message: "Минимум 10 символов" },
                })}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Статус */}
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <select
                id="status"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("status")}
              >
                <option value={TaskStatus.TODO}>К выполнению</option>
                <option value={TaskStatus.IN_PROGRESS}>В работе</option>
                <option value={TaskStatus.IN_REVIEW}>На проверке</option>
                <option value={TaskStatus.DONE}>Готово</option>
                <option value={TaskStatus.BLOCKED}>Заблокировано</option>
              </select>
            </div>

            {/* Приоритет */}
            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <select
                id="priority"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("priority", { valueAsNumber: true })}
              >
                <option value={TaskPriority.LOW}>Низкий</option>
                <option value={TaskPriority.MEDIUM}>Средний</option>
                <option value={TaskPriority.HIGH}>Высокий</option>
                <option value={TaskPriority.CRITICAL}>Критичный</option>
              </select>
            </div>

            {/* Дедлайн */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Дедлайн</Label>
              <Input
                id="deadline"
                type="datetime-local"
                {...register("deadline")}
              />
            </div>

            {/* RACI назначения */}
            {task.raci_assignments && task.raci_assignments.length > 0 && (
              <div className="space-y-2">
                <Label>RACI роли</Label>
                <div className="space-y-2">
                  {task.raci_assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-2 border border-border rounded"
                    >
                      <span className="text-sm">
                        {assignment.user_name || `User #${assignment.user_id}`}
                      </span>
                      <Badge>{assignment.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={updateMutation.isPending || deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateMutation.isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export { TaskDetailSheet };
