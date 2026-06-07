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
 * Lấy danh sách các sinh viên cùng học trong lớp
 * @param {string} classId - Mã lớp học
 */
export const getClassStudents = async (classId) => {
    const response = await api.get(`/api/student-classes/${classId}/students`);
    return response.data;
};

/**
 * Lấy danh sách học liệu của lớp kèm trạng thái hoàn thành của sinh viên hiện tại.
 * @param {string} classId
 */
export const getStudentLearningMaterials = async (classId) => {
    const response = await api.get(`/api/student-learning-materials/class/${classId}`);
    return response.data;
};

/**
 * Đánh dấu hoàn thành một học liệu.
 * @param {string} materialId
 */
export const completeMaterial = async (materialId) => {
    const response = await api.post(`/api/student-learning-materials/${materialId}/complete`);
    return response.data;
};

/**
 * Bỏ đánh dấu hoàn thành một học liệu.
 * @param {string} materialId
 */
export const uncompleteMaterial = async (materialId) => {
    const response = await api.delete(`/api/student-learning-materials/${materialId}/complete`);
    return response.data;
};
