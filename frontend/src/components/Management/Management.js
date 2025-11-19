import React, { useState } from 'react';
import UserForm from './UserForm';
import UserList from './UserList';
import PositionForm from './PositionForm';  // Новый компонент для должностей
import PositionList from './PositionList';  // Новый компонент для списка должностей
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
      setActiveTab('list');
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
        <button
          className={activeTab === 'positions' ? 'active' : ''}
          onClick={() => setActiveTab('positions')}
        >
          Должности
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
      {activeTab === 'positions' && (
        <div>
          <PositionForm />
          <PositionList />
        </div>
      )}
    </div>
  );
};

export default Management;