import api from './api';

/**
 * authService — Các hàm gọi API xác thực
 */

/**
 * Đăng nhập bằng email + mật khẩu
 *
 * POST /api/Auth/login
 * Body: { email, password }
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
 */
export const login = async (email, password) => {
  const response = await api.post('/api/Auth/login', { email, password });
  return response.data;
};

/**
 * Đăng xuất — xóa token khỏi localStorage
 */
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
};

/**
 * Lấy token đang lưu
 * @returns {string|null}
 */
export const getToken = () => localStorage.getItem('access_token');

/**
 * Kiểm tra đã đăng nhập chưa
 * @returns {boolean}
 */
export const isAuthenticated = () => !!getToken();

export const updateProfile = async (userData) => {
  const response = await api.put('/api/Auth/profile', userData);
  return response.data;
};

export { getStoredUser, getUserRole, getHomePathForCurrentUser } from '../utils/authStorage';
