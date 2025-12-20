import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, File, Download, Trash2, X } from "lucide-react";
import { filesApi, FileUpload } from "@/api/files";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TaskFileUploadProps {
  taskId: number;
  projectId: number;
  isReadOnly?: boolean;  
}

function TaskFileUpload({ taskId, projectId, isReadOnly = false }: TaskFileUploadProps) {  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["task-files", taskId],
    queryFn: () => filesApi.getTaskFiles(taskId),
  });

  const uploadMutation = useMutation({
    mutationFn: filesApi.uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-files", taskId] });
      queryClient.invalidateQueries({ queryKey: ["project-files", projectId] });
      toast.success("Файл успешно загружен");
      setSelectedFile(null);
      setDescription("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Ошибка загрузки файла");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: filesApi.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-files", taskId] });
      queryClient.invalidateQueries({ queryKey: ["project-files", projectId] });
      toast.success("Файл удален");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Ошибка удаления файла");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;  
    
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        toast.error("Файл слишком большой (максимум 16MB)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (isReadOnly || !selectedFile) {  
      if (!selectedFile) toast.error("Выберите файл");
      return;
    }

    uploadMutation.mutate({
      file: selectedFile,
      task_id: taskId,
      project_id: projectId,
      description,
    });
  };

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
    const iconClass = "h-8 w-8";
    
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

  return (
    <div className="space-y-4">
      {/* Форма загрузки - скрыта для isReadOnly */}
      {!isReadOnly && (  
        <div className="border border-dashed border-border rounded-lg p-4 space-y-3">
          <Label>Загрузить файл</Label>
          
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0"
            >
              <Upload className="h-4 w-4 mr-2" />
              Выбрать файл
            </Button>
            
            {selectedFile && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm truncate">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({formatFileSize(selectedFile.size)})
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {selectedFile && (
            <>
              <Input
                placeholder="Описание файла (опционально)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? "Загрузка..." : "Загрузить"}
              </Button>
            </>
          )}
        </div>
      )}  

      {/* Список файлов */}
      <div className="space-y-2">
        <Label>Файлы ({files.length})</Label>
        
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">Файлов пока нет</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                {getFileIcon(file.original_filename)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.original_filename}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(file.uploaded_at), "d MMM yyyy, HH:mm", { locale: ru })}
                    </span>
                    {file.uploader && (
                      <>
                        <span>•</span>
                        <span>
                          {file.uploader.first_name} {file.uploader.last_name}
                        </span>
                      </>
                    )}
                  </div>
                  {file.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4" />
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
        )}
      </div>
    </div>
  );
}

export { TaskFileUpload };
