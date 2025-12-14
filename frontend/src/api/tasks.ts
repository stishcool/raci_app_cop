import { api } from "./axios";
import { Task, RACIRole } from "@/types";

export const tasksApi = {
  // Получить мои задачи
  getMyTasks: async (role?: RACIRole): Promise<Task[]> => {
    const params = role ? { role } : {};
    const response = await api.get("/tasks/my-tasks", { params });
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.tasks && Array.isArray(response.data.tasks)) {
      return response.data.tasks;
    }
    
    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  },

  // Получить задачи проекта
  getProjectTasks: async (projectId: number, status?: string): Promise<Task[]> => {
    const params = status ? { status } : {};
    const response = await api.get(`/tasks/project/${projectId}`, { params });
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.tasks && Array.isArray(response.data.tasks)) {
      return response.data.tasks;
    }
    
    return [];
  },

  // Получить задачу по ID
  getTask: async (taskId: number): Promise<Task> => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data.task || response.data;
  },

  // Создать задачу
  createTask: async (data: {
    project_id: number;
    title: string;
    description: string;
    priority: number;
    deadline?: string;
  }): Promise<Task> => {
    const response = await api.post("/tasks", data);
    return response.data.task || response.data;
  },

  // Обновить задачу
  updateTask: async (taskId: number, data: Partial<Task>): Promise<Task> => {
    const response = await api.put(`/tasks/${taskId}`, data);
    return response.data.task || response.data;
  },

  // Удалить задачу
  deleteTask: async (taskId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },
};
