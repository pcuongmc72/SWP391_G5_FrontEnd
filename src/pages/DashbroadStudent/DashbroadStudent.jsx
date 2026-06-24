<<<<<<< HEAD
import StudentDashboard from './StudentDashboard';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    BookOpen, LogOut, LayoutGrid, GraduationCap,
    Upload, MessageSquare, Star, BookMarked
=======
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  Settings,
  ArrowLeft,
  FolderOpen,
  MessageSquare,
  MoreVertical,
  Send,
  Loader2,
  CheckCircle2,
  CircleAlert
>>>>>>> cuongnphe194338
} from 'lucide-react';

// Services
import { logout, getUser } from '../../services/authService';
<<<<<<< HEAD
import SharedBlogForum from '../../components/SharedBlogForum/SharedBlogForum';
import styles from './DashbroadStudent.module.css';

/* ── Sidebar tabs cho student ── */
const SIDEBAR_TABS = [
    { key: 'classes', label: 'Lớp học của tôi', icon: BookOpen, path: '/dashboard/student' },
    { key: 'roadmap', label: 'Lộ trình học tập', icon: BookMarked, path: '/dashboard/student/roadmap' },
    { key: 'materials', label: 'Học liệu', icon: BookMarked, path: '/dashboard/student/materials' },
    { key: 'submissions', label: 'Bài tập và deadline', icon: Upload, path: '/dashboard/student/submissions' },
    { key: 'grades', label: 'Điểm và nhận xét', icon: Star, path: '/dashboard/student/grades' },
    { key: 'blog', label: 'Blog & Diễn đàn', icon: MessageSquare, path: '/dashboard/student/blog' },
];

function DashbroadStudent() {
    const currentUser = getUser();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        window.location.replace('/');
    };

    return (
        <div className={styles.page}>

            {/* ── Sidebar ── */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarLogo}>
                    <div className={styles.sidebarLogoIcon}><BookOpen /></div>
                    <div>
                        <span className={styles.sidebarLogoText}>FLIPPED LMS</span>
                        <span className={styles.sidebarLogoSub}>Học viên</span>
                    </div>
                </div>

                <nav className={styles.sidebarNav} aria-label="Student navigation">
                    <div className={styles.navGroupLabel}>Chức năng học tập</div>
                    {SIDEBAR_TABS.map(({ key, label, icon: Icon, path }) => {
                        const isActive = location.pathname === path;
                        return (
                            <button
                                key={key}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                onClick={() => navigate(path)}
                            >
                                <Icon className={styles.navIcon} />
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </nav>

                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <LogOut className={styles.navIcon} />
                    <span>Đăng xuất</span>
                </button>
            </aside>

            {/* ── Main ── */}
            <div className={styles.main}>
                {/* Topbar */}
                <header className={styles.topbar}>
                    <div />
                    <div className={styles.topbarRight}>
                        <div className={styles.userBadge}>
                            <div className={styles.avatar}>
                                {currentUser?.fullName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>{currentUser?.fullName || 'Học viên'}</span>
                                <span className={styles.userRole}>Student</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className={styles.content}>
                    {location.pathname === '/dashboard/student' ? (
                        <StudentDashboard />
                    ) : location.pathname === '/dashboard/student/blog' ? (
                        <SharedBlogForum />
                    ) : (
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-800">
                                Trang chức năng khác
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Nội dung đang được cập nhật...
                            </p>
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
=======
import { getAcademicTerms, getStudentClasses, getClassStudents } from '../../services/studentService';

// LMS Components
import HeaderLMS from './lms/HeaderLMS';
import CourseDirectory from './lms/CourseDirectory';
import LessonPlayer from './lms/LessonPlayer';
import SidebarSyllabus from './lms/SidebarSyllabus';
import StudentRoadmap from './StudentRoadmap';

const INITIAL_PROGRESS = {
  completedLectures: ["l-1-1"],
  notes: [
    {
      id: "note-init",
      lectureId: "l-1-1",
      sectionId: "section-1",
      timestamp: "20/06/2026 - Lớp học đảo ngược",
      content: "Nhớ đọc kỹ tài liệu trước khi tới lớp để sẵn sàng thảo luận nhóm và bứt phá điểm số phản biện!",
      lectureTitle: "✨ [Trước lớp] Tìm hiểu mô hình Flipped Classroom & Cách tự học hiệu quả"
    }
  ],
  streak: 3,
  points: 150,
  badges: ["pre-class-champ"],
  quizAnswers: {},
  quizScores: {},
  homeworkStatus: {}
};

// Helper mapping backend course to its syllabus/sections
function getSyllabusForCourse(courseCode) {
  return [];
>>>>>>> cuongnphe194338
}

export default function DashbroadStudent() {
  const currentUser = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  // API Terms & Classes States
  const [terms, setTerms] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('Spring');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Class details students list state
  const [classStudents, setClassStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Navigation & LMS States
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentView, setCurrentView] = useState("overview"); // "overview" | "player"
  const [activeCourseTab, setActiveCourseTab] = useState("stream"); // "stream" | "classwork" | "people"
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar toggle state

  // Announcements State
  const [announcementText, setAnnouncementText] = useState("");
  const [isExpandingPublisher, setIsExpandingPublisher] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [announcements, setAnnouncements] = useState({});

  // Study progress state
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem("flipped_lms_progress_v3");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse progress", e);
      }
    }
    return INITIAL_PROGRESS;
  });

  // Active Lecture inside Course Player
  const [activeLecture, setActiveLecture] = useState(null);
  const [activeSectionId, setActiveSectionId] = useState("");

  // Notification Banner
  const [notification, setNotification] = useState(null);

  // Sync progress to LocalStorage
  useEffect(() => {
    localStorage.setItem("flipped_lms_progress_v3", JSON.stringify(progress));
  }, [progress]);

  const triggerNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // 1. Load Academic Terms
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await getAcademicTerms();
        if (response.success && response.data.length > 0) {
          const termsData = response.data;
          setTerms(termsData);

          // Extract unique years
          const uniqueYears = [
            ...new Set(termsData.map(term => term.startDate.split('-')[0]))
          ].sort((a, b) => b - a);
          setYears(uniqueYears);

          // Get current year and semester
          const today = new Date();
          const currentTerm = termsData.find(term => {
            const start = new Date(term.startDate);
            const end = new Date(term.endDate);
            return today >= start && today <= end;
          });

          if (currentTerm) {
            setSelectedYear(currentTerm.startDate.split('-')[0]);
            const nameLower = currentTerm.name.toLowerCase();
            const codeLower = (currentTerm.termCode || '').toLowerCase();

            if (nameLower.includes('spring') || codeLower.includes('sp')) setSelectedSemester('Spring');
            else if (nameLower.includes('summer') || codeLower.includes('su')) setSelectedSemester('Summer');
            else if (nameLower.includes('fall') || codeLower.includes('fa')) setSelectedSemester('Fall');
          } else if (uniqueYears.length > 0) {
            setSelectedYear(uniqueYears[0]);
            setSelectedSemester('Spring');
          }
        } else {
          setError('Không tìm thấy học kỳ nào trong hệ thống.');
          setLoading(false);
        }
      } catch (err) {
        setError(err.message || 'Lỗi tải danh sách học kỳ.');
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  // 2. Load classes based on Year & Semester
  useEffect(() => {
    if (!selectedYear || !selectedSemester || terms.length === 0) return;

    const matchedTerm = terms.find(term => {
      const termYear = term.startDate.split('-')[0];
      const termNameLower = term.name.toLowerCase();
      const termCodeLower = (term.termCode || '').toLowerCase();

      const isSpring = selectedSemester === 'Spring' && (termNameLower.includes('spring') || termCodeLower.includes('sp'));
      const isSummer = selectedSemester === 'Summer' && (termNameLower.includes('summer') || termCodeLower.includes('su'));
      const isFall = selectedSemester === 'Fall' && (termNameLower.includes('fall') || termCodeLower.includes('fa'));

      return termYear === selectedYear && (isSpring || isSummer || isFall);
    });

    const fetchClasses = async () => {
      setLoading(true);
      setError('');
      try {
        if (matchedTerm) {
          const response = await getStudentClasses(matchedTerm.id);
          if (response.success) {
            setClasses(response.data);
          }
        } else {
          setClasses([]);
        }
      } catch (err) {
        setError(err.message || 'Lỗi tải danh sách lớp học.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [selectedYear, selectedSemester, terms]);

  // 3. Load classmates when a course is selected
  useEffect(() => {
    if (!selectedCourse) return;

    const fetchClassmates = async () => {
      setLoadingStudents(true);
      setStudentSearchTerm('');
      try {
        const response = await getClassStudents(selectedCourse.id);
        if (response.success) {
          setClassStudents(response.data);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách sinh viên cùng lớp:', err);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchClassmates();
  }, [selectedCourse]);

  // Action: Select Course Card
  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setCurrentView("overview");
    setActiveCourseTab("stream");

    // Retrieve syllabus mapping
    const syllabus = getSyllabusForCourse(course.courseCode);
    if (syllabus && syllabus.length > 0) {
      setActiveLecture(syllabus[0].lectures[0]);
      setActiveSectionId(syllabus[0].id);
    }
    triggerNotification(`👉 Đã chuyển sang môn học: ${course.courseCode || course.id}`, "success");
  };

  // Metrics counting
  const syllabus = selectedCourse ? getSyllabusForCourse(selectedCourse.courseCode) : [];
  const totalLecturesCount = syllabus.reduce((acc, s) => acc + s.lectures.length, 0);
  const matchedCompletedLectures = selectedCourse
    ? syllabus.flatMap(s => s.lectures.map(l => l.id)).filter(id => progress.completedLectures.includes(id))
    : [];
  const completedLecturesCount = matchedCompletedLectures.length;

  const handleLogout = () => {
    logout();
    window.location.replace('/');
  };

  const addPoints = (amount) => {
    setProgress((prev) => {
      const nextPoints = prev.points + amount;
      const updatedBadges = [...prev.badges];

      if (nextPoints >= 250 && !updatedBadges.includes("ai-explorer")) {
        updatedBadges.push("ai-explorer");
        setTimeout(() => {
          triggerNotification("🏆 Bạn đã rinh Huy hiệu 'NHÀ KHAI THÁC TRI THỨC AI'! Cộng thêm 50 XP bứt phá.", "success");
        }, 1000);
      }

      if (nextPoints >= 450 && !updatedBadges.includes("homework-hero")) {
        updatedBadges.push("homework-hero");
        setTimeout(() => {
          triggerNotification("🏆 Bạn đạt danh hiệu 'ANH HÙNG THỬ THÁCH SAU LỚP'! Đã hoàn thiện trọn vẹn lý thuyết học tập.", "success");
        }, 1600);
      }

      return {
        ...prev,
        points: nextPoints,
        badges: updatedBadges
      };
    });
  };

  const handleToggleComplete = (lectureId) => {
    const idToToggle = lectureId || activeLecture?.id;
    if (!idToToggle) return;

    setProgress((prev) => {
      const alreadyCompleted = prev.completedLectures.includes(idToToggle);
      let updatedList = [];

      if (alreadyCompleted) {
        updatedList = prev.completedLectures.filter((id) => id !== idToToggle);
        triggerNotification("ℹ️ Đã xóa bài giảng khỏi tiến trình hoàn tất.", "info");
      } else {
        updatedList = [...prev.completedLectures, idToToggle];
        triggerNotification("🎉 Tuyệt vời! Đã ghi nhận hoàn thành bài học này. Nhận +50 XP rèn luyện!", "success");
        setTimeout(() => {
          addPoints(50);
        }, 100);
      }

      return {
        ...prev,
        completedLectures: updatedList
      };
    });
  };

  const handleAddNote = (content) => {
    if (!activeLecture) return;
    setProgress((prev) => {
      const newNote = {
        id: `note-${Date.now()}`,
        lectureId: activeLecture.id,
        sectionId: activeSectionId,
        timestamp: new Date().toLocaleDateString("vi-VN") + " - Thời điểm: 03:14",
        content,
        lectureTitle: activeLecture.title
      };

      return {
        ...prev,
        notes: [newNote, ...prev.notes]
      };
    });
  };

  const handleDeleteNote = (noteId) => {
    setProgress((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== noteId)
    }));
    triggerNotification("🗒️ Đã xóa ghi chú cá nhân thành công.", "info");
  };

  const handleSubmitQuizScore = (score) => {
    if (!activeLecture) return;
    setProgress((prev) => ({
      ...prev,
      quizScores: {
        ...prev.quizScores,
        [activeLecture.id]: score
      }
    }));
  };

  const handleSubmitHomework = () => {
    if (!activeLecture) return;
    setProgress((prev) => ({
      ...prev,
      homeworkStatus: {
        ...prev.homeworkStatus,
        [activeLecture.id]: "submitted"
      }
    }));
  };

  const resetProgress = () => {
    setProgress(INITIAL_PROGRESS);
    if (selectedCourse) {
      const courseSyllabus = getSyllabusForCourse(selectedCourse.courseCode);
      if (courseSyllabus.length > 0) {
        setActiveLecture(courseSyllabus[0].lectures[0]);
        setActiveSectionId(courseSyllabus[0].id);
      }
    }
    setCurrentView("overview");
    triggerNotification("🚀 Đặt lại hệ thống lưu trữ tiến độ tự học thành công!", "success");
  };

  // Search filter for classes
  const filteredClasses = classes.filter(cls => {
    const query = searchTerm.toLowerCase();
    const nameMatch = (cls.courseName || "").toLowerCase().includes(query);
    const codeMatch = (cls.courseCode || "").toLowerCase().includes(query);
    const classIdMatch = (cls.id || "").toLowerCase().includes(query);
    return nameMatch || codeMatch || classIdMatch;
  });

  // Filter classmates list
  const filteredClassmates = classStudents.filter(std =>
    (std.fullName || "").toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    (std.studentId || "").toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const studentName = currentUser?.fullName || currentUser?.email || 'Học viên';
  const studentCode = currentUser?.username || 'SV-2026';
  const studentEmail = currentUser?.email || '';

  return (
    <div id="flipped-classroom-app-root" className="bg-slate-50 min-h-screen flex flex-col font-sans transition select-text">

      {/* Top Header Navigation panel */}
      <HeaderLMS
        streak={progress.streak}
        points={progress.points}
        completedCount={completedLecturesCount}
        totalCount={totalLecturesCount}
        resetProgress={resetProgress}
        studentName={studentName}
        studentCode={studentCode}
        studentEmail={studentEmail}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        sidebarOpen={sidebarOpen}
      />

      {/* Visual notification banner */}
      {notification && (
        <div className={`fixed top-18 right-6 z-[100] max-w-sm rounded-xl p-4 shadow-xl border flex gap-3 items-start animate-bounce ${notification.type === "success"
          ? "border-emerald-800 bg-emerald-900 text-white"
          : "border-teal-850 bg-teal-900 text-white"
          }`}>
          {notification.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <CircleAlert size={18} className="text-teal-300 mt-0.5 shrink-0" />
          )}
          <p className="text-xs font-semibold leading-relaxed">{notification.message}</p>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Side Navigation Rail */}
        <aside
          className={`hidden md:flex flex-col bg-white border-r border-gray-200 shrink-0 select-none py-4 items-center justify-between overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-56 opacity-100' : 'w-0 opacity-0 border-r-0'
          }`}
        >
          <div className="flex flex-col gap-1 items-start w-full px-3">

            {/* 1. Home button */}
            <button
              onClick={() => setSelectedCourse(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${!selectedCourse
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              title="Lớp học của tôi"
            >
              <Home size={20} className="stroke-[2.2] shrink-0" />
              <span className="text-xs font-semibold whitespace-nowrap">Trang chủ</span>
            </button>

            {/* 3. Tasks checklist */}
            <button
              onClick={() => alert(`Trạng thái: Bạn đã đánh dấu học xong ${completedLecturesCount}/${totalLecturesCount} học liệu lý thuyết môn học hiện tại.`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer text-left"
              title="Danh sách cần tự học"
            >
              <ClipboardCheck size={20} className="stroke-[2.2] shrink-0" />
              <span className="text-xs font-semibold whitespace-nowrap">Bài tập nhà</span>
            </button>

            {/* 4. Enrolled courses collection list icon */}
            <button
              onClick={() => setSelectedCourse(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer text-left"
              title="Khóa đào tạo"
            >
              <GraduationCap size={20} className="stroke-[2.2] shrink-0" />
              <span className="text-xs font-semibold whitespace-nowrap">Học kỳ hiện tại</span>
            </button>
          </div>

          {/* Quick Settings widget at bottom */}
          <div className="w-full px-3">
            <button
              onClick={() => {
                if (confirm("Bạn có muốn tải lại và reset sạch toàn bộ lịch sử điểm tự học?")) {
                  resetProgress();
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer text-left"
              title="Đặt lại thông tin tiến độ"
            >
              <Settings size={20} className="shrink-0" />
              <span className="text-xs font-semibold whitespace-nowrap">Reset dữ liệu</span>
            </button>
          </div>
        </aside>

        {/* Right workspace core content frame */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 flex flex-col gap-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 text-left">
              <strong>Lỗi tải dữ liệu:</strong> {error}
            </div>
          )}

          {!selectedCourse ? (
            /* STEP 1: CLASSROOM DIRECTORY DASHBOARD DISPLAY */
            loading ? (
              <div className="flex-1 flex flex-col justify-center items-center gap-3 py-16">
                <Loader2 className="animate-spin text-emerald-800" size={32} />
                <span className="text-gray-500 text-xs font-semibold">Đang đồng bộ lớp học và kỳ học của bạn...</span>
              </div>
            ) : (
              <CourseDirectory
                classes={filteredClasses}
                onSelectCourse={handleSelectCourse}
                years={years}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedSemester={selectedSemester}
                setSelectedSemester={setSelectedSemester}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            )
          ) : (
            /* STEP 2: INDIVIDUAL ACTIVE COURSE MANAGEMENT STAGE */
            currentView === "overview" ? (
              <div className="space-y-6 animate-fade-in text-left">

                {/* Google Classroom Universal Tab bar navigation */}
                <div id="classroom-tabs-nav" className="bg-white border-b border-gray-250 px-4 sm:px-6 flex items-center justify-between -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-4 sticky top-0 z-40 select-none">
                  <div className="flex items-center gap-1.5 md:gap-3 overflow-x-auto scrollbar-none h-13">
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition mr-1 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Quay lại tất cả lớp học"
                    >
                      <ArrowLeft size={16} className="inline" />
                      <span className="text-xs">Lớp học</span>
                    </button>

                    <div className="flex items-center h-full gap-1 border-b border-transparent">
                      <button
                        onClick={() => setActiveCourseTab("stream")}
                        className={`px-4 h-full text-xs font-bold flex items-center justify-center border-b-[3px] transition-all relative ${activeCourseTab === "stream"
                          ? "border-emerald-600 text-emerald-800 font-extrabold"
                          : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 cursor-pointer"
                          }`}
                      >
                        Bảng tin (Stream)
                      </button>

                      <button
                        onClick={() => setActiveCourseTab("classwork")}
                        className={`px-4 h-full text-xs font-bold flex items-center justify-center border-b-[3px] transition-all relative ${activeCourseTab === "classwork"
                          ? "border-emerald-600 text-emerald-800 font-extrabold"
                          : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 cursor-pointer"
                          }`}
                      >
                        Lộ trình học (Classwork)
                      </button>

                      <button
                        onClick={() => setActiveCourseTab("people")}
                        className={`px-4 h-full text-xs font-bold flex items-center justify-center border-b-[3px] transition-all relative ${activeCourseTab === "people"
                          ? "border-emerald-600 text-emerald-800 font-extrabold"
                          : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 cursor-pointer"
                          }`}
                      >
                        Thành viên (People)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => triggerNotification("📅 Đã liên kết và đồng bộ thời khóa biểu lớp với Google Calendar của bạn.", "info")}
                      className="p-2 text-gray-400 hover:text-gray-850 hover:bg-gray-100 rounded-full transition cursor-pointer"
                      title="Lịch học tập lớp"
                    >
                      <Calendar size={18} />
                    </button>
                    <button
                      onClick={() => triggerNotification("📁 Đang chuyển hướng đến thư mục học liệu dùng chung trên Google Drive.", "info")}
                      className="p-2 text-gray-400 hover:text-gray-850 hover:bg-gray-100 rounded-full transition cursor-pointer"
                      title="Thư mục Google Drive của lớp"
                    >
                      <FolderOpen size={18} />
                    </button>
                  </div>
                </div>

                {/* Stream tab content */}
                {activeCourseTab === "stream" && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Course Class Banner */}
                    <div
                      className="relative overflow-hidden rounded-2xl text-white p-6 sm:p-8 shadow-xs border border-gray-150 flex flex-col justify-end min-h-[140px] sm:min-h-[160px]"
                      style={{ background: "linear-gradient(135deg, #0d3e26 0%, #175d3c 100%)" }}
                    >
                      <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-xl pointer-events-none" />
                      <div className="relative z-10 flex flex-col text-left">
                        <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-emerald-300 drop-shadow-sm mb-1.5">
                          Hệ Thống Lớp Học Đảo Ngược
                        </span>
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight drop-shadow-md">
                          {selectedCourse.courseName}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs font-medium text-white/90">
                          <span>Mã môn: <strong className="font-bold text-white">{selectedCourse.courseCode || selectedCourse.id}</strong></span>
                          <span className="opacity-60">•</span>
                          <span>Lớp: <strong className="font-bold text-white">{selectedCourse.id}</strong></span>
                          <span className="opacity-60">•</span>
                          <span>Học kỳ: <strong className="font-bold text-white">{selectedSemester} {selectedYear}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Columns Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">



                      {/* Right Column: Interaction Feed */}
                      <div className="md:col-span-3 space-y-4">

                        {/* New Announcement Publisher */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-3xs">
                          {!isExpandingPublisher ? (
                            <div
                              onClick={() => setIsExpandingPublisher(true)}
                              className="flex items-center gap-3 cursor-pointer py-1.5 px-2.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-150 rounded-lg transition"
                            >
                              <div className="w-8 h-8 rounded-full bg-[#0a4823] text-white font-extrabold flex items-center justify-center text-xs shrink-0 select-none">
                                {studentName.trim().split(" ").pop()?.charAt(0).toUpperCase() || "S"}
                              </div>
                              <span className="text-[11px] text-gray-400 font-semibold">
                                Thông báo nội dung nào đó cho lớp học của bạn...
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-4 py-1 text-left">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#0a4823] text-white font-extrabold flex items-center justify-center text-xs shrink-0 select-none">
                                  {studentName.trim().split(" ").pop()?.charAt(0).toUpperCase() || "S"}
                                </div>
                                <div className="leading-none">
                                  <span className="text-xs font-bold text-gray-800 block">{studentName}</span>
                                  <span className="text-[9.5px] text-gray-400 font-bold mt-0.5 block uppercase">Học viên</span>
                                </div>
                              </div>

                              <textarea
                                value={announcementText}
                                onChange={(e) => setAnnouncementText(e.target.value)}
                                placeholder="Hãy dặn dò các thành viên trong nhóm hoặc thảo luận học liệu..."
                                className="w-full min-h-[90px] text-xs p-3 bg-gray-50 focus:bg-white border border-gray-200 focus:border-emerald-600 rounded-lg focus:outline-none transition leading-relaxed resize-none font-medium"
                              />

                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setAnnouncementText("");
                                    setIsExpandingPublisher(false);
                                  }}
                                  className="px-3.5 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={() => {
                                    if (!announcementText.trim()) return;
                                    const courseId = selectedCourse.id;
                                    const newAnn = {
                                      id: `ann-custom-${Date.now()}`,
                                      author: studentName,
                                      role: "Học viên",
                                      avatar: studentName.trim().split(" ").pop()?.charAt(0).toUpperCase() || "S",
                                      date: "Vừa xong",
                                      content: announcementText,
                                      comments: []
                                    };
                                    setAnnouncements(prev => ({
                                      ...prev,
                                      [courseId]: [newAnn, ...(prev[courseId] || [])]
                                    }));
                                    setAnnouncementText("");
                                    setIsExpandingPublisher(false);
                                    triggerNotification("📣 Đã đăng thông tin lên bảng tin lớp học thành công!", "success");
                                  }}
                                  className="px-4 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition cursor-pointer shadow-3xs"
                                >
                                  Đăng tin
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Thread Announcement Posts */}
                        {(announcements[selectedCourse.id] || []).map((ann) => (
                          <div key={ann.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-3xs text-left space-y-4">

                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#0a4823] text-white font-extrabold flex items-center justify-center text-sm shadow-2xs shrink-0 select-none">
                                  {ann.avatar}
                                </div>
                                <div className="leading-none">
                                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                    {ann.author}
                                    {ann.role === "Giảng viên lớp học" && (
                                      <span className="bg-emerald-50 text-emerald-800 font-extrabold text-[8.5px] px-1.5 py-0.5 rounded border border-emerald-100 uppercase">Teacher</span>
                                    )}
                                  </span>
                                  <span className="text-[9.5px] text-gray-400 font-semibold block mt-1 uppercase">
                                    {ann.date} • {ann.role}
                                  </span>
                                </div>
                              </div>
                              <button className="p-1 text-gray-400 hover:text-gray-700 rounded-full transition">
                                <MoreVertical size={16} />
                              </button>
                            </div>

                            <div className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-line bg-gray-50/40 p-3 rounded-lg border border-gray-100">
                              {ann.content}
                            </div>

                            {/* Class Comments list */}
                            <div className="border-t border-gray-100 pt-3 space-y-3">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase pl-1 select-none">
                                <MessageSquare size={13} />
                                <span>{ann.comments.length} Nhận xét lớp học</span>
                              </div>

                              {ann.comments.length > 0 && (
                                <div className="space-y-3 pl-2 sm:pl-4 max-h-[320px] overflow-y-auto pr-1">
                                  {ann.comments.map((comm) => (
                                    <div key={comm.id} className="flex items-start gap-2.5 text-xs">
                                      <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-750 font-extrabold flex items-center justify-center text-[10px] shrink-0 border border-gray-200 select-none">
                                        {comm.avatar}
                                      </div>
                                      <div className="bg-gray-50/70 py-2 px-3 rounded-xl flex-1 leading-normal border border-gray-100/50">
                                        <div className="flex items-baseline justify-between gap-2">
                                          <span className="font-extrabold text-gray-800 text-[11px]">{comm.author}</span>
                                          <span className="text-[9px] text-gray-400 font-semibold">{comm.date}</span>
                                        </div>
                                        <p className="text-gray-600 text-xs mt-1.5 leading-normal font-medium">
                                          {comm.content}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Comment typing form */}
                              <div className="flex items-center gap-2.5 pt-2 pl-1">
                                <div className="w-7 h-7 rounded-full bg-[#0a4823] text-white font-extrabold flex items-center justify-center text-[10px] shrink-0 select-none">
                                  {studentName.trim().split(" ").pop()?.charAt(0).toUpperCase() || "S"}
                                </div>
                                <div className="relative flex-1">
                                  <input
                                    type="text"
                                    placeholder="Thêm nhận xét lớp học..."
                                    value={commentInputs[ann.id] || ""}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [ann.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const val = commentInputs[ann.id] || "";
                                        if (!val.trim()) return;
                                        const newComment = {
                                          id: `comm-custom-${Date.now()}`,
                                          author: studentName,
                                          avatar: studentName.trim().split(" ").pop()?.charAt(0).toUpperCase() || "S",
                                          date: "Vừa xong",
                                          content: val
                                        };
                                        setAnnouncements(prev => {
                                          const updated = (prev[selectedCourse.id] || []).map(a => {
                                            if (a.id === ann.id) {
                                              return { ...a, comments: [...a.comments, newComment] };
                                            }
                                            return a;
                                          });
                                          return { ...prev, [selectedCourse.id]: updated };
                                        });
                                        setCommentInputs(prev => ({ ...prev, [ann.id]: "" }));
                                        triggerNotification("💬 Đã gửi nhận xét lớp học thành công.", "success");
                                      }
                                    }}
                                    className="w-full pl-3.5 pr-10 py-1.5 text-xs bg-gray-50 border border-gray-200 hover:bg-gray-100 focus:bg-white rounded-full focus:outline-none focus:border-emerald-600 transition font-medium text-left"
                                  />
                                  <button
                                    onClick={() => {
                                      const val = commentInputs[ann.id] || "";
                                      if (!val.trim()) return;
                                      const newComment = {
                                        id: `comm-custom-${Date.now()}`,
                                        author: studentName,
                                        avatar: studentName.trim().split(" ").pop()?.charAt(0).toUpperCase() || "S",
                                        date: "Vừa xong",
                                        content: val
                                      };
                                      setAnnouncements(prev => {
                                        const updated = (prev[selectedCourse.id] || []).map(a => {
                                          if (a.id === ann.id) {
                                            return { ...a, comments: [...a.comments, newComment] };
                                          }
                                          return a;
                                        });
                                        return { ...prev, [selectedCourse.id]: updated };
                                      });
                                      setCommentInputs(prev => ({ ...prev, [ann.id]: "" }));
                                      triggerNotification("💬 Đã gửi nhận xét lớp học thành công.", "success");
                                    }}
                                    className="absolute right-1 top-0.5 text-gray-400 hover:text-emerald-700 p-1.5 rounded-full transition cursor-pointer"
                                  >
                                    <Send size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Classwork tab content */}
                {activeCourseTab === "classwork" && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs">
                    <StudentRoadmap cls={selectedCourse} onBack={() => setActiveCourseTab("stream")} />
                  </div>
                )}

                {/* People tab content */}
                {activeCourseTab === "people" && (
                  <div className="max-w-3xl mx-auto space-y-8 select-none text-left animate-fade-in pt-3 w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs">

                    {/* Teachers panel */}
                    <div className="space-y-4">
                      <div className="border-b border-emerald-600 pb-2.5 flex justify-between items-center bg-transparent">
                        <h2 className="text-base font-extrabold font-sans text-emerald-800">Giảng viên phụ trách</h2>
                        <span className="text-[9px] text-emerald-700 font-bold uppercase font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">1 GV</span>
                      </div>

                      <div className="flex items-center gap-4 py-2 pl-2.5">
                        <div className="w-10 h-10 rounded-full bg-[#0a4823] text-emerald-100 font-extrabold flex items-center justify-center text-sm shadow-xs select-none">
                          {(selectedCourse.lecturerName?.[0] || "T").toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-800 block">
                            {selectedCourse.lecturerName || "Chưa phân công"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Classmates panel list */}
                    <div className="space-y-4">
                      <div className="border-b border-gray-250 pb-2.5 flex justify-between items-center">
                        <h2 className="text-base font-extrabold font-sans text-gray-800">Bạn học cùng lớp</h2>
                        <span className="text-[9px] text-gray-500 font-bold uppercase font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-150">{classStudents.length} Học viên</span>
                      </div>

                      {/* Search box for classmates */}
                      <input
                        type="text"
                        placeholder="Tìm kiếm bạn học bằng Tên hoặc Mã số..."
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        className="w-full text-xs p-2 bg-gray-50 focus:bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-600 transition font-medium"
                      />

                      <div className="divide-y divide-gray-150 divide-dashed mt-2">
                        {loadingStudents ? (
                          <div className="flex justify-center items-center py-6 gap-2">
                            <Loader2 className="animate-spin text-emerald-700" size={18} />
                            <span className="text-xs text-gray-400">Đang tải danh sách bạn học...</span>
                          </div>
                        ) : filteredClassmates.length === 0 ? (
                          <div className="text-center text-gray-400 text-xs py-6">Không có bạn học nào khớp.</div>
                        ) : (
                          filteredClassmates.map((std, i) => {
                            const isMe = std.studentId === studentCode;
                            const classmateInitial = std.fullName?.[0]?.toUpperCase() || "S";

                            return (
                              <div key={std.studentId} className="flex items-center gap-4 py-3 pl-2.5">
                                <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-xs shadow-3xs select-none border ${isMe ? "bg-emerald-600 text-white border-emerald-500" : "bg-gray-50 text-gray-650 border-gray-200"
                                  }`}>
                                  {classmateInitial}
                                </div>
                                <div className="flex-1 flex items-center justify-between pr-2.5">
                                  <div>
                                    <span className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                                      {std.fullName}
                                      {isMe && (
                                        <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[8px] px-1.5 py-0.5 rounded border border-emerald-100 uppercase scale-90">Bạn</span>
                                      )}
                                    </span>
                                    <span className="text-[10px] text-gray-400 block mt-0.5">Mã số: {std.studentId} • {std.email}</span>
                                  </div>
                                  {!isMe && (
                                    <span className="text-[10px] font-mono text-gray-400">Học viên</span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            ) : (
              /* Selected Course Live Lecture Player Screen */
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full min-h-[500px]">
                {/* Left Main player pane */}
                <div className="lg:col-span-2 flex flex-col h-full gap-4">
                  {/* Back navigation button row */}
                  <div className="flex items-center justify-between bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-2xs">
                    <button
                      onClick={() => setCurrentView("overview")}
                      className="text-xs font-bold text-gray-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition focus:outline-none bg-transparent border-0"
                    >
                      ← Quay lại Bảng tin lớp học
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-gray-600 hidden sm:inline">
                        Môn học: {selectedCourse.courseCode || selectedCourse.id}
                      </span>
                      <button
                        onClick={() => handleToggleComplete()}
                        className={`text-[9px] uppercase font-extrabold py-1.5 px-3.5 rounded border transition focus:outline-none cursor-pointer ${progress.completedLectures.includes(activeLecture?.id)
                          ? "bg-green-150 text-green-800 border-green-200"
                          : "bg-emerald-700 text-white border-emerald-600 hover:bg-emerald-800"
                          }`}
                      >
                        {progress.completedLectures.includes(activeLecture?.id) ? "✓ Đã hoàn thành" : "Đánh dấu hoàn thành"}
                      </button>
                    </div>
                  </div>

                  {/* Immersive Lecture stage */}
                  <div className="flex-1">
                    {activeLecture && (
                      <LessonPlayer
                        lecture={activeLecture}
                        sectionId={activeSectionId}
                        completedLectures={progress.completedLectures}
                        notes={progress.notes}
                        quizScores={progress.quizScores}
                        homeworkStatus={progress.homeworkStatus}
                        onAddNote={handleAddNote}
                        onDeleteNote={handleDeleteNote}
                        onSubmitQuizScore={handleSubmitQuizScore}
                        onToggleComplete={handleToggleComplete}
                        onSubmitHomework={handleSubmitHomework}
                        addPoints={addPoints}
                        triggerNotification={triggerNotification}
                      />
                    )}
                  </div>
                </div>

                {/* Right Course Outline Sidebar navigation */}
                <div className="h-[600px] lg:h-auto bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {syllabus && syllabus.length > 0 && activeLecture && (
                    <SidebarSyllabus
                      sections={syllabus}
                      activeLectureId={activeLecture.id}
                      completedLectures={progress.completedLectures}
                      onLectureSelect={(lecture, sectionId) => {
                        setActiveLecture(lecture);
                        setActiveSectionId(sectionId);
                      }}
                      onToggleComplete={handleToggleComplete}
                    />
                  )}
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
