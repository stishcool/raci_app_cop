import { api } from "./axios";
import { ActivityLog } from "@/types";

export const logsApi = {
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

  // Получить глобальные логи (для админки)
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
