import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/api/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { CreateUserDialog } from "./CreateUserDialog";

function UserManagement() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.getUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Пользователь удален");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка при удалении");
    },
  });

  const handleDelete = (userId: number, username: string) => {
    if (confirm(`Удалить пользователя ${username}?`)) {
      deleteMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">Загрузка...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Пользователи ({users?.length || 0})</h2>
        <CreateUserDialog />
      </div>

      {/* Таблица пользователей */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold">ID</th>
                  <th className="text-left p-4 font-semibold">Имя пользователя</th>
                  <th className="text-left p-4 font-semibold">Полное имя</th>
                  <th className="text-left p-4 font-semibold">Роль</th>
                  <th className="text-left p-4 font-semibold">Статус</th>
                  <th className="text-right p-4 font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user, index) => (
                  <tr
                    key={user.id}
                    className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                  >
                    <td className="p-4">{user.id}</td>
                    <td className="p-4 font-medium">{user.username}</td>
                    <td className="p-4">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="p-4">
                      <Badge variant={user.system_role === "ADMIN" ? "default" : "secondary"}>
                        {user.system_role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.is_active ? "success" : "secondary"}>
                        {user.is_active ? "Активен" : "Неактивен"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id, user.username)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { UserManagement };
