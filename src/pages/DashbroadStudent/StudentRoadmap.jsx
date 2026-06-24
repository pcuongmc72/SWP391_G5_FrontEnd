import React, { useState, useEffect, useCallback } from 'react';
import {
    BookOpen, User, Calendar, Loader2, FileText,
    Play, FileQuestion, File, CheckCircle, Circle,
    Search, ExternalLink, Award, ArrowLeft, Map, ChevronRight, ChevronDown
} from 'lucide-react';
import {
    getAcademicTerms,
    getStudentClasses,
    getStudentLearningMaterials,
    completeMaterial,
    uncompleteMaterial
} from '../../services/studentService';

const TYPE_CONFIG = {
    video:    { label: 'Video',    icon: Play,         color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd' },
    pdf:      { label: 'PDF',      icon: FileText,     color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
    document: { label: 'Tài liệu', icon: File,         color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
    quiz:     { label: 'Quiz',     icon: FileQuestion, color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
};

function getTypeConfig(type) {
    return TYPE_CONFIG[type?.toLowerCase()] || TYPE_CONFIG.document;
}

/**
 * Parse chuỗi chapter từ DB có dạng "TênMôn ÷ TênChương" → chỉ trả về "TênChương".
 * Nếu không có dấu phân cách " ÷ " thì trả nguyên chuỗi gốc.
 * Ví dụ: "PRN ÷ Chương 1" → "Chương 1"
 *         "Chương 2"       → "Chương 2"
 *         null/""          → "Chung"
 */
function parseChapterName(raw) {
    if (!raw || !raw.trim()) return 'Chung';
    const SEPARATOR = ' ÷ ';
    if (raw.includes(SEPARATOR)) {
        return raw.split(SEPARATOR)[1].trim();
    }
    return raw.trim();
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Class List Screen ─────────────────────────────────────────────────────────

function ClassListScreen({ onSelectClass }) {
    const [terms, setTerms] = useState([]);
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    /** Tải danh sách học kỳ, trích xuất năm học, tự động phát hiện kỳ hiện tại. */
    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const response = await getAcademicTerms();
                if (response.success && response.data.length > 0) {
                    const termsData = response.data;
                    setTerms(termsData);

                    const uniqueYears = [
                        ...new Set(termsData.map(t => t.startDate.split('-')[0]))
                    ].sort((a, b) => b - a);
                    setYears(uniqueYears);

                    const today = new Date();
                    const currentTerm = termsData.find(t => {
                        const start = new Date(t.startDate);
                        const end = new Date(t.endDate);
                        return today >= start && today <= end;
                    });

                    if (currentTerm) {
                        setSelectedYear(currentTerm.startDate.split('-')[0]);
                        const n = currentTerm.name.toLowerCase();
                        const c = (currentTerm.termCode || '').toLowerCase();
                        if (n.includes('spring') || c.includes('sp')) setSelectedSemester('Spring');
                        else if (n.includes('summer') || c.includes('su')) setSelectedSemester('Summer');
                        else if (n.includes('fall') || c.includes('fa')) setSelectedSemester('Fall');
                    } else if (uniqueYears.length > 0) {
                        setSelectedYear(uniqueYears[0]);
                        setSelectedSemester('Spring');
                    }
                } else {
                    setError('Không tìm thấy học kỳ nào trong hệ thống.');
                    setLoading(false);
                }
            } catch (e) {
                setError(e.message || 'Lỗi tải danh sách học kỳ.');
                setLoading(false);
            }
        };
        fetchTerms();
    }, []);

    /** Tải danh sách lớp học khi năm học hoặc kỳ học thay đổi. */
    useEffect(() => {
        if (!selectedYear || !selectedSemester || terms.length === 0) return;

        const matchedTerm = terms.find(t => {
            const termYear = t.startDate.split('-')[0];
            const n = t.name.toLowerCase();
            const c = (t.termCode || '').toLowerCase();
            const isSpring = selectedSemester === 'Spring' && (n.includes('spring') || c.includes('sp'));
            const isSummer = selectedSemester === 'Summer' && (n.includes('summer') || c.includes('su'));
            const isFall   = selectedSemester === 'Fall'   && (n.includes('fall')   || c.includes('fa'));
            return termYear === selectedYear && (isSpring || isSummer || isFall);
        });

        const fetchClasses = async () => {
            setLoading(true);
            setError('');
            try {
                if (matchedTerm) {
                    const res = await getStudentClasses(matchedTerm.id);
                    setClasses(res?.data || []);
                } else {
                    setClasses([]);
                }
            } catch (e) {
                setError(e.message || 'Không thể tải danh sách lớp học.');
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, [selectedYear, selectedSemester, terms]);

    const filtered = classes.filter(cls => {
        const q = searchTerm.toLowerCase();
        return (
            cls.id?.toLowerCase().includes(q) ||
            cls.courseName?.toLowerCase().includes(q) ||
            cls.courseCode?.toLowerCase().includes(q) ||
            cls.lecturerName?.toLowerCase().includes(q)
        );
    });

    if (loading && terms.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 260, gap: 8 }}>
                <Loader2 size={20} style={{ color: '#0D3E26', animation: 'spin 1s linear infinite' }} />
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Đang tải dữ liệu...</span>
            </div>
        );
    }

    return (
        <div style={{ padding: '4px' }}>
            {/* ── Search + Filter bar ── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
                backgroundColor: '#fff', padding: '20px', borderRadius: '16px',
                border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
                {/* Search */}
                <div style={{ flex: '1 1 280px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Tìm kiếm lớp học
                    </label>
                    <input
                        type="text"
                        placeholder="Nhập tên môn học, mã môn học hoặc mã lớp..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', color: '#334155', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = '#0D3E26'}
                        onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                    />
                </div>

                {/* Dropdowns */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Năm học
                        </label>
                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.875rem', fontWeight: 600, color: '#334155', outline: 'none', cursor: 'pointer', minWidth: '120px' }}
                        >
                            {years.map(year => (
                                <option key={year} value={year}>Năm học {year}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Kỳ học
                        </label>
                        <select
                            value={selectedSemester}
                            onChange={e => setSelectedSemester(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.875rem', fontWeight: 600, color: '#334155', outline: 'none', cursor: 'pointer', minWidth: '120px' }}
                        >
                            <option value="Spring">Kỳ Spring</option>
                            <option value="Summer">Kỳ Summer</option>
                            <option value="Fall">Kỳ Fall</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#b91c1c', marginBottom: '24px', fontSize: '0.875rem' }}>
                    {error}
                </div>
            )}

            {/* Loading classes (inline, not full-screen) */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gap: '8px' }}>
                    <Loader2 style={{ color: '#0D3E26', animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Đang tải danh sách lớp học...</span>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗺️</div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                        {classes.length === 0 ? 'Không có lớp học nào trong kỳ này' : 'Không tìm thấy lớp học phù hợp'}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '6px' }}>
                        {classes.length === 0 ? 'Thử chọn năm học hoặc kỳ học khác.' : 'Thử tìm kiếm với từ khóa khác.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {filtered.map(cls => (
                        <div
                            key={cls.id}
                            onClick={() => onSelectClass(cls)}
                            style={{
                                backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
                                padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                            }}
                        >
                            <div>
                                {/* Class ID badge */}
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#e6f4ea', color: '#0d3e26', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', marginBottom: '12px' }}>
                                    <BookOpen size={12} />
                                    {cls.id}
                                </div>

                                {/* Course name */}
                                <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                                    {cls.courseName} ({cls.courseCode})
                                </h4>

                                {/* Lecturer */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#475569' }}>
                                    <User size={16} style={{ color: '#94a3b8' }} />
                                    <span style={{ fontSize: '0.875rem' }}>GV: <strong>{cls.lecturerName}</strong></span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem' }}>
                                    <Calendar size={14} />
                                    <span>{formatDate(cls.startDate)} - {formatDate(cls.endDate)}</span>
                                </div>
                                <button
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', backgroundColor: '#0D3E26', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#072416'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0D3E26'}
                                >
                                    Xem lộ trình <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Roadmap Timeline Screen ───────────────────────────────────────────────────

function RoadmapScreen({ cls, onBack }) {
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [togglingId, setTogglingId] = useState(null);
    const [openChapters, setOpenChapters] = useState({});

    useEffect(() => {
        /** Tải lộ trình học tập của lớp được chọn. */
        const fetchRoadmap = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await getStudentLearningMaterials(cls.id);
                setChapters(res?.data?.chapters || []);
            } catch (e) {
                setError(e.message || 'Không thể tải học liệu.');
            } finally {
                setLoading(false);
            }
        };
        fetchRoadmap();
    }, [cls.id]);

    /** Đánh dấu / bỏ hoàn thành học liệu. */
    const handleToggleComplete = useCallback(async (material) => {
        if (togglingId === material.id) return;
        setTogglingId(material.id);
        const wasCompleted = material.isCompleted;

        // Cập nhật UI lập tức
        setChapters(prev => prev.map(ch => ({
            ...ch,
            materials: ch.materials.map(m => m.id === material.id ? { ...m, isCompleted: !wasCompleted } : m)
        })));

        try {
            if (wasCompleted) {
                await uncompleteMaterial(material.id);
            } else {
                await completeMaterial(material.id);
            }
        } catch {
            // Revert nếu lỗi
            setChapters(prev => prev.map(ch => ({
                ...ch,
                materials: ch.materials.map(m => m.id === material.id ? { ...m, isCompleted: wasCompleted } : m)
            })));
        } finally {
            setTogglingId(null);
        }
    }, [togglingId]);

    // Lấy danh sách học liệu phẳng phục vụ tính toán phần trăm hoàn thành
    const materials = React.useMemo(() => {
        return chapters.flatMap(c => c.materials);
    }, [chapters]);

    const completedCount = materials.filter(m => m.isCompleted).length;
    const progressPercent = materials.length > 0 ? Math.round((completedCount / materials.length) * 100) : 0;

    // Lọc học liệu theo từ khóa tìm kiếm và loại học liệu
    // Đồng thời bỏ nhóm "Chung" (học liệu chưa được giảng viên gán chương)
    const filteredChapters = React.useMemo(() => {
        return chapters.map(ch => {
            const filtered = ch.materials.filter(m => {
                const typeMatch = filterType === 'ALL' || m.type?.toLowerCase() === filterType || m.materialType?.toLowerCase() === filterType;
                const searchMatch = !searchQuery.trim() || m.title.toLowerCase().includes(searchQuery.toLowerCase());
                return typeMatch && searchMatch;
            });
            return {
                ...ch,
                materials: filtered
            };
        }).filter(ch =>
            ch.materials.length > 0 &&
            parseChapterName(ch.chapterName) !== 'Chung'  // ẩn nhóm không có chapter
        );
    }, [chapters, filterType, searchQuery]);

    // Quản lý việc đóng mở Accordion
    const toggleChapter = (chapterName) => {
        setOpenChapters(prev => ({
            ...prev,
            [chapterName]: !prev[chapterName]
        }));
    };

    const isAllExpanded = chapters.length > 0 && chapters.every(ch => openChapters[ch.chapterName]);

    const toggleAllSections = () => {
        if (isAllExpanded) {
            setOpenChapters({});
        } else {
            const newState = {};
            chapters.forEach(ch => {
                newState[ch.chapterName] = true;
            });
            setOpenChapters(newState);
        }
    };

    return (
        <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Header with back button ── */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <button
                    onClick={onBack}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600, color: '#475569', cursor: 'pointer', marginBottom: 14, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                >
                    <ArrowLeft size={14} /> Quay lại danh sách lớp
                </button>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#e6f4ea', color: '#0d3e26', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', marginBottom: '10px' }}>
                            <BookOpen size={12} /> {cls.id}
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
                            {cls.courseName} ({cls.courseCode})
                        </h2>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: '#64748b' }}>
                                <User size={13} /> GV: <strong style={{ color: '#334155' }}>{cls.lecturerName || '—'}</strong>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: '#64748b' }}>
                                <Calendar size={13} /> {formatDate(cls.startDate)} – {formatDate(cls.endDate)}
                            </span>
                        </div>
                    </div>

                    {/* Progress */}
                    <div style={{ minWidth: 220, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>
                                <Award size={14} color="#10b981" /> Tiến độ
                            </span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0D3E26' }}>
                                {completedCount}/{materials.length} ({progressPercent}%)
                            </span>
                        </div>
                        <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #0D3E26, #10b981)', borderRadius: 999, transition: 'width 0.4s ease' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Search + Filter ── */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 260px' }}>
                    <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm học liệu..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: '0.875rem', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                        onFocus={e => e.target.style.borderColor = '#0D3E26'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['ALL', 'video', 'pdf', 'document', 'quiz'].map(type => {
                        const isActive = filterType === type;
                        const cfg = type === 'ALL' ? null : getTypeConfig(type);
                        return (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{
                                    padding: '6px 14px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700,
                                    border: 'none', cursor: 'pointer',
                                    background: isActive ? (cfg ? cfg.bg : '#ecfdf5') : '#f8fafc',
                                    color: isActive ? (cfg ? cfg.color : '#065f46') : '#64748b',
                                    outline: isActive ? `1.5px solid ${cfg ? cfg.border : '#a7f3d0'}` : '1.5px solid #e2e8f0',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {type === 'ALL' ? 'Tất cả' : cfg?.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#b91c1c', fontSize: '0.875rem' }}>
                    {error}
                </div>
            )}

            {/* ── Accordion List ── */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 10 }}>
                    <Loader2 size={20} style={{ color: '#0D3E26', animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Đang tải lộ trình học tập...</span>
                </div>
            ) : filteredChapters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📂</div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                        {chapters.length === 0 ? 'Lớp học chưa có học liệu nào' : 'Không tìm thấy học liệu phù hợp'}
                    </h3>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Header of Accordion section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                            {chapters.length} chương • {materials.length} học liệu
                        </span>
                        <button
                            onClick={toggleAllSections}
                            style={{
                                background: 'none', border: 'none', color: '#0D3E26',
                                fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                                padding: '4px 8px', transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                            onMouseLeave={e => e.currentTarget.style.opacity = 1}
                        >
                            {isAllExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
                        </button>
                    </div>

                    {/* Accordion Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        {filteredChapters.map((ch, index) => {
                            const isOpen = !!openChapters[ch.chapterName];
                            const chapterCompletedCount = ch.materials.filter(m => m.isCompleted).length;
                            const totalChapterMaterials = ch.materials.length;
                            // Parse tên chương: tách bỏ phần "TênMôn ÷ " nếu có
                            const displayName = parseChapterName(ch.chapterName);

                            return (
                                <div key={ch.chapterName} style={{ borderBottom: index < filteredChapters.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                    {/* Accordion Header */}
                                    <div
                                        onClick={() => toggleChapter(ch.chapterName)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '16px 20px', cursor: 'pointer', userSelect: 'none',
                                            backgroundColor: isOpen ? '#f8fafc' : '#fff',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = isOpen ? '#f8fafc' : '#fff'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                            {/* Chevron Icon */}
                                            <div style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: '#64748b', flexShrink: 0 }}>
                                                <ChevronDown size={18} />
                                            </div>
                                            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {displayName}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8125rem', color: '#64748b', flexShrink: 0 }}>
                                            <span>{totalChapterMaterials} bài học</span>
                                            <span style={{ height: 12, width: 1, backgroundColor: '#cbd5e1' }} />
                                            <span style={{ fontWeight: 700, color: chapterCompletedCount === totalChapterMaterials ? '#10b981' : '#64748b' }}>
                                                Đã học {chapterCompletedCount}/{totalChapterMaterials}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Accordion Body */}
                                    {isOpen && (
                                        <div style={{
                                            padding: '8px 20px 20px 20px', backgroundColor: '#f8fafc',
                                            display: 'flex', flexDirection: 'column', gap: 12
                                        }}>
                                            {ch.materials.map(material => {
                                                const cfg = getTypeConfig(material.type || material.materialType);
                                                const TypeIcon = cfg.icon;
                                                const isCompleted = material.isCompleted;
                                                const isToggling = togglingId === material.id;

                                                return (
                                                    <div
                                                        key={material.id}
                                                        style={{
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            padding: '12px 16px', borderRadius: '12px',
                                                            backgroundColor: '#fff', border: `1.5px solid ${isCompleted ? '#a7f3d0' : '#e2e8f0'}`,
                                                            boxShadow: isCompleted ? '0 1px 4px rgba(16,185,129,0.04)' : '0 1px 2px rgba(0,0,0,0.02)',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                                            {/* Status Checkbox Icon */}
                                                            <button
                                                                onClick={() => handleToggleComplete(material)}
                                                                disabled={isToggling}
                                                                style={{
                                                                    background: 'none', border: 'none', padding: 0, cursor: isToggling ? 'wait' : 'pointer',
                                                                    color: isCompleted ? '#10b981' : '#cbd5e1', display: 'flex', alignItems: 'center',
                                                                    transition: 'color 0.2s'
                                                                }}
                                                            >
                                                                {isCompleted ? <CheckCircle size={18} /> : <Circle size={18} />}
                                                            </button>

                                                            {/* Material Type Icon */}
                                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <TypeIcon size={14} color={cfg.color} />
                                                            </div>

                                                            <div style={{ minWidth: 0 }}>
                                                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', display: 'block', lineHeight: '1.4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {material.title}
                                                                </span>
                                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                                                    <span>{cfg.label}</span>
                                                                    {material.fileSize && <span>• {material.fileSize}</span>}
                                                                    <span>• {formatDate(material.uploadedAt)}</span>
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                                                            {material.fileUrl && material.fileUrl !== '#' && (
                                                                <a
                                                                    href={material.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem',
                                                                        fontWeight: 600, color: '#1d4ed8', background: '#eff6ff',
                                                                        border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: 8,
                                                                        textDecoration: 'none', transition: 'all 0.15s'
                                                                    }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                                                                >
                                                                    <ExternalLink size={12} /> Xem bài học
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Root Component ─────────────────────────────────────────────────────────────

export default function StudentRoadmap({ cls, onBack }) {
    const [selectedClassState, setSelectedClassState] = useState(null);

    const activeClass = cls || selectedClassState;
    const handleBack = onBack || (() => setSelectedClassState(null));

    if (activeClass) {
        return <RoadmapScreen cls={activeClass} onBack={handleBack} />;
    }

    return <ClassListScreen onSelectClass={setSelectedClassState} />;
}
