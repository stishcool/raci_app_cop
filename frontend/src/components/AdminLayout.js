import React from 'react';
import Sidebar from './Sidebar/Sidebar';
import { Outlet } from 'react-router-dom';
import '../styles/layout.css';

const AdminLayout = ({ user, setUser }) => {
  const tabs = ['Дашборд', 'Управление', 'Уведомления', 'Профиль'];

  console.log('AdminLayout: Рендеринг с пользователем:', user, 'вкладки:', tabs);

  if (!user) {
    console.warn('AdminLayout: Пользователь не определен');
    return <div>Ошибка: Пользователь не авторизован</div>;
  }

  return (
    <div className="app-container">
      <Sidebar tabs={tabs} user={user} />
      <div className="main-content">
        <Outlet context={{ user, setUser }} />
      </div>
    </div>
  );
};

export default AdminLayout;