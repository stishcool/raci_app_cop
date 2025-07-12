import React, { useState, useEffect } from 'react';
import { getProjects } from '../../api/projects';
import { API_URL } from '../../api/config';
import Modal from './Modal';
import ProjectForm from './ProjectForm';
import ProjectCards from './ProjectCards';
import RaciMatrix from './RaciMatrix';
import ErrorBoundary from './ErrorBoundary';
import './Dashboard.css';

const AdminDashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('project');
  const [editingProject, setEditingProject] = useState(null);
  const [raciProjectId, setRaciProjectId] = useState(null);
  const [archiveProjectId, setArchiveProjectId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
        setError('');
      } catch (error) {
        console.error('AdminDashboard: Ошибка получения проектов:', error);
        setError('Сервер недоступен, попробуйте позже');
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  const handleCreateProject = async (projectData, setFormError) => {
    try {
      setError('');
      setFormError('');
      // Создание проекта
      const projectResponse = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: projectData.title,
          description: projectData.description,
          deadline: projectData.deadline,
        }),
      });
      const projectDataResponse = await projectResponse.json();
      if (!projectResponse.ok) {
        throw new Error(projectDataResponse.error || 'Ошибка создания проекта');
      }
      // Создание первого этапа
      const stageResponse = await fetch(`${API_URL}/projects/${projectDataResponse.id}/stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: 'Этап 1',
          status: 'planned',
          sequence: 0,
          deadline: null,
        }),
      });
      const stageData = await stageResponse.json();
      if (!stageResponse.ok) {
        throw new Error(stageData.error || 'Ошибка создания первого этапа');
      }
      // Создание первой задачи
      const taskResponse = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          stage_id: stageData.id,
          title: 'Задача 1',
          description: null,
          priority: 'low',
          is_completed: false,
          deadline: null,
        }),
      });
      const taskData = await taskResponse.json();
      if (!taskResponse.ok) {
        throw new Error(taskData.error || 'Ошибка создания задачи');
      }
      // Добавление участников
      for (const userId of projectData.members) {
        const memberResponse = await fetch(`${API_URL}/projects/${projectDataResponse.id}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ user_id: userId }),
        });
        const memberData = await memberResponse.json();
        if (!memberResponse.ok) {
          throw new Error(memberData.error || 'Ошибка добавления участника');
        }
      }
      setProjects([...projects, { id: projectDataResponse.id, ...projectData, is_archived: false }]);
      setModalContent('raci');
      setRaciProjectId(projectDataResponse.id);
    } catch (error) {
      console.error('AdminDashboard: Ошибка создания проекта:', error);
      setFormError(error.message || 'Сервер недоступен, попробуйте позже');
    }
  };

  const handleEditProject = async (updatedProject, setFormError) => {
    try {
      setError('');
      setFormError('');
      const response = await fetch(`${API_URL}/projects/${updatedProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: updatedProject.title,
          description: updatedProject.description,
          deadline: updatedProject.deadline,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка обновления проекта');
      }
      const currentMembers = (await (await fetch(`${API_URL}/projects/${updatedProject.id}/members`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      })).json()).map(m => m.user_id);
      const membersToAdd = updatedProject.members.filter(id => !currentMembers.includes(id));
      const membersToRemove = currentMembers.filter(id => !updatedProject.members.includes(id));
      for (const userId of membersToAdd) {
        const memberResponse = await fetch(`${API_URL}/projects/${updatedProject.id}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ user_id: userId }),
        });
        const memberData = await memberResponse.json();
        if (!memberResponse.ok) {
          throw new Error(memberData.error || 'Ошибка добавления участника');
        }
      }
      for (const userId of membersToRemove) {
        const deleteResponse = await fetch(`${API_URL}/projects/${updatedProject.id}/members/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const deleteData = await deleteResponse.json();
        if (!deleteResponse.ok) {
          throw new Error(deleteData.error || 'Ошибка удаления участника');
        }
      }
      setProjects(projects.map(p => (p.id === updatedProject.id ? { ...p, ...updatedProject } : p)));
      setModalContent('raci');
      setRaciProjectId(updatedProject.id);
    } catch (error) {
      console.error('AdminDashboard: Ошибка обновления проекта:', error);
      setFormError(error.message || 'Сервер недоступен, попробуйте позже');
    }
  };

  const handleArchiveProject = async (projectId) => {
    try {
      setError('');
      const response = await fetch(`${API_URL}/projects/${projectId}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка архивирования проекта');
      }
      setProjects(projects.map(p => (p.id === projectId ? { ...p, is_archived: true } : p)));
      setArchiveProjectId(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('AdminDashboard: Ошибка архивирования проекта:', error);
      setError(error.message || 'Сервер недоступен, попробуйте позже');
    }
  };

  const handleOpenProjectDetails = (project) => {
    setEditingProject(project);
    setModalContent('project');
    setIsModalOpen(true);
  };

  const handleOpenRaci = (projectId) => {
    if (projectId) {
      setRaciProjectId(projectId);
      setModalContent('raci');
      setIsModalOpen(true);
    }
  };

  const handleOpenArchiveConfirm = (projectId) => {
    setArchiveProjectId(projectId);
    setModalContent('archive');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalContent('project');
    setEditingProject(null);
    setRaciProjectId(null);
    setArchiveProjectId(null);
    setError('');
  };

  return (
    <div className="dashboard-container">
      <h2>Дашборд</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="projects-area">
        {projects.length === 0 ? (
          <p>Нет проектов</p>
        ) : (
          <ErrorBoundary>
            <ProjectCards
              projects={projects}
              onOpenDetails={handleOpenProjectDetails}
              onArchive={handleOpenArchiveConfirm}
              onOpenRaci={handleOpenRaci}
              isAdmin={true}
            />
          </ErrorBoundary>
        )}
      </div>
      <button
        className="fab-create"
        onClick={() => {
          setModalContent('project');
          setEditingProject(null);
          setIsModalOpen(true);
        }}
      >
        +
      </button>
      {isModalOpen && (
        <Modal onClose={handleCloseModal}>
          {modalContent === 'project' ? (
            <ProjectForm
              onSubmit={(data, setError) => (editingProject ? handleEditProject(data, setError) : handleCreateProject(data, setError))}
              initialData={editingProject}
            />
          ) : modalContent === 'archive' ? (
            <div className="archive-confirm">
              <h3>Подтверждение архивации</h3>
              <p>Вы уверены, что хотите заархивировать проект? Он станет недоступен для редактирования.</p>
              <button onClick={() => handleArchiveProject(archiveProjectId)}>Подтвердить</button>
              <button onClick={handleCloseModal}>Отмена</button>
            </div>
          ) : (
            <RaciMatrix projectId={raciProjectId} isAdmin={true} />
          )}
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;