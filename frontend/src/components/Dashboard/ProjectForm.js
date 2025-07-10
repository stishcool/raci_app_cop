import React, { useState } from 'react';
import './ProjectForm.css';

const ProjectForm = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    deadline: initialData?.deadline || '',
  });
  const [error, setError] = useState('');

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
          />
        </div>
        <div>
          <label>Дедлайн</label>
          <input
            type="datetime-local"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>
        <button type="submit">ОК</button>
      </form>
    </div>
  );
};

export default ProjectForm;