import { api } from "./axios";
import { DashboardStats, TeamWorkload } from "@/types";


export const dashboardApi = {
  // Получить статистику
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get("/dashboard/stats");
    return response.data.data || response.data;
  },


  // Получить загруженность команды
  getTeamWorkload: async (): Promise<TeamWorkload[]> => {
    const response = await api.get("/dashboard/team-workload");
    
    console.log('Team workload response:', response.data); // ← Временная отладка
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    if (response.data.workload && Array.isArray(response.data.workload)) {
      return response.data.workload;
    }
    
    return [];
  },
};
