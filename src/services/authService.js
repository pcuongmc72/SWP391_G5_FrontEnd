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

/**
 * Lấy thông tin user đang lưu
 * @returns {object|null}
 */
export const getUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    // Chuẩn hóa ID để dùng thống nhất ở frontend
    if (user && !user.id && user.Id) user.id = user.Id;
    return user;
  } catch {
    return null;
  }
};

/**
 * Lấy role của user đang đăng nhập
 * Hỗ trợ các field: role, Role, roles (array), userRole
 * @returns {string|null}
 */
export const getRole = () => {
  const user = getUser();
  if (!user) return null;
  // Hỗ trợ nhiều cấu trúc API trả về
  const raw =
    user.role ??
    user.Role ??
    user.userRole ??
    (Array.isArray(user.roles) ? user.roles[0] : null);
  return raw ? String(raw).toLowerCase() : null;
};
