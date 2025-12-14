import { useQuery } from "@tanstack/react-query";
import { FolderKanban, CheckSquare, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { dashboardApi } from "@/api/dashboard";
import { tasksApi } from "@/api/tasks";
import { StatsCard } from "@/components/features/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TaskStatus, TaskPriority } from "@/types";
import { SkeletonStatsCard } from "@/components/features/skeletons/SkeletonCard";
import { Skeleton } from "@/components/ui/Skeleton";


function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.getStats,
  });

  const { data: teamWorkload, isLoading: workloadLoading, error: workloadError } = useQuery({
    queryKey: ["team-workload"],
    queryFn: dashboardApi.getTeamWorkload,
  });

  const myTasks = stats?.my_tasks || [];
  const activeTasks = myTasks.filter((task) => task.status !== TaskStatus.DONE);

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return "Критично";
      case TaskPriority.HIGH:
        return "Высокий";
      case TaskPriority.MEDIUM:
        return "Средний";
      case TaskPriority.LOW:
      default:
        return "Низкий";
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case TaskPriority.HIGH:
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case TaskPriority.MEDIUM:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return "К выполнению";
      case TaskStatus.IN_PROGRESS:
        return "В работе";
      case TaskStatus.IN_REVIEW:
        return "На проверке";
      case TaskStatus.DONE:
        return "Готово";
      case TaskStatus.BLOCKED:
        return "Заблокировано";
      default:
        return status;
    }
  };

  const totalTasks = stats?.status_breakdown 
    ? Object.values(stats.status_breakdown).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold">Дашборд</h1>
        <p className="text-muted-foreground mt-1">
          Обзор проектов и задач
        </p>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <SkeletonStatsCard />
            <SkeletonStatsCard />
            <SkeletonStatsCard />
            <SkeletonStatsCard />
          </>
        ) : statsError ? (
          <div className="col-span-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-destructive text-sm">
              Ошибка загрузки статистики
            </p>
          </div>
        ) : (
          <>
            <StatsCard
              title="Мои проекты"
              value={stats?.my_projects_count || 0}
              icon={FolderKanban}
            />
            <StatsCard
              title="Всего задач"
              value={totalTasks}
              icon={CheckSquare}
            />
            <StatsCard
              title="Моих задач"
              value={stats?.my_tasks_count || 0}
              icon={Clock}
            />
            <StatsCard
              title="Срочных задач"
              value={stats?.urgent_tasks_count || 0}
              icon={AlertCircle}
            />
          </>
        )}
      </div>

      {/* Две колонки */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Мои задачи */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Мои активные задачи
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-3 border border-border rounded-lg">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : activeTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                У вас нет активных задач
              </p>
            ) : (
              <div className="space-y-3">
                {activeTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Статус: {getStatusLabel(task.status)}
                      </p>
                    </div>
                    <span className={`ml-3 px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Загруженность команды */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Загруженность команды</CardTitle>
          </CardHeader>
          <CardContent>
            {workloadLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : workloadError ? (
              <p className="text-sm text-destructive">
                Ошибка загрузки данных
              </p>
            ) : !teamWorkload || teamWorkload.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            ) : (
              <div className="space-y-4">
                {teamWorkload.slice(0, 5).map((member) => (
                  <div key={member.user_id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {member.full_name || member.username}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {member.task_count} {member.task_count === 1 ? 'задача' : member.task_count < 5 ? 'задачи' : 'задач'}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.min((member.task_count / 10) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
