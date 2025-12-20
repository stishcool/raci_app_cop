import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { tasksApi } from "@/api/tasks";
import { Task, TaskStatus, TaskPriority, RACIRole } from "@/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { TaskFileUpload } from "./TaskFileUpload";
import { DateTimePicker } from "@/components/ui/DateTimePicker";

interface TaskDetailSheetProps {
  task: Task;
  projectId: number;
  children: React.ReactNode;
  isReadOnly?: boolean;
}

interface UpdateTaskForm {
  title: string;
  description: string;
  priority: number;
  status: TaskStatus;
  deadline?: string;
}

function TaskDetailSheet({ task, projectId, isReadOnly = false, children }: TaskDetailSheetProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<UpdateTaskForm>({
    defaultValues: {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline ? new Date(task.deadline).toISOString() : undefined,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Task>) => tasksApi.updateTask(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast.success("Задача обновлена!");
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
    if (!isReadOnly) {
      updateMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (!isReadOnly && confirm(`Удалить задачу "${task.title}"?`)) {
      deleteMutation.mutate();
    }
  };

  const getRACIRoleLabel = (role: RACIRole): string => {
    const labels: Record<RACIRole, string> = {
      [RACIRole.RESPONSIBLE]: "Исполнитель",
      [RACIRole.ACCOUNTABLE]: "Ответственный",
      [RACIRole.CONSULTED]: "Консультант",
      [RACIRole.INFORMED]: "Информируемый",
    };
    return labels[role] || role;
  };

  const getRACIRoleColor = (role: RACIRole): string => {
    const colors: Record<RACIRole, string> = {
      [RACIRole.RESPONSIBLE]: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      [RACIRole.ACCOUNTABLE]: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      [RACIRole.CONSULTED]: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      [RACIRole.INFORMED]: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    };
    return colors[role] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isReadOnly ? "Просмотр задачи" : "Редактирование задачи"}</SheetTitle>
          <SheetDescription>
            ID: {task.id} • Проект #{projectId}
            {isReadOnly && <span className="text-destructive ml-2">• Только для чтения</span>}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Детали</TabsTrigger>
              <TabsTrigger value="files">Файлы</TabsTrigger>
            </TabsList>

            {/* Вкладка с деталями */}
            <TabsContent value="details" className="space-y-6 mt-6">
              <form onSubmit={handleSubmit(onSubmit)} id="task-form" className="space-y-6">
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
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
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
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    disabled={isReadOnly}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                    disabled={isReadOnly}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                  <Controller
                    name="deadline"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isReadOnly}
                        placeholder="Выберите дату и время"
                      />
                    )}
                  />
                </div>

                {/* RACI назначения */}
                {task.raci_assignments && task.raci_assignments.length > 0 && (
                  <div className="space-y-2">
                    <Label>RACI роли ({task.raci_assignments.length})</Label>
                    <div className="space-y-2">
                      {task.raci_assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          {assignment.user && (
                            <Avatar
                              src={assignment.user.avatar}
                              fallback={`${assignment.user.first_name?.[0] || ""}${assignment.user.last_name?.[0] || ""}`}
                              size="sm"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {assignment.user
                                ? `${assignment.user.first_name} ${assignment.user.last_name}`
                                : assignment.user_name || `User #${assignment.user_id}`}
                            </p>
                            {assignment.user?.email && (
                              <p className="text-xs text-muted-foreground truncate">
                                {assignment.user.email}
                              </p>
                            )}
                          </div>
                          <Badge className={getRACIRoleColor(assignment.role)}>
                            {assignment.role} - {getRACIRoleLabel(assignment.role)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </TabsContent>

            {/* Вкладка с файлами */}
            <TabsContent value="files" className="mt-6">
              <TaskFileUpload taskId={task.id} projectId={projectId} isReadOnly={isReadOnly} />
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter className="flex-row justify-between gap-2">
          {!isReadOnly && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={updateMutation.isPending || deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateMutation.isPending}
            >
              {isReadOnly ? "Закрыть" : "Отмена"}
            </Button>
            {!isReadOnly && (
              <Button
                type="submit"
                form="task-form"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export { TaskDetailSheet };
