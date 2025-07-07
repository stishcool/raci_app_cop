import React, { useState, useEffect } from 'react';
import { getNotifications } from '../../api/projects';
import './Notifications.css';

const Notifications = ({ user }) => {
  const [notifications, setNotifications] = useState([]);

  console.log('Notifications: Рендеринг, пользователь:', user);

  useEffect(() => {
    console.log('Notifications: Получение уведомлений');
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        console.log('Notifications: Уведомления получены:', data);
        setNotifications(data);
      } catch (error) {
        console.error('Notifications: Ошибка получения уведомлений:', error);
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <div className="notifications-container">
      <h2>Уведомления</h2>
      <p>Тест: Эта страница должна отображаться</p>
      {notifications.length === 0 ? (
        <p>Новых уведомлений нет</p>
      ) : (
        <ul className="notifications-list">
          {notifications.map(n => (
            <li key={n.id}>{n.message} ({n.timestamp})</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;