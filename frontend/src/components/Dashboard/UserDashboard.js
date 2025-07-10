import React, { useState, useEffect } from 'react';
import { getProjects } from '../../api/projects';
import Modal from './Modal';
import ProjectForm from './ProjectForm';
import ProjectCards from './ProjectCards';
import RaciMatrix from './RaciMatrix';
import ErrorBoundary from './ErrorBoundary';
import './Dashboard.css';

const UserDashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('project');
  const [editingProject, setEditingProject] = useState(null);
  const [raciProjectId, setRaciProjectId] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('UserDashboard: Ошибка получения проектов:', error);
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  const handleCreateProject = async (projectData) => {
    try {
      const response = await fetch('http://localhost:5000/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(projectData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания проекта');
      }
      setProjects([...projects, { id: data.id, ...projectData, is_archived: false }]);
      setModalContent('raci');
      setRaciProjectId(data.id);
    } catch (error) {
      console.error('UserDashboard: Ошибка создания проекта:', error);
    }
  };

  const handleEditProject = async (updatedProject) => {
    try {
      const response = await fetch(`http://localhost:5000/projects/${updatedProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedProject),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка обновления проекта');
      }
      setProjects(projects.map(p => (p.id === updatedProject.id ? { ...p, ...updatedProject } : p)));
      setModalContent('raci');
      setRaciProjectId(updatedProject.id);
    } catch (error) {
      console.error('UserDashboard: Ошибка обновления проекта:', error);
    }
  };

  const handleArchiveProject = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:5000/projects/${projectId}/archive`, {
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
    } catch (error) {
      console.error('UserDashboard: Ошибка архивирования проекта:', error);
    }
  };

  const handleOpenProjectDetails = (project) => {
    setEditingProject(project);
    setModalContent('project');
    setIsModalOpen(true);
  };

  const handleOpenRaci = (projectId) => {
    setRaciProjectId(projectId);
    setModalContent('raci');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalContent('project');
    setEditingProject(null);
    setRaciProjectId(null);
  };

  return (
    <div className="dashboard-container">
      <h2>Дашборд</h2>
      <div className="projects-area">
        {projects.length === 0 ? (
          <p>Нет проектов</p>
        ) : (
          <ErrorBoundary>
            <ProjectCards
              projects={projects}
              onOpenDetails={handleOpenProjectDetails}
              onArchive={handleArchiveProject}
              onOpenRaci={handleOpenRaci}
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
              onSubmit={editingProject ? handleEditProject : handleCreateProject}
              initialData={editingProject}
            />
          ) : (
            <RaciMatrix projectId={raciProjectId} />
          )}
        </Modal>
      )}
    </div>
  );
};

export default UserDashboard;