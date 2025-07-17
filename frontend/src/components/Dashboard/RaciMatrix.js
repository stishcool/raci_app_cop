import React, { useState, useEffect, useCallback } from 'react';
import { getRoles, getUsers } from '../../api/projects';
import { API_URL } from '../../api/config';
import './RaciMatrix.css';

const RaciMatrix = ({ projectId, isAdmin }) => {
  const [stages, setStages] = useState([]);
  const [currentStageId, setCurrentStageId] = useState(null);
  const [stageTitle, setStageTitle] = useState('');
  const [isStageTitleEditable, setIsStageTitleEditable] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [raciRoles, setRaciRoles] = useState({});
  const [availablePositions, setAvailablePositions] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async (stageId) => {
    try {
      if (!stageId) {
        throw new Error('Этап не выбран');
      }
      console.log('Запрос задач:', `${API_URL}/tasks?stage_id=${stageId}`);
      const tasksResponse = await fetch(`${API_URL}/tasks?stage_id=${stageId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const tasksData = await tasksResponse.json();
      if (!tasksResponse.ok) {
        throw new Error(tasksData.error || 'Ошибка получения задач');
      }
      setTasks(tasksData);
      localStorage.setItem(`tasks_${projectId}_${stageId}`, JSON.stringify(tasksData));
      const savedRoles = JSON.parse(localStorage.getItem(`raci_${projectId}_${stageId}`)) || {};
      setRaciRoles(savedRoles);
    } catch (error) {
      console.error('RaciMatrix: Ошибка загрузки задач:', error);
      const savedTasks = JSON.parse(localStorage.getItem(`tasks_${projectId}_${stageId}`)) || [];
      setTasks(savedTasks);
      setError('Не удалось загрузить задачи, работаем локально');
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setError('ID проекта не определен');
      return;
    }

    const fetchData = async () => {
      try {
        const rolesData = await getRoles();
        if (!rolesData || rolesData.length === 0) {
          throw new Error('Роли RACI не найдены');
        }
        setRoles(rolesData.map(role => ({ id: role.id, title: role.title, is_custom: role.is_custom })));

        const usersData = await getUsers();
        const positions = [...new Set(usersData.map(user => user.positions?.[0]).filter(Boolean))];
        setAvailablePositions(positions);

        const stagesResponse = await fetch(`${API_URL}/projects/${projectId}/stages`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const stagesData = await stagesResponse.json();
        if (!stagesResponse.ok) {
          throw new Error(stagesData.error || 'Ошибка получения этапов');
        }
        setStages(stagesData);
        if (stagesData.length > 0) {
          setCurrentStageId(stagesData[0].id);
          setStageTitle(stagesData[0].title);
          fetchTasks(stagesData[0].id);
        } else {
          setError('Нет этапов для проекта');
        }

        const membersResponse = await fetch(`${API_URL}/projects/${projectId}/members`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const membersData = await membersResponse.json();
        if (!membersResponse.ok) {
          throw new Error(membersData.error || 'Ошибка получения участников');
        }
        setMembers(membersData);

        const savedRoles = JSON.parse(localStorage.getItem(`raci_${projectId}_${stagesData[0]?.id || 'new'}`)) || {};
        setRaciRoles(savedRoles);
      } catch (error) {
        console.error('RaciMatrix: Ошибка:', error);
        setError(error.message || 'Сервер недоступен, попробуйте позже');
      }
    };
    fetchData();
  }, [projectId, fetchTasks]);

  useEffect(() => {
    if (currentStageId) {
      localStorage.setItem(`raci_${projectId}_${currentStageId || 'new'}`, JSON.stringify(raciRoles));
      localStorage.setItem(`tasks_${projectId}_${currentStageId || 'new'}`, JSON.stringify(tasks));
    }
  }, [raciRoles, tasks, projectId, currentStageId]);

  const handleStageChange = (e) => {
    const stageId = parseInt(e.target.value);
    setCurrentStageId(stageId);
    const stage = stages.find(s => s.id === stageId);
    setStageTitle(stage?.title || '');
    setIsStageTitleEditable(true);
    fetchTasks(stageId);
  };

  const handleStageTitleChange = (e) => {
    if (isStageTitleEditable) {
      setStageTitle(e.target.value);
    }
  };

  const handleToggleStageTitleEdit = async () => {
    if (isStageTitleEditable && stageTitle.trim()) {
      try {
        const response = await fetch(`${API_URL}/projects/${projectId}/stages/${currentStageId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ title: stageTitle }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Ошибка обновления этапа');
        }
        setStages(stages.map(s => (s.id === currentStageId ? { ...s, title: stageTitle } : s)));
        setError('');
      } catch (error) {
        console.error('RaciMatrix: Ошибка обновления этапа:', error);
        setError(error.message || 'Сервер недоступен, попробуйте позже');
      }
    }
    setIsStageTitleEditable(!isStageTitleEditable);
  };

  const handleAddStage = async () => {
    if (!isAdmin) return;
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title: `Этап ${stages.length + 1}`, status: 'planned', sequence: stages.length, deadline: null }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания этапа');
      }
      setStages([...stages, { id: data.id, title: `Этап ${stages.length + 1}`, status: 'planned', sequence: stages.length, deadline: null }]);
      setCurrentStageId(data.id);
      setStageTitle(`Этап ${stages.length + 1}`);
      setIsStageTitleEditable(true);
      setTasks([]);
    } catch (error) {
      console.error('RaciMatrix: Ошибка создания этапа:', error);
      setError(error.message || 'Сервер недоступен, попробуйте позже');
    }
  };

  const handleDeleteStage = async () => {
    if (!isAdmin) return;
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/stages/${currentStageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        throw new Error('Ошибка удаления этапа');
      }
      const newStages = stages.filter(s => s.id !== currentStageId);
      setStages(newStages);
      localStorage.removeItem(`tasks_${projectId}_${currentStageId}`);
      localStorage.removeItem(`raci_${projectId}_${currentStageId}`);
      if (newStages.length > 0) {
        setCurrentStageId(newStages[0].id);
        setStageTitle(newStages[0].title);
        fetchTasks(newStages[0].id);
      } else {
        setCurrentStageId(null);
        setStageTitle('');
        setTasks([]);
        setRaciRoles({});
      }
    } catch (error) {
      console.error('RaciMatrix: Ошибка удаления этапа:', error);
      setError(error.message || 'Сервер недоступен, попробуйте позже');
    }
  };

  const handleRoleChange = (taskId, userId, roleId) => {
    if (!isAdmin) return;
    const newRoles = { ...raciRoles, [`${taskId}-${userId}`]: roleId };
    setRaciRoles(newRoles);
    localStorage.setItem(`raci_${projectId}_${currentStageId || 'new'}`, JSON.stringify(newRoles));
  };

  const handleAddCustomRole = async () => {
    if (!isAdmin || !customRole.trim()) return;
    try {
      const newRole = { id: Date.now(), title: customRole.trim(), is_custom: true };
      setRoles([...roles, newRole]);
      setCustomRole('');
    } catch (error) {
      console.error('RaciMatrix: Ошибка добавления кастомной роли:', error);
      setError(error.message || 'Сервер недоступен, попробуйте позже');
    }
  };

  const handleTaskTitleChange = async (taskId, newTitle) => {
    if (!isAdmin) return;
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка обновления задачи');
      }
      setTasks(tasks.map(t => (t.id === taskId ? { ...t, title: newTitle } : t)));
      localStorage.setItem(`tasks_${projectId}_${currentStageId}`, JSON.stringify(tasks));
      setError('');
    } catch (error) {
      console.error('RaciMatrix: Ошибка обновления задачи:', error);
      setError(error.message || 'Сервер недоступен, попробуйте позже');
    }
  };

  const handleAddTask = async () => {
    if (!isAdmin) return;
    const newTaskTitle = `Задача ${tasks.length + 1}`;
    try {
      if (!currentStageId) {
        throw new Error('Этап не выбран');
      }
      console.log('Запрос создания задачи:', `${API_URL}/tasks`, {
        stage_id: currentStageId,
        title: newTaskTitle,
        description: null,
        priority: 'low',
        is_completed: false,
        deadline: null,
      });
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          stage_id: currentStageId,
          title: newTaskTitle,
          description: null,
          priority: 'low',
          is_completed: false,
          deadline: null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания задачи');
      }
      const newTask = { id: data.id, title: newTaskTitle, stage_id: currentStageId, priority: 'low', is_completed: false, deadline: null };
      setTasks([...tasks, newTask]);
      const newRoles = { ...raciRoles };
      members.forEach(member => {
        newRoles[`${data.id}-${member.user_id}`] = roles.find(r => r.title === 'I')?.id || roles[0]?.id;
      });
      setRaciRoles(newRoles);
      localStorage.setItem(`tasks_${projectId}_${currentStageId}`, JSON.stringify([...tasks, newTask]));
      localStorage.setItem(`raci_${projectId}_${currentStageId}`, JSON.stringify(newRoles));
      setError('');
    } catch (error) {
      console.error('RaciMatrix: Ошибка создания задачи:', error);
      const newTask = { id: Date.now(), title: newTaskTitle, stage_id: currentStageId, priority: 'low', is_completed: false, deadline: null };
      setTasks([...tasks, newTask]);
      const newRoles = { ...raciRoles };
      members.forEach(member => {
        newRoles[`${newTask.id}-${member.user_id}`] = roles.find(r => r.title === 'I')?.id || roles[0]?.id;
      });
      setRaciRoles(newRoles);
      localStorage.setItem(`tasks_${projectId}_${currentStageId}`, JSON.stringify([...tasks, newTask]));
      localStorage.setItem(`raci_${projectId}_${currentStageId}`, JSON.stringify(newRoles));
      setError('Не удалось создать задачу на сервере, сохранено локально');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!isAdmin) return;
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        throw new Error('Ошибка удаления задачи');
      }
      const newTasks = tasks.filter(t => t.id !== taskId);
      setTasks(newTasks);
      const newRoles = { ...raciRoles };
      Object.keys(newRoles).forEach(key => {
        if (key.startsWith(`${taskId}-`)) {
          delete newRoles[key];
        }
      });
      setRaciRoles(newRoles);
      localStorage.setItem(`tasks_${projectId}_${currentStageId}`, JSON.stringify(newTasks));
      localStorage.setItem(`raci_${projectId}_${currentStageId}`, JSON.stringify(newRoles));
    } catch (error) {
      console.error('RaciMatrix: Ошибка удаления задачи:', error);
      setError(error.message || 'Сервер недоступен, попробуйте позже');
    }
  };

  const handleAddPosition = async () => {
    if (!isAdmin) return;
    const newPosition = selectedPosition || `Должность ${members.length + 1}`;
    try {
      console.log('Создание пользователя:', `${API_URL}/admin/users`, { full_name: newPosition });
      const userResponse = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          username: `user_${Date.now()}`,
          password: 'temp_password', // Уточнить у бэкендера
          full_name: newPosition,
          phone: null,
          email: null,
          is_active: true,
          positions: [newPosition],
        }),
      });
      const userData = await userResponse.json();
      if (!userResponse.ok) {
        throw new Error(userData.error || 'Ошибка создания пользователя');
      }

      console.log('Добавление участника:', `${API_URL}/projects/${projectId}/members`, { user_id: userData.id });
      const memberResponse = await fetch(`${API_URL}/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ user_id: userData.id }),
      });
      const memberData = await memberResponse.json();
      if (!memberResponse.ok) {
        throw new Error(memberData.error || 'Ошибка добавления участника');
      }

      const newMember = { user_id: userData.id, full_name: newPosition, positions: [newPosition] };
      setMembers([...members, newMember]);
      const newRoles = { ...raciRoles };
      tasks.forEach(task => {
        newRoles[`${task.id}-${userData.id}`] = roles.find(r => r.title === 'I')?.id || roles[0]?.id;
      });
      setRaciRoles(newRoles);
      localStorage.setItem(`raci_${projectId}_${currentStageId || 'new'}`, JSON.stringify(newRoles));
      setSelectedPosition('');
      setError('');
    } catch (error) {
      console.error('RaciMatrix: Ошибка добавления должности:', error);
      setError(error.message || 'Сервер недоступен, попробуйте позже');
    }
  };

  const handleDeletePosition = async (userId) => {
    if (!isAdmin) return;
    try {
      console.log('Удаление участника:', `${API_URL}/projects/${projectId}/members/${userId}`);
      const response = await fetch(`${API_URL}/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        throw new Error('Ошибка удаления участника');
      }
      setMembers(members.filter(m => m.user_id !== userId));
      const newRoles = { ...raciRoles };
      Object.keys(newRoles).forEach(key => {
        if (key.endsWith(`-${userId}`)) {
          delete newRoles[key];
        }
      });
      setRaciRoles(newRoles);
      localStorage.setItem(`raci_${projectId}_${currentStageId || 'new'}`, JSON.stringify(newRoles));
      setError('');
    } catch (error) {
      console.error('RaciMatrix: Ошибка удаления участника:', error);
      setError(error.message || 'Сервер недоступен, попробуйте позже');
    }
  };

  return (
    <div className="raci-matrix">
      <h3>RACI Матрица</h3>
      {error && <div className="error-message">{error}</div>}
      {isAdmin && (
        <div className="stage-controls">
          <select
            value={currentStageId || ''}
            onChange={handleStageChange}
            disabled={isStageTitleEditable}
            className="stage-select"
          >
            <option value="">Выберите этап</option>
            {stages.map(stage => (
              <option key={stage.id} value={stage.id}>{stage.title}</option>
            ))}
          </select>
          <input
            type="text"
            value={stageTitle}
            onChange={handleStageTitleChange}
            disabled={!isStageTitleEditable}
            placeholder="Название этапа"
            className="stage-title-input"
          />
          <button
            className={isStageTitleEditable ? 'save-button' : 'edit-button'}
            onClick={handleToggleStageTitleEdit}
          >
            {isStageTitleEditable ? 'Сохранить' : 'Изменить'}
          </button>
          <button onClick={handleAddStage} className="add-stage-button">+ Этап</button>
          {stages.length > 1 && (
            <button onClick={handleDeleteStage} className="delete-stage-button">Удалить этап</button>
          )}
        </div>
      )}
      {isAdmin && (
        <div className="action-buttons">
          <button onClick={handleAddTask} className="add-task-button">+ Задача</button>
          <div className="position-controls">
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="position-select"
            >
              <option value="">Выберите должность</option>
              {availablePositions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
            <button onClick={handleAddPosition} className="add-position-button">+ Должность</button>
          </div>
          <div className="custom-role-controls">
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="Новая роль (например, X)"
              className="custom-role-input"
            />
            <button onClick={handleAddCustomRole} className="add-role-button">+ Роль</button>
          </div>
        </div>
      )}
      {tasks.length === 0 || members.length === 0 ? (
        <p className="no-data-message">Нет задач или участников</p>
      ) : (
        <table className="raci-table">
          <thead>
            <tr>
              <th>Задача</th>
              {members.map(member => (
                <th key={member.user_id}>
                  {member.full_name} ({member.positions?.[0] || 'Нет должности'})
                  {isAdmin && (
                    <button
                      className="delete-position-button"
                      onClick={() => handleDeletePosition(member.user_id)}
                    >
                      ×
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td>
                  <div className="task-row">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => handleTaskTitleChange(task.id, e.target.value)}
                      placeholder="Название задачи"
                      disabled={!isAdmin}
                      className="task-title-input"
                    />
                    {isAdmin && (
                      <button
                        className="delete-task-button"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </td>
                {members.map(member => (
                  <td key={member.user_id}>
                    <select
                      value={raciRoles[`${task.id}-${member.user_id}`] || (roles.find(r => r.title === 'I')?.id || roles[0]?.id)}
                      onChange={(e) => handleRoleChange(task.id, member.user_id, parseInt(e.target.value))}
                      disabled={!isAdmin}
                      className="role-select"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.title}</option>
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