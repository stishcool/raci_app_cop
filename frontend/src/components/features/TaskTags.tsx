import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Tag as TagIcon } from "lucide-react";
import { tagsApi } from "@/api/tags";
import { Tag } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface TaskTagsProps {
  taskId: number;
  projectId: number;
  currentTags?: Tag[];
}

const TAG_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

function TaskTags({ taskId, projectId, currentTags = [] }: TaskTagsProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  const { data: projectTags = [] } = useQuery({
    queryKey: ["project-tags", projectId],
    queryFn: () => tagsApi.getProjectTags(projectId),
  });

  const createTagMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      tagsApi.createTag({ ...data, project_id: projectId }),
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ["project-tags", projectId] });
      assignTagMutation.mutate(newTag.id);
      setNewTagName("");
      setIsAdding(false);
    },
  });

  const assignTagMutation = useMutation({
    mutationFn: (tagId: number) => tagsApi.assignTagToTask(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: (tagId: number) => tagsApi.removeTagFromTask(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      createTagMutation.mutate({ name: newTagName, color: selectedColor });
    }
  };

  const availableTags = projectTags.filter(
    (tag) => !currentTags.some((ct) => ct.id === tag.id)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Теги</span>
      </div>

      {/* Текущие теги */}
      <div className="flex flex-wrap gap-2">
        {currentTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => removeTagMutation.mutate(tag.id)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: tag.color + "20",
              color: tag.color,
              border: `1px solid ${tag.color}40`,
            }}
          >
            {tag.name}
            <X className="h-3 w-3" />
          </button>
        ))}
      </div>

      {/* Добавление тега */}
      {isAdding ? (
        <form onSubmit={handleCreateTag} className="border border-border rounded-lg p-3 space-y-3">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Название тега..."
            autoFocus
          />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Выберите цвет:</p>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                    selectedColor === color ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={createTagMutation.isPending}>
              Создать и добавить
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewTagName("");
              }}
            >
              Отмена
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          {/* Существующие теги проекта */}
          {availableTags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Добавить существующий:</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => assignTagMutation.mutate(tag.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: tag.color + "20",
                      color: tag.color,
                      border: `1px solid ${tag.color}40`,
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Кнопка создания нового тега */}
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Создать новый тег
          </Button>
        </div>
      )}
    </div>
  );
}

export { TaskTags };
