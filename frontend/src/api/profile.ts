import { api } from "./axios";
import { User } from "@/types";

export const profileApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get("/auth/me");
    return response.data.user || response.data;
  },

  // Обновить профиль
  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    current_password?: string;
    new_password?: string;
  }): Promise<User> => {
    const response = await api.put("/auth/profile", data);
    return response.data.user || response.data;
  },

  // Загрузить аватар
  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("avatar", file);
    
    const response = await api.post("/auth/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data.avatar_url || response.data.avatar;
  },

  // Удалить аватар
  deleteAvatar: async (): Promise<void> => {
    await api.delete("/auth/profile/avatar");
  },
};
