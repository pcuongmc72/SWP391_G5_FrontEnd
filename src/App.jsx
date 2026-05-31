import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/authService';
import { getHomePathForCurrentUser } from './utils/authStorage';
import { ROLES } from './constants/roles';

import MainLayout from './layouts/MainLayout';
import LecturerLayout from './layouts/LecturerLayout/LecturerLayout';

import HomePage from './pages/Home/HomePage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import LecturerDashboardPage from './pages/Lecturer/LecturerDashboardPage';
import LecturerSchedulePage from './pages/Lecturer/LecturerSchedulePage';

import AuthModal from './components/AuthModal/AuthModal';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute/RoleProtectedRoute';

function AuthenticatedHomeRedirect() {
  return <Navigate to={getHomePathForCurrentUser()} replace />;
}

function App() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout onLogin={() => setShowLogin(true)} />}>
          <Route
            path="/"
            element={
              isAuthenticated()
                ? <AuthenticatedHomeRedirect />
                : <HomePage />
            }
          />
          <Route
            path="/Home"
            element={
              isAuthenticated()
                ? <AuthenticatedHomeRedirect />
                : <HomePage />
            }
          />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/db" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={[ROLES.LECTURER]} />}>
          <Route element={<LecturerLayout />}>
            <Route path="/lecturer/dashboard" element={<LecturerDashboardPage />} />
            <Route path="/lecturer/classes" element={<LecturerSchedulePage />} />
            <Route path="/lecturer/classes/:classId" element={<LecturerSchedulePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showLogin && (
        <AuthModal onClose={() => setShowLogin(false)} />
      )}
    </BrowserRouter>
  );
}

export default App;
