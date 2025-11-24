import React, { useState, useEffect } from 'react';
import { API_URL } from '../../api/config';
import './RaciMatrix.css';

const RaciMatrix = ({ projectId, isAdmin }) => {
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [taskRaci, setTaskRaci] = useState({});
  const [raciRoles, setRaciRoles] = useState([]);
  const [error, setError] = useState('');
  const [isEditingStage, setIsEditingStage] = useState(false);
  const [stageTitle, setStageTitle] = useState('');
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [tempDeadline, setTempDeadline] = useState('');

  // Предопределенные временные интервалы
  const timePresets = [
    { label: '1 день', value: 1 },
    { label: '3 дня', value: 3 },
    { label: '1 неделя', value: 7 },
    { label: '2 недели', value: 14 },
    { label: '1 месяц', value: 30 },
    { label: '3 месяца', value: 90 },
    { label: 'Кастомная дата', value: 'custom' }
  ];

  // Загрузка этапов
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await fetch(`${API_URL}/projects/${projectId}/stages`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка загрузки этапов');
        setStages(data);
        if (data.length > 0) setSelectedStage(data[0].id);
      } catch (err) {
        setError(err.message || 'Ошибка загрузки этапов');
      }
    };
    fetchStages();
  }, [projectId]);

  // Загрузка участников проекта
  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const response = await fetch(`${API_URL}/projects/${projectId}/members`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка загрузки участников');
        setProjectMembers(data);
      } catch (err) {
        setError(err.message || 'Ошибка загрузки участников');
      }
    };
    fetchProjectMembers();
  }, [projectId]);

  // Загрузка ролей RACI
  useEffect(() => {
    const fetchRaciRoles = async () => {
      try {
        const response = await fetch(`${API_URL}/projects/roles`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка загрузки ролей');
        setRaciRoles(data);
      } catch (err) {
        setError(err.message || 'Ошибка загрузки ролей');
      }
    };
    fetchRaciRoles();
  }, []);

  // Загрузка задач при выборе этапа
  useEffect(() => {
    if (selectedStage) {
      const fetchTasks = async () => {
        try {
          const response = await fetch(`${API_URL}/tasks?stage_id=${selectedStage}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Ошибка загрузки задач');
          setTasks(data);
          
          // Загружаем RACI для каждой задачи
          await loadRaciForTasks(data);
        } catch (err) {
          setError(err.message || 'Ошибка загрузки задач');
        }
      };
      fetchTasks();
    } else {
      setTasks([]);
      setTaskRaci({});
    }
  }, [selectedStage]);

  // Функция для загрузки RACI данных для всех задач
  const loadRaciForTasks = async (tasksList) => {
    const raciData = {};
    
    for (const task of tasksList) {
      try {
        const response = await fetch(`${API_URL}/tasks/${task.id}/raci`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        if (response.ok) {
          const data = await response.json();
          raciData[task.id] = data;
        }
      } catch (err) {
        console.error(`Ошибка загрузки RACI для задачи ${task.id}:`, err);
      }
    }
    
    setTaskRaci(raciData);
  };

  // Создание этапа
  const handleCreateStage = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: 'Новый этап',
          status: 'planned',
          sequence: stages.length,
          deadline: null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка создания этапа');
      setStages([...stages, { id: data.id, title: 'Новый этап', status: 'planned' }]);
      setSelectedStage(data.id);
      setError('');
    } catch (err) {
      setError(err.message || 'Ошибка создания этапа');
    }
  };

  // Редактирование этапа
  const handleEditStage = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/stages/${selectedStage}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title: stageTitle }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка редактирования этапа');
      setStages(stages.map(s => (s.id === selectedStage ? { ...s, title: stageTitle } : s)));
      setIsEditingStage(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Ошибка редактирования этапа');
    }
  };

  // Удаление этапа
  const handleDeleteStage = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/stages/${selectedStage}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка удаления этапа');
      }
      setStages(stages.filter(s => s.id !== selectedStage));
      setSelectedStage(stages[0]?.id || null);
      setError('');
    } catch (err) {
      setError(err.message || 'Ошибка удаления этапа');
    }
  };

  // Добавление задачи
  const handleAddTask = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          stage_id: selectedStage,
          title: 'Новая задача',
          deadline: null
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка создания задачи');
      
      const tasksResponse = await fetch(`${API_URL}/tasks?stage_id=${selectedStage}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const tasksData = await tasksResponse.json();
      if (!tasksResponse.ok) throw new Error('Ошибка загрузки обновленных задач');
      
      setTasks(tasksData);
      await loadRaciForTasks(tasksData);
      setError('');
    } catch (err) {
      setError(err.message || 'Ошибка создания задачи');
    }
  };

  // Редактирование задачи
  const handleEditTask = async (taskId, title) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка редактирования задачи');
      
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, title } : task
      ));
      setError('');
    } catch (err) {
      setError(err.message || 'Ошибка редактирования задачи');
    }
  };

  // Удаление задачи
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка удаления задачи');
      
      setTasks(tasks.filter(task => task.id !== taskId));
      
      // Удаляем RACI данные для удаленной задачи
      setTaskRaci(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
      
      setError('');
    } catch (err) {
      setError(err.message || 'Ошибка удаления задачи');
    }
  };

  // Обновление RACI для конкретной задачи и пользователя
  const handleUpdateRole = async (taskId, userId, roleCode) => {
    try {
      const role = raciRoles.find(r => r.title === roleCode);
      if (!role && roleCode !== '') {
        throw new Error('Роль не найдена');
      }

      // Получаем текущие назначения для этой задачи
      const currentRaci = taskRaci[taskId] || [];
      
      let updatedAssignments;
      
      if (roleCode === '') {
        // Удаляем назначение для этого пользователя
        updatedAssignments = currentRaci
          .filter(assignment => assignment.user_id !== userId)
          .map(assignment => ({
            user_id: assignment.user_id,
            role_id: raciRoles.find(r => r.title === assignment.role)?.id
          }))
          .filter(a => a.role_id);
      } else {
        // Обновляем или добавляем назначение
        const currentAssignments = currentRaci
          .filter(a => a.user_id !== userId)
          .map(assignment => ({
            user_id: assignment.user_id,
            role_id: raciRoles.find(r => r.title === assignment.role)?.id
          }))
          .filter(a => a.role_id);

        updatedAssignments = [
          ...currentAssignments,
          { user_id: userId, role_id: role.id }
        ];
      }

      const response = await fetch(`${API_URL}/tasks/${taskId}/raci`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          assignments: updatedAssignments
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка обновления RACI');

      // Обновляем локальное состояние
      const newRaciForTask = updatedAssignments.map(a => ({
        user_id: a.user_id,
        role: raciRoles.find(r => r.id === a.role_id)?.title || ''
      }));
      
      setTaskRaci(prev => ({
        ...prev,
        [taskId]: newRaciForTask
      }));
      
      setError('');
    } catch (err) {
      console.error('RACI update error:', err);
      setError(err.message || 'Ошибка обновления RACI');
    }
  };

  // Функция для установки дедлайна
const handleSetDeadline = async (taskId, days) => {
  try {
    let newDeadline = null;
    
    if (days === 'custom') {
      // Режим кастомной даты - просто активируем редактирование
      setEditingDeadline(taskId);
      const task = tasks.find(t => t.id === taskId);
      setTempDeadline(task?.deadline || '');
      return;
    } else if (days > 0) {
      // Расчет даты на основе дней
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + days);
      deadlineDate.setHours(23, 59, 59, 999); // Конец дня
      newDeadline = deadlineDate.toISOString().split('T')[0]; // Формат YYYY-MM-DD
    }
    
    console.log('Setting deadline:', { taskId, days, newDeadline });
    
    // Обновление на сервере
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ deadline: newDeadline }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Server error:', responseData);
      throw new Error(responseData.error || `Ошибка обновления дедлайна: ${response.status}`);
    }

    // Обновление локального состояния
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, deadline: newDeadline } : task
    ));
    setEditingDeadline(null);
    setError('');
    
    console.log('Deadline updated successfully');

  } catch (err) {
    console.error('Deadline update error:', err);
    setError(err.message || 'Ошибка установки дедлайна');
  }
};

// Сохранение кастомной даты
const handleSaveCustomDeadline = async (taskId) => {
  try {
    if (!tempDeadline) {
      setError('Дата не может быть пустой');
      return;
    }

    console.log('Saving custom deadline:', { taskId, tempDeadline });
    
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ deadline: tempDeadline }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Server error:', responseData);
      throw new Error(responseData.error || `Ошибка обновления дедлайна: ${response.status}`);
    }

    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, deadline: tempDeadline } : task
    ));
    setEditingDeadline(null);
    setError('');
    
    console.log('Custom deadline saved successfully');

  } catch (err) {
    console.error('Custom deadline save error:', err);
    setError(err.message || 'Ошибка сохранения дедлайна');
  }
};

  // Форматирование даты для отображения
  const formatDeadline = (deadline) => {
    if (!deadline) return 'Без срока';
    
    const date = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    if (diffDays === -1) return 'Вчера';
    if (diffDays < 0) return `Просрочено на ${Math.abs(diffDays)} д.`;
    if (diffDays < 7) return `Осталось ${diffDays} д.`;
    if (diffDays < 30) return `Осталось ${Math.ceil(diffDays/7)} нед.`;
    
    return date.toLocaleDateString('ru-RU');
  };

  // Получение класса для стилизации просроченных задач
  const getDeadlineClass = (deadline) => {
    if (!deadline) return '';
    
    const date = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'deadline-overdue';
    if (diffDays <= 3) return 'deadline-urgent';
    if (diffDays <= 7) return 'deadline-warning';
    
    return '';
  };

  // Получение текущей роли для конкретной задачи и пользователя
  const getCurrentRole = (taskId, userId) => {
    const taskRaciData = taskRaci[taskId] || [];
    const assignment = taskRaciData.find(a => a.user_id === userId);
    return assignment ? assignment.role : '';
  };

  if (stages.length === 0) {
    return (
      <div className="no-data-message">
        <p>Нет этапов, задач или участников</p>
        {isAdmin && (
          <button className="add-stage-button" onClick={handleCreateStage}>
            Начать настройку
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="raci-matrix">
      <div className="stage-controls">
        <select
          className="stage-select"
          value={selectedStage || ''}
          onChange={(e) => setSelectedStage(e.target.value)}
          disabled={!stages.length}
        >
          {stages.map(stage => (
            <option key={stage.id} value={stage.id}>{stage.title}</option>
          ))}
        </select>
        {isAdmin && selectedStage && (
          <>
            {isEditingStage ? (
              <>
                <input
                  className="stage-title-input"
                  value={stageTitle}
                  onChange={(e) => setStageTitle(e.target.value)}
                  placeholder="Название этапа"
                />
                <button className="save-button" onClick={handleEditStage}>
                  Сохранить
                </button>
                <button className="cancel-button" onClick={() => setIsEditingStage(false)}>
                  Отмена
                </button>
              </>
            ) : (
              <button
                className="edit-button"
                onClick={() => {
                  setIsEditingStage(true);
                  setStageTitle(stages.find(s => s.id === selectedStage)?.title || '');
                }}
              >
                Редактировать этап
              </button>
            )}
            <button className="add-stage-button" onClick={handleCreateStage}>
              Добавить этап
            </button>
            <button className="delete-stage-button" onClick={handleDeleteStage}>
              Удалить этап
            </button>
          </>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {selectedStage && (
        <div className="action-buttons">
          {isAdmin && (
            <button className="add-task-button" onClick={handleAddTask}>
              Добавить задачу
            </button>
          )}
        </div>
      )}

      {selectedStage && (tasks.length > 0 || projectMembers.length > 0) ? (
        <div className="table-container">
          <table className="raci-table">
            <thead>
              <tr>
                <th>Задачи / Дедлайны</th>
                {projectMembers.map(member => (
                  <th key={member.user_id}>
                    <div className="member-header">
                      <div className="member-name">{member.full_name}</div>
                      <div className="member-username">@{member.username}</div>
                      <div className="member-positions">{member.positions?.join(', ') || 'Нет'}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <React.Fragment key={task.id}>
                  {/* Строка с названием задачи */}
                  <tr className="task-row">
                    <td className="task-title-cell">
                      {isAdmin ? (
                        <input
                          className="task-title-input"
                          value={task.title}
                          onChange={(e) => handleEditTask(task.id, e.target.value)}
                          onBlur={(e) => handleEditTask(task.id, e.target.value)}
                        />
                      ) : (
                        task.title
                      )}
                      {isAdmin && (
                        <button
                          className="delete-task-button"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          X
                        </button>
                      )}
                    </td>
                    {projectMembers.map(member => (
                      <td key={`${task.id}-${member.user_id}`}>
                        <select
                          className="role-select"
                          disabled={!isAdmin}
                          value={getCurrentRole(task.id, member.user_id)}
                          onChange={(e) => handleUpdateRole(task.id, member.user_id, e.target.value)}
                        >
                          <option value="">-</option>
                          <option value="R">R</option>
                          <option value="A">A</option>
                          <option value="C">C</option>
                          <option value="I">I</option>
                        </select>
                      </td>
                    ))}
                  </tr>
                  
                  {/* Новая строка для дедлайна */}
                  <tr className="deadline-row">
                    <td className="deadline-cell">
                      <div className="deadline-controls">
                        {editingDeadline === task.id ? (
                          <div className="custom-deadline-input">
                            <input
                              type="date"
                              value={tempDeadline}
                              onChange={(e) => setTempDeadline(e.target.value)}
                              className="date-input"
                            />
                            <button 
                              onClick={() => handleSaveCustomDeadline(task.id)}
                              className="save-deadline-btn"
                            >
                              ✓
                            </button>
                            <button 
                              onClick={() => setEditingDeadline(null)}
                              className="cancel-deadline-btn"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="deadline-display">
                            <span className={`deadline-text ${getDeadlineClass(task.deadline)}`}>
                              {formatDeadline(task.deadline)}
                            </span>
                            {isAdmin && (
                              <select
                                className="deadline-select"
                                value=""
                                onChange={(e) => handleSetDeadline(task.id, e.target.value === 'custom' ? 'custom' : parseInt(e.target.value))}
                              >
                                <option value="">Изменить срок</option>
                                {timePresets.map(preset => (
                                  <option key={preset.value} value={preset.value}>
                                    {preset.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Пустые ячейки для выравнивания */}
                    {projectMembers.map(member => (
                      <td key={`deadline-${task.id}-${member.user_id}`}></td>
                    ))}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        selectedStage && (
          <div className="no-data-message">
            <p>Нет задач или участников для этого этапа</p>
            {isAdmin && (
              <button className="add-task-button" onClick={handleAddTask}>
                Добавить задачу
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default RaciMatrix;