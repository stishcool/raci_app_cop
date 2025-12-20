import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, CheckCircle2, Circle, Clock, AlertCircle, Trash2 } from "lucide-react";
import { milestonesApi } from "@/api/milestones";
import { Milestone, MilestoneStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MilestonesListProps {
  projectId: number;
  isReadOnly?: boolean;  
}

function MilestonesList({ projectId, isReadOnly = false }: MilestonesListProps) {  
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
  });

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: () => milestonesApi.getProjectMilestones(projectId),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; deadline?: string }) =>
      milestonesApi.createMilestone({ ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
      setIsCreating(false);
      setFormData({ name: "", description: "", deadline: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: milestonesApi.deleteMilestone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: MilestoneStatus }) =>
      milestonesApi.updateMilestoneStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadOnly && formData.name.trim()) {  
      createMutation.mutate(formData);
    }
  };

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case MilestoneStatus.NOT_STARTED:
        return <Circle className="h-5 w-5 text-gray-400" />;
      case MilestoneStatus.IN_PROGRESS:
        return <Clock className="h-5 w-5 text-blue-500" />;
      case MilestoneStatus.COMPLETED:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case MilestoneStatus.BLOCKED:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Этапы проекта ({milestones.length})</h2>
        {!isReadOnly && (  
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить этап
          </Button>
        )}
      </div>

      {/* Форма создания - скрыта для readOnly */}
      {!isReadOnly && isCreating && (  
        <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Название этапа</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Например: Разработка прототипа"
              required
            />
          </div>
          <Textarea
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Краткое описание этапа..."
          />
          <div>
            <label className="text-sm font-medium mb-2 block">Дедлайн</label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>
              Создать
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setFormData({ name: "", description: "", deadline: "" });
              }}
            >
              Отмена
            </Button>
          </div>
        </form>
      )}

      {/* Список этапов */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-4">Загрузка...</p>
      ) : milestones.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Этапов пока нет</p>
          {!isReadOnly && (  
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать первый этап
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">{getStatusIcon(milestone.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold">
                        {index + 1}. {milestone.name}
                      </h3>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    {!isReadOnly && ( 
                      <button
                        onClick={() => {
                          if (confirm("Удалить этот этап?")) {
                            deleteMutation.mutate(milestone.id);
                          }
                        }}
                        className="p-1 hover:bg-destructive/10 text-destructive rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {/* Статус */}
                    <Select
                      value={milestone.status}
                      onChange={(e) =>
                        !isReadOnly && updateStatusMutation.mutate({  
                          id: milestone.id,
                          status: e.target.value as MilestoneStatus,
                        })
                      }
                      disabled={isReadOnly}  
                      className="w-auto h-8 text-xs"
                    >
                      <option value={MilestoneStatus.NOT_STARTED}>Не начат</option>
                      <option value={MilestoneStatus.IN_PROGRESS}>В процессе</option>
                      <option value={MilestoneStatus.COMPLETED}>Завершен</option>
                      <option value={MilestoneStatus.BLOCKED}>Заблокирован</option>
                    </Select>

                    {/* Дедлайн */}
                    {milestone.deadline && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(milestone.deadline), "d MMM yyyy", { locale: ru })}
                      </span>
                    )}

                    {/* Прогресс */}
                    {milestone.tasks_count !== undefined && (
                      <span className="text-muted-foreground">
                        Задач: {milestone.completed_tasks_count || 0} / {milestone.tasks_count}
                      </span>
                    )}
                  </div>

                  {/* Прогресс-бар */}
                  {milestone.progress !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Прогресс</span>
                        <span>{milestone.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            milestone.status === MilestoneStatus.COMPLETED
                              ? "bg-green-500"
                              : "bg-primary"
                          )}
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { MilestonesList };
