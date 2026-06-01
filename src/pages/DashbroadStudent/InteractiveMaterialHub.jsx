import { useState, useEffect } from 'react';
import {
    X, CheckCircle, CheckCircle2, Video, FileText, Presentation,
    Link2, HelpCircle, ChevronLeft, ChevronRight, Play,
    AlertCircle, ExternalLink, Sparkles, BookOpen
} from 'lucide-react';
import styles from './InteractiveMaterialHub.module.css';

/**
 * InteractiveMaterialHub
 *
 * Modal overlay cho việc xem chi tiết một tài liệu học tập.
 * Gồm 5 tab: Video · Slides · PDF · Links · Quiz
 *
 * Props:
 *   material              {object}  — tài liệu đang xem
 *   isInitiallyCompleted  {boolean} — trạng thái ban đầu
 *   onClose               {func}    — đóng overlay
 *   onComplete            {func(id)}— callback khi hoàn thành
 */
function InteractiveMaterialHub({ material, isInitiallyCompleted, onClose, onComplete }) {
    const done = isInitiallyCompleted;

    // ── Sub-tab navigation ────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('video');

    // ── Progress states ───────────────────────────────────────────
    const [videoWatched,  setVideoWatched]  = useState(done);
    const [slidesRead,    setSlidesRead]    = useState(done);
    const [pdfRead,       setPdfRead]       = useState(done);
    const [linksVisited,  setLinksVisited]  = useState(done);
    const [quizPassed,    setQuizPassed]    = useState(done);

    // ── Video player state ────────────────────────────────────────
    const [isVideoPlaying, setIsVideoPlaying]   = useState(false);
    const [videoDone,       setVideoDone]        = useState(done);
    const [countdown,       setCountdown]        = useState(5);

    // ── Slide state ───────────────────────────────────────────────
    const [currentSlide, setCurrentSlide] = useState(1);
    const TOTAL_SLIDES = 4;

    // ── PDF checkbox state ────────────────────────────────────────
    const [chapters, setChapters] = useState({
        intro: done, core: done, cases: done,
    });

    // ── Quiz state ────────────────────────────────────────────────
    const [q1, setQ1] = useState(null);
    const [q2, setQ2] = useState(null);
    const [quizSubmitted, setQuizSubmitted] = useState(done);
    const [quizError,     setQuizError]     = useState(false);

    // ── Toast ─────────────────────────────────────────────────────
    const [toast, setToast] = useState('');
    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3200);
    };

    // ── Video countdown ───────────────────────────────────────────
    useEffect(() => {
        if (!isVideoPlaying || videoDone || countdown <= 0) return;
        const t = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    setVideoDone(true);
                    setVideoWatched(true);
                    showToast('🎬 Đã tự động ghi nhận xem video bài giảng!');
                    return 0;
                }
                return prev - 1;
            });
        }, 1050);
        return () => clearInterval(t);
    }, [isVideoPlaying, videoDone, countdown]);

    // ── Auto-trigger onComplete when any part done ────────────────
    useEffect(() => {
        if (!done && (videoWatched || pdfRead || slidesRead || quizPassed)) {
            onComplete(material.id);
        }
    }, [videoWatched, slidesRead, pdfRead, quizPassed]);

    // ── Derived: overall progress ─────────────────────────────────
    const parts = [videoWatched, slidesRead, pdfRead, linksVisited, quizPassed];
    const completedParts  = parts.filter(Boolean).length;
    const overallProgress = Math.round((completedParts / parts.length) * 100);

    // ── Handlers ─────────────────────────────────────────────────
    const handleSkipVideo = () => {
        setVideoDone(true);
        setVideoWatched(true);
        showToast('🎬 Đã hoàn tất xem video!');
    };

    const handleNextSlide = () => {
        if (currentSlide < TOTAL_SLIDES) {
            setCurrentSlide(p => p + 1);
        } else {
            setSlidesRead(true);
            showToast('📊 Hoàn thành bộ slide bài thuyết trình!');
        }
    };

    const handleToggleChapter = (key) => {
        const next = { ...chapters, [key]: !chapters[key] };
        setChapters(next);
        if (next.intro && next.core && next.cases) {
            setPdfRead(true);
            showToast('📑 Hoàn thành 100% nội dung giáo trình!');
        }
    };

    const handleLinkClick = () => {
        setLinksVisited(true);
        showToast('🔗 Đã ghi nhận truy cập tài liệu tham khảo!');
    };

    const handleSubmitQuiz = () => {
        if (q1 === 'B' && q2 === 'C') {
            setQuizPassed(true);
            setQuizSubmitted(true);
            setQuizError(false);
            showToast('🧠 Đạt 10/10 Mini-Quiz!');
        } else {
            setQuizError(true);
        }
    };

    // ── Sidebar tabs config ───────────────────────────────────────
    const TABS = [
        { id: 'video',  label: '1. Video Bài Giảng',        icon: Video,       done: videoWatched,  badge: videoDone ? null : `${countdown}s` },
        { id: 'slides', label: '2. Slide Thuyết Trình',     icon: Presentation,done: slidesRead,    badge: slidesRead ? null : `${currentSlide}/${TOTAL_SLIDES}` },
        { id: 'pdf',    label: '3. Sách & Giáo Trình PDF',  icon: FileText,    done: pdfRead,       badge: pdfRead ? null : 'Đọc' },
        { id: 'links',  label: '4. Tài Liệu Nghiên Cứu',   icon: Link2,       done: linksVisited,  badge: linksVisited ? null : 'Mở' },
        { id: 'quiz',   label: '5. Mini Quiz Khám Phá',     icon: HelpCircle,  done: quizPassed,    badge: quizPassed ? null : 'Quiz' },
    ];

    const PANEL_TITLES = {
        video:  '🎬 Trình Phát Video Bài Giảng',
        slides: '📊 Bộ Slide Bài Thuyết Trình',
        pdf:    '📑 Giáo Trình Lý Thuyết',
        links:  '🔗 Tài Liệu Nghiên Cứu',
        quiz:   '🧠 Mini Quiz Kiểm Tra',
    };

    return (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>

                {/* ── LEFT SIDEBAR ── */}
                <aside className={styles.sidebar}>
                    <div>
                        <div className={styles.sidebarTop}>
                            <span className={styles.kitBadge}>Flipped Learning Kit</span>
                            <span className={styles.codeLabel}>Mã bài: {material.id}</span>
                        </div>
                        <h3 className={styles.materialTitle}>{material.title}</h3>
                        <p className={styles.materialDesc}>
                            Kho tài liệu cung cấp chuỗi bài giảng trực quan, slide, giáo trình và đánh giá nhanh.
                        </p>

                        {/* Tab list */}
                        <p className={styles.tabsLabel}>Danh mục học liệu bắt buộc</p>
                        <div className={styles.tabList}>
                            {TABS.map(({ id, label, icon: Icon, done: tabDone, badge }) => (
                                <button
                                    key={id}
                                    className={`${styles.tabItem} ${activeTab === id ? styles.tabItemActive : ''}`}
                                    onClick={() => setActiveTab(id)}
                                >
                                    <div className={styles.tabLeft}>
                                        <Icon size={15} className={styles.tabIcon} />
                                        <div>
                                            <p className={styles.tabLabel}>{label}</p>
                                        </div>
                                    </div>
                                    {tabDone
                                        ? <CheckCircle2 size={15} className={activeTab === id ? styles.checkWhite : styles.checkGreen} />
                                        : badge && <span className={`${styles.tabBadge} ${activeTab === id ? styles.tabBadgeActive : ''}`}>{badge}</span>
                                    }
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Overall progress */}
                    <div className={styles.overallProgress}>
                        <div className={styles.progressHeader}>
                            <span>Độ hoàn thiện học liệu</span>
                            <span className={styles.progressPct}>{overallProgress}%</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${overallProgress}%` }} />
                        </div>
                        <p className={styles.progressNote}>
                            *Hoàn thành <strong>{parts.length}</strong> học liệu giúp tối ưu điểm quá trình.
                        </p>
                    </div>
                </aside>

                {/* ── RIGHT PANEL ── */}
                <div className={styles.panel}>
                    {/* Panel header */}
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.panelBadge}>Trình mô phỏng học liệu thông minh</p>
                            <h4 className={styles.panelTitle}>{PANEL_TITLES[activeTab]}</h4>
                        </div>
                        <button className={styles.closeBtn} onClick={onClose} title="Đóng">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Panel content */}
                    <div className={styles.panelContent}>

                        {/* ── VIDEO TAB ── */}
                        {activeTab === 'video' && (
                            <div className={styles.videoSection}>
                                <div className={styles.videoBox}>
                                    <video
                                        src={material.url || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                                        controls
                                        onPlay={() => setIsVideoPlaying(true)}
                                        onPause={() => setIsVideoPlaying(false)}
                                        className={styles.videoEl}
                                    />

                                    {/* Play overlay */}
                                    {!isVideoPlaying && !videoDone && (
                                        <div className={styles.playOverlay} onClick={() => setIsVideoPlaying(true)}>
                                            <div className={styles.playBtn}><Play size={24} className={styles.playIcon} /></div>
                                            <p className={styles.playHint}>Play video để bắt đầu tích lũy tiến độ</p>
                                        </div>
                                    )}

                                    {/* Countdown bar */}
                                    {!videoDone && (
                                        <div className={styles.countdownBar}>
                                            <div className={styles.countdownLeft}>
                                                <span className={styles.pingDot} />
                                                <span>Đang ghi nhận: <strong className={styles.countdownNum}>{countdown} giây</strong> còn lại</span>
                                            </div>
                                            <button className={styles.skipBtn} onClick={handleSkipVideo}>
                                                Bỏ qua & Hoàn Tất
                                            </button>
                                        </div>
                                    )}

                                    {/* Done badge */}
                                    {videoDone && (
                                        <div className={styles.videoDoneBadge}>
                                            <CheckCircle size={13} /> ĐÃ XEM XONG
                                        </div>
                                    )}
                                </div>
                                <div className={styles.videoMeta}>
                                    <p className={styles.videoMetaTitle}>Mô tả bài giảng:</p>
                                    <p className={styles.videoMetaDesc}>{material.description}</p>
                                    <p className={styles.videoMetaInfo}>• Tải lên: {material.uploadedAt} &nbsp;•&nbsp; Định dạng: MP4</p>
                                </div>
                            </div>
                        )}

                        {/* ── SLIDES TAB ── */}
                        {activeTab === 'slides' && (
                            <div className={styles.slidesSection}>
                                <div className={styles.slideBox}>
                                    <div className={styles.slideTop}>
                                        <span className={styles.slideMonoLabel}>SLIDE PRESENTATION</span>
                                        <span className={styles.slideMonoLabel}>{currentSlide} OF {TOTAL_SLIDES}</span>
                                    </div>

                                    {currentSlide === 1 && (
                                        <div className={styles.slideContent}>
                                            <h4 className={styles.slideHeading}>1. Định Hướng & Phương pháp Flipped Classroom</h4>
                                            <p className={styles.slideText}>Mô hình lớp học đảo ngược là phương pháp lấy người học làm trung tâm. Thay vì nghe giảng lý thuyết thụ động tại lớp:</p>
                                            <ul className={styles.slideList}>
                                                <li>Sinh viên tự nghiên cứu lý thuyết trực quan ở nhà.</li>
                                                <li>Dành thời gian trên lớp để giải quyết các vướng mắc.</li>
                                            </ul>
                                        </div>
                                    )}
                                    {currentSlide === 2 && (
                                        <div className={styles.slideContent}>
                                            <h4 className={styles.slideHeading}>2. Quy chế tích lũy % chuyên cần</h4>
                                            <p className={styles.slideText}>Lý thuyết tự học được chia thành chuỗi tài liệu bắt buộc: video ngắn, slide cốt lõi, tài liệu PDF, liên kết bổ túc.</p>
                                            <div className={styles.slideNote}>*Hệ thống tự động đồng bộ thời lượng xem qua API thời gian thực.</div>
                                        </div>
                                    )}
                                    {currentSlide === 3 && (
                                        <div className={styles.slideContent}>
                                            <h4 className={styles.slideHeading}>3. Đặt câu hỏi phản biện nghịch đảo</h4>
                                            <p className={styles.slideText}>Sinh viên xuất sắc cần chuẩn bị ít nhất 2 câu hỏi hoài nghi hoặc tình huống chưa thấu hiểu trước buổi học.</p>
                                            <p className={styles.slideAmber}>Giảng viên sẽ đánh giá điểm rèn luyện cho các câu hỏi xuất thần trực tiếp tại lớp.</p>
                                        </div>
                                    )}
                                    {currentSlide === 4 && (
                                        <div className={styles.slideContent}>
                                            <h4 className={styles.slideHeading}>4. Tự đánh giá & Tổng kết</h4>
                                            <p className={styles.slideSuccess}>★ Chúc mừng bạn đã hoàn thiện chuỗi slide!</p>
                                            <p className={styles.slideText}>Hãy xem PDF và hoàn tất Mini-Quiz để hệ thống lưu hồ sơ tự học tốt nhất.</p>
                                        </div>
                                    )}

                                    {/* Navigation */}
                                    <div className={styles.slideNav}>
                                        <button
                                            className={styles.slideNavBtn}
                                            onClick={() => currentSlide > 1 && setCurrentSlide(p => p - 1)}
                                            disabled={currentSlide === 1}
                                        >
                                            <ChevronLeft size={15} /> Trang trước
                                        </button>
                                        <span className={styles.slidePager}>{currentSlide} / {TOTAL_SLIDES}</span>
                                        <button className={styles.slideNavBtnNext} onClick={handleNextSlide}>
                                            {currentSlide === TOTAL_SLIDES ? 'Hoàn tất Slide ✓' : 'Trang kế tiếp'} <ChevronRight size={15} />
                                        </button>
                                    </div>
                                </div>
                                {slidesRead && (
                                    <div className={styles.successBanner}>
                                        <CheckCircle size={15} /> Đã hoàn thành xem slide — đã ghi nhận vào dữ liệu học tập!
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── PDF TAB ── */}
                        {activeTab === 'pdf' && (
                            <div className={styles.pdfSection}>
                                <div className={styles.pdfReader}>
                                    <div className={styles.pdfTopBar}>
                                        <FileText size={13} />
                                        <span>GIÁO TRÌNH PDF — LỚP HỌC ĐẢO NGƯỢC</span>
                                    </div>
                                    <div className={styles.pdfChapter}>
                                        <h5>Mục lục 1: Tổng thể lý thuyết & Cơ sở lý luận</h5>
                                        <p>Nghiên cứu khoa học giáo dục chỉ ra sự sụt giảm nghiêm trọng trong việc tiếp thu kiến thức khi sinh viên ngồi nghe giảng đơn thuần. Flipped Classroom ra đời như giải pháp đảo ngược cấu trúc học, biến bài học trên lớp thành phòng thực nghiệm và tranh luận khoa học.</p>
                                    </div>
                                    <div className={styles.pdfChapter}>
                                        <h5>Mục lục 2: Mô hình chuỗi kích hoạt 4 lớp</h5>
                                        <p>1. Khởi động: Video 5-10 phút.<br />2. Thụ đắc nền: Nghiên cứu PDF.<br />3. Đào sâu: Trắc nghiệm chuẩn bị.<br />4. Tranh biện trực tiếp với giảng viên.</p>
                                    </div>
                                    <div className={styles.pdfChapter}>
                                        <h5>Mục lục 3: Ứng dụng triển khai thực tế</h5>
                                        <p>Bố trí lịch trình tự học 1,5 giờ/tuần giúp sinh viên làm chủ từ vựng học thuật, tiết kiệm 70% thời gian chép bài và ứng dụng ngay vào bài tập lớn.</p>
                                    </div>
                                </div>
                                <div className={styles.pdfChecklist}>
                                    <p className={styles.checklistLabel}>Tích vào các chương đã đọc:</p>
                                    <div className={styles.checklistGrid}>
                                        {[
                                            { key: 'intro', text: '1. Khái quát chung' },
                                            { key: 'core',  text: '2. Chuỗi kích hoạt' },
                                            { key: 'cases', text: '3. Ứng dụng thực tế' },
                                        ].map(({ key, text }) => (
                                            <label key={key} className={styles.checkItem}>
                                                <input
                                                    type="checkbox"
                                                    checked={chapters[key]}
                                                    onChange={() => handleToggleChapter(key)}
                                                    className={styles.checkbox}
                                                />
                                                <span>{text}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── LINKS TAB ── */}
                        {activeTab === 'links' && (
                            <div className={styles.linksSection}>
                                <p className={styles.linksIntro}>
                                    Tham khảo các nghiên cứu khoa học được bộ môn khuyến nghị. Bấm vào bất kỳ liên kết nào để tự động cập nhật tiến trình.
                                </p>
                                <div className={styles.linksGrid}>
                                    {[
                                        { href: 'https://en.wikipedia.org/wiki/Flipped_classroom', label: 'Wikipedia', title: 'Mô hình Flipped Classroom Toàn Thư', desc: 'Khái niệm học thuyết, lịch sử phát triển và phương diện sư phạm.', color: 'amber' },
                                        { href: 'https://vietnamnet.vn', label: 'Nghiên Cứu', title: 'Ứng dụng tại khối ngành kỹ thuật', desc: 'Báo cáo đo lường kết quả rèn luyện của 1.000 học sinh theo mô hình đảo ngược.', color: 'blue' },
                                    ].map(({ href, label, title, desc, color }) => (
                                        <a
                                            key={href}
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.linkCard}
                                            onClick={handleLinkClick}
                                        >
                                            <div className={styles.linkCardTop}>
                                                <span className={`${styles.linkBadge} ${styles[`linkBadge_${color}`]}`}>{label}</span>
                                                <ExternalLink size={13} className={styles.linkExtIcon} />
                                            </div>
                                            <h5 className={styles.linkTitle}>{title}</h5>
                                            <p className={styles.linkDesc}>{desc}</p>
                                        </a>
                                    ))}
                                </div>
                                {linksVisited && (
                                    <div className={styles.successBanner}>
                                        <CheckCircle2 size={15} /> Đã ghi nhận truy cập tài liệu nghiên cứu!
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── QUIZ TAB ── */}
                        {activeTab === 'quiz' && (
                            <div className={styles.quizSection}>
                                <div className={styles.quizIntro}>
                                    <Sparkles size={16} className={styles.quizIntroIcon} />
                                    <div>
                                        <strong>Tự nghiệm thu bài học trước khi đến Lớp:</strong>
                                        <span> Hoàn thành chính xác 2 câu trắc nghiệm để chứng minh bạn đã học nghiêm túc.</span>
                                    </div>
                                </div>

                                {quizPassed ? (
                                    <div className={styles.quizSuccess}>
                                        <div className={styles.quizSuccessIcon}>✓</div>
                                        <h5>VƯỢT QUA MINI-QUIZ</h5>
                                        <p>Bạn đã trả lời chính xác — hệ thống đã ghi nhận trạng thái tự học ưu tú!</p>
                                        <button
                                            className={styles.quizRetryBtn}
                                            onClick={() => { setQuizPassed(false); setQuizSubmitted(false); setQ1(null); setQ2(null); }}
                                        >
                                            Làm lại bộ câu trắc nghiệm
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.quizForm}>
                                        {/* Q1 */}
                                        <div className={styles.quizQuestion}>
                                            <p className={styles.quizQuestionText}>Câu 1: Điểm cốt lõi của Flipped Classroom là gì?</p>
                                            {[
                                                { val: 'A', text: 'A) Học sinh nghe giáo viên truyền đạt 100% thời gian trên lớp.' },
                                                { val: 'B', text: 'B) Sinh viên tự học ở nhà qua video, dùng buổi lên lớp để thảo luận sâu.', correct: true },
                                            ].map(({ val, text, correct }) => (
                                                <label key={val} className={styles.radioItem}>
                                                    <input type="radio" name="q1" checked={q1 === val} onChange={() => setQ1(val)} className={styles.radio} />
                                                    <span className={correct ? styles.correctOption : ''}>{text}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {/* Q2 */}
                                        <div className={styles.quizQuestion}>
                                            <p className={styles.quizQuestionText}>Câu 2: Vì sao sinh viên cần chuẩn bị câu hỏi hoài nghi trước khi đến Lớp?</p>
                                            {[
                                                { val: 'A', text: 'A) Để làm giáo viên khó xử và kéo dài thời gian thư giãn.' },
                                                { val: 'C', text: 'C) Để rèn luyện tư duy phản biện và tập trung vào nội dung còn vướng mắc.', correct: true },
                                            ].map(({ val, text, correct }) => (
                                                <label key={val} className={styles.radioItem}>
                                                    <input type="radio" name="q2" checked={q2 === val} onChange={() => setQ2(val)} className={styles.radio} />
                                                    <span className={correct ? styles.correctOption : ''}>{text}</span>
                                                </label>
                                            ))}
                                        </div>

                                        {quizError && (
                                            <div className={styles.quizError}>
                                                <AlertCircle size={14} /> Đáp án chưa đúng! Đọc kỹ Slide hoặc Giáo Trình rồi thử lại.
                                            </div>
                                        )}
                                        <button
                                            className={`${styles.quizSubmitBtn} ${!q1 || !q2 ? styles.quizSubmitDisabled : ''}`}
                                            onClick={handleSubmitQuiz}
                                            disabled={!q1 || !q2}
                                        >
                                            Nộp bài kiểm tra & Xác nhận hoàn thành
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Panel footer */}
                    <div className={styles.panelFooter}>
                        <p className={styles.footerNote}>
                            *Hoàn thành tất cả {parts.length} học liệu sẽ giúp tối ưu điểm quá trình của sinh viên.
                        </p>
                        <button className={styles.footerCloseBtn} onClick={onClose}>
                            <X size={13} /> Đóng bảng học liệu
                        </button>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && <div className={styles.toast}>{toast}</div>}
        </div>
    );
}

export default InteractiveMaterialHub;
