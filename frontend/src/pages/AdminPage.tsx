import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users, Activity, Filter, Search } from "lucide-react";
import { adminApi } from "@/api/admin";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PendingProjects } from "@/components/features/admin/PendingProjects";
import { UserManagement } from "@/components/features/admin/UserManagement";
import { GlobalLogs } from "@/components/features/admin/GlobalLogs";
import { AdminUserFilters, AdminLogFilters } from "@/types";

function AdminPage() {
  const [userFilters, setUserFilters] = useState<AdminUserFilters>({});
  const [logFilters, setLogFilters] = useState<AdminLogFilters>({
    page: 1,
    per_page: 50,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Админ-панель</h1>
          <p className="text-muted-foreground mt-1">
            Управление системой и пользователями
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">
            <Shield className="h-4 w-4 mr-2" />
            Одобрение проектов
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Activity className="h-4 w-4 mr-2" />
            Глобальные логи
          </TabsTrigger>
        </TabsList>

        {/* Проекты на одобрение */}
        <TabsContent value="projects">
          <PendingProjects />
        </TabsContent>

        {/* Пользователи с фильтрами */}
        <TabsContent value="users">
          <div className="space-y-4">
            {/* Фильтры пользователей */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4" />
                <h3 className="font-semibold">Фильтры</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Поиск</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Username, email, имя..."
                      value={userFilters.search || ""}
                      onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select
                  label="Роль"
                  value={userFilters.role || ""}
                  onChange={(e) =>
                    setUserFilters({
                      ...userFilters,
                      role: e.target.value ? (e.target.value as "ADMIN" | "USER") : undefined,
                    })
                  }
                >
                  <option value="">Все</option>
                  <option value="ADMIN">Администратор</option>
                  <option value="USER">Пользователь</option>
                </Select>
                <Select
                  label="Статус"
                  value={
                    userFilters.is_active === undefined
                      ? ""
                      : userFilters.is_active
                      ? "true"
                      : "false"
                  }
                  onChange={(e) =>
                    setUserFilters({
                      ...userFilters,
                      is_active: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                >
                  <option value="">Все</option>
                  <option value="true">Активен</option>
                  <option value="false">Деактивирован</option>
                </Select>
              </div>
            </div>

            {/* Список пользователей */}
            <UserManagement filters={userFilters} />
          </div>
        </TabsContent>

        {/* Глобальные логи с фильтрами */}
        <TabsContent value="logs">
          <div className="space-y-4">
            {/* Фильтры логов */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4" />
                <h3 className="font-semibold">Фильтры логов</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Действие"
                  value={logFilters.action || ""}
                  onChange={(e) => setLogFilters({ ...logFilters, action: e.target.value || undefined })}
                >
                  <option value="">Все действия</option>
                  <option value="CREATE">Создание</option>
                  <option value="UPDATE">Обновление</option>
                  <option value="DELETE">Удаление</option>
                  <option value="LOGIN">Вход</option>
                  <option value="LOGOUT">Выход</option>
                </Select>
                <Select
                  label="Тип сущности"
                  value={logFilters.entity_type || ""}
                  onChange={(e) =>
                    setLogFilters({ ...logFilters, entity_type: e.target.value || undefined })
                  }
                >
                  <option value="">Все типы</option>
                  <option value="PROJECT">Проект</option>
                  <option value="TASK">Задача</option>
                  <option value="USER">Пользователь</option>
                  <option value="COMMENT">Комментарий</option>
                  <option value="MILESTONE">Этап</option>
                </Select>
                <div>
                  <label className="text-sm font-medium mb-2 block">Дата (от)</label>
                  <Input
                    type="date"
                    value={logFilters.date_from || ""}
                    onChange={(e) =>
                      setLogFilters({ ...logFilters, date_from: e.target.value || undefined })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Дата (до)</label>
                  <Input
                    type="date"
                    value={logFilters.date_to || ""}
                    onChange={(e) =>
                      setLogFilters({ ...logFilters, date_to: e.target.value || undefined })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setLogFilters({
                        page: 1,
                        per_page: 50,
                      })
                    }
                  >
                    Сбросить фильтры
                  </Button>
                </div>
              </div>
            </div>

            {/* Логи */}
            <GlobalLogs filters={logFilters} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminPage;
