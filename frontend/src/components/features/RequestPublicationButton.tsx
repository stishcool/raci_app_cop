import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { projectsApi } from "@/api/projects";
import { authApi } from "@/api/auth";
import { ProjectStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface RequestPublicationButtonProps {
  projectId: number;
  status: ProjectStatus;
}

function RequestPublicationButton({ projectId, status }: RequestPublicationButtonProps) {
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: authApi.getCurrentUser,
  });

  const requestMutation = useMutation({
    mutationFn: () => projectsApi.requestPublication(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Запрос на публикацию отправлен администратору");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Ошибка отправки запроса");
    },
  });

  if (currentUser?.system_role === "ADMIN") {
    return null;
  }

  if (status !== ProjectStatus.DRAFT) {
    return null;
  }

  return (
    <Button
      onClick={() => {
        if (confirm("Отправить проект на одобрение администратору?")) {
          requestMutation.mutate();
        }
      }}
      disabled={requestMutation.isPending}
    >
      <Send className="h-4 w-4 mr-2" />
      {requestMutation.isPending ? "Отправка..." : "Отправить на одобрение"}
    </Button>
  );
}

export { RequestPublicationButton };
