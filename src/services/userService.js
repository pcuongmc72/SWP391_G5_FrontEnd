import api from './api';

/**
 * userService — Các hàm gọi API liên quan đến User
 * Sử dụng JSONPlaceholder làm API mẫu
 */

/**
 * Lấy danh sách tất cả users
 * @returns {Promise<Array>}
 */
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

/**
 * Lấy thông tin một user theo ID
 * @param {number} id
 * @returns {Promise<object>}
 */
export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

/**
 * Tạo user mới
 * @param {object} userData - { name, email, ... }
 * @returns {Promise<object>}
 */
export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

/**
 * Cập nhật user theo ID
 * @param {number} id
 * @param {object} userData
 * @returns {Promise<object>}
 */
export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

/**
 * Xóa user theo ID
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteUser = async (id) => {
  await api.delete(`/users/${id}`);
};
