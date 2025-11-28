import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../api/auth';
import { API_URL } from '../api/config'; // Добавил import
import './Profile.css';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    position: '',
  });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isAdmin = user?.positions?.includes('Администратор');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setProfile({
            full_name: currentUser.full_name || '',
            phone: currentUser.phone || '',
            position: currentUser.positions?.[0] || 'Нет должности',
          });
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Profile: Ошибка получения данных пользователя:', error);
      }
    };
    fetchUser();
  }, [navigate, setUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/auth/me`, { // Или /admin/users/:id если для админа, но по коду /auth/me для текущего
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(profile),
      });
      if (!response.ok) throw new Error('Ошибка обновления');
      setSuccess('Профиль обновлён');
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword || !newPassword) {
      setError('Введите оба пароля');
      return;
    }

    if (newPassword.length < 6) {
      setError('Новый пароль должен быть не менее 6 символов');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, { // Заменил URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка смены пароля');
      }
      setSuccess('Пароль успешно изменен');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Profile: Ошибка выхода:', error);
    }
  };

  if (!user) {
    return <div>Ошибка: Пользователь не авторизован</div>;
  }

  return (
    <div className="profile-container">
      <h2>Профиль</h2>
      <form onSubmit={handleUpdateProfile}>
        <div>
          <label>ФИО</label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            disabled={false} // Всегда editable для юзера/админа по ТЗ
          />
        </div>
        <div>
          <label>Должность</label>
          <input
            type="text"
            value={profile.position}
            onChange={(e) => setProfile({ ...profile, position: e.target.value })}
            disabled={!isAdmin} // Disabled для юзера
          />
        </div>
        <div>
          <label>Телефон</label>
          <input
            type="text"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            disabled={false} // Editable для всех
          />
        </div>
        <button type="submit">Сохранить изменения</button>
      </form>
      <div>
        <h3>Смена пароля</h3>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleChangePassword}>
          <div>
            <label>Старый пароль</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Старый пароль"
            />
          </div>
          <div>
            <label>Новый пароль</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Новый пароль"
            />
          </div>
          <button type="submit">Сменить пароль</button>
        </form>
      </div>
      <button onClick={handleLogout} className="logout-button">
        Выйти
      </button>
    </div>
  );
};

export default Profile;