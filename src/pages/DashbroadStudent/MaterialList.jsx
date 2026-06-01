import { useState, useEffect, useCallback } from 'react';
import {
    ArrowLeft, Search, BookMarked, CheckCircle, ChevronRight,
    Video, FileText, HelpCircle, BookOpen, Filter
} from 'lucide-react';
import { getMaterialsByClass, markMaterialComplete } from '../../services/studentService';
import InteractiveMaterialHub from './InteractiveMaterialHub';
import styles from './MaterialList.module.css';

/**
 * MaterialList — Phase 2
 *
 * Màn hình danh sách tài liệu của một lớp học cụ thể.
 * Props:
 *   - selectedClass {object}  — lớp học đang xem
 *   - onBack        {func}    — quay lại màn hình chọn lớp
 */
function MaterialList({ selectedClass, onBack }) {
    // ── Data ──────────────────────────────────────────────────────
    const [materials, setMaterials]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);

    // ── Viewer overlay ────────────────────────────────────────────
    const [viewerMaterial, setViewerMaterial] = useState(null);

    // ── Filter state ──────────────────────────────────────────────
    const [searchText, setSearchText]     = useState('');
    const [typeFilter, setTypeFilter]     = useState('all'); // 'all' | 'video' | 'pdf' | 'document' | 'quiz'

    // ── Fetch materials ───────────────────────────────────────────
    const fetchMaterials = useCallback(async () => {
        if (!selectedClass?.id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getMaterialsByClass(selectedClass.id);
            setMaterials(Array.isArray(data) ? data : []);
        } catch {
            setError('Không thể tải danh sách tài liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [selectedClass?.id]);

    useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

    // ── Derived: progress ─────────────────────────────────────────
    const completedCount  = materials.filter(m => m.isCompleted).length;
    const totalCount      = materials.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // ── Derived: filtered list ────────────────────────────────────
    const filteredMaterials = materials.filter(m => {
        const matchSearch =
            searchText === '' ||
            m.title?.toLowerCase().includes(searchText.toLowerCase()) ||
            m.description?.toLowerCase().includes(searchText.toLowerCase());
        const matchType = typeFilter === 'all' || m.type === typeFilter;
        return matchSearch && matchType;
    });

    // ── Handler: mark complete (optimistic) ───────────────────────
    const handleMarkComplete = async (materialId) => {
        // Optimistic update
        setMaterials(prev =>
            prev.map(m => m.id === materialId ? { ...m, isCompleted: true } : m)
        );
        await markMaterialComplete(materialId);
    };

    // ── Handler: complete from viewer ─────────────────────────────
    const handleViewerComplete = (materialId) => {
        setMaterials(prev =>
            prev.map(m => m.id === materialId ? { ...m, isCompleted: true } : m)
        );
    };

    // ── Helpers ───────────────────────────────────────────────────
    const getTypeMeta = (type) => {
        switch (type) {
            case 'video':    return { label: '🎬 Video Bài Giảng',   cls: styles.badgeVideo };
            case 'pdf':      return { label: '📄 Giáo Trình PDF',    cls: styles.badgePdf };
            case 'document': return { label: '📝 Tài Liệu',          cls: styles.badgeDoc };
            case 'quiz':     return { label: '🧠 Mini Quiz',          cls: styles.badgeQuiz };
            default:         return { label: '📁 Tài liệu',          cls: styles.badgeDoc };
        }
    };

    const TYPE_FILTERS = [
        { value: 'all',      label: 'Tất cả', icon: Filter },
        { value: 'video',    label: 'Video',   icon: Video },
        { value: 'pdf',      label: 'PDF',     icon: FileText },
        { value: 'quiz',     label: 'Quiz',    icon: HelpCircle },
    ];

    // ── Render: Loading ───────────────────────────────────────────
    if (loading) return (
        <div className={styles.center}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Đang tải tài liệu...</p>
        </div>
    );

    if (error) return (
        <div className={styles.center}>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryBtn} onClick={fetchMaterials}>Thử lại</button>
        </div>
    );

    return (
        <>
            <div className={styles.container}>

                {/* ── Back button ── */}
                <button className={styles.backBtn} onClick={onBack}>
                    <ArrowLeft size={14} />
                    <span>Quay lại danh sách lớp</span>
                </button>

                {/* ── Header + progress badge ── */}
                <div className={styles.headerRow}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}><BookMarked size={18} /></div>
                        <div>
                            <h2 className={styles.headerTitle}>
                                Tài liệu của lớp:{' '}
                                <span className={styles.className}>{selectedClass.id}</span>
                            </h2>
                            <p className={styles.headerSub}>
                                {selectedClass.courseName || 'Kho tài liệu lý thuyết đảo ngược'}
                            </p>
                        </div>
                    </div>

                    {/* Progress badge */}
                    <div className={styles.progressBadge}>
                        <div className={styles.progressInfo}>
                            <p className={styles.progressLabel}>Học liệu đã xem</p>
                            <p className={styles.progressCount}>{completedCount}/{totalCount} tài liệu</p>
                        </div>
                        <div className={styles.progressTrackSm}>
                            <div
                                className={styles.progressFillSm}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className={styles.progressPct}>{progressPercent}%</span>
                    </div>
                </div>

                {/* ── Search + type filter bar ── */}
                <div className={styles.filterBar}>
                    {/* Search */}
                    <div className={styles.searchWrap}>
                        <Search size={14} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Tìm tài liệu..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                    </div>

                    {/* Type filter pills */}
                    <div className={styles.typePills}>
                        {TYPE_FILTERS.map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                className={`${styles.typePill} ${typeFilter === value ? styles.typePillActive : ''}`}
                                onClick={() => setTypeFilter(value)}
                            >
                                <Icon size={12} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Materials grid ── */}
                {filteredMaterials.length > 0 ? (
                    <div className={styles.grid}>
                        {filteredMaterials.map(m => {
                            const typeMeta = getTypeMeta(m.type);
                            return (
                                <div key={m.id} className={styles.card}>
                                    {/* Card header */}
                                    <div className={styles.cardHeader}>
                                        <span className={`${styles.typeBadge} ${typeMeta.cls}`}>
                                            {typeMeta.label}
                                        </span>
                                        {m.isCompleted ? (
                                            <span className={styles.doneBadge}>
                                                <CheckCircle size={11} />
                                                Đã hoàn tất
                                            </span>
                                        ) : (
                                            <span className={styles.pendingBadge}>Chưa xem</span>
                                        )}
                                    </div>

                                    {/* Title + description */}
                                    <h3 className={styles.cardTitle}>{m.title}</h3>
                                    <p className={styles.cardDesc}>{m.description}</p>

                                    {/* Footer */}
                                    <div className={styles.cardFooter}>
                                        <span className={styles.fileSize}>
                                            {m.fileSize ? `Dung lượng: ${m.fileSize}` : ''}
                                        </span>
                                        <div className={styles.cardActions}>
                                            <button
                                                className={styles.viewBtn}
                                                onClick={() => setViewerMaterial(m)}
                                            >
                                                Xem lý thuyết
                                            </button>
                                            {!m.isCompleted && (
                                                <button
                                                    className={styles.completeBtn}
                                                    onClick={() => handleMarkComplete(m.id)}
                                                >
                                                    Hoàn thành ✓
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <BookOpen size={36} className={styles.emptyIcon} />
                        <p className={styles.emptyTitle}>
                            {totalCount === 0
                                ? 'Lớp học này chưa có tài liệu nào'
                                : 'Không tìm thấy tài liệu phù hợp'}
                        </p>
                        {totalCount > 0 && (
                            <button
                                className={styles.clearFilterBtn}
                                onClick={() => { setSearchText(''); setTypeFilter('all'); }}
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── InteractiveMaterialHub overlay ── */}
            {viewerMaterial && (
                <InteractiveMaterialHub
                    material={viewerMaterial}
                    isInitiallyCompleted={viewerMaterial.isCompleted}
                    onClose={() => setViewerMaterial(null)}
                    onComplete={handleViewerComplete}
                />
            )}
        </>
    );
}

export default MaterialList;
