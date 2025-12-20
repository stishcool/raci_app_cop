import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { adminApi } from "@/api/admin";
import { AdminUserFilters } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { CreateUserDialog } from "@/components/features/admin/CreateUserDialog";

interface UserManagementProps {
  filters?: AdminUserFilters;
}

function UserManagement({ filters }: UserManagementProps) {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", filters],
    queryFn: () => adminApi.getUsers(filters),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: "ADMIN" | "USER" }) =>
      adminApi.changeUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      isActive ? adminApi.userDeactivate(userId) : adminApi.userActivate(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">Загрузка...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-semibold">Пользователи ({users.length})</h2>
        {/* Кнопка создания пользователя */}
        <CreateUserDialog />
      </div>

      {users.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Пользователи не найдены</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-semibold">Пользователь</th>
                <th className="text-left p-3 font-semibold">Контакты</th>
                <th className="text-center p-3 font-semibold">Роль</th>
                <th className="text-center p-3 font-semibold">Статус</th>
                <th className="text-center p-3 font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border hover:bg-accent/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatar}
                        fallback={`${user.first_name[0]}${user.last_name[0]}`}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      {user.email && <p>{user.email}</p>}
                      {user.phone && <p className="text-muted-foreground">{user.phone}</p>}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <select
                      value={user.system_role}
                      onChange={(e) =>
                        changeRoleMutation.mutate({
                          userId: user.id,
                          role: e.target.value as "ADMIN" | "USER",
                        })
                      }
                      className="text-sm border border-border rounded px-2 py-1 bg-background"
                    >
                      <option value="USER">Пользователь</option>
                      <option value="ADMIN">Администратор</option>
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    {user.is_active ? (
                      <Badge variant="success">Активен</Badge>
                    ) : (
                      <Badge variant="secondary">Деактивирован</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            userId: user.id,
                            isActive: user.is_active,
                          })
                        }
                        className="p-2 hover:bg-accent rounded"
                        title={user.is_active ? "Деактивировать" : "Активировать"}
                      >
                        {user.is_active ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить пользователя ${user.username}?`)) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export { UserManagement };
