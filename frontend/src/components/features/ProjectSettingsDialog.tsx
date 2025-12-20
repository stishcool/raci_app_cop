import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { projectsApi } from "@/api/projects";
import { Project } from "@/types";
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
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/ui/DateTimePicker";

interface ProjectSettingsDialogProps {
  project: Project;
  children: React.ReactNode;
}

interface UpdateProjectForm {
  name: string;
  description: string;
  deadline: string;
}

function ProjectSettingsDialog({ project, children }: ProjectSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<UpdateProjectForm>({
    defaultValues: {
      name: project.name,
      description: project.description,
      deadline: project.deadline ? new Date(project.deadline).toISOString() : "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Project>) => projectsApi.updateProject(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Проект обновлен!");
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка при обновлении проекта");
    },
  });

  const onSubmit = (data: UpdateProjectForm) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Настройки проекта</DialogTitle>
            <DialogDescription>
              Редактирование информации о проекте #{project.id}
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
                rows={5}
                placeholder="Опишите цели и задачи проекта..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              <Controller
                name="deadline"
                control={control}
                rules={{ required: "Выберите дедлайн" }}
                render={({ field }) => (
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Выберите дату и время"
                  />
                )}
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
              onClick={() => {
                setOpen(false);
                reset();
              }}
              disabled={updateMutation.isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ProjectSettingsDialog };
