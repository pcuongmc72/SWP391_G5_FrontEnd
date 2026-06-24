import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../../services/authService';
import { normalizeRole, ROLES } from '../../constants/roles';
import { getHomePathForCurrentUser, getUserRole } from '../../utils/authStorage';

/**
 * Chỉ cho phép user đã đăng nhập và có role khớp (mặc định: lecturer).
 */
function RoleProtectedRoute({ allowedRoles = [ROLES.LECTURER] }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const role = normalizeRole(getUserRole());
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  if (!normalizedAllowed.includes(role)) {
    return <Navigate to={getHomePathForCurrentUser()} replace />;
  }

  return <Outlet />;
}

export default RoleProtectedRoute;
