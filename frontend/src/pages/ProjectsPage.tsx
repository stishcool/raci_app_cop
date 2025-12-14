import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { projectsApi } from "@/api/projects";
import { ProjectCard } from "@/components/features/ProjectCard";
import { CreateProjectDialog } from "@/components/features/CreateProjectDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SkeletonProjectCard } from "@/components/features/skeletons/SkeletonCard";


type FilterType = "all" | "active" | "my";


function ProjectsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");


  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", filter],
    queryFn: () => projectsApi.getProjects(filter),
  });


  const filteredProjects = projects?.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Проекты</h1>
          <p className="text-muted-foreground mt-1">
            Управление проектами и командами
          </p>
        </div>
        <CreateProjectDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Создать проект
          </Button>
        </CreateProjectDialog>
      </div>


      {/* Фильтры и поиск */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Фильтры */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Все проекты
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
          >
            Активные
          </Button>
          <Button
            variant={filter === "my" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("my")}
          >
            Мои проекты
          </Button>
        </div>


        {/* Поиск */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск по названию или описанию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>


      {/* Список проектов */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonProjectCard key={i} />
          ))}
        </div>
      ) : !filteredProjects || filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-2">
            {searchQuery ? "Проекты не найдены" : "Проекты не найдены"}
          </p>
          {searchQuery ? (
            <p className="text-sm text-muted-foreground mb-4">
              Попробуйте изменить поисковый запрос
            </p>
          ) : (
            <CreateProjectDialog>
              <Button className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Создать первый проект
              </Button>
            </CreateProjectDialog>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Найдено: {filteredProjects.length} {filteredProjects.length === 1 ? 'проект' : filteredProjects.length > 1 && filteredProjects.length < 5 ? 'проекта' : 'проектов'}
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export default ProjectsPage;
