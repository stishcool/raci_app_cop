import axios from 'axios';
import { API_URL } from './config';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка получения списка пользователей');
  }
};

export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/admin/users`, userData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка создания пользователя');
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await axios.patch(`${API_URL}/admin/users/${userId}`, userData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка обновления пользователя');
  }
};

export const deleteUser = async (userId) => {
  try {
    // Используем PATCH с is_active: false, пока не уточнен DELETE
    const response = await axios.patch(
      `${API_URL}/admin/users/${userId}`,
      { is_active: false },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка деактивации пользователя');
  }
};