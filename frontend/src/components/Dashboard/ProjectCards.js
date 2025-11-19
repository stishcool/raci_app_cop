import React from 'react';
import './ProjectCards.css';

const ProjectCards = ({ projects, onOpenDetails, onArchive, onOpenRaci, isAdmin }) => {
  const sortedProjects = [...projects].sort((a, b) => (a.is_archived ? 1 : 0) - (b.is_archived ? 1 : 0));

  return (
    <div className="project-cards">
      {sortedProjects.map(project => (
        <div
          key={project.id}
          className="project-card"
          onClick={() => onOpenRaci(project.id)}
        >
          <h3 className="project-title">{project.title}</h3>
          <div className="project-details">
            <p><strong>Описание:</strong> {project.description || 'Без описания'}</p>
            <p><strong>Статус:</strong> {project.is_archived ? 'Заархивирован' : 'Активен'}</p>
          </div>
          {isAdmin && !project.is_archived && (
            <>
              <button
                className="archive-button"
                onClick={(e) => { e.stopPropagation(); onArchive(project.id); }}
              >
                Архивировать
              </button>
              <button
                className="edit-button"
                onClick={(e) => { e.stopPropagation(); onOpenDetails(project.id); }}
              >
                Изменить
              </button>
            </>
          )}
          <button
            className="raci-button"
            onClick={(e) => { e.stopPropagation(); onOpenRaci(project.id); }}
          >
            RACI
          </button>
        </div>
      ))}
    </div>
  );
};

export default ProjectCards;