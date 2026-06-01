import api from './api';

/**
 * studentService — API calls dành cho Học viên (Student)
 *
 * Mỗi hàm cố gắng gọi API thực trước.
 * Nếu backend chưa có endpoint → fallback về MOCK_DATA
 * để giao diện vẫn chạy được trong quá trình phát triển.
 */

/* ─────────────────────────── MOCK DATA ─────────────────────────── */

const MOCK_CLASSES = [
  {
    id: 'SE1701',
    courseCode: 'SWP391',
    courseName: 'Phát triển ứng dụng phần mềm hướng dịch vụ',
    termCode: 'HK2-2024-2025',
    termName: 'Học kỳ 2 - 2024-2025',
    termStartDate: '2025-01-06',
    termEndDate: '2025-04-20',
    lecturerName: 'TS. Nguyễn Thanh Hải',
    lecturerEmail: 'hai.nt@fpt.edu.vn',
    totalStudents: 32,
    startDate: '2025-01-06',
    endDate: '2025-04-20',
    allowReviewAfterEnd: true,
    materialProgress: 65,   // % hoàn thành học liệu (Phase 2 sẽ lấy từ API)
  },
  {
    id: 'PRN221',
    courseCode: 'PRN221',
    courseName: 'Lập trình C# cơ bản và nâng cao',
    termCode: 'HK2-2024-2025',
    termName: 'Học kỳ 2 - 2024-2025',
    termStartDate: '2025-01-06',
    termEndDate: '2025-04-20',
    lecturerName: 'ThS. Trần Thị Lan',
    lecturerEmail: 'lan.tt@fpt.edu.vn',
    totalStudents: 28,
    startDate: '2025-01-06',
    endDate: '2025-04-20',
    allowReviewAfterEnd: false,
    materialProgress: 40,
  },
  {
    id: 'MAT101',
    courseCode: 'MAT101',
    courseName: 'Toán rời rạc ứng dụng',
    termCode: 'HK1-2024-2025',
    termName: 'Học kỳ 1 - 2024-2025',
    termStartDate: '2024-09-02',
    termEndDate: '2024-12-20',
    lecturerName: 'PGS. Lê Văn Minh',
    lecturerEmail: 'minh.lv@fpt.edu.vn',
    totalStudents: 45,
    startDate: '2024-09-02',
    endDate: '2024-12-20',
    allowReviewAfterEnd: true,
    materialProgress: 100,
  },
  {
    id: 'WEB301',
    courseCode: 'WEB301',
    courseName: 'Phát triển Web với React',
    termCode: 'HK1-2025-2026',
    termName: 'Học kỳ 1 - 2025-2026',
    termStartDate: '2025-09-01',
    termEndDate: '2025-12-20',
    lecturerName: 'ThS. Phạm Quốc Bảo',
    lecturerEmail: 'bao.pq@fpt.edu.vn',
    totalStudents: 35,
    startDate: '2025-09-01',
    endDate: '2025-12-20',
    allowReviewAfterEnd: false,
    materialProgress: 0,
  },
];

const MOCK_MATERIALS = {
  SE1701: [
    {
      id: 'mat-1', classId: 'SE1701', orderIndex: 1,
      title: 'Tuần 1: Giới thiệu Microservices Architecture',
      description: 'Video bài giảng tổng quan về kiến trúc Microservices, so sánh với Monolithic. Sinh viên cần xem toàn bộ trước buổi học trên lớp.',
      type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      fileSize: '45.2 MB', uploadedAt: '2025-01-08', isCompleted: true,
    },
    {
      id: 'mat-2', classId: 'SE1701', orderIndex: 2,
      title: 'Tuần 1: Slide lý thuyết RESTful API Design',
      description: 'Slide PDF về thiết kế REST API chuẩn OpenAPI 3.0. Đọc kỹ các phần endpoint naming convention và HTTP status codes.',
      type: 'pdf', url: '#',
      fileSize: '3.1 MB', uploadedAt: '2025-01-08', isCompleted: true,
    },
    {
      id: 'mat-3', classId: 'SE1701', orderIndex: 3,
      title: 'Tuần 2: Spring Boot cơ bản và nâng cao',
      description: 'Video thực hành xây dựng Spring Boot API từ đầu. Yêu cầu cài sẵn JDK 17 và IntelliJ IDEA.',
      type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      fileSize: '62.5 MB', uploadedAt: '2025-01-15', isCompleted: true,
    },
    {
      id: 'mat-4', classId: 'SE1701', orderIndex: 4,
      title: 'Tuần 2: Quiz kiểm tra REST API',
      description: 'Bài trắc nghiệm 15 câu kiểm tra kiến thức REST API trước buổi lên lớp thảo luận.',
      type: 'quiz', url: '#',
      fileSize: '0.5 MB', uploadedAt: '2025-01-15', isCompleted: false,
    },
    {
      id: 'mat-5', classId: 'SE1701', orderIndex: 5,
      title: 'Tuần 3: Docker & Container hóa ứng dụng',
      description: 'Hướng dẫn Docker từ cơ bản đến deploy production với docker-compose multi-service.',
      type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      fileSize: '78.3 MB', uploadedAt: '2025-01-22', isCompleted: false,
    },
    {
      id: 'mat-6', classId: 'SE1701', orderIndex: 6,
      title: 'Tuần 3: Tài liệu Docker Compose',
      description: 'Document hướng dẫn cấu hình Docker Compose cho multi-service Spring Boot + PostgreSQL.',
      type: 'document', url: '#',
      fileSize: '1.8 MB', uploadedAt: '2025-01-22', isCompleted: false,
    },
  ],
  PRN221: [
    {
      id: 'mat-7', classId: 'PRN221', orderIndex: 1,
      title: 'Tuần 1: C# Fundamentals - OOP Concepts',
      description: 'Video giới thiệu OOP trong C# - Class, Object, Inheritance, Polymorphism.',
      type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      fileSize: '38.7 MB', uploadedAt: '2025-01-08', isCompleted: true,
    },
    {
      id: 'mat-8', classId: 'PRN221', orderIndex: 2,
      title: 'Tuần 2: LINQ & Lambda Expressions',
      description: 'Video thực hành LINQ queries, Lambda expressions và Extension methods trong C#.',
      type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      fileSize: '42.1 MB', uploadedAt: '2025-01-15', isCompleted: false,
    },
    {
      id: 'mat-9', classId: 'PRN221', orderIndex: 3,
      title: 'Tuần 2: Slide LINQ cheat sheet',
      description: 'PDF tổng hợp các câu lệnh LINQ thường dùng kèm ví dụ thực tế.',
      type: 'pdf', url: '#',
      fileSize: '2.3 MB', uploadedAt: '2025-01-15', isCompleted: false,
    },
  ],
  MAT101: [
    {
      id: 'mat-10', classId: 'MAT101', orderIndex: 1,
      title: 'Chương 1: Tập hợp và Logic mệnh đề',
      description: 'Video bài giảng về tập hợp, phép toán tập hợp và logic mệnh đề cơ bản.',
      type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      fileSize: '55.2 MB', uploadedAt: '2024-09-04', isCompleted: true,
    },
    {
      id: 'mat-11', classId: 'MAT101', orderIndex: 2,
      title: 'Chương 2: Lý thuyết đồ thị',
      description: 'Video bài giảng Graph Theory cơ bản: DFS, BFS, cây khung nhỏ nhất.',
      type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      fileSize: '67.8 MB', uploadedAt: '2024-09-18', isCompleted: true,
    },
  ],
  WEB301: [],
};

/* ──────────────────────────── API FUNCTIONS ─────────────────────── */

/**
 * Lấy danh sách lớp học của sinh viên đang đăng nhập.
 * Endpoint: GET /api/classes/my-classes
 * Fallback: MOCK_CLASSES nếu backend chưa sẵn sàng.
 *
 * @param {{ academicTermId?: string, year?: string }} [params]
 */
export const getMyClasses = async (params = {}) => {
  try {
    const res = await api.get('/api/classes/my-classes', { params });
    return res.data?.data || res.data || [];
  } catch {
    return MOCK_CLASSES;
  }
};

/**
 * Lấy danh sách tài liệu học tập của một lớp.
 * Endpoint: GET /api/materials?classId={id}
 * Fallback: MOCK_MATERIALS[classId]
 *
 * @param {string} classId
 */
export const getMaterialsByClass = async (classId) => {
  try {
    const res = await api.get('/api/materials', { params: { classId } });
    return res.data?.data || res.data || [];
  } catch {
    return MOCK_MATERIALS[classId] || [];
  }
};

/**
 * Đánh dấu một tài liệu đã hoàn thành.
 * Endpoint: POST /api/materials/{materialId}/complete
 * Fallback: trả về { success: true } (optimistic update).
 *
 * @param {string} materialId
 */
export const markMaterialComplete = async (materialId) => {
  try {
    const res = await api.post(`/api/materials/${materialId}/complete`);
    return res.data;
  } catch {
    return { success: true };
  }
};

/**
 * Lấy danh sách bài tập của một lớp.
 * Endpoint: GET /api/assignments?classId={id}
 *
 * @param {string} classId
 */
export const getAssignmentsByClass = async (classId) => {
  try {
    const res = await api.get('/api/assignments', { params: { classId } });
    return res.data?.data || res.data || [];
  } catch {
    return [];
  }
};

/**
 * Nộp bài tập.
 * Endpoint: POST /api/submissions
 *
 * @param {{ assignmentId: string, fileName: string, studentNotes?: string }} data
 */
export const submitAssignment = async (data) => {
  try {
    const res = await api.post('/api/submissions', data);
    return res.data;
  } catch {
    return { success: true, id: `sub_${Date.now()}` };
  }
};

/**
 * Lấy điểm của sinh viên hiện tại.
 * Endpoint: GET /api/submissions/my-grades
 */
export const getMyGrades = async () => {
  try {
    const res = await api.get('/api/submissions/my-grades');
    return res.data?.data || res.data || [];
  } catch {
    return [];
  }
};
