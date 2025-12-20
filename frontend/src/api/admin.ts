import { api } from "./axios";
import { Project, User, ActivityLog, AdminLogFilters, AdminUserFilters } from "@/types";

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
    const response = await api.post(`/admin/approve-project/${projectId}`);
    return response.data.project || response.data;
  },

  // Отклонить проект
  rejectProject: async (projectId: number, reason?: string): Promise<Project> => {
    const response = await api.post(`/admin/reject-project/${projectId}`, {
      reason,
    });
    return response.data.project || response.data;
  },

  // Получить всех пользователей с фильтрами
  getUsers: async (filters?: AdminUserFilters): Promise<User[]> => {
    const response = await api.get("/admin/users", { params: filters });
    
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

  // Изменить роль пользователя
  changeUserRole: async (userId: number, role: "ADMIN" | "USER"): Promise<User> => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data.user || response.data;
  },

  // Деактивировать пользователя
  userDeactivate: async (userId: number): Promise<User> => {
    const response = await api.patch(`/admin/users/${userId}/deactivate`);
    return response.data.user || response.data;
  },

  // Активировать пользователя
  userActivate: async (userId: number): Promise<User> => {
    const response = await api.patch(`/admin/users/${userId}/activate`);
    return response.data.user || response.data;
  },

  // Получить глобальные логи с расширенными фильтрами
  getGlobalLogs: async (filters?: AdminLogFilters): Promise<{ 
    logs: ActivityLog[]; 
    total: number;
    page: number;
    per_page: number;
  }> => {
    const response = await api.get("/admin/logs", { params: filters });
    
    const logs = Array.isArray(response.data) 
      ? response.data 
      : response.data.logs || [];
    
    return {
      logs,
      total: response.data.total || logs.length,
      page: response.data.page || 1,
      per_page: response.data.per_page || 50,
    };
  },
};
