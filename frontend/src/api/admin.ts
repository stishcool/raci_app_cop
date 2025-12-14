import { api } from "./axios";
import { Project, User, ActivityLog } from "@/types";


export const adminApi = {
  // Получить проекты на одобрение
  getPendingProjects: async (): Promise<Project[]> => {
    const response = await api.get("/admin/pending-projects"); 
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.projects && Array.isArray(response.data.projects)) {
      return response.data.projects;
    }
    
    return [];
  },


  // Одобрить проект
  approveProject: async (projectId: number): Promise<Project> => {
    const response = await api.post(`/admin/projects/${projectId}/approve`);
    return response.data.project || response.data;
  },


  // Отклонить проект
  rejectProject: async (projectId: number, reason?: string): Promise<Project> => {
    const response = await api.post(`/admin/projects/${projectId}/reject`, {
      reason,
    });
    return response.data.project || response.data;
  },


  // Получить всех пользователей
  getUsers: async (): Promise<User[]> => {
    const response = await api.get("/admin/users");
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.users && Array.isArray(response.data.users)) {
      return response.data.users;
    }
    
    return [];
  },


  // Создать пользователя
  createUser: async (data: {
    username: string;
    password: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    system_role?: string;
    is_active?: boolean;
  }): Promise<User> => {
    const response = await api.post("/admin/users/create", data);
    return response.data.user || response.data;
  },


  // Обновить пользователя
  updateUser: async (userId: number, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data.user || response.data;
  },


  // Удалить пользователя
  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },


  // Получить глобальные логи
  getGlobalLogs: async (params?: {
    user_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<ActivityLog[]> => {
    const response = await api.get("/admin/logs", { params });
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.logs && Array.isArray(response.data.logs)) {
      return response.data.logs;
    }
    
    return [];
  },
};
