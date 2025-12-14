import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { tasksApi } from "@/api/tasks";
import { TaskPriority } from "@/types";

interface CreateTaskForm {
  title: string;
  description: string;
  priority: number;
  deadline?: string;
}

interface CreateTaskDialogProps {
  projectId: number;
  children: React.ReactNode;
}

function CreateTaskDialog({ projectId, children }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTaskForm>({
    defaultValues: {
      priority: TaskPriority.MEDIUM,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskForm) =>
      tasksApi.createTask({
        project_id: projectId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        deadline: data.deadline,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast.success("Задача создана успешно!");
      setOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка при создании задачи");
    },
  });

  const onSubmit = (data: CreateTaskForm) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Создать новую задачу</DialogTitle>
            <DialogDescription>
              Заполните информацию о задаче. После создания вы сможете назначить RACI роли.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Название */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Название задачи <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Например: Разработка API для авторизации"
                {...register("title", {
                  required: "Введите название задачи",
                  minLength: {
                    value: 3,
                    message: "Минимум 3 символа",
                  },
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
                placeholder="Опишите детали задачи..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("description", {
                  required: "Введите описание задачи",
                  minLength: {
                    value: 10,
                    message: "Минимум 10 символов",
                  },
                })}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Приоритет */}
            <div className="space-y-2">
              <Label htmlFor="priority">
                Приоритет <span className="text-destructive">*</span>
              </Label>
              <select
                id="priority"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("priority", {
                  required: "Выберите приоритет",
                  valueAsNumber: true,
                })}
              >
                <option value={TaskPriority.LOW}>Низкий</option>
                <option value={TaskPriority.MEDIUM}>Средний</option>
                <option value={TaskPriority.HIGH}>Высокий</option>
                <option value={TaskPriority.CRITICAL}>Критичный</option>
              </select>
              {errors.priority && (
                <p className="text-sm text-destructive">{errors.priority.message}</p>
              )}
            </div>

            {/* Дедлайн */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Дедлайн (необязательно)</Label>
              <Input
                id="deadline"
                type="datetime-local"
                {...register("deadline")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Создание..." : "Создать задачу"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CreateTaskDialog };
