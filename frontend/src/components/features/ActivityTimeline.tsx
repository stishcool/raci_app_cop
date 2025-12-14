import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Edit, 
  Trash2, 
  UserPlus,
  Clock,
  Shield
} from "lucide-react";
import { ActivityLog } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

interface ActivityTimelineProps {
  logs: ActivityLog[];
}

const getEntityTitle = (log: ActivityLog): string => {
  const match = log.description?.match(/"([^"]+)"/);
  return match ? match[1] : "";
};

function ActivityTimeline({ logs }: ActivityTimelineProps) {
  const getActionText = (log: ActivityLog): string => {
    const action = log.action.toUpperCase();
    const entityType = log.entity_type;

    if (action.includes("CREATE")) {
      if (entityType === "PROJECT") return "создал проект";
      if (entityType === "TASK") return "создал задачу";
      if (entityType === "TEAM") return "добавил участника в команду";
      return "создал объект";
    }

    if (action.includes("UPDATE")) {
      if (entityType === "PROJECT") return "обновил проект";
      if (entityType === "TASK") return "обновил задачу";
      return "обновил объект";
    }

    if (action.includes("DELETE")) {
      if (entityType === "TASK") return "удалил задачу";
      if (entityType === "TEAM") return "удалил участника из команды";
      return "удалил объект";
    }

    if (action.includes("ASSIGN_RACI") || action.includes("RACI")) {
      return "назначил RACI роль";
    }

    if (action.includes("PUBLISH") || action.includes("REQUEST")) {
      return "запросил публикацию проекта";
    }

    if (action.includes("APPROVE")) {
      return "одобрил проект";
    }

    if (action.includes("REJECT")) {
      return "отклонил проект";
    }

    if (action.includes("STATUS")) {
      return "изменил статус";
    }

    return log.action;
  };

  const getActionIcon = (action: string) => {
    const upperAction = action.toUpperCase();
    
    if (upperAction.includes("CREATE")) {
      return <FileText className="h-4 w-4" />;
    }
    if (upperAction.includes("UPDATE")) {
      return <Edit className="h-4 w-4" />;
    }
    if (upperAction.includes("DELETE")) {
      return <Trash2 className="h-4 w-4" />;
    }
    if (upperAction.includes("RACI") || upperAction.includes("ASSIGN")) {
      return <UserPlus className="h-4 w-4" />;
    }
    if (upperAction.includes("TEAM")) {
      return <Users className="h-4 w-4" />;
    }
    if (upperAction.includes("APPROVE") || upperAction.includes("REJECT")) {
      return <Shield className="h-4 w-4" />;
    }
    if (upperAction.includes("COMPLETE") || upperAction.includes("DONE")) {
      return <CheckCircle className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    const upperAction = action.toUpperCase();
    
    if (upperAction.includes("CREATE")) {
      return "bg-green-100 text-green-700";
    }
    if (upperAction.includes("UPDATE")) {
      return "bg-blue-100 text-blue-700";
    }
    if (upperAction.includes("DELETE")) {
      return "bg-red-100 text-red-700";
    }
    if (upperAction.includes("RACI") || upperAction.includes("ASSIGN")) {
      return "bg-purple-100 text-purple-700";
    }
    if (upperAction.includes("APPROVE")) {
      return "bg-green-100 text-green-700";
    }
    if (upperAction.includes("REJECT")) {
      return "bg-red-100 text-red-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  const getEntityName = (log: ActivityLog): string => {
    const types: Record<string, string> = {
      PROJECT: "Проект",
      TASK: "Задача",
      TEAM: "Команда",
      RACI: "RACI",
      USER: "Пользователь",
    };
    return types[log.entity_type] || log.entity_type;
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">История действий пуста</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Вертикальная линия */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

        {/* События */}
        <div className="space-y-6">
          {logs.map((log) => (
            <div key={log.id} className="relative flex gap-4">
              {/* Аватар пользователя */}
              {log.user ? (
                <Avatar
                  src={log.user.avatar}
                  fallback={`${log.user.first_name?.[0]}${log.user.last_name?.[0]}`}
                  size="md"
                  className={cn("relative z-10 border-4 border-background", getActionColor(log.action))}
                />
              ) : (
                <div
                  className={cn(
                    "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-background",
                    getActionColor(log.action)
                  )}
                >
                  {getActionIcon(log.action)}
                </div>
              )}
              {/* Контент */}
              <div className="flex-1 pb-6">
                <div className="rounded-lg border border-border bg-card p-4">
                  {/* Заголовок */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="font-medium">
                        {log.user && (
                          <span className="text-primary">
                            {log.user.first_name} {log.user.last_name}
                          </span>
                        )}
                        {" "}
                        {getActionText(log)}
                        {getEntityTitle(log) && (
                          <span className="ml-1">
                            "{getEntityTitle(log)}"
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getEntityName(log)} #{log.entity_id}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "d MMM, HH:mm", { locale: ru })}
                    </span>
                  </div>
                  {/* Детали 
                  {log.details && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-md text-sm">
                      <p className="text-muted-foreground">{log.details}</p>
                    </div>
                  )}*/}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { ActivityTimeline };
