import React, { useState } from 'react';
import './Management.css';

const UserForm = ({ initialData = {}, onSubmit, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    username: initialData.username || '',
    password: '',
    new_password: '',
    full_name: initialData.full_name || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    is_active: initialData.is_active !== undefined ? initialData.is_active : true,
  });
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    if (!email) return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    if (!formData.username || formData.username.length < 3) {
      setFormError('Имя пользователя должно быть ≥3 символов');
      setIsLoading(false);
      return;
    }
    if (!isEditing && (!formData.password || formData.password.length < 6)) {
      setFormError('Пароль должен быть ≥6 символов');
      setIsLoading(false);
      return;
    }
    if (isEditing && formData.new_password && formData.new_password.length < 6) {
      setFormError('Новый пароль должен быть ≥6 символов');
      setIsLoading(false);
      return;
    }
    if (!formData.full_name || formData.full_name.length < 2) {
      setFormError('ФИО должно быть ≥2 символов');
      setIsLoading(false);
      return;
    }
    if (formData.email && !validateEmail(formData.email)) {
      setFormError('Некорректный формат email');
      setIsLoading(false);
      return;
    }

    try {
      const dataToSubmit = {
        username: formData.username,
        full_name: formData.full_name,
        phone: formData.phone || null,
        email: formData.email || null,
        is_active: formData.is_active,
      };
      if (!isEditing) {
        dataToSubmit.password = formData.password;
      } else if (formData.new_password) {
        dataToSubmit.new_password = formData.new_password;
      }
      await onSubmit(dataToSubmit, setFormError);
      setFormData({
        username: isEditing ? formData.username : '',
        password: '',
        new_password: '',
        full_name: isEditing ? formData.full_name : '',
        phone: isEditing ? formData.phone : '',
        email: isEditing ? formData.email : '',
        is_active: isEditing ? formData.is_active : true,
      });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-form-container">
      <h3>{isEditing ? 'Редактировать пользователя' : 'Создать пользователя'}</h3>
      {formError && <div className="error-message">{formError}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Имя пользователя (логин)</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.trim() })}
            placeholder="Имя пользователя"
            maxLength={50}
            disabled={isLoading}
          />
        </div>
        {!isEditing && (
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
        )}
        {isEditing && (
          <div>
            <label>Новый пароль (опционально)</label>
            <input
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              placeholder="Новый пароль"
              maxLength={50}
              disabled={isLoading}
            />
          </div>
        )}
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
        <div className="checkbox-container">
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
        <div className="form-buttons">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать'}
          </button>
          <button type="button" onClick={onCancel} disabled={isLoading}>
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;