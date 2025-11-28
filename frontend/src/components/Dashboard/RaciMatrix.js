import React, { useState, useEffect } from 'react';
import { API_URL } from '../../api/config';
import Modal from '../Dashboard/Modal'; // Предполагая, что Modal из Dashboard
import './RaciMatrix.css';

const RaciMatrix = ({ projectId, isAdmin }) => {
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [taskRaci, setTaskRaci] = useState({}); // { taskId: [{user_id, role}] }
  const [raciRoles, setRaciRoles] = useState([]);
  const [error, setError] = useState('');
  const [isEditingStage, setIsEditingStage] = useState(false);
  const [stageTitle, setStageTitle] = useState('');

  // Новый: для добавления/редактирования задач с дедлайном
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  // Для файлов
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedTaskIdForFiles, setSelectedTaskIdForFiles] = useState(null);
  const [taskFiles, setTaskFiles] = useState([]); // Список файлов для выбранной задачи
  const [fileUploadError, setFileUploadError] = useState('');

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
          const response = await fetch(`${API_URL}/tasks/${selectedStage}/tasks`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Ошибка загрузки задач');
          setTasks(data);
        } catch (err) {
          setError(err.message || 'Ошибка загрузки задач');
        }
      };
      fetchTasks();
    }
  }, [selectedStage]);

  // Загрузка RACI для задач (если нужно, но по коду кажется не используется напрямую)

  const handleAddStage = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title: stageTitle || 'Новый этап' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка создания этапа');
      setStages([...stages, { id: data.id, title: stageTitle || 'Новый этап' }]);
      setStageTitle('');
      setIsEditingStage(false);
    } catch (err) {
      setError(err.message || 'Ошибка создания этапа');
    }
  };

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
          title: newTaskTitle,
          deadline: newTaskDeadline || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка создания задачи');
      setTasks([...tasks, { id: data.id, title: newTaskTitle, deadline: newTaskDeadline }]);
      setNewTaskTitle('');
      setNewTaskDeadline('');
    } catch (err) {
      setError(err.message || 'Ошибка создания задачи');
    }
  };

  const handleEditTask = async (taskId, newTitle, newDeadline) => {
    try {
      await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title: newTitle, deadline: newDeadline }),
      });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, title: newTitle, deadline: newDeadline } : t));
    } catch (err) {
      setError(err.message || 'Ошибка обновления задачи');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      setError(err.message || 'Ошибка удаления задачи');
    }
  };

  const getCurrentRole = (taskId, userId) => {
    // Логика получения текущей роли, если есть taskRaci
    return ''; // Заглушка
  };

  const handleUpdateRole = (taskId, userId, role) => {
    // Логика обновления роли
  };

  // Новые функции для файлов

  const openFileModal = async (taskId) => {
    setSelectedTaskIdForFiles(taskId);
    await fetchTaskFiles(taskId);
    setIsFileModalOpen(true);
  };

  const fetchTaskFiles = async (taskId) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}/files`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка загрузки файлов');
      setTaskFiles(data);
    } catch (err) {
      setFileUploadError(err.message || 'Ошибка загрузки файлов');
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/tasks/${selectedTaskIdForFiles}/files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка загрузки файла');
      await fetchTaskFiles(selectedTaskIdForFiles); // Обновить список
      setFileUploadError('');
    } catch (err) {
      setFileUploadError(err.message || 'Ошибка загрузки файла');
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await fetch(`${API_URL}/tasks/${selectedTaskIdForFiles}/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      await fetchTaskFiles(selectedTaskIdForFiles); // Обновить список
    } catch (err) {
      setFileUploadError(err.message || 'Ошибка удаления файла');
    }
  };

  const handleDownloadFile = async (fileId, filename) => {
    try {
      const response = await fetch(`${API_URL}/tasks/files/${fileId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        throw new Error(`Ошибка скачивания: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setFileUploadError(err.message || 'Ошибка скачивания файла');
    }
  };

  return (
    <div className="raci-matrix">
      <select value={selectedStage || ''} onChange={(e) => setSelectedStage(parseInt(e.target.value))}>
        {stages.map(stage => (
          <option key={stage.id} value={stage.id}>{stage.title}</option>
        ))}
      </select>
      {isAdmin && (
        <button onClick={() => setIsEditingStage(true)}>Добавить этап</button>
      )}
      {isEditingStage && (
        <div>
          <input
            type="text"
            value={stageTitle}
            onChange={(e) => setStageTitle(e.target.value)}
            placeholder="Название этапа"
          />
          <button onClick={handleAddStage}>Сохранить</button>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
      {tasks.length > 0 && projectMembers.length > 0 ? (
        <div className="matrix-table-container">
          <table className="raci-table">
            <thead>
              <tr>
                <th>Задача</th>
                {projectMembers.map(member => (
                  <th key={member.user_id}>{member.full_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>
                    {isAdmin ? (
                      <>
                        <input
                          type="text"
                          className="task-title-input"
                          value={task.title}
                          onChange={(e) => handleEditTask(task.id, e.target.value, task.deadline)}
                          onBlur={(e) => handleEditTask(task.id, e.target.value, task.deadline)}
                        />
                        <input
                          type="date"
                          className="task-deadline-input"
                          value={task.deadline || ''}
                          onChange={(e) => handleEditTask(task.id, task.title, e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        {task.title}
                        {task.deadline && <span> (Дедлайн: {task.deadline})</span>}
                      </>
                    )}
                    {isAdmin && (
                      <button
                        className="delete-task-button"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        X
                      </button>
                    )}
                    <button
                      className="files-button"
                      onClick={() => openFileModal(task.id)}
                    >
                      Файлы
                    </button>
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
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        selectedStage && (
          <div className="no-data-message">
            <p>Нет задач или участников для этого этапа</p>
            {isAdmin && (
              <div>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Название задачи"
                />
                <input
                  type="date"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                  placeholder="Дедлайн"
                />
                <button className="add-task-button" onClick={handleAddTask}>
                  Добавить задачу
                </button>
              </div>
            )}
          </div>
        )
      )}
      {isFileModalOpen && (
        <Modal onClose={() => setIsFileModalOpen(false)}>
          <div className="file-modal">
            <h3>Файлы задачи</h3>
            {fileUploadError && <div className="error-message">{fileUploadError}</div>}
            <input type="file" onChange={handleUploadFile} />
            <ul>
              {taskFiles.map(file => (
                <li key={file.id}>
                  <button onClick={() => handleDownloadFile(file.id, file.filename)}>
                    {file.filename}
                  </button>
                  <span> (Загружен: {file.uploaded_at} by {file.uploaded_by})</span>
                  {isAdmin && (
                    <button onClick={() => handleDeleteFile(file.id)}>Удалить</button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RaciMatrix;