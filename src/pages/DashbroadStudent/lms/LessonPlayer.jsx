import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  FileText,
  Sparkles,
  BookOpen,
  Paperclip,
  Download,
  Send,
  Lightbulb,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Users,
  HelpCircle,
  Code
} from "lucide-react";

export default function LessonPlayer({
  lecture,
  sectionId,
  completedLectures = [],
  notes = [],
  quizScores = {},
  homeworkStatus = {},
  onAddNote,
  onDeleteNote,
  onSubmitQuizScore,
  onToggleComplete,
  onSubmitHomework,
  addPoints,
  triggerNotification
}) {
  // Tabs: "overview" | "quiz" | "in_class" | "homework" | "ai_tutor" | "notes"
  const [activeTab, setActiveTab] = useState("overview");

  // Local storage notes drafting state
  const [newNoteText, setNewNoteText] = useState("");

  // Quiz active states
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // Homework writing state
  const [homeworkCode, setHomeworkCode] = useState("");

  // Chat message state with AI Tutor
  const [chatHistory, setChatHistory] = useState({});
  const [currentMessage, setCurrentMessage] = useState("");
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Playback parameters
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0x");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);

  // Sync state variables whenever parent changes lecture
  useEffect(() => {
    // Reset local states for new lecture
    setNewNoteText("");
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    setHomeworkCode(lecture?.postClassHomework?.starterCode || "");
    setIsVideoPlaying(false);

    // Switch active tab appropriately if lecture doesn't possess quiz or other elements
    if (lecture?.type === "in_class") {
      setActiveTab("in_class");
    } else if (lecture?.type === "post_class") {
      setActiveTab("homework");
    } else {
      setActiveTab("overview");
    }
  }, [lecture]);

  // Scroll chat to bottom when messages are added
  useEffect(() => {
    if (activeTab === "ai_tutor") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, activeTab]);

  const activeChatList = chatHistory[lecture?.id] || [
    {
      id: "welcome",
      role: "model",
      text: `👋 Thầy chào em! Thầy là Trợ lý AI đặc biệt của bài học này. Em cần thầy hướng dẫn chuẩn bị bài viết, tóm tắt lý thuyết, giải thích mã nguồn hay đưa ra gợi ý làm các bài tập trắc nghiệm?`,
      timestamp: new Date()
    }
  ];

  const handleVideoPlayToggle = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  // Chat request with Gemini backend
  const handleSendChatMessage = async (overrideText) => {
    const textToSend = overrideText || currentMessage;
    if (!textToSend.trim() || aiIsLoading) return;

    // Add user message to history
    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date()
    };

    const updatedHistoryOfLecture = [...activeChatList, userMsg];
    setChatHistory((p) => ({ ...p, [lecture.id]: updatedHistoryOfLecture }));
    if (!overrideText) setCurrentMessage("");
    setAiIsLoading(true);

    try {
      // Gather relevant lesson context to feed to Gemini
      let lessonContext = `Bài học: "${lecture.title}" (Tuần tương ứng). `;
      if (lecture.readings) {
        lessonContext += `Tài liệu đọc: "${lecture.readings.title}". Nội dung lý thuyết: "${lecture.readings.content.substring(0, 450)}...". `;
      }
      if (lecture.inClassExercise) {
        lessonContext += `Bài tập trên lớp: Chủ đề: "${lecture.inClassExercise.topic}". Lời khuyên thảo luận: "${lecture.inClassExercise.collaborationGuide}". `;
      }
      if (lecture.postClassHomework) {
        lessonContext += `Bài tập về nhà: Đố vui: "${lecture.postClassHomework.challengeTitle}". Hướng dẫn học sinh: "${lecture.postClassHomework.instructions}". `;
      }

      // API request to server.ts backend
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          history: updatedHistoryOfLecture.slice(1, -1).map((m) => ({
            role: m.role,
            text: m.text
          })),
          lessonContext
        })
      });

      if (!response.ok) {
        throw new Error("Lỗi API kết nối tới server.");
      }

      const resData = await response.json();
      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: "model",
        text: resData.text,
        timestamp: new Date()
      };

      setChatHistory((p) => ({
        ...p,
        [lecture.id]: [...updatedHistoryOfLecture, aiMsg]
      }));
      addPoints(10); // Reward active AI prompting!
    } catch (error) {
      console.error("AI Assistant response error", error);
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: "model",
        text: `⚠️ **Không thể kết nối đến Trợ Lý AI**: ${error.message || "Đã xảy ra sự cố kết nối."}\n\nHọc viên thân mến, Gemini AI Server cần được cài đặt và kích hoạt ở backend để sử dụng chức năng này.`,
        timestamp: new Date()
      };
      setChatHistory((p) => ({
        ...p,
        [lecture.id]: [...updatedHistoryOfLecture, errorMsg]
      }));
    } finally {
      setAiIsLoading(false);
    }
  };

  // Instant pre-class query helpers
  const handleQuickAiPrompt = (promptType) => {
    let text = "";
    if (promptType === "summarize") {
      text = "Hãy tóm tắt giúp em bài học này thành 5 gạch đầu dòng ngắn gọn và dễ nhớ nhất.";
    } else if (promptType === "quiz_me") {
      text = "Tạo cho em 1 câu hỏi tương tác ngắn dạng tình huống thực tế dựa trên bài học này kèm giải thích để em ôn luyên.";
    } else {
      text = "Nêu ra 1 khái niệm mang tính thử thách nhất trong bài học này và giải thích nó bằng ví dụ cuộc sống trực quan.";
    }
    setActiveTab("ai_tutor");
    setTimeout(() => {
      handleSendChatMessage(text);
    }, 100);
  };

  // Highlighted reading analysis trigger
  const handleTriggerReadingAiAnalysis = (selectedParagraph) => {
    setActiveTab("ai_tutor");
    const customPrompt = `Hãy giải thích chi tiết, đơn giản hóa và lấy ví dụ minh họa thực tế cho đoạn tài liệu học này của em:\n\n"${selectedParagraph}"`;
    setTimeout(() => {
      handleSendChatMessage(customPrompt);
    }, 100);
  };

  // Handle quiz question option select
  const handleSelectAnswer = (questionId, optionIndex) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Submit Pre-class quiz
  const handleQuizSubmit = () => {
    if (!lecture?.quiz || lecture.quiz.length === 0) return;

    let correctCount = 0;
    lecture.quiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const percent = Math.round((correctCount / lecture.quiz.length) * 100);
    const hasPassed = percent >= 50;

    setQuizResult({
      score: percent,
      passed: hasPassed
    });
    setQuizSubmitted(true);

    onSubmitQuizScore(percent);

    if (hasPassed) {
      addPoints(100);
      triggerNotification(`🎉 Chúc mừng em đã vượt qua bài kiểm tra nhanh với tỉ lệ ${percent}%! Cộng 100 XP tự học.`, "success");
      // Check active lecture complete
      const isCompleted = completedLectures.includes(lecture.id);
      if (!isCompleted) {
        onToggleComplete();
      }
    } else {
      triggerNotification(`⚠️ Rất tiếc, em chỉ đạt ${percent}%. Hãy tự ôn lại tài liệu và bấm thi lại nhé!`, "info");
    }
  };

  // Submit Homework text/code
  const handleHomeworkSubmit = () => {
    if (!homeworkCode.trim()) {
      alert("Vui lòng gõ bài giải hoặc dán code của em trước khi nộp!");
      return;
    }
    onSubmitHomework();
    addPoints(150); // Big reward for homework compilation!
    triggerNotification("🚀 Nộp bài tập về nhà thành công! Thầy chúc mừng em đã hoàn tất thử thách tự học. Nhận 150 XP!", "success");
    // Autocomplete lecture checklist
    if (!completedLectures.includes(lecture.id)) {
      onToggleComplete();
    }
  };

  // Notes addition
  const handleAddNoteNote = () => {
    if (!newNoteText.trim()) return;
    onAddNote(newNoteText);
    setNewNoteText("");
    addPoints(15);
    triggerNotification("🗒️ Lưu ghi chú học tập thành công!", "success");
  };

  // Simulated download triggers
  const handleAttachmentDownload = (fileName) => {
    triggerNotification(`📥 Đã tải xuống "${fileName}" về thiết bị. Điểm cộng tự học +5 XP!`, "success");
    addPoints(5);
  };

  // Current lecture notes filter
  const currentLectureNotes = notes.filter((n) => n.lectureId === lecture?.id);

  if (!lecture) return <div className="text-white p-5">Chưa có bài học nào được chọn</div>;

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg h-full">
      {/* Video Viewport Port / Simulated Frame Player */}
      <div className="relative bg-black aspect-video flex-shrink-0 flex flex-col justify-between items-center group overflow-hidden">
        {lecture.videoUrl ? (
          <div className="w-full h-full relative">
            <video
              ref={videoRef}
              src={lecture.videoUrl}
              className="w-full h-full object-cover"
              controls={false}
              onClick={handleVideoPlayToggle}
            />

            {/* Simulated overlays */}
            {!isVideoPlaying && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 transition">
                <button
                  onClick={handleVideoPlayToggle}
                  className="w-16 h-16 rounded-full bg-emerald-700 text-white flex items-center justify-center hover:bg-emerald-800 hover:scale-110 active:scale-95 cursor-pointer transition shadow-xl"
                >
                  <Play size={28} className="ml-1 fill-white text-white" />
                </button>
                <p className="text-white text-xs font-semibold px-4 text-center">
                  Nhấp để chạy bài giảng {lecture.title}
                </p>
              </div>
            )}

            {/* Controls bottom row bar simulated */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent px-4 py-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition duration-300">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleVideoPlayToggle}
                  className="text-white hover:text-emerald-400 font-bold text-xs cursor-pointer"
                >
                  {isVideoPlaying ? "TẠM DỪNG" : "TIẾP TỤC"}
                </button>
                <span className="text-[11px] text-gray-300 font-mono">03:14 / {lecture.duration}</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Playback rate select */}
                <select
                  value={playbackSpeed}
                  onChange={(e) => {
                    setPlaybackSpeed(e.target.value);
                    if (videoRef.current) {
                      videoRef.current.playbackRate = parseFloat(e.target.value);
                    }
                  }}
                  className="bg-zinc-800 text-white text-[10px] rounded px-1.5 py-0.5 border border-zinc-700 outline-none cursor-pointer"
                >
                  <option value="0.75">0.75x</option>
                  <option value="1.0">1.0x (Chuẩn)</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2.0">2.0x</option>
                </select>
                <span className="text-[10px] bg-emerald-900 border border-emerald-800 text-white font-bold px-2 py-0.5 rounded">
                  Flipped Player
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-slate-955 to-slate-900 p-8 flex flex-col justify-center items-center text-center gap-4 relative">
            <div className="p-4 rounded-full bg-slate-800 text-emerald-400">
              <Users size={40} className="animate-pulse" />
            </div>
            <div>
              <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-emerald-950/75 border border-emerald-900 mb-1.5 inline-block">
                TẬP TRUNG THỜI GIAN TRÊN LỚP (IN-CLASS)
              </span>
              <h3 className="text-white text-lg font-bold max-w-lg mx-auto">
                {lecture.title}
              </h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto mt-2 leading-relaxed">
                Bài học này thuộc mô-đun rèn luyện tương tác tập trung nâng cao ngay tại giảng đường. Thiết kế nhằm tối đa hóa tinh thần kết hợp nhóm và giải bài tập nâng cao.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("in_class")}
                className="bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded shadow-md hover:bg-emerald-800 transition cursor-pointer"
              >
                Mở cẩm nang thảo luận
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Udemy-like Tabs Navigation links */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 overflow-x-auto flex items-center whitespace-nowrap scrollbar-none">
        {lecture.type === "pre_class" && (
          <>
            <button
              onClick={() => setActiveTab("overview")}
              className={`pt-3.5 pb-2.5 px-4 font-bold text-xs transition border-b-2 cursor-pointer ${
                activeTab === "overview"
                  ? "text-emerald-400 border-emerald-500"
                  : "text-slate-400 hover:text-white border-transparent"
              }`}
            >
              📖 Tài liệu tự học
            </button>
            {lecture.quiz && (
              <button
                onClick={() => setActiveTab("quiz")}
                className={`pt-3.5 pb-2.5 px-4 font-bold text-xs transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "quiz"
                    ? "text-emerald-400 border-emerald-500"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                ❓ Trắc nghiệm nhanh
                {quizScores[lecture.id] !== undefined && (
                  <span className="text-[9px] bg-emerald-600 text-white rounded-full px-1.5 py-0.2">
                    {quizScores[lecture.id]}%
                  </span>
                )}
              </button>
            )}
          </>
        )}

        {lecture.type === "in_class" && (
          <button
            onClick={() => setActiveTab("in_class")}
            className={`pt-3.5 pb-2.5 px-4 font-bold text-xs transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "in_class"
                ? "text-emerald-400 border-emerald-500"
                : "text-slate-400 hover:text-white border-transparent"
            }`}
          >
            👥 Thảo luận & Thực hành trên lớp
          </button>
        )}

        {lecture.type === "post_class" && (
          <button
            onClick={() => setActiveTab("homework")}
            className={`pt-3.5 pb-2.5 px-4 font-bold text-xs transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "homework"
                ? "text-emerald-400 border-emerald-500"
                : "text-slate-400 hover:text-white border-transparent"
            }`}
          >
            📝 Thử thách sau lớp
            {homeworkStatus[lecture.id] === "submitted" && (
              <span className="text-[9px] bg-emerald-600 text-white rounded px-1.5 py-0.2 font-bold uppercase tracking-wider">
                Đã nộp
              </span>
            )}
          </button>
        )}

        {/* Universal support tabs */}
        <button
          onClick={() => setActiveTab("ai_tutor")}
          className={`pt-3.5 pb-2.5 px-4 font-bold text-xs transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "ai_tutor"
              ? "text-emerald-400 border-emerald-500"
              : "text-slate-400 hover:text-white border-transparent"
          }`}
        >
          <Sparkles size={13} className="text-emerald-400 animate-pulse fill-emerald-950" /> ASK AI Study Tutor
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`pt-3.5 pb-2.5 px-4 font-bold text-xs transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "notes"
              ? "text-emerald-400 border-emerald-500"
              : "text-slate-400 hover:text-white border-transparent"
          }`}
        >
          🗒️ Tập ghi chú ({currentLectureNotes.length})
        </button>
      </div>

      {/* Tab Panels content details viewport */}
      <div className="flex-1 overflow-y-auto p-5 bg-slate-955 text-slate-100 min-h-[300px]">
        {/* TAB 1: OVERVIEW & READING MATERIALS */}
        {activeTab === "overview" && lecture.type === "pre_class" && (
          <div className="space-y-6">
            {/* Quick AI Trigger Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">Em muốn Trợ lý AI thực hiện nhanh việc gì?</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleQuickAiPrompt("summarize")}
                  className="bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800 text-[10px] font-bold px-3 py-1.5 rounded transition cursor-pointer"
                >
                  📝 Tóm tắt bài này
                </button>
                <button
                  onClick={() => handleQuickAiPrompt("quiz_me")}
                  className="bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800 text-[10px] font-bold px-3 py-1.5 rounded transition cursor-pointer"
                >
                  ⚡ Đố nhanh em
                </button>
                <button
                  onClick={() => handleQuickAiPrompt("explain_difficult")}
                  className="bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800 text-[10px] font-bold px-3 py-1.5 rounded transition cursor-pointer"
                >
                  🔥 Giải nghĩa từ khó
                </button>
              </div>
            </div>

            {/* Reading Material */}
            {lecture.readings && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <BookOpen size={16} /> Tài liệu đọc hiểu chuẩn bị trước giờ học
                  </h4>
                  <span className="text-[10px] text-zinc-500 italic">Mẹo: Chọn đoạn chữ để AI giải thích nhanh</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl leading-relaxed text-sm text-slate-300 space-y-3">
                  <h5 className="font-bold text-white text-sm">{lecture.readings.title}</h5>
                  <p className="text-slate-300 antialiased">{lecture.readings.content}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium italic">Gặp từ ngữ thuật ngữ khó nắm bắt?</span>
                    <button
                      onClick={() => handleTriggerReadingAiAnalysis(lecture.readings.content)}
                      className="bg-emerald-800 text-white font-bold text-[10px] px-3 py-1.5 rounded hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={11} /> AI Giải Thích Toàn Bộ Trích Đoạn
                    </button>
                  </div>
                </div>

                {/* Key Points highlight list */}
                <div className="space-y-2 mt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Trọng tâm cần ghi nhớ:</span>
                  <div className="grid grid-cols-1 gap-2.5">
                    {lecture.readings.keyPoints.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-slate-900/50 p-2.5 rounded border border-slate-800/60 text-xs">
                        <Lightbulb className="text-yellow-500 shrink-0 mt-0.5" size={14} />
                        <span className="text-slate-300">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Attachments Section */}
            {lecture.attachments && lecture.attachments.length > 0 && (
              <div className="space-y-3 border-t border-zinc-800 pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Paperclip size={13} /> Giáo trình đính kèm tự học ({lecture.attachments.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lecture.attachments.map((file, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 border border-slate-800 hover:border-emerald-800 rounded-lg p-3 flex items-center justify-between gap-2 hover:bg-slate-900/80 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-slate-800 rounded text-emerald-400">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-slate-200 block truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">{file.size} • {file.type.toUpperCase()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAttachmentDownload(file.name)}
                        className="text-zinc-400 hover:text-emerald-400 p-1.5 hover:bg-zinc-800 rounded transition shrink-0 cursor-pointer"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTERACTIVE PRE-CLASS QUIZ */}
        {activeTab === "quiz" && lecture.type === "pre_class" && lecture.quiz && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-3">
              <h4 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                <HelpCircle size={16} /> Bài tập trắc nghiệm tự kiểm tra nhanh (Pre-class Quiz)
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Lớp học đảo ngược cần em làm trắc nghiệm này để đảm bảo đã nắm vững khái niệm lý thuyết chính trước khi thảo luận trực tiếp trên lớp. Đạt trên 50% để mở khóa bài học!
              </p>
            </div>

            <div className="space-y-5">
              {lecture.quiz.map((q, idx) => {
                const selectedOption = selectedAnswers[q.id];
                const isCorrect = selectedOption === q.correctAnswer;

                return (
                  <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Câu hỏi {idx + 1}</span>
                    <h5 className="font-bold text-sm text-white leading-relaxed">{q.question}</h5>

                    <div className="grid grid-cols-1 gap-2.5 mt-2">
                      {q.options.map((option, oIdx) => {
                        const isChosen = selectedOption === oIdx;
                        let optionStyle = "border-slate-800 bg-slate-950/60 hover:bg-slate-905 text-slate-300";

                        if (isChosen) {
                          optionStyle = "border-emerald-600 bg-emerald-950/25 text-emerald-250 font-semibold";
                        }

                        if (quizSubmitted) {
                          if (oIdx === q.correctAnswer) {
                            optionStyle = "border-green-600 bg-green-950/30 text-green-200 font-bold";
                          } else if (isChosen && !isCorrect) {
                            optionStyle = "border-red-600 bg-red-950/35 text-red-100 line-through";
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={quizSubmitted}
                            onClick={() => handleSelectAnswer(q.id, oIdx)}
                            className={`w-full text-left p-3 rounded-lg border text-xs transition duration-200 flex items-start gap-2 focus:outline-none cursor-pointer ${optionStyle}`}
                          >
                            <span className="font-bold font-mono text-xs text-emerald-400 mt-0.5 shrink-0">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isCorrect ? (
                            <span className="text-green-500 flex items-center gap-1">
                              <CheckCircle size={14} /> Trả lời chính xác!
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1">
                              <XCircle size={14} /> Chưa chính xác!
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 leading-relaxed italic">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quiz Action Control */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-5">
              {!quizSubmitted ? (
                <>
                  <span className="text-xs text-slate-400 italic">
                    {Object.keys(selectedAnswers).length < lecture.quiz.length
                      ? `Vui lòng hoàn thành ${lecture.quiz.length - Object.keys(selectedAnswers).length} câu còn lại.`
                      : "Trắc nghiệm đã sẵn sàng, hãy nhấn Nộp bài."}
                  </span>
                  <button
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(selectedAnswers).length < lecture.quiz.length}
                    className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-md transition disabled:cursor-not-allowed cursor-pointer"
                  >
                    Nộp bài đánh giá
                  </button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Kết quả thi:</span>
                    <span className="text-lg font-bold text-white">
                      Điểm thi đạt:{" "}
                      <span className={quizResult?.passed ? "text-green-500" : "text-red-400"}>
                        {quizResult?.score}%
                      </span>
                    </span>
                    <span className="text-xs text-slate-400 block italic mt-1">
                      {quizResult?.passed ? "🎉 Đạt tiêu chuẩn! Em đã sẵn sàng lên lớp học thảo luận trực tiếp." : "⚠️ Điểm số dưới trung bình. Em hãy bấm lật lại tài liệu để học kỹ và thi lại nhé!"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAnswers({});
                      setQuizSubmitted(false);
                      setQuizResult(null);
                    }}
                    className="bg-slate-850 text-emerald-400 font-bold text-xs px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-750 transition cursor-pointer"
                  >
                    Làm bài trắc nghiệm lại
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: IN_CLASS COLLABORATION ACTIVITIES */}
        {activeTab === "in_class" && lecture.type === "in_class" && lecture.inClassExercise && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-3">
              <span className="text-[10px] bg-emerald-950 border border-emerald-900 text-emerald-300 font-bold px-2.5 py-0.5 rounded inline-block mb-1.5 uppercase tracking-wider">
                Mục tiêu: Đẩy mạnh làm việc nhóm & Học chủ động
              </span>
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <Users size={16} /> Phiếu hướng dẫn thực hành & Thảo luận nhóm trực tiếp trên lớp
              </h4>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-bold block mb-1">Chủ đề thảo luận:</span>
                <span className="font-bold text-base text-white">{lecture.inClassExercise.topic}</span>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-900/60 rounded-lg p-3.5 flex items-start gap-3">
                <Users className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <div>
                  <span className="text-xs font-bold text-emerald-300 block mb-0.5">Lời khuyên của Instructor:</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{lecture.inClassExercise.collaborationGuide}</p>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-bold block">Quy trình thực hiện tại giảng đường:</span>
                <div className="space-y-2">
                  {lecture.inClassExercise.instructions.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2 pb-2 border-b border-slate-850 last:border-0 last:pb-0">
                      <span className="w-5 h-5 rounded bg-slate-800 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {sIdx + 1}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Discussion Prompt generator */}
            <div className="border-t border-slate-800 pt-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Đội của em đang bế tắc thuật toán hoặc cần bổ sung góc nhìn?</span>
                  <p className="text-[11px] text-slate-400">Yêu cầu Gemini AI gợi mở hướng làm bài tập nhóm nãy ngay không làm hộ.</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("ai_tutor");
                    setTimeout(() => {
                      handleSendChatMessage(`Đội em đang thảo luận chủ đề bài tập trên lớp: "${lecture.inClassExercise.topic}". Hãy gợi ý 3 câu hỏi gợi mở, sâu rộng để thảo luận và nâng cao Critical Thinking, không viết thẳng code giải.`);
                    }, 100);
                  }}
                  className="bg-emerald-800 text-white font-bold text-[10px] px-3 py-1.5 rounded hover:bg-emerald-700 transition flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Sparkles size={11} /> AI Gợi Ý Thảo Luận
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: POST-CLASS HOMEWORK ASSIGNMENT */}
        {activeTab === "homework" && lecture.type === "post_class" && lecture.postClassHomework && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-3">
              <span className="text-[10px] bg-emerald-950 border border-emerald-900 text-emerald-300 font-bold px-2.5 py-0.5 rounded inline-block mb-1.5 uppercase tracking-wider">
                Mục tiêu: Đạt chứng chỉ tự hoàn thiện kiến thức (Mastery)
              </span>
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <Code size={16} /> Thử thách lập trình & Ôn tập mở rộng (Post-class Homework)
              </h4>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <h5 className="font-bold text-sm text-white flex items-center gap-1.5">
                  🛡️ Tiêu đề thử thách: {lecture.postClassHomework.challengeTitle}
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">{lecture.postClassHomework.instructions}</p>
              </div>

              {/* Text area code workspace simulation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    💻 Khu vực viết code / Bài giải:
                  </span>
                  <button
                    onClick={() => {
                      setActiveTab("ai_tutor");
                      setTimeout(() => {
                        handleSendChatMessage(`Hãy phân tích lỗi sai và đưa ra cấu trúc sườn thuật toán (starter code) hỗ trợ em giải đề bài sau:\n"${lecture.postClassHomework.instructions}"`);
                      }, 100);
                    }}
                    className="text-emerald-400 hover:text-white hover:underline text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} className="text-emerald-400" /> Nhờ AI gợi ý sườn giải thuật
                  </button>
                </div>
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950 text-left">
                  <div className="bg-slate-900 border-b border-slate-850 px-3.5 py-1.5 flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-mono">Workspace: student_submission.js</span>
                    <button
                      onClick={() => setHomeworkCode(lecture.postClassHomework?.starterCode || "")}
                      className="text-[9px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      Khôi phục sườn bài ban đầu
                    </button>
                  </div>
                  <textarea
                    value={homeworkCode}
                    onChange={(e) => setHomeworkCode(e.target.value)}
                    rows={10}
                    className="w-full bg-slate-950 font-mono text-xs p-3.5 border-0 focus:ring-1 focus:ring-emerald-600 outline-none text-lime-400 placeholder:text-gray-600 resize-none"
                    placeholder="// Hãy viết bài giải hoặc code của bạn tại đây và nộp để nhận chứng nhận."
                  />
                </div>
              </div>
            </div>

            {/* Submit Homework control */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-5">
              <span className="text-xs text-slate-400 italic">
                {homeworkStatus[lecture.id] === "submitted"
                  ? "✓ Bài tập đã nộp thành công. Em có thể gửi lại bản cập nhật mới hơn nếu muốn."
                  : "Hoàn tất bài giải? Nhấn Nộp bài để tích điểm rèn luyện."}
              </span>
              <button
                onClick={handleHomeworkSubmit}
                className="bg-emerald-700 hover:bg-emerald-800 border border-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition shadow-md cursor-pointer"
              >
                {homeworkStatus[lecture.id] === "submitted" ? "Cập nhật bài nộp" : "Nộp bài thử thách"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: AI TUTOR MESSAGE BOARD */}
        {activeTab === "ai_tutor" && (
          <div className="space-y-4 flex flex-col h-full justify-between min-h-[350px]">
            <div className="border-b border-zinc-800 pb-2 text-left">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-400 fill-emerald-950 animate-pulse" /> Trợ lý tự học AI Tutor (Gemini AI)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Hỏi đáp mọi thắc mắc học liệu, slides bài viết, đố vui hay đề ra lộ trình tự học Flipped. Trợ lý AI có bối cảnh bài học hiện tại để phục vụ chuẩn xác nhất.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-xs text-left">
              <span className="text-zinc-400">Bối cảnh gửi AI: <span className="text-white font-medium">{lecture.title}</span></span>
              <span className="text-[9px] bg-emerald-900 text-emerald-250 border border-emerald-800 uppercase px-1.5 py-0.5 rounded font-bold">
                Mô-đun: {lecture.type?.toUpperCase()}
              </span>
            </div>

            {/* Message History Scroller */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px] border border-slate-850 rounded-lg p-3 bg-slate-900/10 custom-scrollbar text-left">
              {activeChatList.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 max-w-[85%] ${
                    m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 font-bold text-xs ${
                      m.role === "user"
                        ? "bg-slate-750 text-white"
                        : "bg-emerald-900 text-emerald-200 border border-emerald-800"
                    }`}
                  >
                    {m.role === "user" ? "Me" : "🤖"}
                  </div>

                  <div
                    className={`p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap select-text ${
                      m.role === "user"
                        ? "bg-emerald-700 text-white rounded-tr-none"
                        : "bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {aiIsLoading && (
                <div className="flex gap-2.5 mr-auto max-w-[85%] items-center animate-pulse">
                  <div className="w-7 h-7 rounded-sm bg-emerald-950 border border-emerald-900 flex items-center justify-center font-bold text-xs text-emerald-300">
                    🤖
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                    <Clock size={12} className="animate-spin text-emerald-450" />
                    <span>Trợ lý AI đang nghiên cứu tài liệu tự học và soạn câu trả lời...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Message inputs row */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChatMessage();
                  }
                }}
                disabled={aiIsLoading}
                placeholder="Hỏi thầy bất kỳ thắc mắc bài học nào: 'Explain closures', 'Tóm tắt bài này'..."
                className="flex-1 bg-slate-900 border border-slate-800 hover:border-zinc-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-600 transition disabled:opacity-60 text-left"
              />
              <button
                onClick={() => handleSendChatMessage()}
                disabled={aiIsLoading || !currentMessage.trim()}
                className="bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold p-2.5 rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center disabled:cursor-not-allowed"
                title="Gửi câu hỏi"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: STUDENT NOTES LIST & DRAFTING */}
        {activeTab === "notes" && (
          <div className="space-y-4 text-left">
            <div className="border-b border-zinc-800 pb-2">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                🗒️ Sổ tay ghi chép cá nhân
              </h4>
              <p className="text-[11px] text-slate-400">
                Lưu lại ghi chú để ôn tập sâu. Ghi chú cá nhân chỉ lưu trữ riêng tư an toàn trong trình duyệt của bạn (Local Storage).
              </p>
            </div>

            {/* Notes Drafting component */}
            <div className="space-y-2 bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tạo ghi chú mới tại thời điểm này:</span>
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={3}
                className="w-full bg-slate-955 text-xs p-2 rounded border border-slate-850 focus:outline-none focus:border-emerald-600 focus:ring-0 text-white placeholder:text-slate-650"
                placeholder="Gõ nhanh ghi chú học tập cốt lõi của bài học..."
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddNoteNote}
                  disabled={!newNoteText.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] px-3.5 py-1.5 rounded transition disabled:opacity-40 cursor-pointer flex items-center gap-1 focus:outline-none"
                >
                  <Plus size={11} /> Lưu ghi chú (+15 XP)
                </button>
              </div>
            </div>

            {/* List notes of current unit */}
            <div className="space-y-3.5 mt-5">
              <span className="text-xs font-bold text-slate-400 block tracking-wider uppercase">
                Danh sách ghi chép của bài học này ({currentLectureNotes.length}):
              </span>
              {currentLectureNotes.length === 0 ? (
                <div className="bg-slate-900/30 border border-dashed border-slate-850 rounded-xl p-6 text-center text-slate-500">
                  <FileText className="mx-auto mb-2 opacity-50" size={24} />
                  <p className="text-xs">Em chưa lưu ghi chép nào cho bài học này.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 select-text custom-scrollbar">
                  {currentLectureNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-slate-900 border border-slate-850 rounded-lg p-3 space-y-1 relative group"
                    >
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition opacity-0 group-hover:opacity-100 focus:outline-none cursor-pointer"
                        title="Xóa ghi chú"
                      >
                        <Trash2 size={13} />
                      </button>
                      <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono">
                        <Clock size={10} />
                        <span>{note.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed break-words">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
