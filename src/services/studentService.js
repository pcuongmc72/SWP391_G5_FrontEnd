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
    { id: 'mat-se-1', classId: 'SE1701', title: 'Tuần 1: Giới thiệu Kiến trúc & Phương pháp Flipped Classroom', description: 'Video bài giảng tổng quan về mô hình lớp học đảo ngược, so sánh lớp học truyền thống và đảo ngược. Sinh viên cần xem kỹ trước giờ học.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '45.2 MB', uploadedAt: '2025-01-08', isCompleted: true },
    { id: 'mat-se-2', classId: 'SE1701', title: 'Tuần 1: Slide định hướng lý thuyết tự học cơ bản', description: 'Slide PDF về phương pháp tiếp cận chủ động, sơ đồ tự học 4 bước. Đọc kỹ phần chuẩn bị câu hỏi phản biện.', type: 'pdf', url: '#', fileSize: '3.1 MB', uploadedAt: '2025-01-08', isCompleted: true },
    { id: 'mat-se-3', classId: 'SE1701', title: 'Tuần 2: Quy trình phát triển Agile & Mô hình Scrum', description: 'Video bài giảng tóm tắt quy trình phát triển Agile, 3 vai trò chính, 3 hiện vật và 5 sự kiện Scrum.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '48.5 MB', uploadedAt: '2025-01-15', isCompleted: true },
    { id: 'mat-se-4', classId: 'SE1701', title: 'Tuần 2: Slide Scrum Roles, Artifacts & Events', description: 'Slide chi tiết về Product Backlog, Sprint Backlog và các cuộc họp Daily Standup, Sprint Review.', type: 'pdf', url: '#', fileSize: '4.2 MB', uploadedAt: '2025-01-15', isCompleted: true },
    { id: 'mat-se-5', classId: 'SE1701', title: 'Tuần 2: Trắc nghiệm trắc nghiệm tổng quan Scrum', description: 'Mini quiz trắc nghiệm đánh giá hiểu biết Agile Scrum cơ bản.', type: 'quiz', url: '#', fileSize: '0.2 MB', uploadedAt: '2025-01-15', isCompleted: true },
    { id: 'mat-se-6', classId: 'SE1701', title: 'Tuần 3: Phân tích yêu cầu - Biểu đồ Use Case Diagram', description: 'Video bài giảng phân tích tác nhân (Actors) và thiết lập kịch bản Use Case UML.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '52.1 MB', uploadedAt: '2025-01-22', isCompleted: true },
    { id: 'mat-se-7', classId: 'SE1701', title: 'Tuần 3: Hướng dẫn viết kịch bản đặc tả Use Case chi tiết', description: 'Tài liệu hướng dẫn đặc tả các bước thực hiện của Use Case cơ bản và ngoại lệ.', type: 'document', url: '#', fileSize: '1.5 MB', uploadedAt: '2025-01-22', isCompleted: true },
    { id: 'mat-se-8', classId: 'SE1701', title: 'Tuần 4: Thiết kế hệ thống - Biểu đồ Class Diagram', description: 'Video bài giảng dài 25 phút phân tích thực thể, lớp học và sơ đồ lớp chi tiết.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '82.0 MB', uploadedAt: '2025-01-29', isCompleted: true },
    { id: 'mat-se-9', classId: 'SE1701', title: 'Tuần 4: Slide quan hệ Association, Aggregation & Composition', description: 'Slide PDF phân biệt rõ rệt các mối quan hệ giữa các lớp trong UML.', type: 'pdf', url: '#', fileSize: '2.8 MB', uploadedAt: '2025-01-29', isCompleted: true },
    { id: 'mat-se-10', classId: 'SE1701', title: 'Tuần 5: Thiết kế tương tác - Biểu đồ Sequence Diagram', description: 'Video hướng dẫn vẽ sơ đồ tuần tự thể hiện sự giao tiếp giữa các đối tượng theo thời gian.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '65.4 MB', uploadedAt: '2025-02-05', isCompleted: true },
    { id: 'mat-se-11', classId: 'SE1701', title: 'Tuần 5: Các thông điệp Synchronous, Asynchronous & Lifeline', description: 'Slide lý thuyết phân biệt các loại thông điệp và cách thiết lập vòng đời đối tượng.', type: 'pdf', url: '#', fileSize: '3.3 MB', uploadedAt: '2025-02-05', isCompleted: true },
    { id: 'mat-se-12', classId: 'SE1701', title: 'Tuần 5: Mini Quiz nghiệm thu kiến thức chương thiết kế UML', description: 'Bài đánh giá nhanh 10 câu hỏi tổng hợp Use Case, Class và Sequence Diagram.', type: 'quiz', url: '#', fileSize: '0.2 MB', uploadedAt: '2025-02-05', isCompleted: true },
    { id: 'mat-se-13', classId: 'SE1701', title: 'Tuần 6: Kiến trúc phần mềm - Thiết kế RESTful API Design', description: 'Video bài giảng thực hành định hình các REST endpoints chuẩn OpenAPI 3.0.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '58.3 MB', uploadedAt: '2025-02-12', isCompleted: true },
    { id: 'mat-se-14', classId: 'SE1701', title: 'Tuần 6: Slide OpenAPI 3.0 & Swagger UI documentation', description: 'Tài liệu hướng dẫn viết Swagger spec để sinh tài liệu API tự động.', type: 'pdf', url: '#', fileSize: '4.1 MB', uploadedAt: '2025-02-12', isCompleted: false },
    { id: 'mat-se-15', classId: 'SE1701', title: 'Tuần 6: Đọc tài liệu REST API Naming Conventions', description: 'Document quy định quy chuẩn đặt tên tài nguyên API dạng danh từ số nhiều.', type: 'document', url: '#', fileSize: '1.2 MB', uploadedAt: '2025-02-12', isCompleted: false },
    { id: 'mat-se-16', classId: 'SE1701', title: 'Tuần 7: Docker cơ bản & Container hóa ứng dụng', description: 'Video bài giảng container hóa các ứng dụng phần mềm độc lập bằng Docker.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '78.5 MB', uploadedAt: '2025-02-19', isCompleted: false },
    { id: 'mat-se-17', classId: 'SE1701', title: 'Tuần 7: Slide hướng dẫn viết Dockerfile chuẩn hóa', description: 'Slide hướng dẫn khai báo Base Image, cài thư viện và run entrypoint.', type: 'pdf', url: '#', fileSize: '2.5 MB', uploadedAt: '2025-02-19', isCompleted: false },
    { id: 'mat-se-18', classId: 'SE1701', title: 'Tuần 7: Hướng dẫn cấu hình Docker Compose cho multi-service', description: 'Tài liệu cấu hình file docker-compose.yml liên kết API và Database.', type: 'document', url: '#', fileSize: '1.8 MB', uploadedAt: '2025-02-19', isCompleted: false },
    { id: 'mat-se-19', classId: 'SE1701', title: 'Tuần 7: Quiz kiểm tra kiến thức Docker', description: 'Bộ câu hỏi nhanh đánh giá khả năng hiểu lệnh Docker CLI và Docker Compose.', type: 'quiz', url: '#', fileSize: '0.2 MB', uploadedAt: '2025-02-19', isCompleted: false },
    { id: 'mat-se-20', classId: 'SE1701', title: 'Tuần 8: Triển khai ứng dụng lên nền tảng Cloud (AWS/Azure)', description: 'Tài liệu hướng dẫn deploy dockerized application lên cloud hosting.', type: 'document', url: '#', fileSize: '2.0 MB', uploadedAt: '2025-02-26', isCompleted: false },
  ],
  PRN221: [
    { id: 'mat-prn-1', classId: 'PRN221', title: 'Tuần 1: Giới thiệu ngôn ngữ C# và nền tảng .NET Core', description: 'Video giới thiệu tổng quan lịch sử C# và cấu trúc CLR, .NET SDK.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '38.7 MB', uploadedAt: '2025-01-08', isCompleted: true },
    { id: 'mat-prn-2', classId: 'PRN221', title: 'Tuần 1: Slide kiểu dữ liệu, biến và cấu trúc điều khiển', description: 'Slide tóm lược cú pháp cơ bản C#, lệnh if/else, switch/case và vòng lặp.', type: 'pdf', url: '#', fileSize: '2.3 MB', uploadedAt: '2025-01-08', isCompleted: true },
    { id: 'mat-prn-3', classId: 'PRN221', title: 'Tuần 2: Lập trình hướng đối tượng nâng cao trong C#', description: 'Video bài giảng chuyên sâu về đóng gói Encapsulation và trừu tượng Abstraction.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '42.1 MB', uploadedAt: '2025-01-15', isCompleted: true },
    { id: 'mat-prn-4', classId: 'PRN221', title: 'Tuần 2: Tính đa hình, kế thừa và interface trong C#', description: 'Slide lý thuyết hướng dẫn sử dụng tính đa hình ảo virtual/override và interface class.', type: 'pdf', url: '#', fileSize: '2.1 MB', uploadedAt: '2025-01-15', isCompleted: true },
    { id: 'mat-prn-5', classId: 'PRN221', title: 'Tuần 2: Quiz kiểm tra kiến thức OOP nâng cao', description: 'Bài kiểm tra 10 câu trắc nghiệm nghiệm thu OOP.', type: 'quiz', url: '#', fileSize: '0.2 MB', uploadedAt: '2025-01-15', isCompleted: false },
    { id: 'mat-prn-6', classId: 'PRN221', title: 'Tuần 3: Truy vấn dữ liệu nâng cao với LINQ & Lambda', description: 'Video bài giảng thực hành viết câu lệnh truy vấn dữ liệu LINQ Method Syntax & Query Syntax.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '45.0 MB', uploadedAt: '2025-01-22', isCompleted: false },
    { id: 'mat-prn-7', classId: 'PRN221', title: 'Tuần 3: Slide LINQ cheat sheet và extension methods', description: 'Slide PDF tóm lược các phương thức Select, Where, OrderBy, GroupBy và Join.', type: 'pdf', url: '#', fileSize: '1.9 MB', uploadedAt: '2025-01-22', isCompleted: false },
    { id: 'mat-prn-8', classId: 'PRN221', title: 'Tuần 4: Lập trình đa luồng Asynchronous Programming', description: 'Video thực hành tối ưu luồng với Task, async và await trong .NET.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '58.2 MB', uploadedAt: '2025-01-29', isCompleted: false },
    { id: 'mat-prn-9', classId: 'PRN221', title: 'Tuần 4: Sử dụng từ khóa async/await và Task Parallel Library', description: 'Slide lý thuyết quản lý ThreadPool và tránh nghẽn luồng UI.', type: 'pdf', url: '#', fileSize: '3.0 MB', uploadedAt: '2025-01-29', isCompleted: false },
    { id: 'mat-prn-10', classId: 'PRN221', title: 'Tuần 4: Quiz kiểm tra kiến thức đa luồng C#', description: 'Quiz kiểm nghiệm kỹ năng lập trình bất đồng bộ C#.', type: 'quiz', url: '#', fileSize: '0.2 MB', uploadedAt: '2025-01-29', isCompleted: false },
  ],
  MAT101: [
    { id: 'mat-mat-1', classId: 'MAT101', title: 'Tuần 1: Logic toán và Đại số mệnh đề', description: 'Video bài giảng logic toán, các phép toán logic cơ bản (AND, OR, NOT, phép suy ra).', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '55.2 MB', uploadedAt: '2024-09-04', isCompleted: true },
    { id: 'mat-mat-2', classId: 'MAT101', title: 'Tuần 1: Slide các phép toán logic và bảng chân trị', description: 'Slide PDF hướng dẫn chứng minh tương đương logic bằng lập bảng chân trị.', type: 'pdf', url: '#', fileSize: '2.5 MB', uploadedAt: '2024-09-04', isCompleted: true },
    { id: 'mat-mat-3', classId: 'MAT101', title: 'Tuần 2: Lý thuyết tập hợp và các phép toán trên tập hợp', description: 'Video thực hành xác định tập hợp con, phép hợp, giao, hiệu và tích Descartes.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '48.3 MB', uploadedAt: '2024-09-11', isCompleted: true },
    { id: 'mat-mat-4', classId: 'MAT101', title: 'Tuần 2: Slide định lý Venn và nguyên lý bù trừ', description: 'Slide hướng dẫn giải các bài toán đếm ứng dụng biểu đồ Venn.', type: 'pdf', url: '#', fileSize: '1.8 MB', uploadedAt: '2024-09-11', isCompleted: true },
    { id: 'mat-mat-5', classId: 'MAT101', title: 'Tuần 2: Quiz trắc nghiệm Đại số mệnh đề và Tập hợp', description: 'Quiz kiểm tra tổng quan kiến thức 2 chương đầu.', type: 'quiz', url: '#', fileSize: '0.2 MB', uploadedAt: '2024-09-11', isCompleted: true },
  ],
  WEB301: [
    { id: 'mat-web-1', classId: 'WEB301', title: 'Tuần 1: Giới thiệu ReactJS và mô hình Component-based', description: 'Video bài giảng về kiến trúc Virtual DOM, component-based và so sánh React với Vanilla JS.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '45.2 MB', uploadedAt: '2026-02-16', isCompleted: false },
    { id: 'mat-web-2', classId: 'WEB301', title: 'Tuần 1: Slide cài đặt NodeJS, NPM và khởi tạo dự án với Vite', description: 'Slide chi tiết các bước setup runtime environment và cấu hình scaffolding.', type: 'pdf', url: '#', fileSize: '4.2 MB', uploadedAt: '2026-02-16', isCompleted: false },
    { id: 'mat-web-3', classId: 'WEB301', title: 'Tuần 2: JSX và cơ chế quản lý dữ liệu với State & Props', description: 'Video bài giảng chi tiết về luồng luân chuyển dữ liệu đơn chiều và các hooks cơ bản.', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', fileSize: '82.0 MB', uploadedAt: '2026-02-23', isCompleted: false },
    { id: 'mat-web-4', classId: 'WEB301', title: 'Tuần 2: Slide thực hành truyền nhận tham số giữa các Components', description: 'Slide PDF minh họa cách nâng state (lifting state up) và quản lý props.', type: 'pdf', url: '#', fileSize: '3.0 MB', uploadedAt: '2026-02-23', isCompleted: false },
    { id: 'mat-web-5', classId: 'WEB301', title: 'Tuần 2: Quiz trắc nghiệm kiến thức State & Props cơ bản', description: 'Mini-quiz nghiệm thu lý thuyết hooks và JSX cơ bản.', type: 'quiz', url: '#', fileSize: '0.2 MB', uploadedAt: '2026-02-23', isCompleted: false },
  ],
};

/* ──────────────────────────── API FUNCTIONS ─────────────────────── */

/* ─────────────────────── MOCK ASSIGNMENTS ──────────────────────── */
const today = new Date();
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0]; };

const MOCK_ASSIGNMENTS = {
  SE1701: [
    {
      id: 'asg-SE1701-1', classId: 'SE1701',
      title: 'Bài tập 1: Phân tích và thiết kế hệ thống',
      description: 'Sinh viên thực hiện phân tích yêu cầu và thiết kế sơ đồ UML (Use Case, Class Diagram) cho hệ thống quản lý thư viện. Nộp file PDF báo cáo.',
      dueDate: addDays(today, 7), maxPoints: 100, createdAt: addDays(today, -14),
      mySubmission: null,
    },
    {
      id: 'asg-SE1701-2', classId: 'SE1701',
      title: 'Bài tập 2: Xây dựng RESTful API',
      description: 'Nhóm sinh viên xây dựng ít nhất 5 API endpoints cho module quản lý người dùng, sử dụng ASP.NET Core. Kèm tài liệu Swagger.',
      dueDate: addDays(today, 14), maxPoints: 100, createdAt: addDays(today, -7),
      mySubmission: {
        id: 'sub-mock-1', fileName: 'BaoCao_API_Nhom5.pdf',
        submittedAt: addDays(today, -2) + ' 22:30', status: 'SUBMITTED',
        grade: null, feedback: null,
      },
    },
    {
      id: 'asg-SE1701-3', classId: 'SE1701',
      title: 'Đồ án cuối kỳ: Hệ thống LMS Flipped Classroom',
      description: 'Nhóm phát triển đầy đủ hệ thống LMS gồm: quản lý người dùng, lớp học, học liệu, bài tập và điểm số. Demo live và nộp source code lên GitHub.',
      dueDate: addDays(today, -3), maxPoints: 100, createdAt: addDays(today, -30),
      mySubmission: null, // Quá hạn chưa nộp
    },
  ],
  PRN221: [
    {
      id: 'asg-PRN221-1', classId: 'PRN221',
      title: 'Bài tập 1: Lập trình OOP với C#',
      description: 'Xây dựng ứng dụng console quản lý sinh viên sử dụng các nguyên lý OOP: Kế thừa, Đa hình, Đóng gói và Trừu tượng.',
      dueDate: addDays(today, 5), maxPoints: 100, createdAt: addDays(today, -10),
      mySubmission: {
        id: 'sub-mock-2', fileName: 'StudentManagement_C#.zip',
        submittedAt: addDays(today, -1) + ' 10:15', status: 'GRADED',
        grade: 85, feedback: 'Bài làm tốt! Code sạch, có comment đầy đủ. Cần cải thiện phần xử lý exception.',
      },
    },
    {
      id: 'asg-PRN221-2', classId: 'PRN221',
      title: 'Bài tập 2: LINQ & Entity Framework',
      description: 'Thực hành viết các câu truy vấn LINQ phức tạp và sử dụng EF Core để thao tác với cơ sở dữ liệu SQL Server.',
      dueDate: addDays(today, 10), maxPoints: 100, createdAt: addDays(today, -3),
      mySubmission: null,
    },
  ],
  MAT101: [
    {
      id: 'asg-MAT101-1', classId: 'MAT101',
      title: 'Bài kiểm tra giữa kỳ: Logic và Tập hợp',
      description: 'Bài kiểm tra trắc nghiệm và tự luận về Đại số mệnh đề, Lý thuyết tập hợp và ứng dụng nguyên lý bù trừ.',
      dueDate: addDays(today, -15), maxPoints: 100, createdAt: addDays(today, -30),
      mySubmission: {
        id: 'sub-mock-3', fileName: 'BaiKiemTra_GiuaKy.pdf',
        submittedAt: addDays(today, -15) + ' 09:45', status: 'GRADED',
        grade: 92, feedback: 'Xuất sắc! Bài làm rất chắc chắn, phần chứng minh logic rất rõ ràng.',
      },
    },
  ],
  WEB301: [
    {
      id: 'asg-WEB301-1', classId: 'WEB301',
      title: 'Bài tập 1: Xây dựng Todo App với React',
      description: 'Sinh viên xây dựng ứng dụng Todo List sử dụng React Hooks (useState, useEffect), có tính năng thêm, sửa, xóa và lọc task.',
      dueDate: addDays(today, 21), maxPoints: 100, createdAt: addDays(today, -2),
      mySubmission: null,
    },
  ],
};


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
    const cid = String(classId).toLowerCase();
    if (cid.includes('se') || cid.includes('swp') || cid.includes('cnpm')) {
      return MOCK_MATERIALS.SE1701;
    }
    if (cid.includes('prn') || cid.includes('csdl')) {
      return MOCK_MATERIALS.PRN221;
    }
    if (cid.includes('mat') || cid.includes('toan')) {
      return MOCK_MATERIALS.MAT101;
    }
    return MOCK_MATERIALS.WEB301;
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
 * Lấy danh sách bài tập của một lớp (kèm trạng thái nộp bài).
 * Endpoint: GET /api/assignments?classId={id}
 *
 * @param {string} classId
 */
export const getAssignmentsByClass = async (classId) => {
  try {
    const res = await api.get('/api/assignments', { params: { classId } });
    return res.data?.data || res.data || [];
  } catch {
    const cid = String(classId).toUpperCase();
    return MOCK_ASSIGNMENTS[cid] || MOCK_ASSIGNMENTS.WEB301 || [];
  }
};

/**
 * Lấy danh sách bài nộp của sinh viên (có thể lọc theo classId).
 * Endpoint: GET /api/submissions/my-submissions?classId={id}
 *
 * @param {string} [classId]
 */
export const getMySubmissions = async (classId) => {
  try {
    const params = classId ? { classId } : {};
    const res = await api.get('/api/submissions/my-submissions', { params });
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
