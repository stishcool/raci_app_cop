import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.positions?.includes('Администратор');
  const tabs = isAdmin
    ? ['Дашборд', 'Управление', 'Уведомления', 'Профиль']
    : ['Дашборд', 'Уведомления', 'Профиль'];

  console.log('Sidebar: Рендеринг, текущий путь:', location.pathname, 'вкладки:', tabs, 'пользователь:', user);

  const getRoute = (tab) => {
    const routeMap = {
      Дашборд: isAdmin ? '/admin' : '/',
      Управление: '/admin/management',
      Уведомления: isAdmin ? '/admin/notifications' : '/notifications',
      Профиль: isAdmin ? '/admin/profile' : '/profile',
    };
    const route = routeMap[tab] || '/';
    console.log('Sidebar: Сгенерирован маршрут для вкладки', tab, ':', route);
    return route;
  };

  return (
    <div className="sidebar">
      <div className="user-info">
        <h3>{user?.full_name || 'Неизвестный пользователь'}</h3>
        <p>{user?.positions?.[0] || 'Нет должности'}</p>
      </div>
      {tabs.map((tab) => (
        <button
          key={tab}
          className={location.pathname === getRoute(tab) ? 'active' : ''}
          onClick={() => {
            const route = getRoute(tab);
            console.log('Sidebar: Переход на вкладку:', tab, 'маршрут:', route);
            navigate(route);
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default Sidebar;