import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/authService';

// Layout
import MainLayout from './layouts/MainLayout';

// Pages
import HomePage      from './pages/Home/HomePage';
import DashboardPage from './pages/Dashboard/DashboardPage';

// Components
import AuthModal      from './components/AuthModal/AuthModal';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

/**
 * App — Component gốc
 */
function App() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* Trang chủ — chỉ xem được khi CHƯA đăng nhập */}
        <Route element={<MainLayout onLogin={() => setShowLogin(true)} />}>
          <Route
            path="/"
            element={
              isAuthenticated()
                ? <Navigate to="/dashboard" replace />
                : <HomePage />
            }
          />

          <Route
            path="/Home"
            element={
              isAuthenticated()
                ? <Navigate to="/dashboard" replace />
                : <HomePage />
            }
          />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/db" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Catch-all → về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Modal đăng nhập */}
      {showLogin && (
        <AuthModal onClose={() => setShowLogin(false)} />
      )}
    </BrowserRouter>
  );
}

export default App;
