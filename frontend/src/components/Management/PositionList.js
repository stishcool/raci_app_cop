import React, { useState, useEffect } from 'react';
import { getPositions, deletePosition } from '../../api/users';
import './Management.css';

const PositionList = () => {
  const [positions, setPositions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const data = await getPositions();
        setPositions(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchPositions();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deletePosition(id);
      setPositions(positions.filter(p => p.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="position-list">
      <h3>Список должностей</h3>
      {error && <div className="error-message">{error}</div>}
      {positions.length === 0 ? (
        <p>Нет должностей</p>
      ) : (
        <ul>
          {positions.map(pos => (
            <li key={pos.id}>
              {pos.title} {pos.is_custom ? '(кастомная)' : ''}
              <button onClick={() => handleDelete(pos.id)}>Удалить</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PositionList;