import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Download, UserPlus } from "lucide-react";
import { Task, User, RACIRole, RACIAssignment } from "@/types";
import { raciApi } from "@/api/raci";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";


interface RACIMatrixProps {
  tasks: Task[];
  team: User[];
  projectId: number;
}


const RACI_ROLES = [
  { 
    key: RACIRole.RESPONSIBLE, 
    label: "R", 
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", 
    title: "Исполнитель" 
  },
  { 
    key: RACIRole.ACCOUNTABLE, 
    label: "A", 
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", 
    title: "Ответственный" 
  },
  { 
    key: RACIRole.CONSULTED, 
    label: "C", 
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300", 
    title: "Консультант" 
  },
  { 
    key: RACIRole.INFORMED, 
    label: "I", 
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", 
    title: "Информируемый" 
  },
];


function RACIMatrix({ tasks, team, projectId }: RACIMatrixProps) {
  const queryClient = useQueryClient();
  const [selectedCell, setSelectedCell] = useState<{ taskId: number; userId: number } | null>(null);


  const assignRoleMutation = useMutation({
    mutationFn: (data: { task_id: number; user_id: number; role: RACIRole }) =>
      raciApi.assignRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      setSelectedCell(null);
    },
  });


  const getUserRole = (task: Task, userId: number): RACIRole | null => {
    if (!task.raci_assignments) return null;
    const assignment = task.raci_assignments.find((a) => a.user_id === userId);
    return assignment ? assignment.role : null;
  };


  const isTaskValid = (task: Task): boolean => {
    if (!task.raci_assignments || task.raci_assignments.length === 0) return false;
    
    const roles = task.raci_assignments.map((a) => a.role);
    const hasR = roles.includes(RACIRole.RESPONSIBLE);
    const hasA = roles.includes(RACIRole.ACCOUNTABLE);
    const accountableCount = roles.filter((r) => r === RACIRole.ACCOUNTABLE).length;
    
    return hasR && hasA && accountableCount === 1;
  };


  const handleCellClick = (taskId: number, userId: number, currentRole: RACIRole | null) => {
    setSelectedCell({ taskId, userId });
  };


  const handleAssignRole = (role: RACIRole) => {
    if (!selectedCell) return;
    
    assignRoleMutation.mutate({
      task_id: selectedCell.taskId,
      user_id: selectedCell.userId,
      role,
    });
  };


  const handleExportCSV = () => {
    let csv = "Задача," + team.map((u) => `${u.first_name} ${u.last_name}`).join(",") + "\n";
    
    tasks.forEach((task) => {
      const row = [task.title];
      team.forEach((user) => {
        const role = getUserRole(task, user.id);
        row.push(role || "");
      });
      csv += row.join(",") + "\n";
    });


    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raci-matrix-project-${projectId}.csv`;
    a.click();
  };


  if (team.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">В проекте нет участников</p>
        <p className="text-sm text-muted-foreground">
          Добавьте участников в настройках проекта
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">RACI Матрица</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Распределение ролей и зон ответственности
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Экспорт CSV
        </Button>
      </div>


      {/* Легенда */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg text-sm">
        {RACI_ROLES.map((role) => (
          <div key={role.key} className="flex items-center gap-2">
            <span className={cn("px-2 py-1 rounded font-semibold", role.color)}>
              {role.label}
            </span>
            <span className="text-muted-foreground">{role.title}</span>
          </div>
        ))}
      </div>


      {/* Матрица */}
      <div className="border border-border rounded-lg overflow-hidden dark:border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted dark:bg-muted">
                <th className="text-left p-3 font-semibold min-w-[200px] sticky left-0 bg-muted dark:bg-muted z-10 border-b dark:border-border">
                  Задача
                </th>
                {team.map((user) => (
                  <th key={user.id} className="text-center p-3 font-semibold min-w-[120px] border-b dark:border-border">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <span className="text-xs truncate max-w-[100px]">
                        {user.first_name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => {
                const isValid = isTaskValid(task);
                return (
                  <tr
                    key={task.id}
                    className={cn(
                      "border-t dark:border-border hover:bg-accent/50",
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    )}
                  >
                    <td className="p-3 sticky left-0 z-10 border-r dark:border-border" style={{ backgroundColor: index % 2 === 0 ? "hsl(var(--background))" : "hsl(var(--muted) / 0.2)" }}>
                      <div className="flex items-center gap-2">
                        {!isValid && (
                          <div title="Проверьте назначения RACI">
                            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                          </div>
                        )}
                        <span className="text-sm font-medium">{task.title}</span>
                      </div>
                    </td>
                    {team.map((user) => {
                      const role = getUserRole(task, user.id);
                      const roleConfig = RACI_ROLES.find((r) => r.key === role);
                      const isSelected =
                        selectedCell?.taskId === task.id && selectedCell?.userId === user.id;


                      return (
                        <td
                          key={user.id}
                          className="p-3 text-center cursor-pointer hover:bg-accent/50 relative border-l dark:border-border"
                          onClick={() => handleCellClick(task.id, user.id, role)}
                        >
                          {role && roleConfig ? (
                            <span
                              className={cn(
                                "inline-block px-3 py-1 rounded font-semibold",
                                roleConfig.color
                              )}
                            >
                              {roleConfig.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}


                          {/* Выпадающее меню для выбора роли */}
                          {isSelected && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-card border border-border rounded-lg shadow-lg p-2 z-20 flex gap-1 dark:bg-card dark:border-border">
                              {RACI_ROLES.map((r) => (
                                <button
                                  key={r.key}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssignRole(r.key);
                                  }}
                                  className={cn(
                                    "px-3 py-1 rounded font-semibold hover:opacity-80 transition-opacity",
                                    r.color
                                  )}
                                  title={r.title}
                                >
                                  {r.label}
                                </button>
                              ))}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCell(null);
                                }}
                                className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Предупреждения */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">Правила валидации RACI:</p>
            <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-400 space-y-1">
              <li>Каждая задача должна иметь хотя бы одного Исполнителя (R)</li>
              <li>Каждая задача должна иметь ровно одного Ответственного (A)</li>
              <li>Роли C и I опциональны</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


export { RACIMatrix };
