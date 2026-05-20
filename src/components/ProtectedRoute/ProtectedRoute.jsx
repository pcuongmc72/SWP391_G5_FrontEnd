import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../../services/authService';

/**
 * ProtectedRoute — Chỉ cho vào nếu đã đăng nhập
 * Nếu chưa → redirect về trang chủ (/)
 */
function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/" replace />;
}

export default ProtectedRoute;
