import api from './api';

/**
 * classService — Các hàm gọi API liên quan đến Class (Lớp học)
 *
 * Classes:
 *   GET    /api/Classes
 *   POST   /api/Classes
 *   GET    /api/Classes/{id}
 *   PUT    /api/Classes/{id}
 *   DELETE /api/Classes/{id}
 *
 * ClassStudents:
 *   GET    /api/classes/{classId}/students
 *   POST   /api/classes/{classId}/students
 *   DELETE /api/classes/{classId}/students/{studentId}
 */

/* ── Classes ──────────────────────────────────────────────────── */

/**
 * Lấy danh sách tất cả lớp học.
 * @param {string} [termId] - Nếu truyền vào sẽ filter theo học kỳ (query param)
 */
export const getClasses = async (termId) => {
  const params = termId ? { academicTermId: termId } : {};
  const res = await api.get('/api/Classes', { params });
  return res.data;
};

/**
 * Lấy danh sách lớp học của một user cụ thể (sinh viên/giảng viên)
 * @param {string} userId
 */
export const getUserClasses = async (userId) => {
  const res = await api.get(`/api/Classes/user/${userId}`);
  return res.data;
};

/**
 * Lấy thông tin một lớp học theo ID
 * @param {string} id
 */
export const getClassById = async (id) => {
  const res = await api.get(`/api/Classes/${id}`);
  return res.data;
};

/**
 * Tạo lớp học mới
 * @param {object} classData
 */
export const createClass = async (classData) => {
  const res = await api.post('/api/Classes', classData);
  return res.data;
};

/**
 * Cập nhật lớp học theo ID
 * @param {string} id
 * @param {object} classData
 */
export const updateClass = async (id, classData) => {
  const res = await api.put(`/api/Classes/${id}`, classData);
  return res.data;
};

/**
 * Xóa lớp học theo ID
 * @param {string} id
 */
export const deleteClass = async (id) => {
  const res = await api.delete(`/api/Classes/${id}`);
  return res.data;
};

/* ── Class Students ───────────────────────────────────────────── */

/**
 * Lấy danh sách sinh viên trong một lớp
 * @param {string} classId
 */
export const getClassStudents = async (classId) => {
  const res = await api.get(`/api/classes/${classId}/students`);
  return res.data;
};

/**
 * Thêm sinh viên vào lớp học
 * @param {string} classId
 * @param {string} studentId
 */
export const addStudentToClass = async (classId, studentId) => {
  const res = await api.post(`/api/classes/${classId}/students`, { studentId });
  return res.data;
};

/**
 * Xóa sinh viên khỏi lớp học
 * @param {string} classId
 * @param {string} studentId
 */
export const removeStudentFromClass = async (classId, studentId) => {
  const res = await api.delete(`/api/classes/${classId}/students/${studentId}`);
  return res.data;
};
