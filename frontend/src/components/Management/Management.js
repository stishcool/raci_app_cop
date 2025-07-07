import React, { useState } from 'react';
import { getUsers } from '../../api/auth';
import './Management.css';

const Management = () => {
  const [users, setUsers] = useState(getUsers());
  const [newUser, setNewUser] = useState({ name: '', position: '', role: 'I', email: '', password: '', phone: '', description: '' });

  console.log('Management: Рендеринг, пользователи:', users);

  const handleAddUser = () => {
    if (!newUser.name || !newUser.position || !newUser.email) {
      console.warn('Management: Не заполнены обязательные поля');
      alert('Заполните обязательные поля: ФИО, Должность, Email');
      return;
    }
    const newId = users.length + 1;
    setUsers([...users, { id: newId, ...newUser, is_admin: false }]);
    setNewUser({ name: '', position: '', role: 'I', email: '', password: '', phone: '', description: '' });
    console.log('Management: Пользователь добавлен:', { id: newId, ...newUser });
  };

  return (
    <div className="management-container">
      <h2>Управление пользователями</h2>
      <p>Тест: Эта страница должна отображаться</p>
      <div className="management-content">
        <h3>Добавить пользователя</h3>
        <input
          type="text"
          placeholder="ФИО"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Должность"
          value={newUser.position}
          onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
        />
        <select
          value={newUser.role}
          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
        >
          <option value="R">Responsible</option>
          <option value="A">Accountable</option>
          <option value="C">Consulted</option>
          <option value="I">Informed</option>
        </select>
        <input
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
        />
        <input
          type="text"
          placeholder="Телефон"
          value={newUser.phone}
          onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
        />
        <input
          type="text"
          placeholder="Описание"
          value={newUser.description}
          onChange={(e) => setNewUser({ ...newUser, description: e.target.value })}
        />
        <button onClick={handleAddUser}>Добавить</button>
        <h3>Список пользователей</h3>
        {users.length === 0 ? (
          <p>Нет пользователей</p>
        ) : (
          <ul>
            {users.map(user => (
              <li key={user.id}>{user.name} ({user.position}, {user.role})</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Management;