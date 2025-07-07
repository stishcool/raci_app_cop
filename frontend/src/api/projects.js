let mockProjects = [
  { id: 1, title: "Закупки", phases: [{ id: 1, name: "Фаза 1", stages: [{ id: 1, name: "Этап 1" }] }] },
  { id: 2, title: "Разработка", phases: [] },
  { id: 3, title: "Тестирование", phases: [] },
];

let mockNotifications = [
  { id: 1, message: "Проект 'Закупки' создан", timestamp: "2025-07-05 12:00" },
];

export const getProjects = async () => {
  return mockProjects;
};

export const createProject = async (data) => {
  const newProject = { id: mockProjects.length + 1, title: data.title, phases: [] };
  mockProjects.push(newProject);
  mockNotifications.push({ id: mockNotifications.length + 1, message: `Проект '${data.title}' создан`, timestamp: "2025-07-05 12:30" });
  return newProject;
};

export const getNotifications = async () => {
  return mockNotifications;
};

export const updateProject = async (id, data) => {
  const projectIndex = mockProjects.findIndex(p => p.id === id);
  if (projectIndex !== -1) {
    mockProjects[projectIndex] = { ...mockProjects[projectIndex], ...data };
    mockNotifications.push({ id: mockNotifications.length + 1, message: `Проект '${data.title}' обновлен`, timestamp: "2025-07-05 12:30" });
  }
  return mockProjects[projectIndex];
};