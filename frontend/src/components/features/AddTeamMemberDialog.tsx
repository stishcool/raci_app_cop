import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Search, X } from "lucide-react";
import { projectsApi } from "@/api/projects";
import { usersApi } from "@/api/users";
import { User } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddTeamMemberDialogProps {
  projectId: number;
  currentTeam: User[];
  children: React.ReactNode;
}

function AddTeamMemberDialog({ projectId, currentTeam, children }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getUsers(),
    enabled: open,
  });

  const availableUsers = allUsers.filter((user: User) => {
    const isInTeam = currentTeam.some((member) => member.id === user.id);
    if (isInTeam) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const username = user.username.toLowerCase();
      const email = user.email?.toLowerCase() || "";
      
      return fullName.includes(query) || username.includes(query) || email.includes(query);
    }

    return true;
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: number) => projectsApi.addTeamMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Участник добавлен в проект");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Ошибка добавления участника");
    },
  });

  const handleAddMember = (userId: number) => {
    addMemberMutation.mutate(userId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Добавить участника в проект</DialogTitle>
          <DialogDescription>
            Выберите пользователей для добавления в команду проекта
          </DialogDescription>
        </DialogHeader>

        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, username или email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Список пользователей */}
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Загрузка...</p>
          ) : availableUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? "Пользователи не найдены" : "Все пользователи уже в команде"}
            </p>
          ) : (
            availableUsers.map((user: User) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors",
                  addMemberMutation.isPending && "opacity-50 pointer-events-none"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar
                    src={user.avatar}
                    fallback={`${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`}
                    size="md"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {user.system_role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      @{user.username} {user.email && `• ${user.email}`}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleAddMember(user.id)}
                  disabled={addMemberMutation.isPending}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { AddTeamMemberDialog };
