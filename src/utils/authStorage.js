import { getDashboardPathForRole } from '../constants/roles';

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
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
