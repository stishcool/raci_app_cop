import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { checklistApi } from "@/api/checklist";
import { ChecklistItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";

interface TaskChecklistProps {
  taskId: number;
}

function TaskChecklist({ taskId }: TaskChecklistProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["task-checklist", taskId],
    queryFn: () => checklistApi.getTaskChecklist(taskId),
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => checklistApi.createChecklistItem(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-checklist", taskId] });
      setNewItemTitle("");
      setIsAdding(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: checklistApi.toggleChecklistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-checklist", taskId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: checklistApi.deleteChecklistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-checklist", taskId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemTitle.trim()) {
      createMutation.mutate(newItemTitle);
    }
  };

  const completedCount = items.filter((item) => item.is_done).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Чеклист</h3>
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {completedCount} из {totalCount} выполнено
            </p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </div>

      {/* Прогресс-бар */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Форма добавления */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Название задачи..."
            autoFocus
          />
          <Button type="submit" disabled={createMutation.isPending}>
            Добавить
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsAdding(false);
              setNewItemTitle("");
            }}
          >
            Отмена
          </Button>
        </form>
      )}

      {/* Список элементов */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-4">Загрузка...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 border border-dashed border-border rounded-lg">
          Чеклист пуст. Добавьте первый элемент!
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group",
                item.is_done && "opacity-60"
              )}
            >
              <button className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>
              <Checkbox
                checked={item.is_done}
                onCheckedChange={() => toggleMutation.mutate(item.id)}
              />
              <span
                className={cn(
                  "flex-1 text-sm",
                  item.is_done && "line-through text-muted-foreground"
                )}
              >
                {item.title}
              </span>
              <button
                onClick={() => deleteMutation.mutate(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-destructive rounded transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { TaskChecklist };
