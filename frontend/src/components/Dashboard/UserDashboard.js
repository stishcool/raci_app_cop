import React from 'react';
import './Dashboard.css';

const UserDashboard = ({ user }) => {
  return (
    <div className="dashboard">
      <h1>Мои проекты</h1>
      <p>Добро пожаловать, {user.name}!</p>
      <p>Нет проектов</p>
    </div>
  );
};

export default UserDashboard;