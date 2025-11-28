import React, { useState, useEffect } from 'react';
import { getUsers } from '../../api/projects';
import './ProjectForm.css';

const ProjectForm = ({ onSubmit, initialData, setError: setParentError }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    members: initialData?.members || [],
  });
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        const sorted = data.sort((a, b) => a.full_name.localeCompare(b.full_name)); // По алфавиту
        setUsers(sorted);
        applyFilter(sorted, '');
      } catch (error) {
        setError(error.message || 'Ошибка получения пользователей');
      }
    };
    fetchUsers();
  }, []);

  const applyFilter = (data, query) => {
    const lowerQuery = query.toLowerCase();
    const filtered = data.filter(user =>
      user.full_name.toLowerCase().includes(lowerQuery) ||
      (user.positions?.[0] || '').toLowerCase().includes(lowerQuery)
    );
    setFilteredUsers(filtered);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    applyFilter(users, value);
    setVisibleCount(5); // Сброс visible при поиске
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Название проекта обязательно');
      return;
    }

    onSubmit({
      id: initialData?.id,
      title: formData.title,
      description: formData.description || null,
      members: formData.members,
    }, setParentError || setError);
  };

  const handleMemberToggle = (userId) => {
    setFormData({
      ...formData,
      members: formData.members.includes(userId)
        ? formData.members.filter(id => id !== userId)
        : [...formData.members, userId],
    });
  };

  return (
    <div className="project-form-container flex"> {/* Flex для слева/справа */}
      <div className="form-left"> {/* Левая часть: поля */}
        <h3>{initialData ? 'Редактировать проект' : 'Создать проект'}</h3>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Название проекта</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Название проекта"
            />
          </div>
          <div>
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание проекта"
              className="description-textarea"
            />
          </div>
          <button type="submit">ОК</button>
        </form>
      </div>
      <div className="form-right"> {/* Правая часть: таблица с поиском и скроллом */}
        <label>Участники</label>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Поиск по ФИО или должности"
          className="search-input"
        />
        {filteredUsers.length === 0 ? (
          <p>Нет доступных пользователей</p>
        ) : (
          <div className="project-form-table"> {/* Фикс. высота + скролл */}
            <table className="members-table">
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Должность</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.slice(0, visibleCount).map(user => (
                  <tr
                    key={user.id}
                    className={formData.members.includes(user.id) ? 'selected' : ''}
                    onClick={() => handleMemberToggle(user.id)}
                  >
                    <td>{user.full_name}</td>
                    <td>{user.positions?.join(', ') || 'Нет должности'}</td>  {/* Изменено */}
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleCount < filteredUsers.length && (
              <button onClick={handleShowMore}>Показать больше</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectForm;