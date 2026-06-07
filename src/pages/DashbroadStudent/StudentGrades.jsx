import { useState, useEffect } from 'react';
import {
    Search, ArrowLeft, ChevronRight,
    CheckCircle, AlertCircle, Clock,
    FileText, Award, BookOpen
} from 'lucide-react';
import { getMyClassesGrades, getClassGrades, getSubmissionGradeDetail } from '../../services/studentService';
import styles from './StudentGrades.module.css';

/* ─────────────────── Helpers ─────────────────── */
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        });
    } catch {
        return dateStr;
    }
};

/* ======================================================
   VIEW 1: Danh sách lớp học (Card Grid + Bộ lọc)
   ====================================================== */
function ClassListView({ onSelectClass }) {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterYear, setFilterYear] = useState('all');
    const [filterSemester, setFilterSemester] = useState('all');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedYear, setAppliedYear] = useState('all');
    const [appliedSemester, setAppliedSemester] = useState('all');

    useEffect(() => {
        setLoading(true);
        getMyClassesGrades().then((data) => {
            setClasses(data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSearch = () => {
        setAppliedSearch(searchTerm);
        setAppliedYear(filterYear);
        setAppliedSemester(filterSemester);
    };

    const filtered = classes.filter((cls) => {
        const matchSearch = cls.courseName?.toLowerCase().includes(appliedSearch.toLowerCase())
            || cls.id?.toLowerCase().includes(appliedSearch.toLowerCase());

        const termName = cls.termName || cls.termCode || '';
        const matchYear = appliedYear === 'all' || termName.includes(appliedYear);

        let matchSemester = true;
        if (appliedSemester !== 'all') {
            if (appliedSemester === '1') matchSemester = termName.includes('Học kỳ 1') || termName.toLowerCase().includes('hk1');
            if (appliedSemester === '2') matchSemester = termName.includes('Học kỳ 2') || termName.toLowerCase().includes('hk2');
            if (appliedSemester === '3') matchSemester = termName.includes('Học kỳ 3') || termName.toLowerCase().includes('hk3') || termName.includes('hè');
        }

        return matchSearch && matchYear && matchSemester;
    });

    return (
        <div className={styles.view}>
            {/* Header */}
            <div className={styles.viewHeader}>
                <h2 className={styles.viewTitle}>
                    <Award className={styles.viewTitleIcon} />
                    Điểm số và nhận xét từ giảng viên
                </h2>
                <p className={styles.viewDesc}>
                    Xem danh sách lớp học để tra cứu chi tiết bảng điểm và đánh giá từ giảng viên phụ trách.
                </p>
            </div>

            {/* Filter section */}
            <div className={styles.filterBox}>
                <span className={styles.filterLabel}>Lọc danh sách lớp học</span>
                <div className={styles.filterGrid}>
                    <div className={styles.filterField}>
                        <span className={styles.filterFieldLabel}>Tên lớp học</span>
                        <div className={styles.searchInputWrap}>
                            <Search className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Nhập tên lớp học..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                className={styles.searchInput}
                            />
                        </div>
                    </div>

                    <div className={styles.filterField}>
                        <span className={styles.filterFieldLabel}>Chọn năm học</span>
                        <select
                            value={filterYear}
                            onChange={e => setFilterYear(e.target.value)}
                            className={styles.selectInput}
                        >
                            <option value="all">Tất cả năm học</option>
                            <option value="2024-2025">Năm học 2024-2025</option>
                            <option value="2025-2026">Năm học 2025-2026</option>
                            <option value="2026-2027">Năm học 2026-2027</option>
                        </select>
                    </div>

                    <div className={styles.filterField}>
                        <span className={styles.filterFieldLabel}>Chọn kì học (3 kì/năm)</span>
                        <select
                            value={filterSemester}
                            onChange={e => setFilterSemester(e.target.value)}
                            className={styles.selectInput}
                        >
                            <option value="all">Tất cả học kỳ</option>
                            <option value="1">Học kỳ 1</option>
                            <option value="2">Học kỳ 2</option>
                            <option value="3">Học kỳ 3 (Học kỳ hè)</option>
                        </select>
                    </div>

                    <div className={styles.filterBtnWrap}>
                        <button onClick={handleSearch} className={styles.filterBtn}>
                            <Search className={styles.filterBtnIcon} />
                            <span>Tìm kiếm</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Class cards */}
            {loading ? (
                <div className={styles.emptyState}>
                    <div className={styles.loadingSpinner} />
                    <span>Đang tải danh sách lớp học...</span>
                </div>
            ) : (
                <div className={styles.cardGrid}>
                    {filtered.map((cls) => {
                        const graded = cls.gradedAssignmentsCount;
                        const avg = cls.averageGrade;

                        return (
                            <div
                                key={cls.id}
                                className={styles.classCard}
                                onClick={() => onSelectClass(cls)}
                            >
                                <div className={styles.classCardTop}>
                                    <span className={styles.termBadge}>
                                        {cls.termName || cls.termCode || 'Khóa học'}
                                    </span>
                                    <span className={styles.yearBadge}>
                                        {cls.academicYear || 'N/A'}
                                    </span>
                                </div>

                                <h3 className={styles.classCardName}>{cls.courseName || cls.id}</h3>

                                <div className={styles.classCardStats} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div className={styles.progressRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className={styles.progressLabel} style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            Đã chấm: <strong style={{ color: '#0f172a' }}>{graded}</strong> bài
                                        </span>
                                        <span className={styles.progressPct} style={{ color: '#0D3E26', fontWeight: 800 }}>
                                            {avg !== null ? `${avg.toFixed(1)}đ` : '—'}
                                        </span>
                                    </div>
                                    <div className={styles.progressRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className={styles.progressLabel} style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            Trạng thái: <strong style={{ color: '#0f172a' }}>{cls.learningStatus || 'Chưa xác định'}</strong>
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.classCardFooter}>
                                    <span className={styles.viewDetailLink}>
                                        Xem điểm và nhận xét
                                        <ChevronRight className={styles.chevronIcon} />
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {filtered.length === 0 && classes.length > 0 && (
                        <div className={`${styles.emptyState} ${styles.colSpanFull}`}>
                            Không tìm thấy lớp học nào phù hợp với bộ lọc.
                        </div>
                    )}
                    {classes.length === 0 && (
                        <div className={`${styles.emptyState} ${styles.colSpanFull}`}>
                            <BookOpen className={styles.emptyIcon} />
                            <span>Bạn hiện chưa tham gia lớp học nào.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ======================================================
   VIEW 2: Chi tiết lớp — Danh sách bài tập & Điểm
   ====================================================== */
function AssignmentListView({ classInfo, onBack, onSelectAssignment }) {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getClassGrades(classInfo.id).then(data => {
            setAssignments(data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [classInfo.id]);

    const graded = assignments.filter(a => a.mySubmission?.status === 'GRADED').length;
    const total = assignments.length;
    const pct = total > 0 ? Math.round((graded / total) * 100) : 0;

    return (
        <div className={styles.view}>
            {/* Back button */}
            <button onClick={onBack} className={styles.backBtn}>
                <ArrowLeft className={styles.backBtnIcon} />
                Quay lại danh sách lớp
            </button>

            {/* Class header */}
            <div className={styles.detailHeader}>
                <div>
                    <h2 className={styles.detailTitle}>
                        Bảng điểm lớp:{' '}
                        <span className={styles.detailTitleHighlight}>{classInfo.courseName || classInfo.id}</span>
                    </h2>
                    <p className={styles.detailDesc}>
                        Danh sách bài tập và điểm số chi tiết kèm theo đánh giá từ giảng viên phụ trách.
                    </p>
                </div>
                <div className={styles.summaryBadge}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Đã chấm</span>
                        <span className={styles.summaryValue}>{graded}/{total} bài</span>
                    </div>
                    <div className={styles.summaryProgress}>
                        <div className={styles.summaryProgressFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.summaryPct}>{pct}%</span>
                </div>
            </div>

            {loading ? (
                <div className={styles.emptyState}>
                    <div className={styles.loadingSpinner} />
                    <span>Đang tải bảng điểm...</span>
                </div>
            ) : (
                <div className={styles.assignmentList}>
                    {assignments.map((asg) => {
                        const sub = asg.mySubmission;
                        const isGraded = sub?.status === 'GRADED' && sub?.grade !== null;
                        const isSubmitted = sub?.status === 'SUBMITTED' || (sub !== null && sub?.grade === null);

                        let colorStyle = 'pending';
                        let statusText = 'Chưa nộp';
                        let statusIcon = Clock;

                        if (isGraded) {
                            colorStyle = 'graded';
                            statusText = 'Đã chấm điểm';
                            statusIcon = CheckCircle;
                        } else if (isSubmitted) {
                            colorStyle = 'submitted';
                            statusText = 'Đang chờ chấm';
                            statusIcon = Clock;
                        }

                        const StatusIcon = statusIcon;

                        return (
                            <div
                                key={asg.id}
                                className={`${styles.asgCard} ${styles[`asgCard_${colorStyle}`]}`}
                                onClick={() => {
                                    if (sub) {
                                        onSelectAssignment(sub.id);
                                    }
                                }}
                                style={{ cursor: sub ? 'pointer' : 'default' }}
                            >
                                <div className={styles.asgCardLeft}>
                                    <div className={styles.asgMeta}>
                                        <span className={styles.asgDueBadge}>
                                            Hạn nộp: {formatDate(asg.dueDate)}
                                        </span>
                                    </div>
                                    <h4 className={styles.asgTitle}>{asg.title}</h4>
                                    <p className={styles.asgDesc}>{asg.description}</p>

                                    {sub && (
                                        <div className={styles.submittedInfo} style={{ marginTop: '0.75rem' }}>
                                            <FileText className={styles.submittedFileIcon} />
                                            <span>Bài nộp: <strong>{sub.fileName}</strong></span>
                                            {sub.feedback && (
                                                <div style={{ marginTop: '0.4rem', fontStyle: 'italic', color: '#475569', fontSize: '0.8rem' }}>
                                                    💬 Nhận xét: "{sub.feedback.length > 80 ? sub.feedback.substring(0, 80) + '...' : sub.feedback}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.asgCardRight}>
                                    <span className={`${styles.statusBadge} ${styles[`status_${colorStyle}`]}`}>
                                        <StatusIcon className={styles.statusIcon} />
                                        {statusText}
                                    </span>
                                    
                                    <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                                        {isGraded ? (
                                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0D3E26' }}>
                                                {sub.grade} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}>/ {asg.maxPoints}đ</span>
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '1rem', color: '#94a3b8' }}>
                                                — <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>/ {asg.maxPoints}đ</span>
                                            </span>
                                        )}
                                    </div>

                                    {sub && (
                                        <button
                                            type="button"
                                            className={`${styles.asgActionBtn} ${styles.asgActionBtnSecondary}`}
                                            onClick={(e) => { e.stopPropagation(); onSelectAssignment(sub.id); }}
                                            style={{ marginTop: '0.75rem' }}
                                        >
                                            Xem nhận xét
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {assignments.length === 0 && (
                        <div className={styles.emptyState}>
                            <CheckCircle className={styles.emptyIcon} />
                            <span>Lớp học chưa có bài tập nào.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ======================================================
   VIEW 3: Chi tiết điểm — Assignment & Feedback Detail
   ====================================================== */
function GradeDetailView({ submissionId, onBack }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setDetail(null);
        setLoading(true);
        getSubmissionGradeDetail(submissionId).then(data => {
            setDetail(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [submissionId]);

    if (loading) {
        return (
            <div className={styles.view}>
                <button onClick={onBack} className={styles.backBtn}>
                    <ArrowLeft className={styles.backBtnIcon} />
                    Quay lại danh sách bài tập
                </button>
                <div className={styles.emptyState}>
                    <div className={styles.loadingSpinner} />
                    <span>Đang tải chi tiết điểm...</span>
                </div>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className={styles.view}>
                <button onClick={onBack} className={styles.backBtn}>
                    <ArrowLeft className={styles.backBtnIcon} />
                    Quay lại danh sách bài tập
                </button>
                <div className={styles.emptyState}>
                    <AlertCircle className={styles.emptyIcon} />
                    <span>Không tìm thấy thông tin điểm của bài nộp này.</span>
                </div>
            </div>
        );
    }

    const isGraded = detail.grade !== null && detail.grade !== undefined;

    return (
        <div className={styles.view}>
            {/* Back button */}
            <button onClick={onBack} className={styles.backBtn}>
                <ArrowLeft className={styles.backBtnIcon} />
                Quay lại danh sách bài tập
            </button>

            <div className={styles.detailLayout}>
                {/* Left panel: Info */}
                <div className={styles.asgInfoPanel} style={{ width: '100%' }}>
                    <div className={styles.asgInfoHeader}>
                        <span className={styles.asgInfoChip}>Đánh giá &amp; Điểm số</span>
                        <span className={`${styles.statusBadge} ${styles[isGraded ? 'status_graded' : 'status_submitted']}`}>
                            {isGraded ? 'Đã chấm điểm' : 'Chờ chấm điểm'}
                        </span>
                    </div>

                    <h3 className={styles.asgInfoTitle}>{detail.assignmentTitle}</h3>
                    <p className={styles.asgInfoDesc}>{detail.assignmentDescription || 'Không có mô tả bài tập.'}</p>

                    <div className={styles.asgMeta2}>
                        <div className={styles.asgMetaRow}>
                            <span className={styles.asgMetaKey}>Hạn nộp bài:</span>
                            <span className={styles.asgMetaVal}>{formatDate(detail.dueDate)}</span>
                        </div>
                        <div className={styles.asgMetaRow}>
                            <span className={styles.asgMetaKey}>Điểm tối đa:</span>
                            <span className={styles.asgMetaVal}><strong>{detail.maxPoints} điểm</strong></span>
                        </div>
                    </div>

                    {/* Result and Feedback */}
                    <div className={styles.submissionResult} style={{ marginTop: '1.5rem' }}>
                        <div className={styles.submissionResultHeader}>
                            <CheckCircle className={styles.submissionResultIcon} />
                            <span>Thông tin nộp bài &amp; Chấm điểm</span>
                        </div>
                        <div className={styles.submissionResultBody}>
                            <div className={styles.submissionResultRow}>
                                <FileText className={styles.fileIcon} />
                                <div>
                                    <span className={styles.fileLabel}>Tập tin bài làm:</span>
                                    <strong className={styles.fileName}>{detail.fileName}</strong>
                                </div>
                            </div>
                            <div className={styles.submissionResultRow}>
                                <Clock className={styles.fileIcon} />
                                <div>
                                    <span className={styles.fileLabel}>Thời gian nộp:</span>
                                    <span className={styles.fileName}>{formatDate(detail.submittedAt)} {new Date(detail.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            {detail.studentNotes && (
                                <div style={{ margin: '0.75rem 0', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', borderLeft: '3px solid #cbd5e1' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Lời nhắn của sinh viên:</span>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>"{detail.studentNotes}"</p>
                                </div>
                            )}

                            {isGraded ? (
                                <div className={styles.gradeBox} style={{ marginTop: '1.5rem' }}>
                                    <span className={styles.gradeLabel}>Điểm số đạt được</span>
                                    <span className={styles.gradeValue}>
                                        {detail.grade}
                                        <span className={styles.gradeMax}>/{detail.maxPoints}đ</span>
                                    </span>

                                    {detail.feedback ? (
                                        <div className={styles.feedbackBox}>
                                            <span className={styles.feedbackLabel}>💬 Nhận xét chi tiết từ giảng viên:</span>
                                            <p className={styles.feedbackText}>"{detail.feedback}"</p>
                                            {detail.gradedAt && (
                                                <span style={{ display: 'block', textAlign: 'right', fontSize: '0.7rem', color: '#059669', marginTop: '0.5rem' }}>
                                                    Ngày chấm: {formatDate(detail.gradedAt)}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={styles.feedbackBox} style={{ fontStyle: 'italic', color: '#64748b' }}>
                                            Giảng viên không để lại nhận xét bằng văn bản.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.waitingBox} style={{ marginTop: '1.5rem' }}>
                                    <Clock className={styles.waitingIcon} />
                                    <span>Đang chờ giảng viên chấm điểm và nhận xét...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ======================================================
   MAIN COMPONENT
   ====================================================== */
export default function StudentGrades() {
    const [view, setView] = useState('classList'); // 'classList' | 'assignmentList' | 'assignmentDetail'
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);

    const handleSelectClass = (cls) => {
        setSelectedClass(cls);
        setView('assignmentList');
    };

    const handleSelectAssignment = (submissionId) => {
        setSelectedSubmissionId(submissionId);
        setView('assignmentDetail');
    };

    const handleBackToClassList = () => {
        setSelectedClass(null);
        setView('classList');
    };

    const handleBackToAssignmentList = () => {
        setSelectedSubmissionId(null);
        setView('assignmentList');
    };

    return (
        <div className={styles.container}>
            {view === 'classList' && (
                <ClassListView onSelectClass={handleSelectClass} />
            )}
            {view === 'assignmentList' && selectedClass && (
                <AssignmentListView
                    classInfo={selectedClass}
                    onBack={handleBackToClassList}
                    onSelectAssignment={handleSelectAssignment}
                />
            )}
            {view === 'assignmentDetail' && selectedSubmissionId && (
                <GradeDetailView
                    submissionId={selectedSubmissionId}
                    onBack={handleBackToAssignmentList}
                />
            )}
        </div>
    );
}
