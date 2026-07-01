import api from './api';

/**
 * Lấy danh sách các học kỳ (Academic Terms)
 */
export const getAcademicTerms = async () => {
    const response = await api.get('/api/AcademicTerms');
    return response.data; // Trả về { success: true, data: [...] }
};

/**
 * Lấy danh sách lớp học của sinh viên theo học kỳ
 * @param {string} academicTermId - ID của học kỳ (optional)
 */
export const getStudentClasses = async (academicTermId) => {
    const url = academicTermId
        ? `/api/student-classes?academicTermId=${academicTermId}`
        : '/api/student-classes';
    const response = await api.get(url);
    return response.data; // Trả về { success: true, data: [...] }
};

/**
 * Lấy danh sách sinh viên cùng lớp (dùng cho Student xem danh sách bạn học)
 * GET /api/student-classes/{classId}/students
 * @param {string} classId - Mã lớp học
 */
export const getClassStudents = async (classId) => {
    const response = await api.get(`/api/student-classes/${classId}/students`);
    return response.data; // Trả về { success: true, data: [...] }
};

/**
 * Lấy lộ trình học tập của sinh viên theo lớp học (nhóm theo Chapter)
 * GET /api/student-classes/{classId}/roadmap
 */
export const getStudentLearningMaterials = async (classId) => {
    const response = await api.get(`/api/student-classes/${classId}/roadmap`);
    return response.data; // Trả về { success: true, data: { classId, className, chapters: [...] } }
};

/**
 * Đánh dấu hoàn thành tài liệu học tập
 * POST /api/student-classes/materials/{materialId}/complete
 */
export const completeMaterial = async (materialId) => {
    const response = await api.post(`/api/student-classes/materials/${materialId}/complete`);
    return response.data;
};

/**
 * Hủy đánh dấu hoàn thành tài liệu học tập
 * POST /api/student-classes/materials/{materialId}/uncomplete
 */
export const uncompleteMaterial = async (materialId) => {
    const response = await api.post(`/api/student-classes/materials/${materialId}/uncomplete`);
    return response.data;
};

/**
 * Lấy danh sách bài tập của lớp kèm trạng thái nộp bài của sinh viên hiện tại
 * GET /api/student-classes/{classId}/assignments
 * @param {string} classId - Mã lớp học
 */
export const getStudentAssignments = async (classId) => {
    const response = await api.get(`/api/student-classes/${classId}/assignments`);
    return response.data; // Trả về { success: true, data: [...] }
};

/**
 * Nộp bài tập (hoặc cập nhật bài nộp nếu chưa chấm điểm)
 * POST /api/student-classes/{classId}/assignments/{assignmentId}/submit
 * @param {string} classId
 * @param {string} assignmentId
 * @param {{ fileName?: string, studentNotes?: string }} payload
 */
export const submitAssignment = async (classId, assignmentId, payload) => {
    const response = await api.post(
        `/api/student-classes/${classId}/assignments/${assignmentId}/submit`,
        payload
    );
    return response.data;
};
