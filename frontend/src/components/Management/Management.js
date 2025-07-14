import React, { useState } from 'react';
import UserForm from './UserForm';
import UserList from './UserList';
import { createUser } from '../../api/users';
import './Management.css';

const Management = ({ user }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [success, setSuccess] = useState('');

  const handleCreateUser = async (userData, setFormError) => {
    try {
      const response = await createUser(userData);
      setSuccess(response.message || 'Пользователь успешно создан');
      setTimeout(() => setSuccess(''), 3000);
      setActiveTab('list'); // Переключаемся на список после создания
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <div className="management-container">
      <h2>Управление</h2>
      <div className="tabs">
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          Создать пользователя
        </button>
        <button
          className={activeTab === 'list' ? 'active' : ''}
          onClick={() => setActiveTab('list')}
        >
          Список пользователей
        </button>
      </div>
      {success && <div className="success-message">{success}</div>}
      {activeTab === 'create' && (
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => setActiveTab('list')}
        />
      )}
      {activeTab === 'list' && <UserList />}
    </div>
  );
};

export default Management;