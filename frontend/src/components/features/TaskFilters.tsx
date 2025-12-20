import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Task, TaskStatus, TaskPriority, User } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

interface TaskFiltersProps {
  tasks: Task[];
  team: User[];
  onFilterChange: (filtered: Task[]) => void;
}

interface Filters {
  statuses: TaskStatus[];
  priorities: TaskPriority[];
  assignees: number[];
}

function TaskFilters({ tasks, team, onFilterChange }: TaskFiltersProps) {
  const [filters, setFilters] = useState<Filters>({
    statuses: [],
    priorities: [],
    assignees: [],
  });

  const applyFilters = (newFilters: Filters) => {
    let filtered = [...tasks];

    if (newFilters.statuses.length > 0) {
      filtered = filtered.filter((task) => newFilters.statuses.includes(task.status));
    }

    if (newFilters.priorities.length > 0) {
      filtered = filtered.filter((task) => newFilters.priorities.includes(task.priority));
    }

    if (newFilters.assignees.length > 0) {
      filtered = filtered.filter((task) =>
        task.raci_assignments?.some((a) => newFilters.assignees.includes(a.user_id))
      );
    }

    onFilterChange(filtered);
    setFilters(newFilters);
  };

  const toggleStatus = (status: TaskStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    applyFilters({ ...filters, statuses: newStatuses });
  };

  const togglePriority = (priority: TaskPriority) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    applyFilters({ ...filters, priorities: newPriorities });
  };

  const toggleAssignee = (userId: number) => {
    const newAssignees = filters.assignees.includes(userId)
      ? filters.assignees.filter((a) => a !== userId)
      : [...filters.assignees, userId];
    applyFilters({ ...filters, assignees: newAssignees });
  };

  const clearFilters = () => {
    setFilters({ statuses: [], priorities: [], assignees: [] });
    onFilterChange(tasks);
  };

  const hasActiveFilters =
    filters.statuses.length > 0 || filters.priorities.length > 0 || filters.assignees.length > 0;

  const getStatusLabel = (status: TaskStatus) => {
    const labels: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: "К выполнению",
      [TaskStatus.IN_PROGRESS]: "В работе",
      [TaskStatus.IN_REVIEW]: "На проверке",
      [TaskStatus.DONE]: "Готово",
      [TaskStatus.BLOCKED]: "Заблокировано",
    };
    return labels[status];
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    const labels: Record<TaskPriority, string> = {
      [TaskPriority.LOW]: "Низкий",
      [TaskPriority.MEDIUM]: "Средний",
      [TaskPriority.HIGH]: "Высокий",
      [TaskPriority.CRITICAL]: "Критичный",
    };
    return labels[priority];
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Статус */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Статус
            {filters.statuses.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.statuses.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Статус задачи</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(TaskStatus) as Array<keyof typeof TaskStatus>).map((key) => {
            const status = TaskStatus[key];
            return (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filters.statuses.includes(status)}
                onCheckedChange={() => toggleStatus(status)}
              >
                {getStatusLabel(status)}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Приоритет */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Приоритет
            {filters.priorities.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.priorities.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Приоритет</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(TaskPriority) as Array<keyof typeof TaskPriority>).map((key) => {
            const priority = TaskPriority[key];
            return (
              <DropdownMenuCheckboxItem
                key={priority}
                checked={filters.priorities.includes(priority)}
                onCheckedChange={() => togglePriority(priority)}
              >
                {getPriorityLabel(priority)}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Исполнитель */}
      {team.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Исполнитель
              {filters.assignees.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.assignees.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Участники</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {team.map((user) => (
              <DropdownMenuCheckboxItem
                key={user.id}
                checked={filters.assignees.includes(user.id)}
                onCheckedChange={() => toggleAssignee(user.id)}
              >
                {user.first_name} {user.last_name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Очистить фильтры */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Сбросить
        </Button>
      )}
    </div>
  );
}

export { TaskFilters };
