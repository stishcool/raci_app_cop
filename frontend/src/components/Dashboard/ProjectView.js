import React, { useState, useEffect } from 'react';
import RaciMatrix from './RaciMatrix';
import { getProjects } from '../../api/projects';  
import { API_URL } from '../../api/config';  
import { useNavigate, useParams } from 'react-router-dom';
import Modal from './Modal'; 
import './ProjectView.css';

const ProjectView = ({ user, isAdmin }) => {
  const [project, setProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);  
  const navigate = useNavigate();
  const { id } = useParams();

  const fetchProjectData = async () => {
    try {
      const projectsList = await getProjects();
      const foundProject = projectsList.find(p => p.id === parseInt(id));
      if (!foundProject) throw new Error('Проект не найден');
      setProject(foundProject);

      const membersResponse = await fetch(`${API_URL}/projects/${id}/members`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!membersResponse.ok) throw new Error('Ошибка загрузки участников');
      const membersData = await membersResponse.json();
      setProjectMembers(membersData.map(m => ({
        id: m.user_id,
        full_name: m.full_name,
        positions: m.positions?.join(', ') || 'Нет должности',
      })));
    } catch (error) {
      setError(error.message || 'Ошибка загрузки данных');
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const handleDeleteMember = async (memberId) => {
    try {
      await fetch(`${API_URL}/projects/${id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      fetchProjectData();  
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || 'Ошибка удаления участника');
    }
  };

  if (!project && !error) return <div className="loading-screen">Загрузка...</div>;

  const isArchived = project?.is_archived || false;
  const currentUserId = user.id;  

  return (
    <div className="project-view">
      <button
        className="back-button"
        onClick={() => navigate(isAdmin ? '/admin' : '/')}
      >
        Назад
      </button>
      <div className="project-details">
        <h2 className="project-title-highlight">{project?.title || 'Проект'}</h2>
        <p>Описание: {project?.description || 'Без описания'}</p>
        <p>
          Статус:{' '}
          <span className={`status-chip ${isArchived ? 'archived' : 'active'}`}>
            {isArchived ? 'Заархивирован' : 'Активен'}
          </span>
        </p>
        {isAdmin && !isArchived && (
          <button
            className="edit-button"
            onClick={() => navigate(`/admin/project/${id}/edit`)}
          >
            Изменить
          </button>
        )}
        <hr className="section-divider" />
        <RaciMatrix projectId={id} isAdmin={isAdmin && !isArchived} />
      </div>
      <div className="members-sidebar">
        <h3>Участники проекта</h3>
        {isAdmin && !isArchived && (
          <button className="add-member-button" onClick={() => navigate(`/admin/project/${id}/edit`)}>
            Добавить участников
          </button>
        )}
        {projectMembers.length > 0 ? (
          <ul className="members-list">
            {projectMembers.map(member => (
              <li key={member.id}>
                {member.full_name} <span>{member.positions}</span>
                {isAdmin && !isArchived && member.id !== currentUserId && (
                  <button
                    className="delete-member-button"
                    onClick={() => setDeleteConfirm(member.id)}
                  >
                    -
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Нет участников</p>
        )}
      </div>
      {error && <div className="error-message">{error}</div>}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)}>
          <div className="confirm-delete">
            <h3>Подтверждение удаления</h3>
            <p>Вы уверены, что хотите удалить этого участника из проекта?</p>
            <button onClick={() => handleDeleteMember(deleteConfirm)}>Да</button>
            <button onClick={() => setDeleteConfirm(null)}>Нет</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProjectView;