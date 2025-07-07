import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import './Profile.css';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    position: user?.position || '',
    phone: user?.phone || '',
    description: user?.description || '',
  });

  console.log('Profile: Рендеринг с пользователем:', user, 'профиль:', profile);

  if (!user) {
    console.warn('Profile: Пользователь не определен');
    return <div>Ошибка: Пользователь не авторизован</div>;
  }

  const handleSave = () => {
    console.log('Profile: Сохранение профиля:', profile);
    alert('Профиль сохранен');
  };

  const handleLogout = async () => {
    console.log('Profile: Выход из системы');
    await logout();
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="profile-container">
      <h2>Профиль</h2>
      <p>Тест: Эта страница должна отображаться</p>
      <div>
        <label>ФИО</label>
        <input
          type="text"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          disabled={!user.is_admin}
        />
      </div>
      <div>
        <label>Должность</label>
        <input
          type="text"
          value={profile.position}
          onChange={(e) => setProfile({ ...profile, position: e.target.value })}
          disabled={!user.is_admin}
        />
      </div>
      <div>
        <label>Телефон</label>
        <input
          type="text"
          value={profile.phone}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
        />
      </div>
      <div>
        <label>Описание</label>
        <textarea
          value={profile.description}
          onChange={(e) => setProfile({ ...profile, description: e.target.value })}
        />
      </div>
      <button onClick={handleSave}>Сохранить</button>
      <button onClick={handleLogout} className="logout-button">Выйти</button>
    </div>
  );
};

export default Profile;