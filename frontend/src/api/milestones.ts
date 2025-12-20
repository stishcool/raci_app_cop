import { api } from "./axios";
import { Milestone, MilestoneStatus } from "@/types";

export const milestonesApi = {
  // Создать этап
  createMilestone: async (data: {
    project_id: number;
    name: string;
    description?: string;
    deadline?: string;
  }): Promise<Milestone> => {
    const response = await api.post("/milestones", data);
    return response.data.milestone || response.data;
  },

  // Получить все этапы проекта
  getProjectMilestones: async (projectId: number): Promise<Milestone[]> => {
    const response = await api.get(`/milestones/project/${projectId}`);
    return Array.isArray(response.data) ? response.data : response.data.milestones || [];
  },

  // Получить один этап
  getMilestone: async (milestoneId: number): Promise<Milestone> => {
    const response = await api.get(`/milestones/${milestoneId}`);
    return response.data.milestone || response.data;
  },

  // Обновить этап
  updateMilestone: async (milestoneId: number, data: Partial<Milestone>): Promise<Milestone> => {
    const response = await api.put(`/milestones/${milestoneId}`, data);
    return response.data.milestone || response.data;
  },

  // Удалить этап
  deleteMilestone: async (milestoneId: number): Promise<void> => {
    await api.delete(`/milestones/${milestoneId}`);
  },

  // Изменить порядок этапов
  reorderMilestones: async (milestoneId: number, newOrder: number): Promise<void> => {
    await api.post(`/milestones/${milestoneId}/reorder`, { order_index: newOrder });
  },

  // Изменить статус этапа
  updateMilestoneStatus: async (milestoneId: number, status: MilestoneStatus): Promise<void> => {
    await api.put(`/milestones/${milestoneId}/status`, { status });
  },
};
