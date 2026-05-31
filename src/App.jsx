import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getRole } from './services/authService';

// Layout
import MainLayout from './layouts/MainLayout';

// Pages
import HomePage from './pages/Home/HomePage';
import DashboardAdminPage from './pages/DashboardAdmin/DashboardAdminPage';
import DashbroadStudentPage from './pages/DashbroadStudent/DashbroadStudent';

// Components
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import SharedBlogForum from './components/SharedBlogForum/SharedBlogForum';

/**
 * Redirect thông minh sau khi đăng nhập theo role
 */
function RoleRedirect() {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  const role = getRole();
  if (role === 'admin') return <Navigate to="/dashboard/admin" replace />;
  if (role === 'student') return <Navigate to="/dashboard/student" replace />;

  // Thêm role khác ở đây khi có thêm trang
  return <HomePage />;
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
          <Route
            path="/"
            element={
              isAuthenticated()
                ? <RoleRedirect />
                : <HomePage />
            }
          />
          <Route
            path="/Home"
            element={
              isAuthenticated()
                ? <RoleRedirect />
                : <HomePage />
            }
          />
          <Route path="/blog" element={<SharedBlogForum />} />
        </Route>

        {/* ── Trang Admin — chỉ role 'admin' ── */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/dashboard/admin" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/account-management" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/courses-management" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/terms-management" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/classes-management" element={<DashboardAdminPage />} />
          <Route path="/dashboard/admin/blogs-management" element={<DashboardAdminPage />} />
        </Route>

        {/* ── Trang Student — chỉ role 'student' ── */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/dashboard/student" element={<DashbroadStudentPage />} />
          <Route path="/dashboard/student/materials" element={<DashbroadStudentPage />} />
          <Route path="/dashboard/student/submissions" element={<DashbroadStudentPage />} />
          <Route path="/dashboard/student/grades" element={<DashbroadStudentPage />} />
          <Route path="/dashboard/student/forum" element={<DashbroadStudentPage />} />
        </Route>

        {/* ── Redirect /dashboard → trang đúng role ── */}
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* ── Không có quyền ── */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
