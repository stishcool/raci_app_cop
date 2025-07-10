import React, { useState, useEffect } from 'react';
import './RaciMatrix.css';

const RaciMatrix = ({ projectId }) => {
  const [stages, setStages] = useState([]);
  const [members, setMembers] = useState([]);
  const [raciRoles, setRaciRoles] = useState({});
  const [newStage, setNewStage] = useState({ title: '', status: 'planned', deadline: '', sequence: 0 });
  const [error, setError] = useState('');
  const roles = ['R', 'A', 'C', 'I'];

  useEffect(() => {
    const fetchStagesAndMembers = async () => {
      try {
        const stagesResponse = await fetch(`http://localhost:5000/projects/${projectId}/stages`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const stagesData = await stagesResponse.json();
        if (!stagesResponse.ok) {
          throw new Error(stagesData.error || 'Ошибка получения этапов');
        }
        setStages(stagesData);

        const membersResponse = await fetch(`http://localhost:5000/projects/${projectId}/members`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const membersData = await membersResponse.json();
        if (!membersResponse.ok) {
          throw new Error(membersData.error || 'Ошибка получения участников');
        }
        setMembers(membersData);

        const savedRoles = JSON.parse(localStorage.getItem(`raci_${projectId}`)) || {};
        setRaciRoles(savedRoles);
      } catch (error) {
        console.error('RaciMatrix: Ошибка:', error);
        setError(error.message);
      }
    };
    fetchStagesAndMembers();
  }, [projectId]);

  const handleRoleChange = (stageId, userId, role) => {
    const newRoles = { ...raciRoles, [`${stageId}-${userId}`]: role };
    setRaciRoles(newRoles);
    localStorage.setItem(`raci_${projectId}`, JSON.stringify(newRoles));
  };

  const handleStageTitleChange = async (stageId, newTitle) => {
    try {
      const response = await fetch(`http://localhost:5000/projects/${projectId}/stages/${stageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка обновления этапа');
      }
      setStages(stages.map(s => (s.id === stageId ? { ...s, title: newTitle } : s)));
    } catch (error) {
      console.error('RaciMatrix: Ошибка обновления этапа:', error);
      setError(error.message);
    }
  };

  const handleAddStage = async (e) => {
    e.preventDefault();
    setError('');

    if (!newStage.title.trim()) {
      setError('Название этапа обязательно');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/projects/${projectId}/stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: newStage.title,
          status: newStage.status,
          deadline: newStage.deadline || null,
          sequence: newStage.sequence || stages.length,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания этапа');
      }
      setStages([...stages, { id: data.id, title: newStage.title, status: newStage.status, deadline: newStage.deadline, sequence: newStage.sequence }]);
      setNewStage({ title: '', status: 'planned', deadline: '', sequence: 0 });
    } catch (error) {
      console.error('RaciMatrix: Ошибка создания этапа:', error);
      setError(error.message);
    }
  };

  return (
    <div className="raci-matrix">
      <h3>Фаза 1</h3>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleAddStage}>
        <div>
          <label>Новый этап</label>
          <input
            type="text"
            value={newStage.title}
            onChange={(e) => setNewStage({ ...newStage, title: e.target.value })}
            placeholder="Название этапа"
          />
        </div>
        <div>
          <label>Статус</label>
          <select
            value={newStage.status}
            onChange={(e) => setNewStage({ ...newStage, status: e.target.value })}
          >
            <option value="planned">Планируется</option>
            <option value="in_progress">В процессе</option>
            <option value="completed">Завершён</option>
          </select>
        </div>
        <div>
          <label>Дедлайн</label>
          <input
            type="datetime-local"
            value={newStage.deadline}
            onChange={(e) => setNewStage({ ...newStage, deadline: e.target.value })}
          />
        </div>
        <button type="submit">Добавить этап</button>
      </form>
      {stages.length === 0 || members.length === 0 ? (
        <p>Нет этапов или участников</p>
      ) : (
        <table className="raci-table">
          <thead>
            <tr>
              <th>Этап</th>
              {members.map(member => (
                <th key={member.user_id}>{member.full_name} ({member.username})</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stages.map(stage => (
              <tr key={stage.id}>
                <td>
                  <input
                    type="text"
                    value={stage.title}
                    onChange={(e) => handleStageTitleChange(stage.id, e.target.value)}
                    placeholder="Название этапа"
                  />
                </td>
                {members.map(member => (
                  <td key={member.user_id}>
                    <select
                      value={raciRoles[`${stage.id}-${member.user_id}`] || 'I'}
                      onChange={(e) => handleRoleChange(stage.id, member.user_id, e.target.value)}
                    >
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RaciMatrix;