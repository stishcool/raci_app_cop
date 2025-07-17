import React from 'react';
import './ProjectCards.css';

const ProjectCards = ({ projects, onOpenDetails, onArchive, onOpenRaci, isAdmin }) => {
  // Сортировка: незархивированные проекты вверху, заархивированные внизу
  const sortedProjects = [...projects].sort((a, b) => (a.is_archived ? 1 : 0) - (b.is_archived ? 1 : 0));

  const handleCardClick = (e, project) => {
    e.stopPropagation();
    if (!project.is_archived) {
      onOpenRaci(project.id);
    }
  };

  const handleArchiveClick = (e, projectId) => {
    e.stopPropagation();
    onArchive(projectId);
  };

  const handleRaciClick = (e, projectId) => {
    e.stopPropagation();
    onOpenRaci(projectId);
  };

  const handleEditClick = (e, project) => {
    e.stopPropagation();
    onOpenDetails(project);
  };

  return (
    <div className="project-cards">
      {sortedProjects.map(project => (
        <div
          key={project.id}
          className="project-card"
          onClick={(e) => handleCardClick(e, project)}
        >
          <h3 className="project-title">{project.title}</h3>
          <div className="project-details">
            <p><strong>Описание:</strong> {project.description || 'Без описания'}</p>
            <p><strong>Дедлайн:</strong> {project.deadline || 'Не указан'}</p>
            <p><strong>Статус:</strong> {project.is_archived ? 'Заархивирован' : 'Активен'}</p>
          </div>
          {isAdmin && !project.is_archived && (
            <>
              <button
                className="archive-button"
                onClick={(e) => handleArchiveClick(e, project.id)}
              >
                Архивировать
              </button>
              <button
                className="edit-button"
                onClick={(e) => handleEditClick(e, project)}
              >
                Изменить
              </button>
            </>
          )}
          <button
            className="raci-button"
            onClick={(e) => handleRaciClick(e, project.id)}
          >
            RACI
          </button>
        </div>
      ))}
    </div>
  );
};

export default ProjectCards;