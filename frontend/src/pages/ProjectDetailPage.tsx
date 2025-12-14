import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Settings } from "lucide-react";
import { projectsApi } from "@/api/projects";
import { tasksApi } from "@/api/tasks";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { TaskItem } from "@/components/features/TaskItem";
import { ProjectStatus } from "@/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { KanbanBoard } from "@/components/features/KanbanBoard";
import { RACIMatrix } from "@/components/features/RACIMatrix";
import { ActivityTimeline } from "@/components/features/ActivityTimeline";
import { CreateTaskDialog } from "@/components/features/CreateTaskDialog";
import { SkeletonTaskList } from "@/components/features/skeletons/SkeletonCard";
import { Skeleton } from "@/components/ui/Skeleton";

function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id || "0");

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.getProject(projectId),
    enabled: !!projectId,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: () => tasksApi.getProjectTasks(projectId),
    enabled: !!projectId,
  });

   const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["project-logs", projectId],
    queryFn: () => projectsApi.getProjectLogs(projectId),  
    enabled: !!projectId,
  });


  if (projectLoading) {
    return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-10 w-40" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <SkeletonTaskList />
    </div>
  );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground mb-4">Проект не найден</p>
        <Button onClick={() => navigate("/projects")}>Вернуться к проектам</Button>
      </div>
    );
  }

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return <Badge variant="success">Активен</Badge>;
      case ProjectStatus.DRAFT:
        return <Badge variant="secondary">Черновик</Badge>;
      case ProjectStatus.PENDING_APPROVAL:
        return <Badge variant="warning">Ожидает одобрения</Badge>;
      case ProjectStatus.REJECTED:
        return <Badge variant="danger">Отклонен</Badge>;
      case ProjectStatus.COMPLETED:
        return <Badge>Завершен</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/projects")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к проектам
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              {getStatusBadge(project.status)}
            </div>
            <p className="text-muted-foreground">{project.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>
                Дедлайн:{" "}
                {format(new Date(project.deadline), "d MMMM yyyy", { locale: ru })}
              </span>
              <span>Команда: {project.team_count || 0} чел.</span>
              {project.creator && (
                <span>
                  Менеджер: {project.creator.first_name} {project.creator.last_name}
                </span>
              )}
            </div>
          </div>

          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Настройки
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Задачи</TabsTrigger>
          <TabsTrigger value="board">Доска</TabsTrigger>
          <TabsTrigger value="raci">RACI матрица</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Задачи ({tasks?.length || 0})
              </h2>
              <CreateTaskDialog projectId={projectId}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать задачу
                </Button>
              </CreateTaskDialog>
            </div>

            {tasksLoading ? (
              <SkeletonTaskList />
            ) : !tasks || tasks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground mb-4">Задач пока нет</p>
                <CreateTaskDialog projectId={projectId}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать первую задачу
                  </Button>
                </CreateTaskDialog>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskItem key={task.id} task={task} projectId={projectId} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

         {/* Board Tab */}
        <TabsContent value="board">
          {tasksLoading ? (
            <p className="text-center text-muted-foreground py-8">Загрузка...</p>
          ) : !tasks || tasks.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground mb-4">
                Создайте задачи, чтобы увидеть Kanban доску
              </p>
            </div>
          ) : (
            <KanbanBoard tasks={tasks} projectId={projectId} />
          )}
        </TabsContent>

         {/* RACI Tab */}
        <TabsContent value="raci">
          {tasksLoading ? (
            <p className="text-center text-muted-foreground py-8">Загрузка...</p>
          ) : !tasks || tasks.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground mb-4">
                Создайте задачи, чтобы увидеть RACI матрицу
              </p>
            </div>
          ) : (
            <RACIMatrix
              tasks={tasks}
              team={project?.team?.map((t) => t.user) || []}
              projectId={projectId}
            />
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          {logsLoading ? (
            <p className="text-center text-muted-foreground py-8">Загрузка...</p>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">История действий пуста</p>
            </div>
          ) : (
            <ActivityTimeline logs={logs} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProjectDetailPage;
