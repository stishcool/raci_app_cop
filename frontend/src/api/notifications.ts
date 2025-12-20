import { api } from "./axios";

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface NotificationCount {
  count: number;
}

export const notificationsApi = {
  // Получить все уведомления
  getNotifications: async (unreadOnly?: boolean): Promise<Notification[]> => {
    const params = unreadOnly ? { unread_only: true } : {};
    const response = await api.get("/notifications", { params });
    return Array.isArray(response.data) ? response.data : response.data.notifications || [];
  },

  // Получить количество непрочитанных
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<NotificationCount>("/notifications/unread-count");
    return response.data.count || 0;
  },

  // Отметить как прочитанное
  markAsRead: async (notificationId: number): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`);
  },

  // Отметить все как прочитанные
  markAllAsRead: async (): Promise<void> => {
    await api.put("/notifications/read-all");
  },
};
