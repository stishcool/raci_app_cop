import { api } from "./axios";

export interface FileUpload {
  id: number;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  mime_type: string;
  description?: string;
  uploaded_by_id: number;
  project_id?: number;
  task_id?: number;
  uploaded_at: string;
  uploader?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

export const filesApi = {
  // Загрузить файл к задаче
  uploadFile: async (data: {
    file: File;
    task_id?: number;
    project_id?: number;
    description?: string;
  }): Promise<FileUpload> => {
    const formData = new FormData();
    formData.append("file", data.file);
    
    if (data.task_id) {
      formData.append("task_id", data.task_id.toString());
    }
    
    if (data.project_id) {
      formData.append("project_id", data.project_id.toString());
    }
    
    if (data.description) {
      formData.append("description", data.description);
    }

    const response = await api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data.file || response.data;
  },

  // Получить файлы задачи
  getTaskFiles: async (taskId: number): Promise<FileUpload[]> => {
    const response = await api.get(`/files/task/${taskId}`);
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.files && Array.isArray(response.data.files)) {
      return response.data.files;
    }
    
    return [];
  },

  // Получить файлы проекта
  getProjectFiles: async (projectId: number): Promise<FileUpload[]> => {
    const response = await api.get(`/files/project/${projectId}`);
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.files && Array.isArray(response.data.files)) {
      return response.data.files;
    }
    
    return [];
  },

  // Скачать файл
  downloadFile: async (fileId: number): Promise<Blob> => {
    const response = await api.get(`/files/download/${fileId}`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Удалить файл
  deleteFile: async (fileId: number): Promise<void> => {
    await api.delete(`/files/${fileId}`);
  },
};
