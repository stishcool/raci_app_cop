import { api } from "./axios";
import { Comment } from "@/types";

export const commentsApi = {
  // Создать комментарий
  createComment: async (taskId: number, content: string, parentId?: number): Promise<Comment> => {
    const response = await api.post(`/comments/task/${taskId}`, {
      content,
      parent_id: parentId,
    });
    return response.data.comment || response.data;
  },

  // Получить комментарии задачи
  getTaskComments: async (taskId: number): Promise<Comment[]> => {
    const response = await api.get(`/comments/task/${taskId}`);
    return Array.isArray(response.data) ? response.data : response.data.comments || [];
  },

  // Редактировать комментарий
  updateComment: async (commentId: number, content: string): Promise<Comment> => {
    const response = await api.put(`/comments/${commentId}`, { content });
    return response.data.comment || response.data;
  },

  // Удалить комментарий
  deleteComment: async (commentId: number): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  },

  // Получить ответы на комментарий
  getCommentReplies: async (commentId: number): Promise<Comment[]> => {
    const response = await api.get(`/comments/${commentId}/replies`);
    return Array.isArray(response.data) ? response.data : response.data.replies || [];
  },
};
