import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/api/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

function PendingProjects() {
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-pending-projects"],
    queryFn: adminApi.getPendingProjects,
  });

  const approveMutation = useMutation({
    mutationFn: adminApi.approveProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-projects"] });
      toast.success("Проект одобрен!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка при одобрении");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (projectId: number) => adminApi.rejectProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-projects"] });
      toast.success("Проект отклонен");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка при отклонении");
    },
  });

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">Загрузка...</p>;
  }

  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет проектов на одобрение</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{project.name}</CardTitle>
                <Badge variant="warning">Ожидает одобрения</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{project.description}</p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {project.creator && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    {project.creator.first_name} {project.creator.last_name}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Дедлайн: {format(new Date(project.deadline), "d MMMM yyyy", { locale: ru })}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => approveMutation.mutate(project.id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Одобрить
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate(project.id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Отклонить
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { PendingProjects };
