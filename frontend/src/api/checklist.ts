import { api } from "./axios";
import { ChecklistItem } from "@/types";

export const checklistApi = {
  // Создать элемент чеклиста
  createChecklistItem: async (taskId: number, title: string): Promise<ChecklistItem> => {
    const response = await api.post(`/checklist/task/${taskId}`, { title });
    return response.data.item || response.data;
  },

  // Получить все элементы чеклиста задачи
  getTaskChecklist: async (taskId: number): Promise<ChecklistItem[]> => {
    const response = await api.get(`/checklist/task/${taskId}`);
    return Array.isArray(response.data) ? response.data : response.data.items || [];
  },

  // Обновить элемент чеклиста
  updateChecklistItem: async (itemId: number, title: string): Promise<ChecklistItem> => {
    const response = await api.put(`/checklist/${itemId}`, { title });
    return response.data.item || response.data;
  },

  // Удалить элемент чеклиста
  deleteChecklistItem: async (itemId: number): Promise<void> => {
    await api.delete(`/checklist/${itemId}`);
  },

  // Переключить статус (done/not done)
  toggleChecklistItem: async (itemId: number): Promise<ChecklistItem> => {
    const response = await api.post(`/checklist/${itemId}/toggle`);
    return response.data.item || response.data;
  },

  // Изменить порядок элементов
  reorderChecklistItem: async (itemId: number, newOrder: number): Promise<void> => {
    await api.post(`/checklist/${itemId}/reorder`, { order_index: newOrder });
  },
};
