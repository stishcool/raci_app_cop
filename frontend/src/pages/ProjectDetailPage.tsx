import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Settings, Download, FileText } from "lucide-react";
import { projectsApi } from "@/api/projects";
import { tasksApi } from "@/api/tasks";
import { authApi } from "@/api/auth";
import { exportApi } from "@/api/export";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ProjectStatus, Task } from "@/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { KanbanBoard } from "@/components/features/KanbanBoard";
import { RACIMatrix } from "@/components/features/RACIMatrix";
import { ActivityTimeline } from "@/components/features/ActivityTimeline";
import { SkeletonTaskList } from "@/components/features/skeletons/SkeletonCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProjectSettingsDialog } from "@/components/features/ProjectSettingsDialog";
import { TeamManagementTab } from "@/components/features/TeamManagementTab";
import { ProjectFilesTab } from "@/components/features/ProjectFilesTab";
import { RequestPublicationButton } from "@/components/features/RequestPublicationButton";
import { TaskFilters } from "@/components/features/TaskFilters";
import { ProjectAnalytics } from "@/components/features/ProjectAnalytics";
import { MilestonesWithTasks } from "@/components/features/MilestonesWithTasks";

function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id || "0");
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setShowExportMenu(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowExportMenu(false);
    }, 300);
    setCloseTimeout(timeout);
  };

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: authApi.getCurrentUser,
  });

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

  const isRejected = project?.status === ProjectStatus.REJECTED;

  const displayTasks = filteredTasks.length > 0 || tasks?.length === 0 ? filteredTasks : tasks || [];

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const blob = await exportApi.exportProjectExcel(projectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${projectId}-${project?.name || "export"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка экспорта Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const blob = await exportApi.exportProjectPDF(projectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${projectId}-${project?.name || "export"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка экспорта PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

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

  const teamUsers = project?.team?.map((t) => t.user) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к проектам
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              {getStatusBadge(project.status)}
            </div>
            <p className="text-muted-foreground">{project.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
              <span>
                Дедлайн: {format(new Date(project.deadline), "d MMMM yyyy", { locale: ru })}
              </span>
              <span>Команда: {project.team_count || 0} чел.</span>
              {project.creator && (
                <span>
                  Менеджер: {project.creator.first_name} {project.creator.last_name}
                </span>
              )}
            </div>
            {isRejected && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ Проект отклонен. Редактирование недоступно.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            {/* Экспорт */}
            <div 
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Button variant="outline" disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Экспорт..." : "Экспорт"}
              </Button>
              
              {showExportMenu && !isExporting && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[150px] z-50">
                  <button
                    onClick={handleExportExcel}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    PDF (.pdf)
                  </button>
                </div>
              )}
            </div>

            {/* Отправить на одобрение */}
            <RequestPublicationButton projectId={projectId} status={project.status} />

            {/* Настройки */}
            {!isRejected && (
              <ProjectSettingsDialog project={project}>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Настройки
                </Button>
              </ProjectSettingsDialog>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="tasks">Этапы</TabsTrigger>
          <TabsTrigger value="board">Доска</TabsTrigger>
          <TabsTrigger value="raci">RACI матрица</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="team">Команда</TabsTrigger>
          <TabsTrigger value="files">Файлы</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <MilestonesWithTasks projectId={projectId} isReadOnly={isRejected} />
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
            <KanbanBoard tasks={displayTasks} projectId={projectId} isReadOnly={isRejected} />
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
            <RACIMatrix tasks={tasks} team={teamUsers} projectId={projectId} isReadOnly={isRejected} />
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <ProjectAnalytics projectId={projectId} />
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <TeamManagementTab
            projectId={projectId}
            team={teamUsers}
            creatorId={project.created_by_id || project.creator_id}
            currentUserId={currentUser?.id || 0}
            isReadOnly={isRejected}
          />
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <ProjectFilesTab projectId={projectId} isReadOnly={isRejected} />
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
