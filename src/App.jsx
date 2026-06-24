import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getRole } from './services/authService';
import { getHomePathForCurrentUser } from './utils/authStorage';
import { ROLES } from './constants/roles';

import MainLayout from './layouts/MainLayout';


import HomePage from './pages/Home/HomePage';
import DashboardPage from './pages/Dashboard/DashboardPage';

import DashboardLecturerPage from './pages/Lecturer/DashboardLecturerPage';
import DashboardAdminPage from './pages/DashboardAdmin/DashboardAdminPage';
import DashbroadStudentPage from './pages/DashbroadStudent/DashbroadStudent';


import AuthModal from './components/AuthModal/AuthModal';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute/RoleProtectedRoute';

function AuthenticatedHomeRedirect() {
  return <Navigate to={getHomePathForCurrentUser()} replace />;
}


function RoleRedirect() {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  const role = getRole();
  if (role === 'admin') return <Navigate to="/dashboard/admin" replace />;

  if (role === 'lecturer') return <Navigate to="/lecturer/dashboard" replace />;


  if (role === 'student') return <Navigate to="/dashboard/student" replace />;  // ← THÊM DÒNG NÀY

  return <Navigate to="/" replace />;
}


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

        {/* ── Trang Admin — chỉ role 'admin' ── */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/dashboard/admin" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/account-management" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/courses-management" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/terms-management" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/classes-management" element={<DashboardAdminPage />} />
        </Route>


        {/* ── Trang Lecturer — chỉ role 'lecturer' ── */}
        <Route element={<RoleProtectedRoute allowedRoles={[ROLES.LECTURER]} />}>
          <Route path="/lecturer/dashboard" element={<Navigate to="/dashboard/lecturer" replace />} />
          <Route path="/dashboard/lecturer" element={<DashboardLecturerPage />} />
          <Route path="/dashboard/lecturer/materials" element={<DashboardLecturerPage />} />
          <Route path="/dashboard/lecturer/classes-list" element={<DashboardLecturerPage />} />
          <Route path="/dashboard/lecturer/assignments" element={<DashboardLecturerPage />} />
          <Route path="/dashboard/lecturer/grading" element={<DashboardLecturerPage />} />
          <Route path="/dashboard/lecturer/feedback" element={<DashboardLecturerPage />} />
          <Route path="/dashboard/lecturer/progress" element={<DashboardLecturerPage />} />
          <Route path="/dashboard/lecturer/promotion" element={<DashboardLecturerPage />} />
        </Route>
        {/* ── Trang Student — chỉ role 'student' ── */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/dashboard/student" element={<DashbroadStudentPage />} />

        </Route>

        {/* ── Redirect /dashboard → trang đúng role ── */}
        <Route path="/dashboard" element={<AuthenticatedHomeRedirect />} />
        <Route path="/db" element={<Navigate to="/dashboard" replace />} />

        {/* ── Không có quyền ── */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      {
        showLogin && (
          <AuthModal onClose={() => setShowLogin(false)} />
        )
      }
    </BrowserRouter >
  );
}

export default App;
