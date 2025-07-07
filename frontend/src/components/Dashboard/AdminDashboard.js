import React, { useState, useEffect } from 'react';
import { getProjects } from '../../api/projects';
import Modal from './Modal';
import ProjectForm from './ProjectForm';
import ProjectCards from './ProjectCards';
import ErrorBoundary from './ErrorBoundary';
import './Dashboard.css';

const AdminDashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    console.log('AdminDashboard: Загрузка проектов');
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        console.log('AdminDashboard: Проекты получены:', data);
        // Минимальная нормализация
        const normalizedProjects = data.length > 0 ? data.map(project => ({
          id: project.id || Date.now() + Math.random(),
          name: typeof project.name === 'string' ? project.name : 'Без названия',
          description: typeof project.description === 'string' ? project.description : '',
          phases: Array.isArray(project.phases) ? project.phases.map(phase => ({
            name: typeof phase.name === 'string' ? phase.name : 'Фаза',
            stages: Array.isArray(phase.stages) ? phase.stages.filter(s => typeof s === 'string') : ['Этап 1'],
            selectedUsers: Array.isArray(phase.selectedUsers) ? phase.selectedUsers : [],
            positions: Array.isArray(phase.positions) ? phase.positions.map(pos => ({
              name: typeof pos.name === 'string' ? pos.name : 'Должность',
              users: Array.isArray(pos.users) ? pos.users.map(user => ({
                id: user.id || 0,
                name: typeof user.name === 'string' ? user.name : 'Неизвестный',
                role: typeof user.role === 'object' ? user.role : {}
              })) : []
            })) : [],
            phaseEndDate: typeof phase.phaseEndDate === 'string' ? phase.phaseEndDate : ''
          })) : [{ name: 'Фаза 1', stages: ['Этап 1'], selectedUsers: [], positions: [], phaseEndDate: '' }]
        })) : [
          {
            id: 1,
            name: 'Проект 1',
            description: 'Описание проекта 1',
            phases: [
              {
                name: 'Фаза 1',
                stages: ['Сбор требований', 'Анализ'],
                selectedUsers: [],
                positions: [],
                phaseEndDate: ''
              },
            ],
          },
          {
            id: 2,
            name: 'Проект 2',
            description: 'Описание проекта 2',
            phases: [
              {
                name: 'Фаза 1',
                stages: ['Планирование'],
                selectedUsers: [],
                positions: [],
                phaseEndDate: ''
              },
            ],
          },
        ];
        setProjects(normalizedProjects);
      } catch (error) {
        console.error('AdminDashboard: Ошибка получения проектов:', error);
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  const handleCreateProject = (newProject) => {
    console.log('AdminDashboard: Создание проекта:', newProject);
    setProjects([...projects, { id: projects.length + 1, ...newProject }]);
    setIsModalOpen(false);
  };

  const handleEditProject = (updatedProject) => {
    console.log('AdminDashboard: Обновление проекта:', updatedProject);
    setProjects(projects.map(p => (p.id === updatedProject.id ? updatedProject : p)));
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId) => {
    console.log('AdminDashboard: Удаление проекта:', projectId);
    setProjects(projects.filter(p => p.id !== projectId));
  };

  const handleOpenProjectDetails = (project) => {
    console.log('AdminDashboard: Открытие деталей проекта:', project);
    setEditingProject(project);
    setIsModalOpen(true);
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
              onDelete={handleDeleteProject}
            />
          </ErrorBoundary>
        )}
      </div>
      <button
        className="fab-create"
        onClick={() => {
          console.log('AdminDashboard: Клик по кнопке Создать');
          setEditingProject(null);
          setIsModalOpen(true);
        }}
      >
        +
      </button>
      {isModalOpen && (
        <Modal
          onClose={() => {
            console.log('AdminDashboard: Закрытие модального окна');
            setIsModalOpen(false);
            setEditingProject(null);
          }}
        >
          <ProjectForm
            onSubmit={editingProject ? handleEditProject : handleCreateProject}
            initialData={editingProject}
          />
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;