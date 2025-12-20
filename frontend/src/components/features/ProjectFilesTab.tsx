import { useQuery } from "@tanstack/react-query";
import { filesApi, FileUpload } from "@/api/files";
import { File, Download, Trash2, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface ProjectFilesTabProps {
  projectId: number;
  isReadOnly?: boolean;  
}

function ProjectFilesTab({ projectId, isReadOnly = false }: ProjectFilesTabProps) {  
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["project-files", projectId],
    queryFn: () => filesApi.getProjectFiles(projectId),
  });

  const deleteMutation = useMutation({
    mutationFn: filesApi.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-files", projectId] });
      toast.success("Файл удален");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Ошибка удаления файла");
    },
  });

  const handleDownload = async (file: FileUpload) => {
    try {
      const blob = await filesApi.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Ошибка скачивания файла");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const iconClass = "h-10 w-10";
    
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) {
      return <File className={cn(iconClass, "text-blue-500")} />;
    }
    if (["pdf"].includes(ext || "")) {
      return <File className={cn(iconClass, "text-red-500")} />;
    }
    if (["doc", "docx"].includes(ext || "")) {
      return <File className={cn(iconClass, "text-blue-600")} />;
    }
    if (["xls", "xlsx"].includes(ext || "")) {
      return <File className={cn(iconClass, "text-green-600")} />;
    }
    return <File className={cn(iconClass, "text-gray-500")} />;
  };

  const filesByTask = files.reduce((acc, file) => {
    const key = file.task_id ? `task-${file.task_id}` : "project";
    if (!acc[key]) acc[key] = [];
    acc[key].push(file);
    return acc;
  }, {} as Record<string, FileUpload[]>);

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">Загрузка...</p>;
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Файлов в проекте пока нет</p>
        <p className="text-sm text-muted-foreground mt-2">
          Загружайте файлы в задачи для работы с документацией
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Все файлы проекта ({files.length})
          {isReadOnly && <span className="text-sm text-destructive ml-2">• Только для чтения</span>}
        </h3>
      </div>

      {Object.entries(filesByTask).map(([key, taskFiles]) => (
        <div key={key} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            {key === "project" ? "Общие файлы проекта" : `Задача #${key.split("-")[1]}`}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {taskFiles.map((file) => (
              <div
                key={file.id}
                className="flex flex-col gap-3 p-4 border border-border rounded-lg hover:shadow-md transition-shadow bg-card"
              >
                <div className="flex items-start gap-3">
                  {getFileIcon(file.original_filename)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" title={file.original_filename}>
                      {file.original_filename}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(file.file_size)}
                    </p>
                  </div>
                </div>

                {file.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {file.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(file.uploaded_at), "d MMM yyyy", { locale: ru })}</span>
                  {file.uploader && (
                    <>
                      <span>•</span>
                      <User className="h-3 w-3" />
                      <span className="truncate">
                        {file.uploader.first_name} {file.uploader.last_name}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Скачать
                  </Button>
                  {!isReadOnly && (  
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Удалить файл?")) {
                          deleteMutation.mutate(file.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { ProjectFilesTab };
