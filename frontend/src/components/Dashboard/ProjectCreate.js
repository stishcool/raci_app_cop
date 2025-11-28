import React, { useState } from 'react';
import ProjectForm from './ProjectForm';
import { API_URL } from '../../api/config';
import { useNavigate } from 'react-router-dom';

const ProjectCreate = ({ user }) => {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isAdmin = user?.positions?.includes('Администратор');

  const handleCreateProject = async (projectData, setFormError) => {
    try {
      setError('');
      setFormError('');
      const projectResponse = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: projectData.title,
          description: projectData.description,
          // Removed status - backend sets it
        }),
      });
      const projectDataResponse = await projectResponse.json();
      if (!projectResponse.ok) {
        throw new Error(projectDataResponse.error || 'Ошибка создания проекта');
      }
      const newProjectId = projectDataResponse.id;

      // Add members
      for (const userId of projectData.members) {
        await fetch(`${API_URL}/projects/${newProjectId}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ user_id: userId }),
        });
      }

      // Create first stage
      const stageResponse = await fetch(`${API_URL}/projects/${newProjectId}/stages`, {
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

      navigate(isAdmin ? `/admin/project/${newProjectId}` : '/requests');
    } catch (error) {
      setFormError(error.message || 'Ошибка создания');
    }
  };

  return (
    <div className="project-create">
      <button onClick={() => navigate(isAdmin ? '/admin' : '/')}>Назад</button>
      <ProjectForm onSubmit={handleCreateProject} initialData={null} setError={setError} />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ProjectCreate;