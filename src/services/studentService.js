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
