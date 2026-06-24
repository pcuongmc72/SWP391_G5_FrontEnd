import api from './api';

/**
 * studentService — API calls dành cho Học viên (Student)
 *
 * Tất cả hàm gọi thẳng vào API thực.
 * Lỗi được ném ra (throw) để component tự xử lý và hiển thị trạng thái lỗi.
 */

/**
 * Lấy danh sách lớp học của sinh viên đang đăng nhập.
 * Endpoint: GET /api/classes/my-classes
 *
 * @param {{ academicTermId?: string, year?: string }} [params]
 */
export const getMyClasses = async (params = {}) => {
  const res = await api.get('/api/classes/my-classes', { params });
  return res.data?.data || res.data || [];
};

/**
 * Lấy danh sách tài liệu học tập của một lớp.
 * Endpoint: GET /api/materials?classId={id}
 *
 * @param {string} classId
 */
export const getMaterialsByClass = async (classId) => {
  const res = await api.get('/api/materials', { params: { classId } });
  return res.data?.data || res.data || [];
};

/**
 * Đánh dấu một tài liệu đã hoàn thành.
 * Endpoint: POST /api/materials/{materialId}/complete
 *
 * @param {string} materialId
 */
export const markMaterialComplete = async (materialId) => {
  const res = await api.post(`/api/materials/${materialId}/complete`);
  return res.data;
};

/**
 * Lấy danh sách bài tập của một lớp (kèm trạng thái nộp bài).
 * Endpoint: GET /api/assignments?classId={id}
 *
 * @param {string} classId
 */
export const getAssignmentsByClass = async (classId) => {
  const res = await api.get('/api/assignments', { params: { classId } });
  return res.data?.data || res.data || [];
};

/**
 * Lấy danh sách bài nộp của sinh viên (có thể lọc theo classId).
 * Endpoint: GET /api/submissions/my-submissions?classId={id}
 *
 * @param {string} [classId]
 */
export const getMySubmissions = async (classId) => {
  const params = classId ? { classId } : {};
  const res = await api.get('/api/submissions/my-submissions', { params });
  return res.data?.data || res.data || [];
};

/**
 * Nộp bài tập.
 * Endpoint: POST /api/submissions
 *
 * @param {{ assignmentId: string, fileName: string, studentNotes?: string }} data
 */
export const submitAssignment = async (data) => {
  const res = await api.post('/api/submissions', data);
  return res.data;
};

/**
 * Lấy điểm số lớp học của tôi.
 * Endpoint: GET /api/grades/my-classes
 */
export const getMyClassesGrades = async () => {
  const res = await api.get('/api/grades/my-classes');
  return res.data?.data || res.data || [];
};

/**
 * Lấy danh sách điểm số bài tập của lớp học.
 * Endpoint: GET /api/classes/{classId}/grades
 */
export const getClassGrades = async (classId) => {
  const res = await api.get(`/api/classes/${classId}/grades`);
  return res.data?.data || res.data || [];
};

/**
 * Lấy chi tiết điểm bài nộp.
 * Endpoint: GET /api/submissions/{submissionId}/grade-detail
 */
export const getSubmissionGradeDetail = async (submissionId) => {
  const res = await api.get(`/api/submissions/${submissionId}/grade-detail`);
  return res.data?.data || res.data || null;
};
