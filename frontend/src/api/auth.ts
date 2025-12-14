import { api } from "./axios";
import { AuthResponse, User } from "@/types";

export const authApi = {
  // Вход
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", {
      username,
      password,
    });
    return response.data;
  },

  // Регистрация
  register: async (data: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  // Получить текущего пользователя
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },
};
