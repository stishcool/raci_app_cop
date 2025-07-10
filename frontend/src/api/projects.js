import axios from 'axios';

const API_URL = 'http://localhost:5000';

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