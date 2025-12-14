import { useNavigate } from "react-router-dom";
import { Calendar, Users, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Project, ProjectStatus } from "@/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Avatar } from "@/components/ui/Avatar";

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

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
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const deadline = new Date(project.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const getDeadlineColor = () => {
    if (daysLeft < 0) return "text-red-600";
    if (daysLeft < 3) return "text-red-600";
    if (daysLeft < 7) return "text-orange-600";
    return "text-muted-foreground";
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          {getStatusBadge(project.status)}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="space-y-2">
          {/* Дедлайн */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={getDeadlineColor()}>
              {format(deadline, "d MMMM yyyy", { locale: ru })}
              {daysLeft >= 0 && ` (${daysLeft} дн.)`}
              {daysLeft < 0 && " (просрочен)"}
            </span>
          </div>

          {/* Команда */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Команда: {project.team_count || project.team?.length || 0} чел.
            </span>
          </div>

          {/* Менеджер */}
          {project.creator && (
            <div className="flex items-center gap-2 mt-3">
              <Avatar
                src={project.creator.avatar}
                fallback={`${project.creator.first_name[0]}${project.creator.last_name[0]}`}
                size="sm"
                className="!h-6 !w-6 !text-xs"
              />
              <span className="text-xs text-muted-foreground">
                {project.creator.first_name} {project.creator.last_name}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { ProjectCard };
