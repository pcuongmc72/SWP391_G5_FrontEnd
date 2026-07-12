import api from './api';
import { normalizeData } from '../utils/dataNormalization';

/**
 * Service cho API quản lý Khóa học (Courses)
 * Base: /api/Courses
 */

/**
 * Lấy danh sách tất cả khóa học
 * GET /api/Courses
 */
export async function fetchCourses() {
  const res = await api.get('/api/Courses');
  return normalizeData(res.data);
}

export async function getUserCourses(userId, role) {
  // Backend expects lowercase role: 'student' or 'lecturer'
  const normalizedRole = role ? role.toLowerCase() : role;
  const params = { role: normalizedRole };
  const res = await api.get(`/api/Courses/user/${userId}`, { params });
  return normalizeData(res.data);
}

/**
 * Lấy chi tiết một khóa học theo ID
 * GET /api/Courses/{id}
 */
export async function fetchCourseById(id) {
  const res = await api.get(`/api/Courses/${id}`);
  return res.data;
}

/**
 * Tạo khóa học mới
 * POST /api/Courses
 * Body: { code, name, description }
 */
export async function createCourse({ code, name, description }) {
  const res = await api.post('/api/Courses', { code, name, description });
  return res.data;
}

/**
 * Cập nhật khóa học
 * PUT /api/Courses/{id}
 * Body: { code, name, description }
 */
export async function updateCourse(id, { code, name, description }) {
  const res = await api.put(`/api/Courses/${id}`, { code, name, description });
  return res.data;
}

/**
 * Xóa khóa học
 * DELETE /api/Courses/{id}
 */
export async function deleteCourse(id) {
  const res = await api.delete(`/api/Courses/${id}`);
  return res.data;
}
