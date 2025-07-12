import axios from 'axios';
import { API_URL } from './config';

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка авторизации');
  }
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    localStorage.removeItem('token');
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};