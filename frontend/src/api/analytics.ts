import { api } from "./axios";
import { ProjectAnalytics } from "@/types";

export const analyticsApi = {
  // Получить аналитику проекта
  getProjectAnalytics: async (projectId: number): Promise<ProjectAnalytics> => {
    const response = await api.get(`/analytics/project/${projectId}`);
    return response.data;
  },
};
