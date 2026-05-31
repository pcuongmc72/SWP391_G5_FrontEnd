import api from './api';

/**
 * userService — Các hàm gọi API liên quan đến User
 * Đã kết nối với backend /api/Users thực tế
 */

/**
 * Lấy danh sách tất cả users
 * @returns {Promise<Array>}
 */
export const getUsers = async () => {
  const response = await api.get('/api/Users');
  return response.data;
};

/**
 * Lấy thông tin một user theo ID
 * @param {string|number} id
 * @returns {Promise<object>}
 */
export const getUserById = async (id) => {
  const response = await api.get(`/api/Users/${id}`);
  return response.data;
};

/**
 * Tạo user mới
 * @param {object} userData - { name, email, ... }
 * @returns {Promise<object>}
 */
export const createUser = async (userData) => {
  const response = await api.post('/api/Users', userData);
  return response.data;
};

/**
 * Cập nhật user theo ID
 * @param {string|number} id
 * @param {object} userData
 * @returns {Promise<object>}
 */
export const updateUser = async (id, userData) => {
  const response = await api.put(`/api/Users/${id}`, userData);
  return response.data;
};

