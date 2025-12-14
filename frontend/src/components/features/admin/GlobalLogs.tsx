import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { ActivityTimeline } from "@/components/features/ActivityTimeline";

function GlobalLogs() {
  const [page, setPage] = useState(1);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-logs", page],
    queryFn: () => adminApi.getGlobalLogs({ page, per_page: 20 }),
  });

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">Загрузка...</p>;
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">Логи отсутствуют</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Глобальные логи системы</h2>
        <p className="text-sm text-muted-foreground">Страница {page}</p>
      </div>

      <ActivityTimeline logs={logs} />
    </div>
  );
}

export { GlobalLogs };
