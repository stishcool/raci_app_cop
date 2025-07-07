const mockUsers = [
  { id: 1, name: "Иванов И.И.", position: "Менеджер", role: "R", is_admin: true, email: "admin@example.com", password: "admin123", phone: "1234567890", description: "Администратор системы" },
  { id: 2, name: "Петров П.П.", position: "Аналитик", role: "A", is_admin: false, email: "user1@example.com", password: "user123", phone: "0987654321", description: "Аналитик проектов" },
  { id: 3, name: "Сидоров С.С.", position: "Разработчик", role: "C", is_admin: false, email: "user2@example.com", password: "user123", phone: "1112223333", description: "Backend разработчик" },
  { id: 4, name: "Козлов К.К.", position: "Тестировщик", role: "I", is_admin: false, email: "user3@example.com", password: "user123", phone: "4445556666", description: "QA инженер" },
  { id: 5, name: "Морозов М.М.", position: "Менеджер", role: "R", is_admin: false, email: "user4@example.com", password: "user123", phone: "7778889999", description: "Менеджер проектов" },
  // ... добавлено еще 13 пользователей для достижения 18
  { id: 6, name: "Смирнов А.А.", position: "Аналитик", role: "A", is_admin: false, email: "user5@example.com", password: "user123", phone: "1112223334", description: "Бизнес-аналитик" },
  { id: 7, name: "Васильев В.В.", position: "Разработчик", role: "C", is_admin: false, email: "user6@example.com", password: "user123", phone: "1112223335", description: "Frontend разработчик" },
  { id: 8, name: "Кузнецов Н.Н.", position: "Тестировщик", role: "I", is_admin: false, email: "user7@example.com", password: "user123", phone: "1112223336", description: "Тестировщик" },
  { id: 9, name: "Попов Д.Д.", position: "Менеджер", role: "R", is_admin: false, email: "user8@example.com", password: "user123", phone: "1112223337", description: "Менеджер" },
  { id: 10, name: "Лебедев Е.Е.", position: "Аналитик", role: "A", is_admin: false, email: "user9@example.com", password: "user123", phone: "1112223338", description: "Аналитик" },
  { id: 11, name: "Соколов Ф.Ф.", position: "Разработчик", role: "C", is_admin: false, email: "user10@example.com", password: "user123", phone: "1112223339", description: "Разработчик" },
  { id: 12, name: "Волков Г.Г.", position: "Тестировщик", role: "I", is_admin: false, email: "user11@example.com", password: "user123", phone: "1112223340", description: "Тестировщик" },
  { id: 13, name: "Михайлов И.И.", position: "Менеджер", role: "R", is_admin: false, email: "user12@example.com", password: "user123", phone: "1112223341", description: "Менеджер" },
  { id: 14, name: "Федоров К.К.", position: "Аналитик", role: "A", is_admin: false, email: "user13@example.com", password: "user123", phone: "1112223342", description: "Аналитик" },
  { id: 15, name: "Павлов Л.Л.", position: "Разработчик", role: "C", is_admin: false, email: "user14@example.com", password: "user123", phone: "1112223343", description: "Разработчик" },
  { id: 16, name: "Семенов М.М.", position: "Тестировщик", role: "I", is_admin: false, email: "user15@example.com", password: "user123", phone: "1112223344", description: "Тестировщик" },
  { id: 17, name: "Григорьев Н.Н.", position: "Менеджер", role: "R", is_admin: false, email: "user16@example.com", password: "user123", phone: "1112223345", description: "Менеджер" },
  { id: 18, name: "Алексеев О.О.", position: "Аналитик", role: "A", is_admin: false, email: "user17@example.com", password: "user123", phone: "1112223346", description: "Аналитик" },
];

export const login = async (email, password) => {
  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (!user) throw new Error("Неверный email или пароль");
  localStorage.setItem("token", "mock-token");
  return true;
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return mockUsers[0]; // Для теста возвращаем админа, для пользователя можно изменить на mockUsers[1]
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getUsers = () => {
  return mockUsers;
};