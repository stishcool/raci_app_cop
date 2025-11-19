import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserDashboard from '../components/Dashboard/UserDashboard';
import Notifications from '../components/Management/Notifications';
import Profile from '../components/Profile';

const UserRoutes = () => (
  <Routes>
    <Route index element={<UserDashboard />} />
    <Route path="notifications" element={<Notifications />} />
    <Route path="profile" element={<Profile />} />
  </Routes>
);

export default UserRoutes;