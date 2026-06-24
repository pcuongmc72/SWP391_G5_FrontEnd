import { getDashboardPathForRole } from '../constants/roles';

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    // Chuẩn hóa ID để dùng thống nhất ở frontend
    if (user && !user.id && user.Id) user.id = user.Id;
    return user;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export const getUserRole = () => getStoredUser()?.role ?? null;

export const getHomePathForCurrentUser = () =>
  getDashboardPathForRole(getUserRole());

/**
 * API login: { success, data: { token, user } }
 */
export const parseLoginResponse = (response) => {
  const payload = response?.data ?? response;
  const token =
    payload?.token ??
    payload?.Token ??
    response?.token ??
    response?.Token;

  const user =
    payload?.user ??
    payload?.User ??
    response?.user ??
    response?.User;

  return { token, user };
};

export const persistAuth = ({ token, user }) => {
  if (token) localStorage.setItem('access_token', token);
  if (user) localStorage.setItem('user', JSON.stringify(user));
};

export const getUserDisplayName = (user) =>
  user?.fullName || user?.FullName || user?.name || user?.email || 'Người dùng';
