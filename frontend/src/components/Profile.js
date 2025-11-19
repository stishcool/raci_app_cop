import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../api/auth';
import { getPositions } from '../api/users';
import { API_URL } from '../api/config';
import './Profile.css';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
  });
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [positionsList, setPositionsList] = useState([]);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.positions?.some(p => p.title === 'Администратор');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setProfile({
            full_name: currentUser.full_name || '',
            phone: currentUser.phone || '',
          });

          // Загружаем список должностей
          const positions = await getPositions();
          setPositionsList(positions);

          // Устанавливаем текущие должности пользователя
          const userPosIds = currentUser.positions?.map(p => p.id) || [];
          setSelectedPositions(userPosIds);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
      }
    };
    fetchData();
  }, [navigate, setUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 1. Обновляем ФИО и телефон
      const profileResponse = await fetch(`${API_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(profile),
      });

      if (!profileResponse.ok) {
        const err = await profileResponse.json();
        throw new Error(err.error || 'Ошибка обновления профиля');
      }

      // 2. Обновляем должности
      const positionsResponse = await fetch(`${API_URL}/auth/me/positions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ positions: selectedPositions }),
      });

      if (!positionsResponse.ok) {
        const err = await positionsResponse.json();
        throw new Error(err.error || 'Ошибка обновления должностей');
      }

      setSuccess('Профиль и должности обновлены');
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка смены пароля');
      setSuccess('Пароль успешно изменен');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate('/login');
  };

  const handlePositionChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
    setSelectedPositions(selected);
  };

  if (!user) return <div>Загрузка...</div>;

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
          <label>Должности (выберите свои)</label>
          <select
            multiple
            size="6"
            value={selectedPositions}
            onChange={handlePositionChange}
            className="positions-select"
          >
            {positionsList.map(pos => (
              <option key={pos.id} value={pos.id}>
                {pos.title}
              </option>
            ))}
          </select>
          <small>Удерживайте Ctrl (Cmd на Mac) для выбора нескольких</small>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить профиль'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="password-section">
        <h3>Смена пароля</h3>
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
              placeholder="Новый пароль (мин. 6 символов)"
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