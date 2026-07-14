import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  FileText,
  BookOpen,
  Paperclip,
  Download,
  Code,
  Users,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Maximize,
  ExternalLink,
  ZoomIn,
} from "lucide-react";
import StudentQuizPlayer from "./StudentQuizPlayer";

// ─────────────────────────────────────────
// Helper: lưu / lấy vị trí xem video
// ─────────────────────────────────────────
const STORAGE_PREFIX = "flipped_vpos_";
const savePlaybackPos = (lectureId, time) => {
  try { localStorage.setItem(STORAGE_PREFIX + lectureId, String(time)); } catch {}
};
const getPlaybackPos = (lectureId) => {
  try { return parseFloat(localStorage.getItem(STORAGE_PREFIX + lectureId) || "0"); } catch { return 0; }
};

// ─────────────────────────────────────────
// Sub-component: Video Player chuẩn
// ─────────────────────────────────────────
function VideoPlayer({ src, lectureId }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  // Khôi phục vị trí xem sau khi video sẵn sàng
  const handleCanPlay = () => {
    setLoading(false);
    const saved = getPlaybackPos(lectureId);
    if (saved > 1 && videoRef.current) {
      videoRef.current.currentTime = saved;
    }
  };

  // Lưu vị trí xem mỗi 5 giây
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        savePlaybackPos(lectureId, videoRef.current.currentTime);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [lectureId]);

  // Lưu khi rời trang
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        savePlaybackPos(lectureId, videoRef.current.currentTime);
      }
    };
  }, [lectureId]);

  // Keyboard shortcuts: Space, ←/→, F
  useEffect(() => {
    const handleKey = (e) => {
      const v = videoRef.current;
      if (!v) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); v.paused ? v.play() : v.pause(); }
      if (e.code === "ArrowRight") { e.preventDefault(); v.currentTime = Math.min(v.duration, v.currentTime + 10); }
      if (e.code === "ArrowLeft") { e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 10); }
      if (e.code === "KeyF") { e.preventDefault(); v.requestFullscreen?.(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (error) {
    return (
      <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-3 text-center p-6">
        <AlertTriangle size={40} className="text-amber-400" />
        <p className="text-white font-bold">Không thể tải video bài giảng</p>
        <p className="text-gray-500 text-xs">URL có thể đã hết hạn hoặc bị lỗi.</p>
        <button
          onClick={() => { setError(false); setLoading(true); if (videoRef.current) videoRef.current.load(); }}
          className="mt-2 flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-gray-900 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
        >
          <RefreshCw size={14} /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      {loading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <span className="text-gray-500 text-xs">Đang tải video...</span>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full h-full"
        onLoadStart={() => setLoading(true)}
        onCanPlay={handleCanPlay}
        onError={() => { setLoading(false); setError(true); }}
      />
      <div className="absolute bottom-14 right-2 z-10">
        <button
          onClick={() => videoRef.current?.requestFullscreen?.()}
          className="bg-black/50 hover:bg-black/80 text-white p-1.5 rounded text-[10px] flex items-center gap-1 transition cursor-pointer"
          title="Toàn màn hình (F)"
        >
          <Maximize size={12} />
        </button>
      </div>
      <p className="absolute bottom-1 right-2 text-[9px] text-white/30 select-none">Space: Play/Pause · ←/→: Tua 10s · F: Toàn màn hình</p>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-component: Image Viewer
// ─────────────────────────────────────────
function ImageViewer({ src, title }) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 relative p-4 cursor-zoom-in" onClick={() => setZoomed(true)}>
      <img src={src} alt={title} className="max-w-full max-h-full object-contain rounded" />
      <button className="absolute top-3 right-3 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded cursor-pointer transition">
        <ZoomIn size={14} />
      </button>
      {zoomed && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center cursor-zoom-out p-4"
          onClick={() => setZoomed(false)}
        >
          <img src={src} alt={title} className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-component: PDF Viewer
// ─────────────────────────────────────────
function PdfViewer({ src, title }) {
  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <span className="text-xs text-gray-600 font-medium truncate">{title}</span>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition"
        >
          <ExternalLink size={13} /> Mở tab mới
        </a>
      </div>
      <iframe src={src} title={title} className="flex-1 w-full border-0" />
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-component: Document / Link Card
// ─────────────────────────────────────────
function DocumentCard({ url, title, type }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-8 text-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-emerald-400 mb-2">
        <FileText size={40} />
      </div>
      <h3 className="text-gray-900 text-lg font-bold">{title}</h3>
      <p className="text-gray-500 text-sm">Định dạng: <span className="uppercase font-mono text-gray-600">{type}</span></p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-gray-900 font-bold py-2.5 px-7 rounded-xl transition shadow-lg mt-2"
      >
        <Download size={16} /> Mở / Tải xuống
      </a>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-component: In-Class Placeholder
// ─────────────────────────────────────────
function InClassPlaceholder({ lecture, onOpenTab }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 flex flex-col justify-center items-center text-center gap-5 p-8">
      <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-900">
        <Users size={44} className="text-emerald-400 animate-pulse" />
      </div>
      <div className="space-y-2">
        <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-emerald-950/75 border border-emerald-900 inline-block">
          Học trực tiếp trên lớp (In-Class)
        </span>
        <h3 className="text-gray-900 text-xl font-bold mt-2">{lecture.title}</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
          Bài học này được thiết kế để thực hành tương tác tại giảng đường. Xem hướng dẫn thực hành bên dưới.
        </p>
      </div>
      <button
        onClick={onOpenTab}
        className="bg-emerald-700 hover:bg-emerald-600 text-gray-900 font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2"
      >
        <ChevronRight size={16} /> Xem hướng dẫn thực hành
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
export default function LessonPlayer({
  lecture,
  sectionId,
  completedLectures = [],
  quizScores = {},
  homeworkStatus = {},
  onSubmitQuizScore,
  onToggleComplete,
  onSubmitHomework,
  addPoints,
  triggerNotification,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [homeworkCode, setHomeworkCode] = useState("");
  const [fadeKey, setFadeKey] = useState(0); // trigger fade-in on lecture change

  // ── Sync on lecture change ──
  useEffect(() => {
    setHomeworkCode(lecture?.postClassHomework?.starterCode || "");
    setFadeKey((k) => k + 1);
    if (lecture?.type === "in_class") setActiveTab("in_class");
    else if (lecture?.type === "post_class") setActiveTab("homework");
    else if (lecture?.type === "quiz") setActiveTab("quiz");
    else setActiveTab("overview");
  }, [lecture?.id]);

  // ── Available tabs (computed) ──
  const availableTabs = useMemo(() => {
    if (!lecture) return [];
    const tabs = [];
    if (lecture.type === "quiz") return [{ id: "quiz", label: "❓ Bài kiểm tra" }];
    if (lecture.type === "in_class" && lecture.inClassExercise)
      return [{ id: "in_class", label: "👥 Thực hành nhóm" }];
    if (lecture.type === "post_class" && lecture.postClassHomework)
      return [{ id: "homework", label: "📝 Bài tập" }];
    // Pre-class / video / pdf / image / document
    if (lecture.readings || (lecture.attachments?.length > 0)) tabs.push({ id: "overview", label: "📖 Tài liệu" });
    return tabs;
  }, [lecture]);

  // ── Quiz logic ──
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const handleSelectAnswer = (questionId, optionIndex) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleQuizSubmit = () => {
    if (!lecture?.quiz?.length) return;
    let correct = 0;
    lecture.quiz.forEach((q) => { if (selectedAnswers[q.id] === q.correctAnswer) correct++; });
    const percent = Math.round((correct / lecture.quiz.length) * 100);
    const passed = percent >= 50;
    setQuizResult({ score: percent, passed });
    setQuizSubmitted(true);
    onSubmitQuizScore(percent);
    if (passed) {
      addPoints(100);
      triggerNotification(`🎉 Hoàn thành! Tỉ lệ ${percent}%. +100 XP`, "success");
      if (!completedLectures.includes(lecture.id)) onToggleComplete();
    } else {
      triggerNotification(`⚠️ Chỉ đạt ${percent}%. Hãy ôn lại và thử lại!`, "info");
    }
  };

  // ── Homework logic ──
  const handleHomeworkSubmit = () => {
    if (!homeworkCode.trim()) { alert("Vui lòng gõ bài giải trước khi nộp!"); return; }
    onSubmitHomework();
    addPoints(150);
    triggerNotification("🚀 Nộp bài tập thành công! +150 XP", "success");
    if (!completedLectures.includes(lecture.id)) onToggleComplete();
  };

  // ── Attachment download ──
  const handleAttachmentDownload = (fileName) => {
    triggerNotification(`📥 Tải xuống "${fileName}" thành công. +5 XP`, "success");
    addPoints(5);
  };

  // ── Empty state ──
  if (!lecture) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-xl border border-gray-200 gap-5 text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
          <Play size={36} />
        </div>
        <div>
          <h3 className="text-gray-900 font-bold text-lg">Chọn bài học để bắt đầu</h3>
          <p className="text-gray-500 text-sm mt-1">Nhấp vào bài học ở danh sách bên phải để xem nội dung.</p>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs mt-2 bg-gray-100 px-4 py-2 rounded-lg">
          <ChevronRight size={14} className="text-emerald-500" />
          <span>Chọn chương → chọn bài học từ sidebar bên phải</span>
        </div>
      </div>
    );
  }

  // ── Media area ──
  const fileUrl = lecture.url || lecture.videoUrl;
  const renderMedia = () => {
    if (lecture.type === "quiz") return null;
    if (lecture.type === "in_class") return <InClassPlaceholder lecture={lecture} onOpenTab={() => setActiveTab("in_class")} />;

    if (!fileUrl || fileUrl === '#' || fileUrl.startsWith('#file:')) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 text-sm gap-3 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2">
            <FileText size={32} className="text-gray-400" />
          </div>
          <span className="font-bold text-gray-600">
            {fileUrl?.startsWith('#file:') ? `Tệp đính kèm: ${fileUrl.substring(6)}` : 'Bài học này chưa có tệp media đính kèm.'}
          </span>
          <span className="text-xs text-gray-400 mt-1 max-w-sm">
            {fileUrl?.startsWith('#file:') 
              ? 'Tệp này được lưu trữ nội bộ và không thể xem trước trực tiếp trên trình duyệt.' 
              : 'Giảng viên chưa cập nhật nội dung đa phương tiện cho bài học này.'}
          </span>
        </div>
      );
    }

    if (lecture.type === "video") return <VideoPlayer src={fileUrl} lectureId={lecture.id} />;
    if (lecture.type === "image") return <ImageViewer src={fileUrl} title={lecture.title} />;
    if (lecture.type === "pdf") return <PdfViewer src={fileUrl} title={lecture.title} />;
    return <DocumentCard url={fileUrl} title={lecture.title} type={lecture.type} />;
  };

  const isQuiz = lecture.type === "quiz";
  const completionPercent = completedLectures.length > 0 ? Math.min(100, completedLectures.length * 10) : 0;

  return (
    <div
      key={fadeKey}
      className={`flex flex-col rounded-xl overflow-hidden shadow-lg h-full transition-opacity duration-300 ${isQuiz ? "bg-white border-gray-200" : "bg-white border border-gray-200"}`}
      style={{ animation: "fadeIn 0.3s ease" }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>

      {/* Progress bar */}
      {!isQuiz && completedLectures.length > 0 && (
        <div className="h-0.5 bg-gray-100 w-full">
          <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${completionPercent}%` }} />
        </div>
      )}

      {/* Media viewport */}
      {!isQuiz && (
        <div className="relative bg-black aspect-video flex-shrink-0 overflow-hidden">
          {renderMedia()}
        </div>
      )}

      {/* Tab navigation */}
      {availableTabs.length > 0 && (
        <div className={`border-b px-4 overflow-x-auto flex items-center whitespace-nowrap scrollbar-none ${isQuiz ? "border-gray-200 bg-white" : "border-gray-200 bg-white"}`}>
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pt-3.5 pb-2.5 px-4 font-bold text-xs transition border-b-2 flex items-center gap-1.5 cursor-pointer ${activeTab === tab.id
                ? "text-emerald-400 border-emerald-500"
                : "text-gray-500 hover:text-gray-900 border-transparent"
              }`}
            >
              {tab.label}
              {tab.id === "homework" && homeworkStatus[lecture.id] === "submitted" && (
                <span className="text-[9px] bg-emerald-600 text-gray-900 rounded px-1.5 font-bold uppercase">Đã nộp</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar p-5 min-h-[200px] ${isQuiz ? "bg-white text-gray-800" : "bg-gray-50 text-gray-800"}`}>

        {/* Quiz tab */}
        {((activeTab === "quiz" && lecture.type !== "quiz") || lecture.type === "quiz") && (
          <StudentQuizPlayer
            quizId={lecture.fileUrl || lecture.url || lecture.id}
            triggerNotification={triggerNotification}
            addPoints={addPoints}
            onToggleComplete={onToggleComplete}
          />
        )}

        {/* Overview / Reading materials */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {lecture.readings && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <BookOpen size={16} className="text-emerald-400" />
                  <h4 className="text-sm font-bold text-emerald-400">Tài liệu đọc hiểu</h4>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl leading-relaxed text-sm text-gray-600 space-y-3">
                  <h5 className="font-bold text-gray-900 text-sm">{lecture.readings.title}</h5>
                  <p className="text-gray-600">{lecture.readings.content}</p>
                </div>
                {lecture.readings.keyPoints?.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Trọng tâm cần ghi nhớ:</span>
                    <div className="grid grid-cols-1 gap-2">
                      {lecture.readings.keyPoints.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded border border-gray-200 text-xs">
                          <span className="text-yellow-500 shrink-0 mt-0.5">💡</span>
                          <span className="text-gray-600">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {lecture.attachments?.length > 0 && (
              <div className="space-y-3 border-t border-gray-200 pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <Paperclip size={13} /> Tài liệu đính kèm ({lecture.attachments.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lecture.attachments.map((file, i) => (
                    <div key={i} className="bg-white border border-gray-200 hover:border-emerald-700 rounded-lg p-3 flex items-center justify-between gap-2 transition">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-gray-100 rounded text-emerald-400"><FileText size={16} /></div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-gray-800 block truncate">{file.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{file.size} · {file.type?.toUpperCase()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAttachmentDownload(file.name)}
                        className="text-gray-500 hover:text-emerald-400 p-1.5 hover:bg-gray-100 rounded transition shrink-0 cursor-pointer"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!lecture.readings && !lecture.attachments?.length && (
              <div className="text-center py-8 text-gray-400 text-sm">
                Bài học này chưa có tài liệu bổ sung.
              </div>
            )}
          </div>
        )}

        {/* In-Class tab */}
        {activeTab === "in_class" && lecture.inClassExercise && (
          <div className="space-y-5">
            <div className="border-b border-gray-200 pb-3">
              <span className="text-[10px] bg-emerald-950 border border-emerald-900 text-emerald-300 font-bold px-2.5 py-0.5 rounded inline-block mb-1.5 uppercase tracking-wider">
                Mục tiêu: Làm việc nhóm & Học chủ động
              </span>
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <Users size={16} /> Phiếu hướng dẫn thực hành trực tiếp trên lớp
              </h4>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">Chủ đề:</span>
                <span className="font-bold text-base text-gray-900">{lecture.inClassExercise.topic}</span>
              </div>
              {lecture.inClassExercise.collaborationGuide && (
                <div className="bg-emerald-950/20 border border-emerald-900/60 rounded-lg p-3.5 flex items-start gap-3">
                  <Users className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block mb-0.5">Lời khuyên của Instructor:</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{lecture.inClassExercise.collaborationGuide}</p>
                  </div>
                </div>
              )}
              {lecture.inClassExercise.instructions?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-bold block">Quy trình thực hiện:</span>
                  <div className="space-y-2">
                    {lecture.inClassExercise.instructions.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 pb-2 border-b border-gray-200 last:border-0">
                        <span className="w-5 h-5 rounded bg-gray-100 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-gray-600 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Homework tab */}
        {activeTab === "homework" && lecture.postClassHomework && (
          <div className="space-y-5">
            <div className="border-b border-gray-200 pb-3">
              <span className="text-[10px] bg-emerald-950 border border-emerald-900 text-emerald-300 font-bold px-2.5 py-0.5 rounded inline-block mb-1.5 uppercase tracking-wider">
                Mục tiêu: Tự hoàn thiện kiến thức (Mastery)
              </span>
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <Code size={16} /> Thử thách lập trình & Ôn tập sau lớp
              </h4>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              <h5 className="font-bold text-sm text-gray-900">🛡️ {lecture.postClassHomework.challengeTitle}</h5>
              <p className="text-xs text-gray-600 leading-relaxed">{lecture.postClassHomework.instructions}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  💻 Khu vực viết code:
                </span>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="bg-white border-b border-gray-200 px-3.5 py-1.5 flex items-center justify-between">
                  <span className="text-[9px] text-gray-400 font-mono">student_submission.js</span>
                  <button onClick={() => setHomeworkCode(lecture.postClassHomework?.starterCode || "")} className="text-[9px] text-gray-500 hover:text-gray-900 cursor-pointer transition">
                    Khôi phục sườn bài
                  </button>
                </div>
                <textarea
                  value={homeworkCode}
                  onChange={(e) => setHomeworkCode(e.target.value)}
                  rows={10}
                  className="w-full bg-gray-50 font-mono text-xs p-3.5 border-0 outline-none text-lime-400 placeholder-slate-600 resize-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="// Hãy viết bài giải hoặc code của bạn tại đây"
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <span className="text-xs text-gray-500 italic">
                {homeworkStatus[lecture.id] === "submitted"
                  ? "✓ Đã nộp. Bạn có thể gửi lại bản cập nhật."
                  : "Hoàn tất bài giải? Nhấn Nộp bài để tích điểm."}
              </span>
              <button onClick={handleHomeworkSubmit} className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition cursor-pointer">
                {homeworkStatus[lecture.id] === "submitted" ? "Cập nhật bài nộp" : "Nộp bài thử thách"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
