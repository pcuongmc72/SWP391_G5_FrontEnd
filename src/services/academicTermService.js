import api from './api';

/**
 * Service cho API quản lý Học kỳ (AcademicTerms)
 * Base: /api/AcademicTerms
 */

/**
 * Lấy danh sách tất cả học kỳ
 * GET /api/AcademicTerms
 */
export async function fetchAcademicTerms() {
  const res = await api.get('/api/AcademicTerms');
  return res.data;
}

/**
 * Lấy chi tiết một học kỳ theo ID
 * GET /api/AcademicTerms/{id}
 */
export async function fetchAcademicTermById(id) {
  const res = await api.get(`/api/AcademicTerms/${id}`);
  return res.data;
}

/**
 * Tạo học kỳ mới
 * POST /api/AcademicTerms
 * Body: { termCode, name, startDate, endDate }
 */
export async function createAcademicTerm({ termCode, name, startDate, endDate }) {
  const res = await api.post('/api/AcademicTerms', { termCode, name, startDate, endDate });
  return res.data;
}

/**
 * Cập nhật học kỳ
 * PUT /api/AcademicTerms/{id}
 * Body: { termCode, name, startDate, endDate }
 */
export async function updateAcademicTerm(id, { termCode, name, startDate, endDate }) {
  const res = await api.put(`/api/AcademicTerms/${id}`, { termCode, name, startDate, endDate });
  return res.data;
}

/**
 * Xóa học kỳ
 * DELETE /api/AcademicTerms/{id}
 */
export async function deleteAcademicTerm(id) {
  const res = await api.delete(`/api/AcademicTerms/${id}`);
  return res.data;
}
