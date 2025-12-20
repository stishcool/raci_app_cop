import { api } from "./axios";

export const exportApi = {
  // Экспорт проекта в Excel
  exportProjectExcel: async (projectId: number): Promise<Blob> => {
    const response = await api.get(`/export/project/${projectId}/excel`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Экспорт проекта в PDF
  exportProjectPDF: async (projectId: number): Promise<Blob> => {
    const response = await api.get(`/export/project/${projectId}/pdf`, {
      responseType: "blob",
    });
    return response.data;
  },
};
