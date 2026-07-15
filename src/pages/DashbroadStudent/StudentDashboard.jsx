import React, { useState, useEffect } from 'react';
import { getAcademicTerms, getStudentClasses, getClassStudents } from '../../services/studentService';
import { BookOpen, User, Calendar, Loader2, Users, Search, ChevronDown, Folder, Bell, MoreVertical } from 'lucide-react';
import styles from './StudentDashboard.module.css';

export default function StudentDashboard() {
    const [terms, setTerms] = useState([]);
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Các state phục vụ Modal chi tiết lớp học
    const [selectedClass, setSelectedClass] = useState(null); // Lớp đang được mở chi tiết
    const [classStudents, setClassStudents] = useState([]);   // Danh sách bạn học trong lớp đó
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentSearchTerm, setStudentSearchTerm] = useState(''); // Tìm kiếm bạn học

    // 1. Initial Data Fetch
    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const response = await getAcademicTerms();
                if (response.success && response.data.length > 0) {
                    const termsData = response.data;
                    setTerms(termsData);

                    // Trích xuất danh sách Năm học không trùng lặp từ startDate
                    const uniqueYears = [
                        ...new Set(termsData.map(term => term.startDate ? term.startDate.split('-')[0] : '')) // Cắt lấy 4 ký tự năm
                    ].filter(y => y !== '').sort((a, b) => b - a);

                    setYears(uniqueYears);

                    // Xác định Năm học và Kỳ học hiện tại dựa trên ngày hôm nay
                    const today = new Date();
                    const currentTerm = termsData.find(term => {
                        const start = new Date(term.startDate);
                        const end = new Date(term.endDate);
                        return today >= start && today <= end;
                    });

                    if (currentTerm) {
                        setSelectedYear(currentTerm.startDate.split('-')[0]); // Cắt lấy năm học hiện tại
                        setSelectedSemester(currentTerm.id);
                    } else if (uniqueYears.length > 0) {
                        const firstYear = uniqueYears[0].toString();
                        setSelectedYear(firstYear);
                        const yearTerms = termsData.filter(term => term.startDate && term.startDate.split('-')[0] === firstYear);
                        if (yearTerms.length > 0) {
                            setSelectedSemester(yearTerms[0].id);
                        }
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

    const matchedTerm = terms.find(t => t.id === selectedSemester);

    // Auto-update selectedSemester when selectedYear changes
    useEffect(() => {
        if (!selectedYear || terms.length === 0) return;

        const currentSelectedTerm = terms.find(t => t.id === selectedSemester);
        const currentSelectedTermYear = currentSelectedTerm?.startDate?.split('-')[0];

        if (currentSelectedTermYear !== selectedYear) {
            const yearTerms = terms.filter(t => t.startDate && t.startDate.split('-')[0] === selectedYear);
            if (yearTerms.length > 0) {
                setSelectedSemester(yearTerms[0].id);
            }
        }
    }, [selectedYear, terms, selectedSemester]);

    // 2. Tải danh sách lớp học tương ứng khi thay đổi selectedSemester
    useEffect(() => {
        if (!selectedSemester || terms.length === 0) return;

        const fetchClasses = async () => {
            setLoading(true);
            setError('');
            try {
                if (matchedTerm) {
                    const response = await getStudentClasses(matchedTerm.id);
                    if (response.success) {
                        setClasses(response.data || []);
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
    }, [selectedSemester, terms, matchedTerm]);

    // Xử lý khi nhấn "Vào lớp" hoặc click Card lớp học
    const handleOpenClassDetail = async (cls) => {
        setSelectedClass(cls);
        setLoadingStudents(true);
        setStudentSearchTerm('');
        try {
            const response = await getClassStudents(cls.id);
            if (response.success) {
                setClassStudents(response.data || []);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách sinh viên cùng lớp:', err);
        } finally {
            setLoadingStudents(false);
        }
    };

    // 3. Logic tìm kiếm môn học
    const filteredClasses = classes.filter(cls => {
        const nameMatch = (cls.courseName || "").toLowerCase().includes(searchTerm.toLowerCase());
        const codeMatch = (cls.courseCode || "").toLowerCase().includes(searchTerm.toLowerCase());
        const classIdMatch = (cls.id || "").toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || codeMatch || classIdMatch;
    });

    // Banner color per course code
    const getBannerColor = (code) => {
        if (!code) return 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)';
        const c = code.toLowerCase();
        if (c.includes('prj')) return 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)';
        if (c.includes('se') || c.includes('oop')) return 'linear-gradient(135deg, #78350f 0%, #92400e 100%)';
        if (c.includes('mad') || c.includes('csd')) return 'linear-gradient(135deg, #312e81 0%, #3730a3 100%)';
        return 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)';
    };

    const activeCount = classes.length;

    return (
        <div style={{ padding: '24px 28px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Search & Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tên môn học, mã môn học hoặc mã lớp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <div className={styles.filterSelectWrapper}>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {years.map(year => (
                                <option key={year} value={year}>
                                    Năm học {year}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className={styles.filterSelectIcon} />
                    </div>

                    <div className={styles.filterSelectWrapper}>
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {terms
                                ?.filter(t => t.startDate && t.startDate.split('-')[0] === selectedYear)
                                .map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))
                            }
                        </select>
                        <ChevronDown size={14} className={styles.filterSelectIcon} />
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className={styles.errorBanner}>
                    {error}
                </div>
            )}

            {/* Classes section */}
            {loading ? (
                <div className={styles.loadingState}>
                    <Loader2 size={22} style={{ color: '#0f766e', animation: 'spin 1s linear infinite' }} />
                    <span>Đang tải danh sách lớp học...</span>
                </div>
            ) : filteredClasses.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🎒</div>
                    <h3 className={styles.emptyTitle}>Không tìm thấy lớp học nào</h3>
                    <p className={styles.emptyDescription}>
                        {searchTerm
                            ? 'Không tìm thấy lớp học nào khớp với từ khóa tìm kiếm.'
                            : 'Không có lớp học nào trong học kỳ được chọn.'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Section header */}
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>
                            <BookOpen size={16} style={{ color: '#0f766e' }} />
                            Lớp học của tôi
                        </h3>
                        <span className={styles.sectionCount}>{filteredClasses.length} lớp</span>
                    </div>

                    {/* Cards grid */}
                    <div className={styles.cardsGrid}>
                        {filteredClasses.map((cls) => (
                            <div
                                key={cls.id}
                                className={styles.classCard}
                                onClick={() => handleOpenClassDetail(cls)}
                            >
                                {/* Banner */}
                                <div
                                    className={styles.cardBanner}
                                    style={{ background: getBannerColor(cls.courseCode) }}
                                >
                                    <div className={styles.cardBannerDecor} />
                                    <div className={styles.cardBannerDecor2} />

                                    <div className={styles.cardBannerTop}>
                                        <h3 className={styles.cardCourseCode}>{cls.courseCode || cls.id}</h3>
                                        <span className={styles.cardSemesterBadge}>{cls.termCode || (matchedTerm ? (matchedTerm.termCode || matchedTerm.name) : selectedSemester)}</span>
                                    </div>

                                    <div className={styles.cardBannerBottom}>
                                        <p className={styles.cardLecturer}>
                                            <User size={12} />
                                            GV: {cls.lecturerName || 'Chưa phân công'}
                                        </p>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className={styles.cardBody}>
                                    <h4 className={styles.cardCourseName}>{cls.courseName}</h4>
                                    <div className={styles.cardMeta}>
                                        <Calendar size={13} className={styles.cardMetaIcon} />
                                        <span>{cls.startDate || 'N/A'} — {cls.endDate || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className={styles.cardFooter}>
                                    <div className={styles.cardActions}>
                                        <button
                                            className={styles.cardActionBtn}
                                            title="Thư mục khóa học"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Folder size={16} />
                                        </button>
                                        <button
                                            className={styles.cardActionBtn}
                                            title="Thông báo"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Bell size={16} />
                                        </button>
                                        <button
                                            className={styles.cardActionBtn}
                                            title="Tùy chọn thêm"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenClassDetail(cls); }}
                                        className={styles.cardEnterBtn}
                                    >
                                        Vào lớp
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Class Detail Modal */}
            {selectedClass && (
                <div
                    onClick={() => setSelectedClass(null)}
                    className={styles.modalOverlay}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className={styles.modalBox}
                    >
                        {/* Modal Header */}
                        <div className={styles.modalHeader}>
                            <div>
                                <div className={styles.modalClassBadge}>
                                    <BookOpen size={11} /> {selectedClass.id}
                                </div>
                                <h2 className={styles.modalTitle}>
                                    {selectedClass.courseName} ({selectedClass.courseCode})
                                </h2>
                                <div className={styles.modalMeta}>
                                    <span className={styles.modalMetaItem}>
                                        <User size={13} />
                                        GV: <strong>{selectedClass.lecturerName || '—'}</strong>
                                    </span>
                                    <span className={styles.modalMetaItem}>
                                        <Calendar size={13} />
                                        {selectedClass.startDate || 'N/A'} – {selectedClass.endDate || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedClass(null)}
                                className={styles.modalCloseBtn}
                            >✕</button>
                        </div>

                        {/* Modal Body — Student list section */}
                        <div className={styles.modalBody}>
                            <div className={styles.studentListHeader}>
                                <h3 className={styles.studentListTitle}>
                                    <Users size={16} style={{ color: '#0f766e' }} />
                                    Danh sách học viên
                                    {!loadingStudents && (
                                        <span className={styles.studentCountBadge}>
                                            {classStudents.length} người
                                        </span>
                                    )}
                                </h3>
                            </div>

                            {/* Search students */}
                            <input
                                type="text"
                                placeholder="Tìm kiếm học viên..."
                                value={studentSearchTerm}
                                onChange={e => setStudentSearchTerm(e.target.value)}
                                className={styles.studentSearchInput}
                            />

                            {loadingStudents ? (
                                <div className={styles.loadingState} style={{ minHeight: 100 }}>
                                    <Loader2 size={18} style={{ color: '#0f766e', animation: 'spin 1s linear infinite' }} />
                                    <span>Đang tải danh sách...</span>
                                </div>
                            ) : classStudents.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: '13px' }}>
                                    Chưa có học viên nào trong lớp này.
                                </div>
                            ) : (
                                <div className={styles.studentList}>
                                    {classStudents
                                        .filter(s => {
                                            const q = studentSearchTerm.toLowerCase();
                                            return !q || (s.fullName || '').toLowerCase().includes(q) || (s.id || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
                                        })
                                        .map((s, idx) => (
                                            <div key={s.id || idx} className={styles.studentItem}>
                                                <div className={styles.studentAvatar}>
                                                    {(s.fullName || s.id || '?')[0].toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div className={styles.studentName}>{s.fullName || '—'}</div>
                                                    <div className={styles.studentSub}>{s.email || s.id}</div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
