import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserMinus, Mail, Shield } from "lucide-react";
import { projectsApi } from "@/api/projects";
import { User } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "sonner";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";

interface TeamManagementTabProps {
  projectId: number;
  team: User[];
  creatorId: number;
  currentUserId: number;
  isReadOnly?: boolean;  
}

function TeamManagementTab({ projectId, team, creatorId, currentUserId, isReadOnly = false }: TeamManagementTabProps) {  
  const queryClient = useQueryClient();

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => projectsApi.removeTeamMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Участник удален из команды");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Ошибка удаления участника");
    },
  });

  const handleRemoveMember = (userId: number, userName: string) => {
    if (!isReadOnly && confirm(`Удалить ${userName} из команды проекта?`)) {  
      removeMemberMutation.mutate(userId);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: { label: "Администратор", variant: "danger" as const },
      PROJECT_MANAGER: { label: "Менеджер проекта", variant: "default" as const },
      TEAM_MEMBER: { label: "Участник", variant: "secondary" as const },
    };
    return badges[role as keyof typeof badges] || { label: role, variant: "secondary" as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Команда проекта ({team.length})</h3>
          <p className="text-sm text-muted-foreground">
            Управление участниками проекта
            {isReadOnly && <span className="text-destructive ml-2">• Только для чтения</span>}
          </p>
        </div>
        {!isReadOnly && ( 
          <AddTeamMemberDialog projectId={projectId} currentTeam={team}>
            <Button>
              <Shield className="h-4 w-4 mr-2" />
              Добавить участника
            </Button>
          </AddTeamMemberDialog>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((member) => {
          const isCreator = member.id === creatorId;
          const isCurrentUser = member.id === currentUserId;
          const roleBadge = getRoleBadge(member.system_role);

          return (
            <div
              key={member.id}
              className="flex flex-col gap-4 p-4 border border-border rounded-lg bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  src={member.avatar}
                  fallback={`${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}`}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">
                      {member.first_name} {member.last_name}
                    </p>
                    {isCreator && (
                      <Badge variant="default" className="text-xs">
                        Создатель
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{member.username}</p>
                  <Badge variant={roleBadge.variant} className="mt-2 text-xs">
                    {roleBadge.label}
                  </Badge>
                </div>
              </div>

              {member.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}

              {!isCreator && !isReadOnly && ( 
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() =>
                    handleRemoveMember(member.id, `${member.first_name} ${member.last_name}`)
                  }
                  disabled={removeMemberMutation.isPending}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Удалить из команды
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { TeamManagementTab };
