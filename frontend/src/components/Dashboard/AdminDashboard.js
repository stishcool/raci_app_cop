import React, { useState, useEffect } from 'react';
import { getProjects } from '../../api/projects';
import { API_URL } from '../../api/config';
import ProjectCards from './ProjectCards';
import ErrorBoundary from './ErrorBoundary';
import Modal from './Modal';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filter, setFilter] = useState('active'); // Default: активные
  const [error, setError] = useState('');
  const [archiveProjectId, setArchiveProjectId] = useState(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
        applyFilter(data, 'active');
        setError('');
      } catch (error) {
        console.error('AdminDashboard: Ошибка получения проектов:', error);
        setError('Сервер недоступен, попробуйте позже');
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  const applyFilter = (data, currentFilter) => {
    let filtered = [...data];
    if (currentFilter === 'active') {
      filtered = filtered.filter(p => !p.is_archived);
    } else if (currentFilter === 'archived') {
      filtered = filtered.filter(p => p.is_archived);
    } // 'all' — все
    // Сортировка по created_at (новые сверху)
    setFilteredProjects(filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilter(value);
    applyFilter(projects, value);
  };

  const handleCreate = () => {
    navigate('/admin/project/new');
  };

  const handleOpenProject = (projectId) => {
    navigate(`/admin/project/${projectId}`);
  };

  const handleEditProject = (projectId) => {
    navigate(`/admin/project/${projectId}/edit`);
  };

  const handleOpenArchiveConfirm = (projectId) => {
    setArchiveProjectId(projectId);
    setIsArchiveModalOpen(true);
  };

  const handleArchiveProject = async (projectId) => {
    try {
      await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ is_archived: true }),
      });
      const updatedProjects = projects.map(p => p.id === projectId ? { ...p, is_archived: true } : p);
      setProjects(updatedProjects);
      applyFilter(updatedProjects, filter);
      setIsArchiveModalOpen(false);
    } catch (error) {
      setError(error.message || 'Ошибка архивации');
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Дашборд</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="filter-container">
        <label>Показать проекты:</label>
        <select value={filter} onChange={handleFilterChange}>
          <option value="active">Активные</option>
          <option value="archived">Архивные</option>
          <option value="all">Все</option>
        </select>
      </div>
      <div className="projects-area">
        {filteredProjects.length === 0 ? (
          <p>Нет проектов</p>
        ) : (
          <ErrorBoundary>
            <ProjectCards
              projects={filteredProjects}
              onOpenDetails={handleEditProject}
              onArchive={handleOpenArchiveConfirm}
              onOpenRaci={handleOpenProject}
              isAdmin={true}
            />
          </ErrorBoundary>
        )}
      </div>
      <button className="fab-create" onClick={handleCreate}>+</button>
      {isArchiveModalOpen && (
        <Modal onClose={() => setIsArchiveModalOpen(false)}>
          <div className="archive-confirm">
            <h3>Подтверждение архивации</h3>
            <p>Вы уверены, что хотите заархивировать проект? Он станет недоступен для редактирования.</p>
            <button onClick={() => handleArchiveProject(archiveProjectId)}>Подтвердить</button>
            <button onClick={() => setIsArchiveModalOpen(false)}>Отмена</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;