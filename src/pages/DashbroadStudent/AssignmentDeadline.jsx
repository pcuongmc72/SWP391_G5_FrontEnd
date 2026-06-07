import { useState, useEffect, useRef } from 'react';
import {
    Calendar, Search, ArrowLeft, ChevronRight,
    Upload, CheckCircle, AlertCircle, Clock,
    FileText, X, BookOpen
} from 'lucide-react';
import { getMyClasses, getAssignmentsByClass, submitAssignment } from '../../services/studentService';
import { getUser } from '../../services/authService';
import styles from './AssignmentDeadline.module.css';

/* ─────────────────── Helpers ─────────────────── */
const getDaysRemaining = (dueDateStr) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
};

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

const getStatusInfo = (assignment) => {
    const { mySubmission, dueDate } = assignment;
    const days = getDaysRemaining(dueDate);

    if (mySubmission?.status === 'GRADED') {
        return { label: 'Đã chấm điểm', color: 'graded', icon: CheckCircle };
    }
    if (mySubmission?.status === 'SUBMITTED') {
        return { label: 'Đã nộp', color: 'submitted', icon: CheckCircle };
    }
    if (mySubmission?.status === 'LATE') {
        return { label: 'Nộp muộn', color: 'late', icon: AlertCircle };
    }
    if (days !== null && days < 0) {
        return { label: 'Quá hạn', color: 'overdue', icon: AlertCircle };
    }
    if (days !== null && days <= 3) {
        return { label: `Còn ${days} ngày`, color: 'urgent', icon: Clock };
    }
    return { label: 'Chưa nộp', color: 'pending', icon: Clock };
};

/* ══════════════════════════════════════════════════════
   VIEW 1: Danh sách lớp học (Card Grid + Bộ lọc)
══════════════════════════════════════════════════════ */
function ClassListView({ onSelectClass }) {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterYear, setFilterYear] = useState('all');
    const [filterSemester, setFilterSemester] = useState('all');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedYear, setAppliedYear] = useState('all');
    const [appliedSemester, setAppliedSemester] = useState('all');
    const [assignmentsCache, setAssignmentsCache] = useState({});

    useEffect(() => {
        setLoading(true);
        getMyClasses().then(async (data) => {
            setClasses(data || []);
            // Preload assignments count for each class
            const cache = {};
            await Promise.all((data || []).map(async (cls) => {
                try {
                    const asgList = await getAssignmentsByClass(cls.id);
                    cache[cls.id] = asgList || [];
                } catch {
                    cache[cls.id] = [];
                }
            }));
            setAssignmentsCache(cache);
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
                    <Calendar className={styles.viewTitleIcon} />
                    Nộp bài tập &amp; Báo cáo đồ án theo lớp học
                </h2>
                <p className={styles.viewDesc}>
                    Chọn một lớp học bên dưới để xem toàn bộ danh sách bài tập và nộp đồ án chi tiết.
                </p>
            </div>

            {/* Filter section */}
            <div className={styles.filterBox}>
                <span className={styles.filterLabel}>Lọc lớp học nộp bài tập &amp; đồ án</span>
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
                        const asgList = assignmentsCache[cls.id] || [];
                        const submitted = asgList.filter(a => a.mySubmission).length;
                        const total = asgList.length;
                        const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

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
                                        {cls.startDate ? new Date(cls.startDate).getFullYear() : ''}
                                    </span>
                                </div>

                                <h3 className={styles.classCardName}>{cls.courseName || cls.id}</h3>

                                <div className={styles.classCardStats}>
                                    <div className={styles.progressRow}>
                                        <span className={styles.progressLabel}>
                                            Đã nộp: <strong>{submitted}/{total}</strong> nhiệm vụ
                                        </span>
                                        <span className={styles.progressPct}>{pct}%</span>
                                    </div>
                                    <div className={styles.progressBarWrap}>
                                        <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>

                                <div className={styles.classCardFooter}>
                                    <span className={styles.viewDetailLink}>
                                        Xem chi tiết &amp; nộp bài
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

/* ══════════════════════════════════════════════════════
   VIEW 2: Chi tiết lớp — Danh sách bài tập
══════════════════════════════════════════════════════ */
function AssignmentListView({ classInfo, onBack, onSelectAssignment }) {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getAssignmentsByClass(classInfo.id).then(data => {
            setAssignments(data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [classInfo.id]);

    const submitted = assignments.filter(a => a.mySubmission).length;
    const total = assignments.length;
    const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

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
                        Nộp bài tập của lớp:{' '}
                        <span className={styles.detailTitleHighlight}>{classInfo.courseName || classInfo.id}</span>
                    </h2>
                    <p className={styles.detailDesc}>
                        Khu vực nộp bài tập chuẩn bị hoặc nộp đồ án chi tiết sau buổi học lớp đảo ngược.
                    </p>
                </div>
                <div className={styles.summaryBadge}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Đã nộp</span>
                        <span className={styles.summaryValue}>{submitted}/{total} bài</span>
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
                    <span>Đang tải bài tập...</span>
                </div>
            ) : (
                <div className={styles.assignmentList}>
                    {assignments.map((asg) => {
                        const statusInfo = getStatusInfo(asg);
                        const days = getDaysRemaining(asg.dueDate);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div
                                key={asg.id}
                                className={`${styles.asgCard} ${styles[`asgCard_${statusInfo.color}`]}`}
                                onClick={() => onSelectAssignment(asg)}
                            >
                                <div className={styles.asgCardLeft}>
                                    <div className={styles.asgMeta}>
                                        <span className={styles.asgDueBadge}>
                                            Hạn: {formatDate(asg.dueDate)}
                                            {days !== null && days >= 0 && ` (còn ${days} ngày)`}
                                            {days !== null && days < 0 && ` (đã quá ${Math.abs(days)} ngày)`}
                                        </span>
                                    </div>
                                    <h4 className={styles.asgTitle}>{asg.title}</h4>
                                    <p className={styles.asgDesc}>{asg.description}</p>

                                    {asg.mySubmission && (
                                        <div className={styles.submittedInfo}>
                                            <FileText className={styles.submittedFileIcon} />
                                            <span>Đã tải lên: <strong>{asg.mySubmission.fileName}</strong></span>
                                            <span className={styles.submittedTime}>
                                                • {asg.mySubmission.submittedAt}
                                            </span>
                                        </div>
                                    )}
                                    {!asg.mySubmission && (
                                        <p className={styles.notSubmittedHint}>
                                            <AlertCircle className={styles.hintIcon} />
                                            Chưa có nộp tập tin chuẩn bị nào.
                                        </p>
                                    )}
                                </div>

                                <div className={styles.asgCardRight}>
                                    <span className={`${styles.statusBadge} ${styles[`status_${statusInfo.color}`]}`}>
                                        <StatusIcon className={styles.statusIcon} />
                                        {statusInfo.label}
                                    </span>
                                    <button
                                        type="button"
                                        className={`${styles.asgActionBtn} ${asg.mySubmission ? styles.asgActionBtnSecondary : styles.asgActionBtnPrimary}`}
                                        onClick={(e) => { e.stopPropagation(); onSelectAssignment(asg); }}
                                    >
                                        {asg.mySubmission ? 'Nộp lại bài làm' : 'Nộp bài làm ngay ✓'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {assignments.length === 0 && (
                        <div className={styles.emptyState}>
                            <CheckCircle className={styles.emptyIcon} />
                            <span>Lớp học chưa có bài tập nào được giao.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   VIEW 3: Chi tiết bài tập — Upload / Kết quả
══════════════════════════════════════════════════════ */
function AssignmentDetailView({ assignment, classInfo, onBack }) {
    const currentUser = getUser();
    const [file, setFile] = useState(null);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedData, setSubmittedData] = useState(assignment.mySubmission);
    const [toast, setToast] = useState(null);
    const [showResubmit, setShowResubmit] = useState(false);
    const fileInputRef = useRef(null);

    const statusInfo = getStatusInfo({ ...assignment, mySubmission: submittedData });
    const days = getDaysRemaining(assignment.dueDate);
    const StatusIcon = statusInfo.icon;

    const showMsg = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (f) setFile(f);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { showMsg('Vui lòng chọn file bài làm!'); return; }

        setIsSubmitting(true);
        try {
            const result = await submitAssignment({
                assignmentId: assignment.id,
                fileName: file.name,
                fileUrl: '#',
                studentNotes: notes,
            });

            const newSub = result?.data || {
                id: `sub_${Date.now()}`,
                fileName: file.name,
                submittedAt: new Date().toLocaleString('vi-VN'),
                status: days !== null && days < 0 ? 'LATE' : 'SUBMITTED',
                grade: null, feedback: null,
            };

            setSubmittedData(newSub);
            setShowResubmit(false);
            setFile(null);
            setNotes('');
            showMsg('🚀 Nộp bài tập thành công!');
        } catch {
            showMsg('Có lỗi khi nộp bài. Vui lòng thử lại!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasSubmission = !!submittedData;
    const showForm = !hasSubmission || showResubmit;

    return (
        <div className={styles.view}>
            {/* Toast */}
            {toast && (
                <div className={styles.toast}>
                    <CheckCircle className={styles.toastIcon} />
                    {toast}
                </div>
            )}

            {/* Back button */}
            <button onClick={onBack} className={styles.backBtn}>
                <ArrowLeft className={styles.backBtnIcon} />
                Quay lại danh sách bài tập
            </button>

            <div className={styles.detailLayout}>
                {/* Left: Assignment Info */}
                <div className={styles.asgInfoPanel}>
                    <div className={styles.asgInfoHeader}>
                        <span className={styles.asgInfoChip}>Chi tiết bài tập</span>
                        <span className={`${styles.statusBadge} ${styles[`status_${statusInfo.color}`]}`}>
                            <StatusIcon className={styles.statusIcon} />
                            {statusInfo.label}
                        </span>
                    </div>

                    <h3 className={styles.asgInfoTitle}>{assignment.title}</h3>
                    <p className={styles.asgInfoDesc}>{assignment.description}</p>

                    <div className={styles.asgMeta2}>
                        <div className={styles.asgMetaRow}>
                            <span className={styles.asgMetaKey}>Ngày giao:</span>
                            <span className={styles.asgMetaVal}>{formatDate(assignment.createdAt)}</span>
                        </div>
                        <div className={styles.asgMetaRow}>
                            <span className={styles.asgMetaKey}>Deadline:</span>
                            <span className={`${styles.asgMetaVal} ${days !== null && days < 0 ? styles.textDanger : days !== null && days <= 3 ? styles.textWarning : ''}`}>
                                {formatDate(assignment.dueDate)}
                                {days !== null && days >= 0 && <em className={styles.daysTag}> (còn {days} ngày)</em>}
                                {days !== null && days < 0 && <em className={styles.daysTag}> (đã quá {Math.abs(days)} ngày)</em>}
                            </span>
                        </div>
                        <div className={styles.asgMetaRow}>
                            <span className={styles.asgMetaKey}>Điểm tối đa:</span>
                            <span className={styles.asgMetaVal}><strong>{assignment.maxPoints} điểm</strong></span>
                        </div>
                        <div className={styles.asgMetaRow}>
                            <span className={styles.asgMetaKey}>Lớp học:</span>
                            <span className={styles.asgMetaVal}>{classInfo?.courseName || classInfo?.id}</span>
                        </div>
                    </div>

                    {/* Kết quả nộp bài đã có */}
                    {hasSubmission && !showResubmit && (
                        <div className={styles.submissionResult}>
                            <div className={styles.submissionResultHeader}>
                                <CheckCircle className={styles.submissionResultIcon} />
                                <span>Thông tin bài đã nộp</span>
                            </div>
                            <div className={styles.submissionResultBody}>
                                <div className={styles.submissionResultRow}>
                                    <FileText className={styles.fileIcon} />
                                    <div>
                                        <span className={styles.fileLabel}>File đã nộp:</span>
                                        <strong className={styles.fileName}>{submittedData.fileName}</strong>
                                    </div>
                                </div>
                                <div className={styles.submissionResultRow}>
                                    <Clock className={styles.fileIcon} />
                                    <div>
                                        <span className={styles.fileLabel}>Thời gian nộp:</span>
                                        <span className={styles.fileName}>{submittedData.submittedAt}</span>
                                    </div>
                                </div>

                                {submittedData.status === 'GRADED' && submittedData.grade !== null && (
                                    <div className={styles.gradeBox}>
                                        <span className={styles.gradeLabel}>Điểm đạt được</span>
                                        <span className={styles.gradeValue}>
                                            {submittedData.grade}
                                            <span className={styles.gradeMax}>/{assignment.maxPoints}đ</span>
                                        </span>
                                        {submittedData.feedback && (
                                            <div className={styles.feedbackBox}>
                                                <span className={styles.feedbackLabel}>💬 Nhận xét từ giảng viên:</span>
                                                <p className={styles.feedbackText}>"{submittedData.feedback}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {submittedData.status === 'SUBMITTED' && (
                                    <div className={styles.waitingBox}>
                                        <Clock className={styles.waitingIcon} />
                                        <span>Đang chờ giảng viên chấm điểm...</span>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setShowResubmit(true)}
                                    className={styles.resubmitBtn}
                                >
                                    Nộp lại bài làm
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Upload Form */}
                {showForm && (
                    <div className={styles.uploadPanel}>
                        <div className={styles.uploadPanelHeader}>
                            <span className={styles.uploadPanelTitle}>
                                {hasSubmission ? 'Nộp lại bài tập' : 'Đăng tải Bài Nộp Mới'}
                            </span>
                            {showResubmit && (
                                <button
                                    type="button"
                                    onClick={() => { setShowResubmit(false); setFile(null); setNotes(''); }}
                                    className={styles.closeResubmit}
                                >
                                    Đóng ×
                                </button>
                            )}
                        </div>

                        {/* Preview bài đang chọn */}
                        <div className={styles.selectedAsgPreview}>
                            <span className={styles.selectedAsgChip}>Đang chọn</span>
                            <h4 className={styles.selectedAsgTitle}>{assignment.title}</h4>
                            <p className={styles.selectedAsgDue}>Hạn nộp: <strong>{formatDate(assignment.dueDate)}</strong></p>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.uploadForm}>
                            {/* Notes */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Lời nhắn của học viên</label>
                                <textarea
                                    rows={3}
                                    placeholder="Lời nhắn gửi tới Giảng viên hướng dẫn..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className={styles.formTextarea}
                                />
                            </div>

                            {/* File upload */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Chọn tập tin giải bài tập</label>
                                <div
                                    className={`${styles.dropzone} ${file ? styles.dropzoneHasFile : ''}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.docx,.doc,.zip,.rar,.xlsx"
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                    {file ? (
                                        <div className={styles.dropzoneFileInfo}>
                                            <CheckCircle className={styles.dropzoneCheckIcon} />
                                            <p className={styles.dropzoneFileName}>{file.name}</p>
                                            <span className={styles.dropzoneChangeHint}>Bấm để chọn lại tệp</span>
                                        </div>
                                    ) : (
                                        <div className={styles.dropzonePlaceholder}>
                                            <Upload className={styles.dropzoneUploadIcon} />
                                            <p className={styles.dropzoneHint}>Bấm để đính kèm file bài làm</p>
                                            <p className={styles.dropzoneFormats}>PDF, ZIP, DOCX dung lượng tối đa 50MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    onClick={() => { setShowResubmit(false); setFile(null); setNotes(''); }}
                                    className={styles.cancelBtn}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !file}
                                    className={styles.submitBtn}
                                >
                                    {isSubmitting ? 'Đang gửi...' : 'Nộp bài'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function AssignmentDeadline() {
    const [view, setView] = useState('classList'); // 'classList' | 'assignmentList' | 'assignmentDetail'
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const handleSelectClass = (cls) => {
        setSelectedClass(cls);
        setView('assignmentList');
    };

    const handleSelectAssignment = (asg) => {
        setSelectedAssignment(asg);
        setView('assignmentDetail');
    };

    const handleBackToClassList = () => {
        setSelectedClass(null);
        setView('classList');
    };

    const handleBackToAssignmentList = () => {
        setSelectedAssignment(null);
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
            {view === 'assignmentDetail' && selectedAssignment && (
                <AssignmentDetailView
                    assignment={selectedAssignment}
                    classInfo={selectedClass}
                    onBack={handleBackToAssignmentList}
                />
            )}
        </div>
    );
}
