import { useQuery } from "@tanstack/react-query";
import { Activity, User, Calendar } from "lucide-react";
import { adminApi } from "@/api/admin";
import { AdminLogFilters } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/Button";

interface GlobalLogsProps {
  filters?: AdminLogFilters;
}

function GlobalLogs({ filters }: GlobalLogsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs", filters],
    queryFn: () => adminApi.getGlobalLogs(filters),
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return <Badge variant="success">Создание</Badge>;
      case "UPDATE":
        return <Badge variant="default">Обновление</Badge>;
      case "DELETE":
        return <Badge variant="danger">Удаление</Badge>;
      case "LOGIN":
        return <Badge variant="secondary">Вход</Badge>;
      case "LOGOUT":
        return <Badge variant="secondary">Выход</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">Загрузка...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Глобальные логи ({total})</h2>
      </div>

      {logs.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Логи не найдены</p>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      <Badge variant="secondary">{log.entity_type}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{log.description || log.action}</p>
                  {log.user && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>
                        {log.user.first_name} {log.user.last_name} (@{log.user.username})
                      </span>
                    </div>
                  )}
                  {log.details && (
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                      {log.details}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Пагинация (упрощенная) */}
      {total > (filters?.per_page || 50) && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm">
            Предыдущая
          </Button>
          <Button variant="outline" size="sm">
            Следующая
          </Button>
        </div>
      )}
    </div>
  );
}

export { GlobalLogs };
