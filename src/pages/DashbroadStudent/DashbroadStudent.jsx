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
  CircleAlert,
  BookOpen,
  ClipboardList,
  Award,
  Users
} from 'lucide-react';

// Services
import { logout, getUser } from '../../services/authService';
import { getAcademicTerms, getStudentClasses, getClassStudents } from '../../services/studentService';
import { fetchClassBlogs, createBlog } from '../../services/blogService';

// LMS Components
import HeaderLMS from './lms/HeaderLMS';
import CourseDirectory from './lms/CourseDirectory';
import LessonPlayer from './lms/LessonPlayer';
import SidebarSyllabus from './lms/SidebarSyllabus';
import StudentRoadmap from './StudentRoadmap';
import StudentAssignments from './StudentAssignments';
import StudentGrades from './StudentGrades';
import SharedBlogForum from '../../components/SharedBlogForum/SharedBlogForum';
import ChangePasswordModal from '../../components/ChangePasswordModal/ChangePasswordModal';

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
}

// ─── Google Classroom Three-State Sidebar Nav Item ────────────
//  collapsed  → icon-only, 40px pill centered, tooltip on hover
//  expanded   → icon + label, full-width pill, left-aligned
function SidebarNavItem({ icon, label, isActive, onClick, title, collapsed }) {
  const [hov, setHov] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);

  const handleMouseEnter = () => {
    setHov(true);
    // Only show tooltip when fully collapsed (not during hover-expansion transition)
    if (collapsed) setShowTooltip(true);
  };
  const handleMouseLeave = () => {
    setHov(false);
    setShowTooltip(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={title}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '12px',
          width: collapsed ? '40px' : '100%',
          height: '48px',
          borderRadius: '999px',
          fontSize: '14px',
          fontWeight: isActive ? 600 : 500,
          color: isActive ? '#0f766e' : (hov ? '#111827' : '#4B5563'),
          background: isActive
            ? 'rgba(15, 118, 110, 0.12)'
            : hov ? '#F1F3F4' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
          transition: 'background 200ms ease, color 200ms ease, width 280ms ease-in-out',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          flexShrink: 0,
          padding: collapsed ? '0' : '0 16px 0 12px',
          margin: collapsed ? '0 auto' : '0',
          boxSizing: 'border-box',
        }}
      >
        {/* Icon — ALWAYS rendered and visible */}
        <span style={{
          color: isActive ? '#0f766e' : (hov ? '#374151' : '#5F6368'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          minWidth: '20px',
          width: '20px',
          height: '20px',
          transition: 'color 200ms ease',
        }}>
          {icon}
        </span>

        {/* Label — fades + slides when toggling */}
        <span style={{
          opacity: collapsed ? 0 : 1,
          transform: collapsed ? 'translateX(-8px)' : 'translateX(0)',
          maxWidth: collapsed ? '0px' : '180px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          pointerEvents: collapsed ? 'none' : 'auto',
          transition: [
            'opacity 200ms ease',
            'transform 220ms ease',
            'max-width 280ms ease-in-out',
          ].join(', '),
        }}>
          {label}
        </span>
      </button>

      {/* Tooltip — only when truly collapsed (not hover-expanding) */}
      {collapsed && showTooltip && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: 'calc(100% + 14px)',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#3C4043',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: 1.4,
            padding: '6px 12px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            animation: 'fadeInTooltip 150ms ease-out forwards',
          }}
        >
          {label}
          {/* Arrow pointing left */}
          <span style={{
            position: 'absolute',
            right: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderRight: '6px solid #3C4043',
          }} />
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  SidebarRail — Three-State Google Classroom Navigation Rail
//
//  State 1 — Collapsed (default)
//    • width: 72px  • icons only, centered  • tooltip on hover
//
//  State 2 — Hover-Expanded
//    • when mouse enters → auto-expand to 240px  • labels visible
//    • when mouse leaves → collapse back to 72px
//
//  State 3 — Pinned
//    • hamburger button clicked → always expanded at 240px
//    • clicking again → back to hover/collapsed behavior
//
//  isPinned: driven by existing sidebarOpen state (no new state added)
//  isHovered: local to this component
//  isExpanded = isPinned || isHovered
// ────────────────────────────────────────────────────────────────
function SidebarRail({ isPinned, selectedCourse, location, setSelectedCourse, navigate }) {
  const [isHovered, setIsHovered] = React.useState(false);

  // The sidebar is "visually expanded" when pinned OR hovered
  const isExpanded = isPinned || isHovered;
  // Icons show tooltip only when sidebar is truly collapsed (not hovering or pinned)
  const collapsed = !isExpanded;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        /* Width drives the three states */
        width: isExpanded ? '240px' : '72px',
        flexShrink: 0,
        background: '#ffffff',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        padding: isExpanded ? '16px 12px 16px' : '16px 0 16px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        /* Core animation: width + padding transition */
        transition: [
          'width 280ms ease-in-out',
          'padding 280ms ease-in-out',
        ].join(', '),
        userSelect: 'none',
        boxSizing: 'border-box',
        /* Elevated enough to cover content when hover-expanding */
        zIndex: isHovered && !isPinned ? 20 : 'auto',
        /* Subtle shadow when hover-expanded (not pinned) to indicate overlay */
        boxShadow: isHovered && !isPinned
          ? '4px 0 16px rgba(0,0,0,0.08)'
          : 'none',
      }}
    >
      {/* ── Pin indicator dot (shows when pinned) ── */}
      {isPinned && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '10px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#0f766e',
          opacity: 0.7,
          transition: 'opacity 200ms ease',
        }} />
      )}

      {/* ── Nav items ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1,
        /* Center items when collapsed; stretch when expanded */
        alignItems: isExpanded ? 'stretch' : 'center',
        transition: 'align-items 0ms',
      }}>

        {/* 1. Home / Lớp học */}
        <SidebarNavItem
          icon={<Home size={20} />}
          label="Lớp học"
          isActive={!selectedCourse && location.pathname === '/dashboard/student'}
          onClick={() => { setSelectedCourse(null); navigate('/dashboard/student'); }}
          title="Lớp học của tôi"
          collapsed={collapsed}
        />

        {/* 2. Học kỳ hiện tại */}
        <SidebarNavItem
          icon={<GraduationCap size={20} />}
          label="Học kỳ hiện tại"
          isActive={false}
          onClick={() => { setSelectedCourse(null); navigate('/dashboard/student'); }}
          title="Khóa đào tạo"
          collapsed={collapsed}
        />

        {/* 3. Blog & Diễn đàn */}
        <SidebarNavItem
          icon={<MessageSquare size={20} />}
          label="Blog & Diễn đàn"
          isActive={location.pathname === '/dashboard/student/blog'}
          onClick={() => { setSelectedCourse(null); navigate('/dashboard/student/blog'); }}
          title="Blog & Diễn đàn"
          collapsed={collapsed}
        />

      </div>

      {/* ── Hover-mode hint (shown at bottom when hover-expanded but not pinned) ── */}
      {isHovered && !isPinned && (
        <div style={{
          marginTop: 'auto',
          paddingTop: '12px',
          borderTop: '1px solid #F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          opacity: 0.55,
          animation: 'fadeIn 200ms ease-out',
        }}>
          <span style={{ fontSize: '10px', color: '#6B7280', whiteSpace: 'nowrap', fontWeight: 500 }}>
            Nhấn ☰ để ghim
          </span>
        </div>
      )}
    </aside>
  );
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
  const [classBlogs, setClassBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [refreshBlogsKey, setRefreshBlogsKey] = useState(0);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Navigation & LMS States
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentView, setCurrentView] = useState("overview"); // "overview" | "player"
  const [activeCourseTab, setActiveCourseTab] = useState("stream"); // "stream" | "classwork" | "people"
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar toggle state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Announcements State
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [isExpandingPublisher, setIsExpandingPublisher] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [blogForDetail, setBlogForDetail] = useState(null);

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

  // 4. Load class blogs when a course is selected
  useEffect(() => {
    if (!selectedCourse) {
      setClassBlogs([]);
      return;
    }

    const fetchBlogs = async () => {
      setLoadingBlogs(true);
      try {
        const blogsData = await fetchClassBlogs(selectedCourse.id);
        setClassBlogs(Array.isArray(blogsData) ? blogsData : []);
      } catch (err) {
        console.error('Lỗi tải danh sách bài viết lớp:', err);
      } finally {
        setLoadingBlogs(false);
      }
    };

    fetchBlogs();
  }, [selectedCourse, refreshBlogsKey]);

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Vừa xong';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  const handlePostBlog = async () => {
    if (!announcementText.trim() || !announcementTitle.trim() || !selectedCourse) {
      triggerNotification("⚠️ Vui lòng nhập đầy đủ tiêu đề và nội dung thảo luận.", "info");
      return;
    }

    try {
      setLoadingBlogs(true);
      const payload = {
        title: announcementTitle,
        content: announcementText,
        courseId: selectedCourse.courseId || selectedCourse.id,
        classId: selectedCourse.id,
        authorId: currentUser?.id,
        isPrivate: true, // Default to class-level discussion
        keywords: null
      };

      await createBlog(payload);
      setAnnouncementText("");
      setAnnouncementTitle("");
      setIsExpandingPublisher(false);
      setRefreshBlogsKey(prev => prev + 1);
      triggerNotification("📣 Đã đăng bài thảo luận thành công!", "success");
    } catch (err) {
      console.error('Lỗi khi đăng bài:', err);
      triggerNotification("❌ Lỗi khi đăng bài: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setLoadingBlogs(false);
    }
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
  const studentCode = currentUser?.username || currentUser?.id || 'SV-2026';
  const studentEmail = currentUser?.email || '';

  return (
    <div id="flipped-classroom-app-root" style={{ background: '#F7F9FC', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

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
        onHome={() => {
          setSelectedCourse(null);
          navigate('/dashboard/student');
        }}
        onChangePassword={() => setChangePasswordOpen(true)}
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
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/*
         * ── Three-State Sidebar (Google Classroom style) ──────────────
         *  sidebarOpen (existing state) → now means "isPinned"
         *  isHovered   (local state)    → hover-expand trigger
         *  isExpanded  = isPinned || isHovered → drives all visual states
         *
         * States:
         *  1. Collapsed (default)  → 72px, icons only
         *  2. Hover Expanded       → 240px while mouse is inside
         *  3. Pinned               → hamburger clicked → always 240px
         * ─────────────────────────────────────────────────────────────
         */}
        <SidebarRail
          isPinned={sidebarOpen}
          selectedCourse={selectedCourse}
          location={location}
          setSelectedCourse={setSelectedCourse}
          navigate={navigate}
        />

        {/* ── Right workspace core content frame ── */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#F7F9FC', display: 'flex', flexDirection: 'column', gap: '0' }}>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 text-left">
              <strong>Lỗi tải dữ liệu:</strong> {error}
            </div>
          )}

          {location.pathname === "/dashboard/student/blog" ? (
            <div className="animate-fade-in">
              <SharedBlogForum
                initialSelectedBlog={blogForDetail}
                onClearInitialBlog={() => setBlogForDetail(null)}
              />
            </div>
          ) : !selectedCourse ? (
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
                <div id="classroom-tabs-nav" className="bg-white border-b border-gray-250 px-4 sm:px-6 flex items-center justify-between -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-4 sticky top-0 z-40 select-none shadow-xs">
                  <div className="flex items-center gap-1.5 md:gap-3 overflow-x-auto scrollbar-none py-2.5">
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition duration-300 ease-in-out shrink-0 cursor-pointer"
                      title="Quay lại tất cả lớp học"
                    >
                      <ArrowLeft size={15} />
                      <span>Lớp học</span>
                    </button>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => setActiveCourseTab("stream")}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ease-in-out shrink-0 cursor-pointer ${activeCourseTab === "stream"
                          ? "bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/50 scale-102"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:scale-101"
                          }`}
                      >
                        <MessageSquare size={14} className={activeCourseTab === "stream" ? "text-emerald-600" : ""} />
                        <span>Bảng tin (Stream)</span>
                      </button>

                      <button
                        onClick={() => setActiveCourseTab("classwork")}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ease-in-out shrink-0 cursor-pointer ${activeCourseTab === "classwork"
                          ? "bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/50 scale-102"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:scale-101"
                          }`}
                      >
                        <BookOpen size={14} className={activeCourseTab === "classwork" ? "text-emerald-600" : ""} />
                        <span>Học liệu</span>
                      </button>

                      <button
                        onClick={() => setActiveCourseTab("assignments")}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ease-in-out shrink-0 cursor-pointer ${activeCourseTab === "assignments"
                          ? "bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/50 scale-102"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:scale-101"
                          }`}
                      >
                        <ClipboardList size={14} className={activeCourseTab === "assignments" ? "text-emerald-600" : ""} />
                        <span>Bài tập</span>
                      </button>

                      <button
                        onClick={() => setActiveCourseTab("grades")}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ease-in-out shrink-0 cursor-pointer ${activeCourseTab === "grades"
                          ? "bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/50 scale-102"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:scale-101"
                          }`}
                      >
                        <Award size={14} className={activeCourseTab === "grades" ? "text-emerald-600" : ""} />
                        <span>Điểm &amp; Nhận xét</span>
                      </button>

                      <button
                        onClick={() => setActiveCourseTab("people")}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ease-in-out shrink-0 cursor-pointer ${activeCourseTab === "people"
                          ? "bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/50 scale-102"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:scale-101"
                          }`}
                      >
                        <Users size={14} className={activeCourseTab === "people" ? "text-emerald-600" : ""} />
                        <span>Thành viên (People)</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 py-2.5">
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

                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={announcementTitle}
                                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                                  placeholder="Tiêu đề thảo luận (ví dụ: Thắc mắc về Lab 1)..."
                                  className="w-full text-xs font-bold p-3 bg-gray-50 focus:bg-white border border-gray-200 focus:border-emerald-600 rounded-lg focus:outline-none transition"
                                />
                                <textarea
                                  value={announcementText}
                                  onChange={(e) => setAnnouncementText(e.target.value)}
                                  placeholder="Nội dung thảo luận chi tiết..."
                                  className="w-full min-h-[120px] text-xs p-3 bg-gray-50 focus:bg-white border border-gray-200 focus:border-emerald-600 rounded-lg focus:outline-none transition leading-relaxed resize-none font-medium"
                                />
                              </div>

                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setAnnouncementText("");
                                    setAnnouncementTitle("");
                                    setIsExpandingPublisher(false);
                                  }}
                                  className="px-3.5 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={handlePostBlog}
                                  disabled={loadingBlogs}
                                  className={`px-4 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition cursor-pointer shadow-3xs flex items-center gap-2 ${loadingBlogs ? 'opacity-70' : ''}`}
                                >
                                  {loadingBlogs && <Loader2 size={12} className="animate-spin" />}
                                  Đăng tin
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Thread Blog Posts (Real data) */}
                        {loadingBlogs && classBlogs.length === 0 ? (
                          <div className="flex justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-emerald-700" />
                          </div>
                        ) : classBlogs.length > 0 ? (
                          classBlogs.map((blog) => (
                            <div key={blog.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-3xs text-left space-y-4">

                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-[#0a4823] text-white font-extrabold flex items-center justify-center text-sm shadow-2xs shrink-0 select-none">
                                    {blog.authorFullName?.[0]?.toUpperCase() || "S"}
                                  </div>
                                  <div className="leading-none">
                                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                      {blog.authorFullName}
                                      {(() => {
                                        const r = String(blog.role || blog.authorRole || blog.AuthorRole || "").toLowerCase();
                                        if (r === "admin") return <span className="bg-rose-50 text-rose-800 font-extrabold text-[8.5px] px-1.5 py-0.5 rounded border border-rose-100 uppercase">Admin</span>;
                                        if (r === "lecturer" || r === "teacher" || r.includes("giảng viên")) return <span className="bg-emerald-50 text-emerald-800 font-extrabold text-[8.5px] px-1.5 py-0.5 rounded border border-emerald-100 uppercase">Giảng viên</span>;
                                        return <span className="bg-gray-50 text-gray-600 font-extrabold text-[8.5px] px-1.5 py-0.5 rounded border border-gray-100 uppercase">Học viên</span>;
                                      })()}
                                    </span>
                                    <span className="text-[9.5px] text-gray-400 font-semibold block mt-1 uppercase">
                                      {formatDate(blog.createdAt)} • {(() => {
                                        const r = String(blog.role || blog.authorRole || blog.AuthorRole || "").toLowerCase();
                                        if (r === "admin") return "Admin";
                                        if (r === "lecturer" || r === "teacher" || r.includes("giảng viên")) return "Giảng viên";
                                        return "Học viên";
                                      })()}
                                    </span>
                                  </div>
                                </div>
                                <button className="p-1 text-gray-400 hover:text-gray-700 rounded-full transition">
                                  <MoreVertical size={16} />
                                </button>
                              </div>

                              <div className="space-y-2 overflow-hidden">
                                <h4 className="text-sm font-bold text-gray-900 break-words">{blog.title}</h4>
                                <div className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-line bg-gray-50/40 p-3 rounded-lg border border-gray-100 break-words">
                                  {blog.content}
                                </div>
                              </div>

                              {/* Blog Interactions - Link to detail or comments */}
                              <div className="border-t border-gray-100 pt-3 flex items-center gap-4">
                                <button
                                  onClick={() => {
                                    setBlogForDetail(blog);
                                    navigate('/dashboard/student/blog');
                                  }}
                                  className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase hover:underline cursor-pointer"
                                >
                                  <MessageSquare size={13} />
                                  <span>Xem thảo luận & bình luận</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-xs text-gray-400 font-medium">Chưa có thông báo hay bài thảo luận nào trong lớp này.</p>
                          </div>
                        )}
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

                {/* Assignments tab content */}
                {activeCourseTab === "assignments" && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs">
                    <StudentAssignments cls={selectedCourse} />
                  </div>
                )}

                {/* Grades & Feedback tab content */}
                {activeCourseTab === "grades" && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs">
                    <StudentGrades cls={selectedCourse} />
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
      <ChangePasswordModal isOpen={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </div>
  );
}
