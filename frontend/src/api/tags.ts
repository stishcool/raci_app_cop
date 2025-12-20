import { api } from "./axios";
import { Tag } from "@/types";

export const tagsApi = {
  // Создать тег
  createTag: async (data: { name: string; color: string; project_id?: number }): Promise<Tag> => {
    const response = await api.post("/tags", data);
    return response.data.tag || response.data;
  },

  // Получить все теги
  getAllTags: async (): Promise<Tag[]> => {
    const response = await api.get("/tags");
    return Array.isArray(response.data) ? response.data : response.data.tags || [];
  },

  // Получить тег по ID
  getTag: async (tagId: number): Promise<Tag> => {
    const response = await api.get(`/tags/${tagId}`);
    return response.data.tag || response.data;
  },

  // Обновить тег
  updateTag: async (tagId: number, data: { name?: string; color?: string }): Promise<Tag> => {
    const response = await api.put(`/tags/${tagId}`, data);
    return response.data.tag || response.data;
  },

  // Удалить тег
  deleteTag: async (tagId: number): Promise<void> => {
    await api.delete(`/tags/${tagId}`);
  },

  // Назначить тег задаче
  assignTagToTask: async (taskId: number, tagId: number): Promise<void> => {
    await api.post(`/tags/task/${taskId}/assign`, { tag_id: tagId });
  },

  // Удалить тег с задачи
  removeTagFromTask: async (taskId: number, tagId: number): Promise<void> => {
    await api.delete(`/tags/task/${taskId}/remove/${tagId}`);
  },

  // Получить теги проекта
  getProjectTags: async (projectId: number): Promise<Tag[]> => {
    const response = await api.get(`/tags/project/${projectId}`);
    return Array.isArray(response.data) ? response.data : response.data.tags || [];
  },
};
