import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, AlertTriangle, Users, CheckCircle } from "lucide-react";
import { analyticsApi } from "@/api/analytics";
import { cn } from "@/lib/utils";

interface ProjectAnalyticsProps {
  projectId: number;
}

function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ["project-analytics", projectId],
    queryFn: () => analyticsApi.getProjectAnalytics(projectId),
    enabled: true,
  });

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">Загрузка аналитики...</p>;
  }

  if (error) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-destructive mb-2">Ошибка загрузки аналитики</p>
        <p className="text-sm text-muted-foreground">{String(error)}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Нет данных для аналитики</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Аналитика проекта</h2>
      </div>

      {/* Статистика в карточках */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Завершено</span>
          </div>
          <p className="text-2xl font-bold">
            {analytics.completed_tasks || 0}/{analytics.total_tasks || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {(analytics.completion_rate || 0).toFixed(1)}% выполнено
          </p>
        </div>

        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Просрочено</span>
          </div>
          <p className="text-2xl font-bold text-destructive">
            {analytics.overdue_tasks || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">задач</p>
        </div>

        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Высокий приоритет</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {analytics.high_priority_tasks || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">задач</p>
        </div>

        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">Участников</span>
          </div>
          <p className="text-2xl font-bold">
            {analytics.team_workload?.length || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">в команде</p>
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Общий прогресс</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Выполнено задач</span>
            <span className="font-medium">
              {(analytics.completion_rate || 0).toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${analytics.completion_rate || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Распределение по статусам */}
      {analytics.tasks_by_status && (
        <div className="border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Распределение по статусам</h3>
          <div className="space-y-2">
            {Object.entries(analytics.tasks_by_status).map(([status, count]) => {
              const total = analytics.total_tasks || 1;
              const percentage = (Number(count) / total) * 100;

              const statusColors: Record<string, string> = {
                TODO: "bg-gray-500",
                IN_PROGRESS: "bg-blue-500",
                IN_REVIEW: "bg-yellow-500",
                DONE: "bg-green-500",
                BLOCKED: "bg-red-500",
              };

              const statusLabels: Record<string, string> = {
                TODO: "К выполнению",
                IN_PROGRESS: "В работе",
                IN_REVIEW: "На проверке",
                DONE: "Завершено",
                BLOCKED: "Заблокировано",
              };

              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {statusLabels[status] || status}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all", statusColors[status])}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Загруженность команды */}
      {analytics.team_workload && analytics.team_workload.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Загруженность команды</h3>
          <div className="space-y-3">
            {analytics.team_workload.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between">
                <span className="text-sm">{member.full_name}</span>
                <span className="text-sm font-medium">{member.task_count} задач</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Этапы (если есть) */}
      {analytics.tasks_by_milestone && analytics.tasks_by_milestone.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-3">По этапам</h3>
          <div className="space-y-2">
            {analytics.tasks_by_milestone.map((milestone) => (
              <div
                key={milestone.milestone_id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{milestone.milestone_name}</span>
                <span className="font-medium">{milestone.task_count} задач</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { ProjectAnalytics };
