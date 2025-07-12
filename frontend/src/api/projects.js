import axios from 'axios';
import { API_URL } from './config';

export const getProjects = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Не авторизован');
  try {
    const response = await axios.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка получения проектов');
  }
};

export const getRoles = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Не авторизован');
  try {
    const response = await axios.get(`${API_URL}/projects/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка получения ролей');
  }
};

export const getUsers = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Не авторизован');
  try {
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка получения пользователей');
  }
};