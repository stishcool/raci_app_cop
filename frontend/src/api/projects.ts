import { api } from "./axios";
import { Project, User, ActivityLog } from "@/types";


export const projectsApi = {
  // Получить все проекты
  getProjects: async (filter?: "all" | "active" | "my"): Promise<Project[]> => {
    const params = filter && filter !== "all" ? { filter } : {};
    const response = await api.get("/projects", { params });
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.projects && Array.isArray(response.data.projects)) {
      return response.data.projects;
    }
    
    return [];
  },

  // Получить проект по ID
  getProject: async (id: number): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data.project || response.data;
  },

  // Создать проект
  createProject: async (data: {
    name: string;
    description: string;
    deadline: string;
  }): Promise<Project> => {
    const response = await api.post("/projects", data);
    return response.data.project || response.data;
  },

  // Обновить проект
  updateProject: async (id: number, data: Partial<Project>): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data.project || response.data;
  },

  // Запросить публикацию
  requestPublication: async (id: number): Promise<void> => {
    await api.post(`/projects/${id}/request-publication`);
  },

  // Добавить участника
  addTeamMember: async (projectId: number, userId: number): Promise<void> => {
    await api.post(`/projects/${projectId}/team`, { user_id: userId });
  },

  // Удалить участника
  removeTeamMember: async (projectId: number, userId: number): Promise<void> => {
    await api.delete(`/projects/${projectId}/team/${userId}`);
  },

  // Получить логи проекта
  getProjectLogs: async (projectId: number): Promise<ActivityLog[]> => {
    const response = await api.get(`/projects/${projectId}/logs`);
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.logs && Array.isArray(response.data.logs)) {
      return response.data.logs;
    }
    
    return [];
  },
};
