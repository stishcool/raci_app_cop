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
import { projectsApi } from "@/api/projects";

interface CreateProjectForm {
  name: string;
  description: string;
  deadline: string;
}

interface CreateProjectDialogProps {
  children: React.ReactNode;
}

function CreateProjectDialog({ children }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateProjectForm>();

  const createMutation = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Проект создан успешно!");
      setOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка при создании проекта");
    },
  });

  const onSubmit = (data: CreateProjectForm) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Создать новый проект</DialogTitle>
            <DialogDescription>
              Заполните информацию о проекте. После создания вы сможете добавить команду и задачи.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Название */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Название проекта <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Например: Разработка CRM системы"
                {...register("name", {
                  required: "Введите название проекта",
                  minLength: {
                    value: 3,
                    message: "Минимум 3 символа",
                  },
                })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
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
                placeholder="Опишите цели и задачи проекта..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("description", {
                  required: "Введите описание проекта",
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

            {/* Дедлайн */}
            <div className="space-y-2">
              <Label htmlFor="deadline">
                Дедлайн <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deadline"
                type="datetime-local"
                {...register("deadline", {
                  required: "Выберите дедлайн",
                })}
              />
              {errors.deadline && (
                <p className="text-sm text-destructive">{errors.deadline.message}</p>
              )}
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
              {createMutation.isPending ? "Создание..." : "Создать проект"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CreateProjectDialog };
