import React, { useState, useEffect } from 'react';
import { getProjects } from '../../api/projects';
import ProjectCards from './ProjectCards';
import ErrorBoundary from './ErrorBoundary';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

const UserDashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filter, setFilter] = useState('active');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
        applyFilter(data, 'active');
        setError('');
      } catch (error) {
        console.error('UserDashboard: Ошибка получения проектов:', error);
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
    }
    // Сортировка по created_at (новые сверху)
    setFilteredProjects(filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilter(value);
    applyFilter(projects, value);
  };

  const handleOpenProject = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleCreateRequest = () => {
    navigate('/project/new');
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
              onOpenDetails={() => {}}
              onArchive={() => {}}
              onOpenRaci={handleOpenProject}
              isAdmin={false}
            />
          </ErrorBoundary>
        )}
      </div>
      <button className="fab-create" onClick={handleCreateRequest}>Запросить</button>
    </div>
  );
};

export default UserDashboard;