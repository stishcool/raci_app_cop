import React, { useState } from 'react';
import { createUser } from '../../api/projects';
import './Management.css';

const Management = ({ user }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
    email: '',
    is_active: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    if (!email) return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!formData.username || formData.username.length < 3) {
      setError('Имя пользователя должно быть ≥3 символов');
      setIsLoading(false);
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Пароль должен быть ≥6 символов');
      setIsLoading(false);
      return;
    }
    if (!formData.full_name || formData.full_name.length < 2) {
      setError('ФИО должно быть ≥2 символов');
      setIsLoading(false);
      return;
    }
    if (formData.email && !validateEmail(formData.email)) {
      setError('Некорректный формат email');
      setIsLoading(false);
      return;
    }

    try {
      const response = await createUser({
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone || null,
        email: formData.email || null,
        is_active: formData.is_active,
      });
      setSuccess(response.message || 'Пользователь успешно создан');
      setFormData({
        username: '',
        password: '',
        full_name: '',
        phone: '',
        email: '',
        is_active: true,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.positions?.includes('Администратор')) {
    return <div>Доступ запрещен</div>;
  }

  return (
    <div className="management-container">
      <h2>Управление</h2>
      <h3>Создать пользователя</h3>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Имя пользователя</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.trim() })}
            placeholder="Имя пользователя"
            maxLength={50}
            disabled={isLoading}
          />
        </div>
        <div>
          <label>Пароль</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Пароль"
            maxLength={50}
            disabled={isLoading}
          />
        </div>
        <div>
          <label>ФИО</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="ФИО"
            maxLength={100}
            disabled={isLoading}
          />
        </div>
        <div>
          <label>Телефон</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Телефон"
            maxLength={20}
            disabled={isLoading}
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
            placeholder="Email"
            maxLength={100}
            disabled={isLoading}
          />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              disabled={isLoading}
            />
            Активен
          </label>
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Создание...' : 'Создать'}
        </button>
      </form>
    </div>
  );
};

export default Management;