import { useState, useEffect, useCallback } from 'react';
import { Search, BookOpen, ChevronRight, Users, Calendar, GraduationCap, BookMarked } from 'lucide-react';
import { getMyClasses } from '../../services/studentService';
import MaterialList from './MaterialList';
import styles from './StudentMaterials.module.css';

/**
 * StudentMaterials — Phase 1: Màn hình chọn lớp học
 *
 * Hiển thị danh sách lớp học của sinh viên với:
 *  - Search theo tên lớp / tên môn
 *  - Filter năm học
 *  - Filter học kỳ
 *  - Progress bar tiến độ (mock 0% cho đến khi có Materials API)
 *  - Card lớp học responsive
 *
 * Props:
 *  - onSelectClass(classObj) — callback khi sinh viên chọn một lớp để xem tài liệu
 */
function StudentMaterials({ onSelectClass, selectedClass }) {
    // ── Nếu đã chọn lớp → render MaterialList ────────────────────
    if (selectedClass) {
        return (
            <MaterialList
                selectedClass={selectedClass}
                onBack={() => onSelectClass && onSelectClass(null)}
            />
        );
    }

    // ── Data state ──────────────────────────────────────────────
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ── Filter input state (chưa apply) ─────────────────────────
    const [searchInput, setSearchInput] = useState('');
    const [yearInput, setYearInput] = useState('all');
    const [semesterInput, setSemesterInput] = useState('all');

    // ── Applied filter state (sau khi bấm Tìm kiếm) ─────────────
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedYear, setAppliedYear] = useState('all');
    const [appliedSemester, setAppliedSemester] = useState('all');

    // ── Fetch dữ liệu ────────────────────────────────────────────
    const fetchClasses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getMyClasses();
            setClasses(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Không thể tải danh sách lớp học. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    // ── Logic lọc danh sách ──────────────────────────────────────
    const filteredClasses = classes.filter((cls) => {
        const name = `${cls.id || ''} ${cls.courseName || ''} ${cls.courseCode || ''}`.toLowerCase();
        const matchSearch = appliedSearch === '' || name.includes(appliedSearch.toLowerCase());

        // Filter năm học — dựa vào termCode hoặc termName chứa năm
        const termRef = `${cls.termCode || ''} ${cls.termName || ''}`.toLowerCase();
        const matchYear = appliedYear === 'all' || termRef.includes(appliedYear.replace('-', ''));

        // Filter học kỳ — tìm "hk1", "hk2", "hk3" hoặc "học kỳ 1/2/3" trong termCode
        let matchSemester = true;
        if (appliedSemester !== 'all') {
            matchSemester =
                termRef.includes(`hk${appliedSemester}`) ||
                termRef.includes(`học kỳ ${appliedSemester}`) ||
                termRef.includes(`ky${appliedSemester}`) ||
                termRef.includes(`semester${appliedSemester}`);
        }

        return matchSearch && matchYear && matchSemester;
    });

    // ── Handler: Apply filter ────────────────────────────────────
    const handleApplyFilter = () => {
        setAppliedSearch(searchInput);
        setAppliedYear(yearInput);
        setAppliedSemester(semesterInput);
    };

    const handleResetFilter = () => {
        setSearchInput('');
        setYearInput('all');
        setSemesterInput('all');
        setAppliedSearch('');
        setAppliedYear('all');
        setAppliedSemester('all');
    };

    // ── Helpers ──────────────────────────────────────────────────
    /**
     * Tính % tiến độ học liệu.
     * Phase 1: trả về 0 vì chưa có Materials API.
     * Phase 2 sẽ nhận progress từ API.
     */
    const getProgress = (cls) => {
        if (typeof cls.materialProgress === 'number') return cls.materialProgress;
        return 0;
    };

    const getProgressColor = (pct) => {
        if (pct >= 80) return '#10b981'; // emerald
        if (pct >= 40) return '#f59e0b'; // amber
        return '#6366f1';                // indigo
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // ── Render: Loading ──────────────────────────────────────────
    if (loading) {
        return (
            <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
                <p className={styles.loadingText}>Đang tải danh sách lớp học...</p>
            </div>
        );
    }

    // ── Render: Error ────────────────────────────────────────────
    if (error) {
        return (
            <div className={styles.errorWrap}>
                <p className={styles.errorText}>{error}</p>
                <button className={styles.retryBtn} onClick={fetchClasses}>Thử lại</button>
            </div>
        );
    }

    // ── Render: Main ─────────────────────────────────────────────
    return (
        <div className={styles.container}>

            {/* ── Page header ── */}
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderIcon}>
                    <BookMarked size={20} />
                </div>
                <div>
                    <h2 className={styles.pageTitle}>Tài liệu học tập theo lớp học</h2>
                    <p className={styles.pageSubtitle}>
                        Chọn một lớp học để tra cứu toàn bộ video bài giảng, slide và tài liệu lý thuyết đảo ngược.
                    </p>
                </div>
            </div>

            {/* ── Filter panel ── */}
            <div className={styles.filterPanel}>
                <div className={styles.filterLabel}>
                    <Search size={13} />
                    <span>Tìm kiếm &amp; Lọc lớp học xem tài liệu học tập</span>
                </div>

                <div className={styles.filterRow}>
                    {/* Search input */}
                    <div className={styles.filterField}>
                        <label className={styles.fieldLabel}>Tên lớp / Môn học</label>
                        <div className={styles.searchWrap}>
                            <Search size={14} className={styles.searchIcon} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Nhập tên lớp hoặc tên môn..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                            />
                        </div>
                    </div>

                    {/* Filter năm học */}
                    <div className={styles.filterField}>
                        <label className={styles.fieldLabel}>Năm học</label>
                        <select
                            className={styles.selectInput}
                            value={yearInput}
                            onChange={(e) => setYearInput(e.target.value)}
                        >
                            <option value="all">Tất cả năm học</option>
                            <option value="2024-2025">Năm học 2024-2025</option>
                            <option value="2025-2026">Năm học 2025-2026</option>
                            <option value="2026-2027">Năm học 2026-2027</option>
                        </select>
                    </div>

                    {/* Filter học kỳ */}
                    <div className={styles.filterField}>
                        <label className={styles.fieldLabel}>Học kỳ (3 kỳ/năm)</label>
                        <select
                            className={styles.selectInput}
                            value={semesterInput}
                            onChange={(e) => setSemesterInput(e.target.value)}
                        >
                            <option value="all">Tất cả học kỳ</option>
                            <option value="1">Học kỳ 1</option>
                            <option value="2">Học kỳ 2</option>
                            <option value="3">Học kỳ 3 (Học kỳ hè)</option>
                        </select>
                    </div>

                    {/* Action buttons */}
                    <div className={styles.filterActions}>
                        <button className={styles.searchBtn} onClick={handleApplyFilter}>
                            <Search size={13} />
                            <span>Tìm kiếm</span>
                        </button>
                        <button className={styles.resetBtn} onClick={handleResetFilter} title="Xóa bộ lọc">
                            ✕
                        </button>
                    </div>
                </div>

                {/* Result count */}
                <p className={styles.resultCount}>
                    Hiển thị <strong>{filteredClasses.length}</strong> / {classes.length} lớp học
                </p>
            </div>

            {/* ── Class cards grid ── */}
            {filteredClasses.length > 0 ? (
                <div className={styles.cardsGrid}>
                    {filteredClasses.map((cls) => {
                        const progress = getProgress(cls);
                        const progressColor = getProgressColor(progress);
                        return (
                            <div
                                key={cls.id}
                                className={styles.classCard}
                                onClick={() => onSelectClass && onSelectClass(cls)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && onSelectClass && onSelectClass(cls)}
                            >
                                {/* Card top: term badge + course code */}
                                <div className={styles.cardTop}>
                                    <span className={styles.termBadge}>
                                        {cls.termName || cls.termCode || 'Khóa học'}
                                    </span>
                                    <span className={styles.courseCodeBadge}>{cls.courseCode || cls.id}</span>
                                </div>

                                {/* Class name */}
                                <h3 className={styles.className}>
                                    {cls.courseName
                                        ? `${cls.id} — ${cls.courseName}`
                                        : cls.id}
                                </h3>

                                {/* Meta info */}
                                <div className={styles.metaList}>
                                    <div className={styles.metaItem}>
                                        <GraduationCap size={13} className={styles.metaIcon} />
                                        <span>{cls.lecturerName || 'Chưa phân công'}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <Users size={13} className={styles.metaIcon} />
                                        <span>{cls.totalStudents ?? '—'} sinh viên</span>
                                    </div>
                                    {cls.startDate && (
                                        <div className={styles.metaItem}>
                                            <Calendar size={13} className={styles.metaIcon} />
                                            <span>{formatDate(cls.startDate)} — {formatDate(cls.endDate)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className={styles.progressSection}>
                                    <div className={styles.progressHeader}>
                                        <span>Đã học: <strong>{progress}%</strong> tài liệu</span>
                                        <span className={styles.progressPct} style={{ color: progressColor }}>
                                            {progress}%
                                        </span>
                                    </div>
                                    <div className={styles.progressTrack}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${progress}%`, background: progressColor }}
                                        />
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className={styles.cardCta}>
                                    <span>Truy cập tài liệu</span>
                                    <ChevronRight size={14} className={styles.ctaIcon} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <BookOpen size={40} className={styles.emptyIcon} />
                    {classes.length === 0 ? (
                        <>
                            <p className={styles.emptyTitle}>Bạn chưa tham gia lớp học nào</p>
                            <p className={styles.emptyDesc}>Vui lòng liên hệ Ban Đào Tạo để được ghi danh vào lớp học.</p>
                        </>
                    ) : (
                        <>
                            <p className={styles.emptyTitle}>Không tìm thấy lớp học phù hợp</p>
                            <p className={styles.emptyDesc}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
                            <button className={styles.resetBtn2} onClick={handleResetFilter}>
                                Xóa bộ lọc
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default StudentMaterials;
