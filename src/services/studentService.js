import api from './api';
import { uploadFileToCloudinary } from './cloudinaryService';


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

/**
 * Tải file lên đám mây thông qua Cloudinary (đồng bộ cơ chế với Lecturer)
 * @param {File} file - Đối tượng file cần tải lên
 */
export const uploadFile = async (file) => {
    const res = await uploadFileToCloudinary(file);
    return {
        data: {
            url: res.url,
            fileName: file.name,
            size: res.size
        }
    };
};

/**
 * Lấy chi tiết đề thi cho sinh viên
 */
export const getQuizDetailsForStudent = async (quizId) => {
    const response = await api.get(`/api/Student/quizzes/${quizId}`);
    return response.data;
};

/**
 * Bắt đầu làm bài
 */
export const startQuizAttempt = async (quizId) => {
    const response = await api.post(`/api/Student/quizzes/${quizId}/attempts`);
    return response.data;
};

/**
 * Nộp bài thi
 */
export const submitQuizAttempt = async (quizId, attemptId, payload) => {
    const response = await api.post(`/api/Student/quizzes/${quizId}/attempts/${attemptId}/submit`, payload);
    return response.data;
};

/**
 * Xem lịch sử làm bài
 */
export const getStudentQuizAttempts = async (quizId) => {
    const response = await api.get(`/api/Student/quizzes/${quizId}/attempts`);
    return response.data;
};

/**
 * Lấy danh sách câu hỏi / feedback trong một lớp học
 * GET /api/student-classes/{classId}/feedbacks
 */
export const getStudentFeedbacks = async (classId) => {
    const response = await api.get(`/api/student-classes/${classId}/feedbacks`);
    return response.data;
};

/**
 * Tạo một câu hỏi mới trong lớp
 * POST /api/student-classes/{classId}/feedbacks
 */
export const createStudentFeedback = async (classId, payload) => {
    const response = await api.post(`/api/student-classes/${classId}/feedbacks`, payload);
    return response.data;
};

/**
 * Trợ giảng trả lời câu hỏi
 * PUT /api/student-classes/{classId}/feedbacks/{feedbackId}/respond
 */
export const respondFeedbackAsAssistant = async (classId, feedbackId, payload) => {
    const response = await api.put(
        `/api/student-classes/${classId}/feedbacks/${feedbackId}/respond`,
        payload
    );
    return response.data;
};
