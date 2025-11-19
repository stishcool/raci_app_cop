import React, { useState, useEffect } from 'react';
import ProjectForm from './ProjectForm';
import { API_URL } from '../../api/config';
import { useNavigate, useParams } from 'react-router-dom';
import './ProjectEdit.css'; 

const ProjectEdit = ({ user }) => {
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        // Загрузка проекта + членов (для initialData.members)
        const projectRes = await fetch(`${API_URL}/projects/${id}`, { 
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const projectData = await projectRes.json();
        if (!projectRes.ok) throw new Error('Ошибка загрузки проекта');

        const membersRes = await fetch(`${API_URL}/projects/${id}/members`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const membersData = await membersRes.json();
        if (!membersRes.ok) throw new Error('Ошибка загрузки членов');

        setInitialData({
          ...projectData,
          members: membersData.map(m => m.user_id),
        });
      } catch (error) {
        setError(error.message || 'Ошибка загрузки');
      }
    };
    fetchProject();
  }, [id]);

  const handleEditProject = async (projectData, setFormError) => {
    try {
      // Обновление базовых данных
      await fetch(`${API_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: projectData.title,
          description: projectData.description,
        }),
      });

      // Обновление членов: Сначала удалить всех (или diff, но просто: удалить всех, добавить новых)
      const currentMembersRes = await fetch(`${API_URL}/projects/${id}/members`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const currentMembers = await currentMembersRes.json();
      for (const member of currentMembers) {
        await fetch(`${API_URL}/projects/${id}/members/${member.user_id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
      }

      // Добавить новых
      for (const userId of projectData.members) {
        await fetch(`${API_URL}/projects/${id}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ user_id: userId }),
        });
      }

      navigate(`/admin/project/${id}`);
    } catch (error) {
      setFormError(error.message || 'Ошибка обновления');
    }
  };

  if (!initialData) return <div>Загрузка...</div>;

  return (
    <div className="project-view"> 
      <button className="back-button" onClick={() => navigate(`/admin/project/${id}`)}>
        Назад
      </button>
      <div className="project-details">
        <h2 className="project-title-highlight">Редактирование проекта</h2>
        <ProjectForm onSubmit={handleEditProject} initialData={initialData} setError={setError} />
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ProjectEdit;