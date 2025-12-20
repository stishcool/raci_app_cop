import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, FileText, CheckSquare, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { projectsApi } from "@/api/projects";
import { tasksApi } from "@/api/tasks";
import { Badge } from "@/components/ui/Badge";

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const { data: projects } = useQuery({
    queryKey: ["global-search-projects", debouncedQuery],
    queryFn: () => projectsApi.getProjects("all"),
    enabled: debouncedQuery.length >= 2,
  });

  const { data: tasks } = useQuery({
    queryKey: ["global-search-tasks", debouncedQuery],
    queryFn: () => tasksApi.getMyTasks(),
    enabled: debouncedQuery.length >= 2,
  });

  const filteredProjects = projects?.filter((project) =>
    project.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(debouncedQuery.toLowerCase())
  ).slice(0, 5); 

  const filteredTasks = tasks?.filter((task) =>
    task.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(debouncedQuery.toLowerCase())
  ).slice(0, 5);

  const hasResults = (filteredProjects && filteredProjects.length > 0) || 
                     (filteredTasks && filteredTasks.length > 0);

  const handleProjectClick = (projectId: number) => {
    navigate(`/projects/${projectId}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleTaskClick = (task: any) => {
    navigate(`/projects/${task.project_id}?task=${task.id}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    setSearchQuery("");
    setDebouncedQuery("");
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Поле поиска */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
            type="text"
            placeholder="Поиск по проектам и задачам"
            value={searchQuery}
            onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10 w-full" 
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Результаты поиска */}
    {isOpen && searchQuery.length >= 2 && (
    <div className="absolute top-full mt-2 w-full bg-card border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {debouncedQuery.length < 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Введите минимум 2 символа для поиска
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </div>
          ) : (
            <div className="py-2">
              {/* Проекты */}
              {filteredProjects && filteredProjects.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Проекты
                  </div>
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(project.id)}
                      className="w-full px-4 py-2 hover:bg-accent text-left transition-colors flex items-start gap-3"
                    >
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{project.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {project.description}
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {project.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {/* Задачи */}
              {filteredTasks && filteredTasks.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Задачи
                  </div>
                  {filteredTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="w-full px-4 py-2 hover:bg-accent text-left transition-colors flex items-start gap-3"
                    >
                      <CheckSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground truncate">
                            {task.description}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {task.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
