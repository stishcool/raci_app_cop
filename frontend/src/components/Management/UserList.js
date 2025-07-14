import React, { useState, useEffect } from 'react';
import { getUsers, updateUser, deleteUser } from '../../api/users';
import UserForm from './UserForm';
import Modal from '../Dashboard/Modal';
import './Management.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    position: 'all',
    phone: 'all',
    search: '',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
        applyFilters(data, filters);
        setError('');
      } catch (error) {
        setError(error.message);
      }
    };
    fetchUsers();
  }, []);

  const applyFilters = (data, currentFilters) => {
    let filtered = [...data];

    if (currentFilters.status !== 'all') {
      filtered = filtered.filter(user => user.is_active === (currentFilters.status === 'active'));
    }

    if (currentFilters.position !== 'all') {
      if (currentFilters.position === 'admin') {
        filtered = filtered.filter(user => user.positions?.includes('Администратор'));
      } else if (currentFilters.position === 'no-position') {
        filtered = filtered.filter(user => !user.positions || user.positions.length === 0);
      }
    }

    if (currentFilters.phone !== 'all') {
      filtered = filtered.filter(user => currentFilters.phone === 'has-phone' ? user.phone : !user.phone);
    }

    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().startsWith(searchLower) ||
        user.full_name.toLowerCase().startsWith(searchLower) ||
        (user.email && user.email.toLowerCase().startsWith(searchLower)) ||
        (user.positions && user.positions.some(pos => pos.toLowerCase().startsWith(searchLower)))
      );
    }

    setFilteredUsers(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    applyFilters(users, newFilters);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await updateUser(userId, { is_active: !isActive });
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, is_active: !isActive } : user
      );
      setUsers(updatedUsers);
      applyFilters(updatedUsers, filters);
      setError('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdateUser = async (userData, setFormError) => {
    try {
      const response = await updateUser(editingUser.id, userData);
      const updatedUsers = users.map(user =>
        user.id === editingUser.id ? { ...user, ...userData } : user
      );
      setUsers(updatedUsers);
      applyFilters(updatedUsers, filters);
      setIsModalOpen(false);
      setEditingUser(null);
      setError('');
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <div className="user-list-container">
      <h3>Список пользователей</h3>
      {error && <div className="error-message">{error}</div>}
      <div className="filters">
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>
        <select name="position" value={filters.position} onChange={handleFilterChange}>
          <option value="all">Все должности</option>
          <option value="admin">Администраторы</option>
          <option value="no-position">Без должности</option>
        </select>
        <select name="phone" value={filters.phone} onChange={handleFilterChange}>
          <option value="all">Все телефоны</option>
          <option value="has-phone">С телефоном</option>
          <option value="no-phone">Без телефона</option>
        </select>
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Поиск по имени, ФИО, email, должности"
        />
      </div>
      {filteredUsers.length === 0 ? (
        <p>Нет пользователей</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>Имя пользователя</th>
              <th>ФИО</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.full_name}</td>
                <td>{user.email || '-'}</td>
                <td>{user.phone || '-'}</td>
                <td className="status-cell">
                  {user.is_active ? 'Активен' : 'Неактивен'}
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={user.is_active}
                      onChange={() => handleToggleActive(user.id, user.is_active)}
                    />
                    <span className="slider"></span>
                  </label>
                </td>
                <td>
                  <button onClick={() => handleEdit(user)}>Редактировать</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {isModalOpen && (
        <Modal onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}>
          <UserForm
            initialData={editingUser}
            onSubmit={handleUpdateUser}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingUser(null);
            }}
            isEditing={true}
          />
        </Modal>
      )}
    </div>
  );
};

export default UserList;