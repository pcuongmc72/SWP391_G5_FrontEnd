import { useMemo, useState, useEffect, useCallback } from 'react';
import { Check, X, CheckSquare, FileText, Pencil, Loader2, Search, BookOpen, CheckCircle2 } from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';

const truncateText = (text, maxLength = 60) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return 'Vừa xong';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Hôm qua';
  if (diffInDays < 7) return `${diffInDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

export default function GradingDashboard() {
  const {
    users, classesLoading, classesError, workspaceLoading,
    assignments, submissions, materials, api
  } = useLecturerWorkspace();

  const [toast, setToast] = useState(null);
  
  // Selection state
  const [activeAsgId, setActiveAsgId] = useState('');
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  
  // Filter state
  const [materialFilter, setMaterialFilter] = useState('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('all');
  
  // Grading form state
  const [gradeInput, setGradeInput] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter assignments & submissions
  const activeAsgIds = useMemo(() => (assignments || []).map((a) => a.id), [assignments]);

  const groupedMaterialsByChapter = useMemo(() => {
    const groups = {};
    (materials || []).forEach((m) => {
      if (!m) return;
      let chapter = 'Học liệu chung';
      if (m.chapter && typeof m.chapter === 'string' && m.chapter.includes(' ÷ ')) {
        chapter = m.chapter.split(' ÷ ')[1].trim();
      } else if (m.chapter && typeof m.chapter === 'string') {
        chapter = m.chapter.trim();
      }
      if (!groups[chapter]) groups[chapter] = [];
      groups[chapter].push(m);
    });
    return groups;
  }, [materials]);

  const sortedMaterialChapters = useMemo(() => {
    return Object.keys(groupedMaterialsByChapter).sort((a, b) => {
      if (a === 'Học liệu chung') return 1;
      if (b === 'Học liệu chung') return -1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [groupedMaterialsByChapter]);

  const assignmentsByMaterial = useMemo(() => {
    const groups = { 'unlinked': [] };
    
    (assignments || []).forEach(asg => {
      let matId = 'unlinked';
      try {
        const rawDesc = asg.description?.trim();
        if (rawDesc && rawDesc.startsWith('{')) {
          const data = JSON.parse(rawDesc);
          if (data.linkedItem) {
            if (!String(data.linkedItem).startsWith('chapter_')) {
              let material = (materials || []).find(m => String(m.id) === String(data.linkedItem));
              if (!material && data.linkedTitle) {
                const titleMatch = String(data.linkedTitle).replace('Bài học:', '').trim();
                material = (materials || []).find(m => m.title && m.title.trim() === titleMatch);
              }
              if (material) {
                matId = String(material.id);
              }
            }
          }
        }
      } catch (e) { }
      
      if (!groups[matId]) groups[matId] = [];
      groups[matId].push(asg);
    });
    
    return groups;
  }, [assignments, materials]);

  // Set default assignment if empty or material changes
  useEffect(() => {
    if (materialFilter !== 'all') {
      const asgs = assignmentsByMaterial[materialFilter] || [];
      if (asgs.length > 0 && (!activeAsgId || !asgs.find(a => String(a.id) === String(activeAsgId)))) {
        setActiveAsgId(asgs[0].id);
      } else if (asgs.length === 0) {
        setActiveAsgId('');
      }
    } else if (assignments.length > 0 && !activeAsgId && activeAsgIds.includes(assignments[0].id)) {
      setActiveAsgId(assignments[0].id);
    }
  }, [assignments, activeAsgId, activeAsgIds, materialFilter, assignmentsByMaterial]);

  const currentAsg = assignments.find(a => String(a.id) === String(activeAsgId));

  const currentSubmissions = useMemo(() => {
    if (!activeAsgId) return [];
    let subs = submissions.filter((s) => String(s.assignmentId) === String(activeAsgId));
    
    if (submissionStatusFilter === 'graded') subs = subs.filter(s => s.status === 'GRADED');
    if (submissionStatusFilter === 'ungraded') subs = subs.filter(s => s.status !== 'GRADED');

    // Sort: Submitted first, then Graded
    return subs.sort((a, b) => {
      if (a.status === 'SUBMITTED' && b.status !== 'SUBMITTED') return -1;
      if (a.status !== 'SUBMITTED' && b.status === 'SUBMITTED') return 1;
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    });
  }, [submissions, activeAsgId, submissionStatusFilter]);

  const gradingSubmission = useMemo(() => {
    return currentSubmissions.find(s => s.id === gradingSubmissionId) || null;
  }, [currentSubmissions, gradingSubmissionId]);

  // Reset grading selection when changing assignment
  useEffect(() => {
    setGradingSubmissionId(null);
  }, [activeAsgId]);

  const handleSelectSubmission = (sub) => {
    setGradingSubmissionId(sub.id);
    setGradeInput(sub.grade !== null ? sub.grade : (currentAsg?.maxPoints || 10));
    setGradeFeedback(sub.feedback || '');
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    try {
      setIsSubmitting(true);
      await api.gradeSubmission(gradingSubmission.id, {
        grade: Number(gradeInput),
        feedback: gradeFeedback,
      });
      showToast('Đã lưu điểm & phản hồi thành công!');

      // Auto-advance logic
      const currentIndex = currentSubmissions.findIndex(s => s.id === gradingSubmission.id);
      if (currentIndex !== -1) {
        const nextSub = currentSubmissions.slice(currentIndex + 1).find(s => s.status !== 'GRADED');
        if (nextSub) {
          handleSelectSubmission(nextSub);
        } else {
          setGradingSubmissionId(null);
        }
      }
    } catch (err) {
      showToast(err.message || 'Chấm điểm thất bại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (!currentSubmissions || currentSubmissions.length === 0) return;
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = gradingSubmissionId ? currentSubmissions.findIndex(s => s.id === gradingSubmissionId) : -1;
        
        let nextIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < currentSubmissions.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : currentSubmissions.length - 1;
        }
        
        const nextSub = currentSubmissions[nextIndex];
        if (nextSub) {
          handleSelectSubmission(nextSub);
          // Scroll item into view could be added here if we had refs
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSubmissions, gradingSubmissionId]);

  if (classesLoading || workspaceLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
        <p className="text-sm text-gray-400">Đang tải dữ liệu chấm điểm...</p>
      </div>
    );
  }

  // Preview logic for current grading submission
  const fileUrl = gradingSubmission?.fileName?.startsWith('http') ? gradingSubmission.fileName : null;
  const isImage = fileUrl && /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(fileUrl);
  const isVideo = fileUrl && /\.(mp4|webm|ogg)($|\?)/i.test(fileUrl);
  const isZip = fileUrl && /\.(zip|rar|7z|gz|tar)($|\?)/i.test(fileUrl);
  const ytMatch = fileUrl && fileUrl.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
  const ytId = ytMatch ? ytMatch[1] : null;
  const isCloudinary = fileUrl && fileUrl.includes('cloudinary.com');
  const isDocType = fileUrl && /\.(pptx?|docx?|xlsx?)($|\?)/i.test(fileUrl);
  const previewSrc = fileUrl
    ? (isCloudinary && !isDocType && !isImage && !isVideo && !isZip
      ? fileUrl.replace('/upload/', '/upload/fl_attachment:false/').split('?')[0] + '.pdf'
      : isDocType
        ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
        : fileUrl)
    : null;

  return (
    <div className="relative pb-12 h-full">
      {/* ── Toast ─────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-bold transition-all
          ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          <Check size={15} /> {toast.message}
        </div>
      )}

      {classesError && (
        <p className="text-center text-red-600 font-bold mb-4">{classesError}</p>
      )}

      {/* ── Page header ───────────────────── */}
      <div className="mb-4 flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 mb-1">Chấm điểm bài nộp</h2>
          <p className="text-xs text-gray-500">Chấm điểm nhanh gọn với giao diện Hộp thư 2 cột.</p>
        </div>
        
        {/* Filters Panel */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Material Selector */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm min-w-[220px] w-full sm:w-auto">
            <BookOpen size={16} className="text-emerald-600 shrink-0" />
            <select 
              value={materialFilter} 
              onChange={(e) => setMaterialFilter(e.target.value)}
              className="w-full text-sm font-bold text-gray-800 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="all">-- Tất cả Bài học --</option>
              {sortedMaterialChapters.map(chName => (
                <optgroup key={chName} label={truncateText(chName, 50)}>
                  {(groupedMaterialsByChapter[chName] || []).map(m => (
                    <option key={m.id} value={m.id}>{truncateText(`Bài học: ${m.title}`, 60)}</option>
                  ))}
                </optgroup>
              ))}
              <optgroup label="Khác">
                <option value="unlinked">Chưa phân loại</option>
              </optgroup>
            </select>
          </div>

          {/* Assignment Selector */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm min-w-[280px] w-full sm:w-auto">
            <FileText size={16} className="text-blue-600 shrink-0" />
            <select 
              value={activeAsgId} 
              onChange={(e) => setActiveAsgId(e.target.value)}
              className="w-full text-sm font-bold text-gray-800 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {assignments.length === 0 ? (
                <option value="">Chưa có bài tập nào</option>
              ) : (
                (() => {
                  let options = [];
                  if (materialFilter === 'all') {
                    options = sortedMaterialChapters.flatMap(chName => {
                      const mats = groupedMaterialsByChapter[chName] || [];
                      return mats.map(m => {
                        const asgs = assignmentsByMaterial[String(m.id)];
                        if (!asgs || asgs.length === 0) return null;
                        return (
                          <optgroup key={m.id} label={truncateText(`Bài học: ${m.title}`, 50)}>
                            {asgs.map(a => <option key={a.id} value={a.id}>{truncateText(a.title, 60)}</option>)}
                          </optgroup>
                        );
                      });
                    });
                    const unlinked = assignmentsByMaterial['unlinked'];
                    if (unlinked && unlinked.length > 0) {
                      options.push(
                        <optgroup key="unlinked" label="Chưa phân loại">
                          {unlinked.map(a => <option key={a.id} value={a.id}>{truncateText(a.title, 60)}</option>)}
                        </optgroup>
                      );
                    }
                  } else {
                    const asgs = assignmentsByMaterial[materialFilter];
                    if (!asgs || asgs.length === 0) {
                      options.push(<option key="empty" value="">(Không có bài tập)</option>);
                    } else {
                      options = asgs.map(a => <option key={a.id} value={a.id}>{truncateText(a.title, 60)}</option>);
                    }
                  }
                  return options;
                })()
              )}
            </select>
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN LAYOUT ───────────────────────── */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 160px)', minHeight: 500 }}>
        
        {/* LEFT COLUMN: LIST OF SUBMISSIONS */}
        <div className="w-[300px] lg:w-[340px] xl:w-[380px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden shrink-0">
          
          <div className="p-3 border-b border-gray-100 bg-gray-50 shrink-0 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Danh sách nộp bài</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {currentSubmissions.length} bài
              </span>
            </div>
            
            {/* Progress Bar */}
            {(() => {
              const gradedCount = currentSubmissions.filter(s => s.status === 'GRADED').length;
              const totalCount = currentSubmissions.length;
              const pct = totalCount > 0 ? Math.round((gradedCount / totalCount) * 100) : 0;
              return (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1 overflow-hidden" title={`${gradedCount}/${totalCount} Đã chấm`}>
                  <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              );
            })()}

            <select
              value={submissionStatusFilter}
              onChange={(e) => setSubmissionStatusFilter(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-emerald-400 shadow-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ungraded">⏳ Cần chấm</option>
              <option value="graded">✅ Đã chấm</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
            {!currentAsg ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <FileText size={28} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium">Hãy chọn một bài tập ở trên.</p>
              </div>
            ) : currentSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <CheckSquare size={32} className="text-emerald-300" />
                </div>
                <p className="text-sm font-bold text-gray-800 mb-1">Chưa có bài nộp nào.</p>
                <p className="text-xs text-gray-500 max-w-[200px] text-center">Sinh viên chưa nộp bài hoặc bạn có thể đi pha một tách trà!</p>
              </div>
            ) : currentSubmissions.map(sub => {
              const student = users.find((s) => s.id === sub.studentId);
              const isActive = gradingSubmissionId === sub.id;
              const isGraded = sub.status === 'GRADED';
              const avatar = student?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${sub.studentId}`;
              
              return (
                <div
                  key={sub.id}
                  onClick={() => handleSelectSubmission(sub)}
                  className={`group p-3.5 rounded-2xl cursor-pointer border transition-all duration-300 flex items-center gap-3.5 relative overflow-hidden ${isActive ? 'bg-gradient-to-br from-emerald-50 to-teal-50/30 border-emerald-300 shadow-sm ring-1 ring-emerald-100' : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5'}`}
                >
                  {/* Decorative active bar */}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500" />}

                  <div className="relative">
                    <img src={avatar} alt="" className={`w-11 h-11 rounded-full shrink-0 object-cover ${isActive ? 'ring-2 ring-emerald-400 ring-offset-2' : 'group-hover:ring-2 group-hover:ring-emerald-200 transition-all'}`} />
                    {isGraded && (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        <CheckCircle2 size={12} className="text-emerald-500 fill-emerald-100" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[13px] font-bold truncate ${isActive ? 'text-emerald-900' : 'text-gray-900 group-hover:text-emerald-700 transition-colors'}`}>
                        {sub.studentName || student?.name || sub.studentId}
                      </span>
                      <span className="text-[10px] font-medium text-gray-400 shrink-0 ml-2 mt-0.5">
                        {timeAgo(sub.submittedAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                        ${isGraded ? 'bg-gray-100 text-gray-500' : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200/50'}`}>
                        {isGraded ? 'Đã chấm' : 'Cần chấm'}
                      </span>
                      
                      {isGraded && (
                        <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                          {sub.grade}/{currentAsg?.maxPoints || 10}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW & GRADING FORM */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden relative">
          {gradingSubmission ? (
            <div className="flex flex-col lg:flex-row h-full overflow-hidden">
              
              {/* Left inner: File Preview */}
              <div className="flex-[1.4] bg-[#0f172a] flex flex-col min-w-[340px] overflow-hidden border-b lg:border-b-0 lg:border-r border-gray-200">
                <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm z-10 shrink-0">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-2 truncate pr-4">
                    <FileText size={14} /> 
                    {gradingSubmission.fileName ? (
                      <span className="truncate">{gradingSubmission.fileName.startsWith('http') ? 'Tài liệu học viên nộp' : gradingSubmission.fileName}</span>
                    ) : 'Không có tệp đính kèm'}
                  </span>
                  {fileUrl && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-decoration-none flex items-center gap-1.5 transition whitespace-nowrap shrink-0 font-medium">
                      Mở tab mới / Tải
                    </a>
                  )}
                </div>
                
                <div className="flex-1 flex items-center justify-center overflow-auto relative">
                  {!fileUrl ? (
                    <div className="text-center p-8">
                      <FileText size={48} className="mx-auto text-gray-600 mb-3" />
                      <p className="text-sm font-bold text-gray-400">Học viên không nộp tệp đính kèm.</p>
                      {gradingSubmission.fileName && !gradingSubmission.fileName.startsWith('http') && (
                        <p className="text-xs text-gray-500 mt-2 bg-gray-800 p-2 rounded-lg">{gradingSubmission.fileName}</p>
                      )}
                    </div>
                  ) : ytId ? (
                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}`} title="YouTube" className="border-none" allowFullScreen />
                  ) : isVideo ? (
                    <video src={previewSrc} controls autoPlay className="max-w-full max-h-full" />
                  ) : isZip ? (
                    <div className="text-center p-10">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-base font-bold text-white mb-2">Tệp nén</p>
                      <p className="text-xs text-gray-400 max-w-[280px] mx-auto mb-6">Trình duyệt không hỗ trợ xem trước tệp này. Vui lòng tải xuống để xem nội dung.</p>
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-xl transition">
                        Tải xuống tệp nén
                      </a>
                    </div>
                  ) : isImage ? (
                    <div className="overflow-auto w-full h-full flex items-center justify-center p-4">
                      <img src={previewSrc} className="max-w-full max-h-full object-contain" alt="Preview" />
                    </div>
                  ) : (
                    <iframe src={previewSrc} className="w-full h-full border-none bg-white" title="Preview" />
                  )}
                </div>
              </div>

              {/* Right inner: Grading Form */}
              <div className="w-full lg:w-[320px] xl:w-[380px] flex flex-col bg-gradient-to-b from-white to-gray-50/50 overflow-y-auto shrink-0 relative">
                {/* Subtle top gradient */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />
                
                <form onSubmit={handleSubmitGrade} className="flex flex-col h-full min-h-min p-5 lg:p-6 gap-6 relative z-10">
                  
                  <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                    <p className="text-xs text-gray-500 mb-1">Đang chấm bài của:</p>
                    <p className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">{gradingSubmission.studentName}</p>
                    
                    {gradingSubmission.studentNotes && (
                      <div className="mt-3 pt-3 border-t border-gray-100/80">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1.5">Ghi chú của học viên:</p>
                        <p className="text-xs text-gray-600 italic border-l-[3px] border-emerald-300 pl-3 py-0.5 bg-emerald-50/30 rounded-r-lg">
                          "{gradingSubmission.studentNotes}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 flex justify-between items-end">
                      <span className="uppercase tracking-wider text-gray-500">Điểm số <span className="text-red-500">*</span></span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Max: {currentAsg?.maxPoints || 10}</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={currentAsg?.maxPoints || 10}
                        className="w-full p-4 text-3xl font-black text-center text-emerald-700 bg-white rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 shadow-inner transition-all"
                        required
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xl pointer-events-none select-none">
                        / {currentAsg?.maxPoints || 10}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nhận xét chi tiết</label>
                    <textarea
                      className="w-full flex-1 p-4 text-sm bg-white rounded-2xl border border-gray-200 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 resize-none transition-all shadow-sm min-h-[140px] leading-relaxed"
                      placeholder="Ghi nhận xét chi tiết, gạch đầu dòng những điểm tốt và chưa tốt..."
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['👍 Làm rất tốt', '✨ Xuất sắc', '📝 Cần chi tiết hơn', '⚠️ Sai yêu cầu'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setGradeFeedback(prev => prev ? `${prev}\n${t}` : t)}
                          className="text-[11px] bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 font-bold px-3 py-1.5 rounded-full shadow-sm transition-all active:scale-95"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-black text-[13px] uppercase tracking-wide py-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex justify-center items-center gap-2 shrink-0 active:scale-[0.98]"
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckSquare size={18} />}
                    {gradingSubmission.status === 'GRADED' ? 'Cập nhật Điểm' : 'Lưu Điểm & Phản hồi'}
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
              
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-6 relative z-10">
                <FileText size={40} className="text-emerald-400" strokeWidth={1.5} />
              </div>
              <p className="text-xl font-black text-gray-800 mb-2 relative z-10">Sẵn sàng chấm điểm</p>
              <p className="text-sm text-gray-500 max-w-[280px] text-center leading-relaxed relative z-10">
                Chọn một học viên ở danh sách bên trái để xem bài làm và bắt đầu đánh giá.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
