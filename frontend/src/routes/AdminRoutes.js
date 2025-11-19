import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import Management from '../components/Management/Management';
import Notifications from '../components/Management/Notifications';
import Profile from '../components/Profile';

const AdminRoutes = () => (
  <Routes>
    <Route index element={<AdminDashboard />} />
    <Route path="management" element={<Management />} />
    <Route path="notifications" element={<Notifications />} />
    <Route path="profile" element={<Profile />} />
  </Routes>
);

export default AdminRoutes;