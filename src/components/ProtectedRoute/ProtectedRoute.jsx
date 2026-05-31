import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getRole } from '../../services/authService';

/**
 * ProtectedRoute — Bảo vệ route theo trạng thái đăng nhập và role
 *
 * Props:
 *   allowedRoles {string[]} — danh sách role được phép truy cập (lowercase).
 *                             Nếu không truyền → chỉ cần đăng nhập là đủ.
 *
 * Hành vi:
 *   - Chưa đăng nhập          → redirect về /
 *   - Đăng nhập nhưng sai role → redirect về /unauthorized
 *   - Hợp lệ                  → render <Outlet />
 */
function ProtectedRoute({ allowedRoles }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = getRole();
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
}

export default ProtectedRoute;
