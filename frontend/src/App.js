import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import AdminLayout from './components/AdminLayout';
import UserLayout from './components/UserLayout';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import UserDashboard from './components/Dashboard/UserDashboard';
import Management from './components/Management/Management';
import Notifications from './components/Management/Notifications';
import Profile from './components/Profile';
import ProjectCreate from './components/Dashboard/ProjectCreate'; // Новый
import ProjectEdit from './components/Dashboard/ProjectEdit'; // Новый
import ProjectView from './components/Dashboard/ProjectView'; // Новый для просмотра/RACI
import Requests from './components/Requests/Requests'; // Новый импорт для Запросов
import { getCurrentUser, logout } from './api/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App: Проверка статуса авторизации');
    const checkAuthStatus = async () => {
      try {
        const userData = await getCurrentUser();
        console.log('App: Пользователь получен:', userData);
        setUser(userData);
      } catch (error) {
        console.error('App: Ошибка получения пользователя:', error);
        await logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  if (loading) {
    console.log('App: Загрузка...');
    return <div>Загрузка...</div>;
  }

  console.log('App: Рендеринг, пользователь:', user);

  const isAdmin = user?.positions?.includes('Администратор');

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={isAdmin ? '/admin' : '/'} /> : <Login setUser={setUser} />}
        />
        <Route
          path="/admin"
          element={user && isAdmin ? <AdminLayout user={user} setUser={setUser} /> : <Navigate to="/login" />}
        >
          <Route index element={<AdminDashboard user={user} />} />
          <Route path="management" element={<Management />} />
          <Route path="requests" element={<Requests user={user} />} /> {/* Новый маршрут для админа */}
          <Route path="notifications" element={<Notifications user={user} />} />
          <Route path="profile" element={<Profile user={user} setUser={setUser} />} />
          <Route path="project/new" element={<ProjectCreate user={user} />} /> {/* Фрейм создания */}
          <Route path="project/:id" element={<ProjectView user={user} isAdmin={true} />} /> {/* Просмотр/RACI */}
          <Route path="project/:id/edit" element={<ProjectEdit user={user} />} /> {/* Редактирование */}
        </Route>
        <Route
          path="/"
          element={user && !isAdmin ? <UserLayout user={user} setUser={setUser} /> : <Navigate to="/login" />}
        >
          <Route index element={<UserDashboard user={user} />} />
          <Route path="requests" element={<Requests user={user} />} /> {/* Новый маршрут для юзера */}
          <Route path="notifications" element={<Notifications user={user} />} />
          <Route path="profile" element={<Profile user={user} setUser={setUser} />} />
          <Route path="project/new" element={<ProjectCreate user={user} />} /> {/* Новый маршрут для создания запроса юзером */}
          <Route path="project/:id" element={<ProjectView user={user} isAdmin={false} />} /> {/* Только просмотр для юзера */}
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;