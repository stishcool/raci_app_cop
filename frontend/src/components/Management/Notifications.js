import React, { useState, useEffect } from 'react';
import { API_URL } from '../../api/config';
import './Notifications.css';

const Notifications = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_URL}/notifications/notifications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Ошибка загрузки уведомлений');
        }
        const data = await response.json();
        setNotifications(data);
        setError('');
      } catch (err) {
        setError(err.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ is_read: true }),
      });
      if (!response.ok) {
        throw new Error('Ошибка отметки как прочитанного');
      }
      // Локально обновляем state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      setError(err.message || 'Ошибка обновления');
    }
  };

  if (loading) {
    return (
      <div className="notifications-container">
        <h2>Уведомления</h2>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <h2>Уведомления</h2>
      {error && <div className="error-message">{error}</div>}
      {notifications.length === 0 ? (
        <p>Нет уведомлений</p>
      ) : (
        <ul className="notifications-list">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={notification.is_read ? 'read' : 'unread'}
            >
              <input
                type="checkbox"
                checked={notification.is_read}
                onChange={() => !notification.is_read && handleMarkAsRead(notification.id)} // Только если не прочитано
                disabled={notification.is_read} // Чтобы не снимать галочку
              />
              <span className="message">{notification.message}</span>
              <span className="date"> ({new Date(notification.created_at).toLocaleString()})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;