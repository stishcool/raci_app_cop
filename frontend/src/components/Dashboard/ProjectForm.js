import React, { useState, useEffect } from 'react';
import { getUsers } from '../../api/projects';
import './ProjectForm.css';

const ProjectForm = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem(`project_form_${initialData?.id || 'new'}`);
    return savedData
      ? JSON.parse(savedData)
      : {
          title: initialData?.title || '',
          description: initialData?.description || '',
          deadline: initialData?.deadline || '',
          members: initialData?.members || [],
        };
  });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        setError(error.message || 'Ошибка получения пользователей');
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    localStorage.setItem(`project_form_${initialData?.id || 'new'}`, JSON.stringify(formData));
  }, [formData, initialData?.id]);

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
      deadline: formData.deadline || null,
      members: formData.members,
    }, setError);
    localStorage.removeItem(`project_form_${initialData?.id || 'new'}`);
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
    <div className="project-form-container">
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
        <div>
          <label>Дедлайн</label>
          <input
            type="datetime-local"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            className="deadline-input"
          />
        </div>
        <div>
          <label>Участники</label>
          {users.length === 0 ? (
            <p>Нет доступных пользователей</p>
          ) : (
            <table className="members-table">
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Должность</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr
                    key={user.id}
                    className={formData.members.includes(user.id) ? 'selected' : ''}
                    onClick={() => handleMemberToggle(user.id)}
                  >
                    <td>{user.full_name}</td>
                    <td>{user.positions?.[0] || 'Нет должности'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <button type="submit">ОК</button>
      </form>
    </div>
  );
};

export default ProjectForm;