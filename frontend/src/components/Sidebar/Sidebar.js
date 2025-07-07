import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ tabs, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  console.log('Sidebar: Рендеринг, текущий путь:', location.pathname, 'вкладки:', tabs, 'пользователь:', user);

  const getRoute = (tab) => {
    const routeMap = {
      'Дашборд': user.is_admin ? '/admin' : '/',
      'Управление': user.is_admin ? '/admin/management' : '/management',
      'Уведомления': user.is_admin ? '/admin/notifications' : '/notifications',
      'Профиль': user.is_admin ? '/admin/profile' : '/profile'
    };
    const route = routeMap[tab] || '/';
    console.log('Sidebar: Сгенерирован маршрут для вкладки', tab, ':', route);
    return route;
  };

  return (
    <div className="sidebar">
      <div className="user-info">
        <h3>{user?.name || 'Неизвестный пользователь'}</h3>
        <p>{user?.position || 'Нет должности'}</p>
      </div>
      {tabs.map(tab => (
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