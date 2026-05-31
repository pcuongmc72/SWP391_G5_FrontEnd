<<<<<<< HEAD
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
=======
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getRole } from './services/authService';

// Layout
import MainLayout from './layouts/MainLayout';

// Pages
import HomePage from './pages/Home/HomePage';
import DashboardAdminPage from './pages/DashboardAdmin/DashboardAdminPage';

// Components
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

/**
 * Redirect thông minh sau khi đăng nhập theo role
 */
function RoleRedirect() {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  const role = getRole();
  if (role === 'admin') return <Navigate to="/dashboard/admin" replace />;
  // Thêm role khác ở đây khi có thêm trang
  return <Navigate to="/" replace />;
}

/**
 * Trang báo không có quyền truy cập
 */
function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      background: '#F8FAFC',
      gap: '1rem',
    }}>
      <div style={{ fontSize: '3rem' }}>🚫</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
        Không có quyền truy cập
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
        Tài khoản của bạn không có quyền vào trang này.
      </p>
      <a
        href="/"
        style={{
          marginTop: '0.5rem',
          padding: '0.6rem 1.5rem',
          background: '#0D3E26',
          color: '#fff',
          borderRadius: '0.75rem',
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: '0.875rem',
        }}
      >
        Về trang chủ
      </a>
    </div>
  );
}

/**
 * App — Component gốc
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Trang công khai (layout chứa Navbar + Footer) ── */}
        <Route element={<MainLayout />}>
>>>>>>> 5a0202d322bef30bf80ba9cbe7c846fdfde31b3d
          <Route
            path="/"
            element={
              isAuthenticated()
<<<<<<< HEAD
                ? <AuthenticatedHomeRedirect />
=======
                ? <RoleRedirect />
>>>>>>> 5a0202d322bef30bf80ba9cbe7c846fdfde31b3d
                : <HomePage />
            }
          />
          <Route
            path="/Home"
            element={
              isAuthenticated()
<<<<<<< HEAD
                ? <AuthenticatedHomeRedirect />
=======
                ? <RoleRedirect />
>>>>>>> 5a0202d322bef30bf80ba9cbe7c846fdfde31b3d
                : <HomePage />
            }
          />
        </Route>

<<<<<<< HEAD
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
=======
        {/* ── Trang Admin — chỉ role 'admin' ── */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/dashboard/admin" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/account-management" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/courses-management" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/terms-management" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/classes-management" element={<DashboardAdminPage />} />
        </Route>

        {/* ── Redirect /dashboard → trang đúng role ── */}
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* ── Không có quyền ── */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
>>>>>>> 5a0202d322bef30bf80ba9cbe7c846fdfde31b3d
    </BrowserRouter>
  );
}

export default App;
