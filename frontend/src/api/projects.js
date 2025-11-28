import axios from 'axios';
import { API_URL } from './config';

export const getProjects = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Не авторизован');
  try {
    const response = await axios.get(`${API_URL}/projects?status=approved`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка получения проектов');
  }
};

export const getRequests = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Не авторизован');
  try {
    const response = await axios.get(`${API_URL}/projects?status=draft`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка получения запросов');
  }
};

export const approveProject = async (id) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Не авторизован');
  try {
    const response = await axios.patch(`${API_URL}/projects/${id}`, { status: 'approved' }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка одобрения проекта');
  }
};

export const rejectProject = async (id) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Не авторизован');
  try {
    await axios.delete(`${API_URL}/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка отклонения проекта');
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
    const response = await axios.get(`${API_URL}/auth/users`, {  
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Ошибка получения пользователей');
  }
};

export const createUser = async (userData) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Не авторизован');
  try {
    const response = await axios.post(`${API_URL}/admin/users`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || 'Ошибка создания пользователя';
    const details = error.response?.data?.details || null;
    throw new Error(details ? `${errMsg}: ${JSON.stringify(details)}` : errMsg);
  }
};