import React from 'react';
import './ProjectCards.css';

const ProjectCards = ({ projects, onOpenDetails, onDelete }) => {
  console.log('ProjectCards: Рендеринг проектов:', projects);

  const handleCardClick = (e, project) => {
    e.stopPropagation();
    console.log('ProjectCards: Клик по карточке:', project);
    onOpenDetails(project);
  };

  const handleDeleteClick = (e, projectId) => {
    e.stopPropagation();
    console.log('ProjectCards: Удаление проекта:', projectId);
    onDelete(projectId);
  };

  return (
    <div className="project-cards">
      {projects.map(project => (
        <div
          key={project.id}
          className="project-card"
          onClick={(e) => handleCardClick(e, project)}
        >
          <h3 className="project-title">{project.name || 'Без названия'}</h3>
          <div className="project-details">
            <p><strong>Фаза:</strong> {project.phases?.[0]?.name || 'Не указана'}</p>
            <p><strong>Этап:</strong> {project.phases?.[0]?.stages?.[0] || 'Не указан'}</p>
            <p><strong>Окончание фазы:</strong> {project.phases?.[0]?.phaseEndDate || 'Не указана'}</p>
          </div>
          <button
            className="delete-button"
            onClick={(e) => handleDeleteClick(e, project.id)}
          >
            Удалить
          </button>
        </div>
      ))}
    </div>
  );
};

export default ProjectCards;