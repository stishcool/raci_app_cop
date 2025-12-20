// src/api/users.ts
import { api } from "./axios";
import { User } from "@/types";

export const usersApi = {
  // Получить всех пользователей
  getUsers: async (): Promise<User[]> => {
    const response = await api.get("/users");
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.users && Array.isArray(response.data.users)) {
      return response.data.users;
    }
    
    return [];
  },

  // Получить пользователя по ID
  getUser: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data.user || response.data;
  },
};
