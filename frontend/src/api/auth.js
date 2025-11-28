import axios from 'axios';
import { API_URL } from './config';

export const login = async (username, password) => {
  console.log('Login request:', { username, password, url: `${API_URL}/auth/login` });
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    console.log('Login response:', response.data);
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return true;
  } catch (error) {
    console.error('Login error:', error.response?.data, error.message);
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