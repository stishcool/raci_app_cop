import React, { useState } from 'react';
import { createPosition } from '../../api/users';
import './Management.css';

const PositionForm = () => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!title.trim()) {
      setError('Название должности обязательно');
      return;
    }
    try {
      await createPosition(title);
      setSuccess('Должность создана');
      setTitle('');
      // Можно обновить список, но для простоты - перезагрузка страницы или useEffect в PositionList
    } catch (err) {
      setError(err.message || 'Ошибка создания');
    }
  };

  return (
    <div className="position-form">
      <h3>Создать должность</h3>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название должности"
        />
        <button type="submit">Создать</button>
      </form>
    </div>
  );
};

export default PositionForm;