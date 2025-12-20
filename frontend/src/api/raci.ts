import { api } from "./axios";
import { RACIAssignment, RACIRole } from "@/types";

export const raciApi = {
  // Назначить RACI роль
  assignRole: async (data: {
    task_id: number;
    user_id: number;
    role: RACIRole;
  }): Promise<RACIAssignment> => {
    const response = await api.post("/raci/assign", data);
    return response.data.assignment || response.data;
  },

  // Получить RACI матрицу проекта
  getProjectMatrix: async (projectId: number): Promise<any> => {
    const response = await api.get(`/raci/project/${projectId}/matrix`);
    return response.data;
  },

  // Получить RACI назначения задачи
  getTaskAssignments: async (taskId: number): Promise<RACIAssignment[]> => {
    const response = await api.get(`/raci/task/${taskId}`);
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.assignments && Array.isArray(response.data.assignments)) {
      return response.data.assignments;
    }
    
    return [];
  },

  // Валидировать RACI задачи
  validateTask: async (taskId: number): Promise<{
    is_valid: boolean;
    warnings: string[];
  }> => {
    const response = await api.get(`/raci/task/${taskId}/validate`);
    return response.data;
  },

  // Удалить назначение
  removeAssignment: async (assignmentId: number): Promise<void> => {
    await api.delete(`/raci/assignment/${assignmentId}`);
  },

  // Изменить RACI роль
  updateAssignment: async (assignmentId: number, role: RACIRole): Promise<RACIAssignment> => {
    const response = await api.put(`/raci/assignment/${assignmentId}`, { role });
    return response.data.assignment || response.data;
  },

  // Экспорт RACI матрицы в CSV
  exportMatrixCSV: async (projectId: number): Promise<Blob> => {
    const response = await api.get(`/raci/project/${projectId}/export-csv`, {
      responseType: "blob",
    });
    return response.data;
  },
};
