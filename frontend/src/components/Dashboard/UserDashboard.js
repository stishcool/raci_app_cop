import React, { useState, useEffect } from 'react';
import { getProjects } from '../../api/projects';
import Modal from './Modal';
import ProjectCards from './ProjectCards';
import RaciMatrix from './RaciMatrix';
import ErrorBoundary from './ErrorBoundary';
import './Dashboard.css';

const UserDashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [raciProjectId, setRaciProjectId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
        setError('');
      } catch (error) {
        console.error('UserDashboard: Ошибка получения проектов:', error);
        setError('Сервер недоступен, попробуйте позже');
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  const handleOpenRaci = (projectId) => {
    if (projectId) {
      setRaciProjectId(projectId);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRaciProjectId(null);
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
              onOpenDetails={() => {}} // Пустая функция
              onArchive={() => {}} // Пустая функция
              onOpenRaci={handleOpenRaci}
              isAdmin={false}
            />
          </ErrorBoundary>
        )}
      </div>
      {isModalOpen && (
        <Modal onClose={handleCloseModal}>
          <RaciMatrix projectId={raciProjectId} isAdmin={false} />
        </Modal>
      )}
    </div>
  );
};

export default UserDashboard;