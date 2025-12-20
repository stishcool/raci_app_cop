import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { milestonesApi } from "@/api/milestones";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";

interface CreateMilestoneInlineProps {
  projectId: number;
  onClose: () => void;
}

export function CreateMilestoneInline({ projectId, onClose }: CreateMilestoneInlineProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; deadline?: string }) =>
      milestonesApi.createMilestone({ ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
      toast.success("Этап создан!");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка создания этапа");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      createMutation.mutate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 space-y-3 bg-accent/50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Новый этап</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-accent rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <Input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Название этапа"
        required
      />
      
      <Textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Описание (необязательно)"
      />
      
      <Input
        type="date"
        value={formData.deadline}
        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        placeholder="Дедлайн"
      />
      
      <div className="flex gap-2">
        <Button type="submit" disabled={createMutation.isPending}>
          Создать
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}
