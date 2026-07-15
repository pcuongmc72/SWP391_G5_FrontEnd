import { useMemo, useRef, useState } from 'react';
import { Pencil, Trash2, Plus, Search, Clock, CheckSquare, X, Check, BookOpen, ChevronDown, ChevronRight, ClipboardList, Upload, ExternalLink, Film, FileText, FileSpreadsheet, Paperclip, Eye, Loader2 } from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';

export default function AssignmentsDashboard() {
  const {
    users, selectedClassId, classesLoading, classesError, workspaceLoading,
    assignments, submissions, materials, api
  } = useLecturerWorkspace();

  const [toast, setToast] = useState(null);
  
  // Workspace State
  const [workspaceMode, setWorkspaceMode] = useState('idle'); // 'idle' | 'view' | 'create' | 'edit'
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  
  const [newAsgForm, setNewAsgForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxPoints: 10,
    linkedItem: '',
    instructions: '',
    attachmentUrl: '',
    attachmentName: '',
    attachmentSize: '',
    inputType: 'file', // 'file' | 'link'
    linkUrl: '',
  });
  
  const [isAsgUploading, setIsAsgUploading] = useState(false);
  const [isAsgDragging, setIsAsgDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const asgFileInputRef = useRef(null);

  const [assignmentFilter, setAssignmentFilter] = useState('all'); // all, active, overdue
  const [assignmentSearch, setAssignmentSearch] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Helpers
  const parseAssignmentDesc = (rawDesc) => {
    if (!rawDesc) {
      return { desc: '', linkedItem: '', linkedTitle: '', type: 'individual', instructions: '' };
    }
    const clean = rawDesc.trim();
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const data = JSON.parse(clean);
        return {
          desc: data.desc || '',
          linkedItem: data.linkedItem || data.sessionId || '',
          linkedTitle: data.linkedTitle || data.sessionTitle || '',
          type: data.type || 'individual',
          instructions: data.instructions || '',
          attachmentUrl: data.attachmentUrl || '',
          attachmentName: data.attachmentName || '',
          attachmentSize: data.attachmentSize || '',
        };
      } catch (e) { }
    }
    return { desc: rawDesc, linkedItem: '', linkedTitle: '', type: 'individual', instructions: '', attachmentUrl: '', attachmentName: '', attachmentSize: '' };
  };

  const serializeAssignmentDesc = (data) => {
    return JSON.stringify({
      desc: data.desc || '',
      linkedItem: data.linkedItem || '',
      linkedTitle: data.linkedTitle || '',
      type: 'individual',
      instructions: data.instructions || '',
      attachmentUrl: data.attachmentUrl || '',
      attachmentName: data.attachmentName || '',
      attachmentSize: data.attachmentSize || '',
    });
  };

  const calculateTimeRemaining = (dueDateString) => {
    if (!dueDateString) return { text: 'N/A', status: 'unknown', color: '#64748b', bg: '#f1f5f9' };
    const due = new Date(dueDateString);
    const now = new Date();
    due.setHours(23, 59, 59, 999);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Đã quá hạn ${Math.abs(diffDays)} ngày`, status: 'overdue', color: '#ef4444', bg: '#fef2f2' };
    }
    if (diffDays === 0) {
      return { text: 'Hết hạn hôm nay!', status: 'warning', color: '#ea580c', bg: '#fff7ed' };
    }
    if (diffDays <= 3) {
      return { text: `Còn ${diffDays} ngày`, status: 'warning', color: '#d97706', bg: '#fef3c7' };
    }
    return { text: `Còn ${diffDays} ngày`, status: 'normal', color: '#059669', bg: '#ecfdf5' };
  };

  // Grouping
  const groupedByChapter = useMemo(() => {
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

  const sortedChapters = useMemo(() => {
    return Object.keys(groupedByChapter).sort((a, b) => {
      if (a === 'Học liệu chung') return 1;
      if (b === 'Học liệu chung') return -1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [groupedByChapter]);

  const filteredAssignments = useMemo(() => {
    let list = assignments || [];
    if (assignmentSearch.trim()) {
      const q = assignmentSearch.toLowerCase();
      list = list.filter((asg) => {
        const meta = parseAssignmentDesc(asg.description);
        return (asg.title || '').toLowerCase().includes(q) ||
          (meta.desc || '').toLowerCase().includes(q) ||
          (meta.linkedTitle || '').toLowerCase().includes(q);
      });
    }
    if (assignmentFilter !== 'all') {
      list = list.filter((asg) => {
        const remaining = calculateTimeRemaining(asg.dueDate);
        if (assignmentFilter === 'active') return remaining.status !== 'overdue';
        if (assignmentFilter === 'overdue') return remaining.status === 'overdue';
        return true;
      });
    }
    // Sort by dueDate
    return [...list].sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
  }, [assignments, assignmentSearch, assignmentFilter]);

  // Actions
  const handleOpenCreate = () => {
    setWorkspaceMode('create');
    setActiveAssignmentId(null);
    setNewAsgForm({
      title: '', description: '', dueDate: '', maxPoints: 10, linkedItem: '',
      instructions: '', attachmentUrl: '', attachmentName: '', attachmentSize: '',
      inputType: 'file', linkUrl: '',
    });
  };

  const handleOpenView = (asg) => {
    setWorkspaceMode('view');
    setActiveAssignmentId(asg.id);
  };

  const handleOpenEdit = (asg) => {
    const meta = parseAssignmentDesc(asg.description);
    setWorkspaceMode('edit');
    setActiveAssignmentId(asg.id);
    setNewAsgForm({
      title: asg.title,
      description: meta.desc,
      dueDate: asg.dueDate?.substring(0, 10) || '',
      maxPoints: asg.maxPoints,
      linkedItem: meta.linkedItem,
      instructions: meta.instructions,
      attachmentUrl: meta.attachmentUrl || '',
      attachmentName: meta.attachmentName || '',
      attachmentSize: meta.attachmentSize || '',
      inputType: meta.attachmentUrl ? 'file' : 'file',
      linkUrl: '',
    });
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài tập này? Thao tác này không thể hoàn tác.')) {
      try {
        await api.removeAssignment(id);
        showToast('Đã xóa bài tập thành công!');
        if (activeAssignmentId === id) {
          setWorkspaceMode('idle');
          setActiveAssignmentId(null);
        }
      } catch (err) {
        showToast(err.response?.data?.message || err.message || 'Xóa bài tập thất bại.', 'error');
      }
    }
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    
    // VALIDATIONS
    if (!newAsgForm.title?.trim()) {
      showToast('Vui lòng nhập tiêu đề bài tập.', 'error');
      return;
    }
    if (newAsgForm.title.trim().length < 5) {
      showToast('Tiêu đề bài tập phải có ít nhất 5 ký tự.', 'error');
      return;
    }
    if (!newAsgForm.dueDate) {
      showToast('Vui lòng chọn hạn nộp bài.', 'error');
      return;
    }
    if (new Date(newAsgForm.dueDate) <= new Date()) {
      showToast('Hạn nộp bài phải là một thời điểm trong tương lai.', 'error');
      return;
    }
    if (!newAsgForm.maxPoints || Number(newAsgForm.maxPoints) <= 0 || Number(newAsgForm.maxPoints) > 10) {
      showToast('Điểm tối đa phải lớn hơn 0 và không vượt quá 10.', 'error');
      return;
    }

    let resolvedLinkedTitle = '';
    if (newAsgForm.linkedItem) {
      if (String(newAsgForm.linkedItem).startsWith('chapter_')) {
        resolvedLinkedTitle = String(newAsgForm.linkedItem).replace('chapter_', 'Chương: ');
      } else {
        const mat = (materials || []).find(m => String(m.id) === String(newAsgForm.linkedItem));
        if (mat) resolvedLinkedTitle = `Bài học: ${mat.title}`;
      }
    }

    const payload = {
      title: newAsgForm.title,
      description: serializeAssignmentDesc({
        desc: newAsgForm.description,
        linkedItem: newAsgForm.linkedItem,
        linkedTitle: resolvedLinkedTitle,
        instructions: newAsgForm.instructions,
        attachmentUrl: newAsgForm.attachmentUrl,
        attachmentName: newAsgForm.attachmentName,
        attachmentSize: newAsgForm.attachmentSize,
      }),
      dueDate: newAsgForm.dueDate,
      maxPoints: Number(String(newAsgForm.maxPoints).replace(',', '.')),
    };

    try {
      setIsSubmitting(true);
      if (workspaceMode === 'edit' && activeAssignmentId) {
        await api.updateAssignment(activeAssignmentId, payload);
        showToast('Cập nhật bài tập thành công!');
        // Transition back to View mode
        setWorkspaceMode('view');
      } else {
        await api.addAssignment(payload);
        showToast('Tạo bài tập thành công!');
        setWorkspaceMode('idle');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Lưu bài tập thất bại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;
    setIsAsgUploading(true);
    try {
      const result = await api.uploadFile(file);
      setNewAsgForm(prev => ({ 
        ...prev, 
        attachmentUrl: result.url, 
        attachmentName: file.name, 
        attachmentSize: `${(result.size / (1024*1024)).toFixed(1)} MB` 
      }));
      showToast('Đã tải tệp lên thành công!');
    } catch { 
      showToast('Tải tệp thất bại.', 'error'); 
    } finally { 
      setIsAsgUploading(false);
      if (e.target.value) e.target.value = '';
    }
  };

  const activeAsgDetails = useMemo(() => {
    if (!activeAssignmentId) return null;
    const asg = (assignments || []).find(a => a.id === activeAssignmentId);
    if (!asg) return null;
    return { ...asg, meta: parseAssignmentDesc(asg.description) };
  }, [assignments, activeAssignmentId]);

  if (classesLoading || workspaceLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
        <p className="text-sm text-gray-400">Đang tải dữ liệu bài tập...</p>
      </div>
    );
  }

  // Preview Logic
  const getPreviewSrc = (url, name) => {
    if (!url) return null;
    const isImage = /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(url);
    const isVideo = /\.(mp4|webm|ogg)($|\?)/i.test(url);
    const isZip = /\.(zip|rar|7z|gz|tar)($|\?)/i.test(name || url);
    const ytMatch = url.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
    const isCloudinary = url.includes('cloudinary.com');
    const isDocType = /\.(pptx?|docx?|xlsx?)($|\?)/i.test(url);
    
    let src = url;
    if (isCloudinary && !isDocType && !isImage && !isVideo && !isZip) {
      src = url.replace('/upload/', '/upload/fl_attachment:false/').split('?')[0] + '.pdf';
    } else if (isDocType) {
      src = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }

    return { url, src, isImage, isVideo, isZip, ytId: ytMatch ? ytMatch[1] : null, isDocType };
  };

  // Render components
  const renderPreviewBox = (attachmentUrl, attachmentName) => {
    const p = getPreviewSrc(attachmentUrl, attachmentName);
    if (!p) return null;

    return (
      <div className="flex-1 bg-[#0f172a] flex flex-col min-w-[340px] overflow-hidden border-b lg:border-b-0 lg:border-r border-gray-200">
        <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm z-10 shrink-0">
          <span className="text-xs font-bold text-gray-300 flex items-center gap-2 truncate pr-4">
            <FileText size={14} /> 
            <span className="truncate">{attachmentName || 'Tài liệu đính kèm'}</span>
          </span>
          <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-decoration-none flex items-center gap-1.5 transition whitespace-nowrap shrink-0 font-medium">
            <ExternalLink size={12} /> Mở tab mới / Tải
          </a>
        </div>
        
        <div className="flex-1 flex items-center justify-center overflow-auto relative">
          {p.ytId ? (
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${p.ytId}`} title="YouTube" className="border-none" allowFullScreen />
          ) : p.isVideo ? (
            <video src={p.src} controls autoPlay className="max-w-full max-h-full" />
          ) : p.isZip ? (
            <div className="text-center p-10">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-base font-bold text-white mb-2">Tệp nén</p>
              <p className="text-xs text-gray-400 max-w-[280px] mx-auto mb-6">Trình duyệt không hỗ trợ xem trước tệp này. Vui lòng tải xuống để xem nội dung.</p>
            </div>
          ) : p.isImage ? (
            <div className="overflow-auto w-full h-full flex items-center justify-center p-4">
              <img src={p.src} className="max-w-full max-h-full object-contain" alt="Preview" />
            </div>
          ) : attachmentName === 'Liên kết' ? (
            <div className="text-center p-10">
              <ExternalLink size={48} className="mx-auto text-blue-500 mb-3" />
              <p className="text-base font-bold text-white mb-2">Liên kết ngoài</p>
            </div>
          ) : (
            <iframe src={p.src} className="w-full h-full border-none bg-white" title="Preview" />
          )}
        </div>
      </div>
    );
  };




  return (
    <div className="relative pb-12 h-full">
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
      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Quản lý Bài tập</h2>
        <p className="text-xs text-gray-500">Soạn thảo, giao bài và theo dõi tiến độ nộp bài của sinh viên.</p>
      </div>

      {/* ── 2-COLUMN LAYOUT ───────────────────────── */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 160px)', minHeight: 500 }}>
        
        {/* LEFT COLUMN: LIST */}
        <div className="w-[320px] lg:w-[380px] xl:w-[420px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden shrink-0">
          
          <div className="p-4 border-b border-gray-100 flex flex-col gap-3 shrink-0">
            <button
              onClick={handleOpenCreate}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Plus size={16} /> Soạn bài tập mới
            </button>
            
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
              {[
                { key: 'all',      label: 'Tất cả' },
                { key: 'active',   label: 'Đang mở' },
                { key: 'overdue',  label: 'Quá hạn' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setAssignmentFilter(tab.key)}
                  className={`flex-1 px-2 py-1.5 text-[11px] lg:text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer flex justify-center items-center gap-1.5
                    ${assignmentFilter === tab.key ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full text-xs pl-8 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50 transition"
                placeholder="Tìm tiêu đề, mô tả..."
                value={assignmentSearch}
                onChange={e => setAssignmentSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-400">Không tìm thấy bài tập nào.</p>
              </div>
            ) : filteredAssignments.map(asg => {
              const meta = parseAssignmentDesc(asg.description);
              const timeInfo = calculateTimeRemaining(asg.dueDate);
              const isActive = activeAssignmentId === asg.id;
              
              return (
                <div
                  key={asg.id}
                  onClick={() => handleOpenView(asg)}
                  className={`p-3.5 rounded-xl cursor-pointer border transition-all ${isActive ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-sm'}`}
                >
                  <h4 className={`text-sm font-bold truncate mb-1.5 ${isActive ? 'text-emerald-900' : 'text-gray-800'}`}>{asg.title}</h4>
                  
                  {meta.linkedTitle && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md mb-2 border border-blue-100">
                      <BookOpen size={10} /> {meta.linkedTitle.length > 35 ? meta.linkedTitle.substring(0,35)+'...' : meta.linkedTitle}
                    </div>
                  )}

                  <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed mb-3">{meta.desc || 'Không có mô tả.'}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full uppercase">
                      Max: {asg.maxPoints}đ
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: timeInfo.color, background: timeInfo.bg }}>
                      {timeInfo.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: WORKSPACE */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden relative">
          
          {workspaceMode === 'idle' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-5">
                <ClipboardList size={40} className="text-emerald-500" strokeWidth={1.5} />
              </div>
              <p className="text-xl font-bold text-gray-800 mb-1">Khu vực làm việc</p>
              <p className="text-sm text-gray-500 max-w-xs text-center leading-relaxed">
                Chọn một bài tập ở bên trái để xem chi tiết, hoặc bấm Tạo mới để giao bài cho học viên.
              </p>
            </div>
          ) : workspaceMode === 'view' && activeAsgDetails ? (
            // VIEW MODE
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
                <h3 className="text-lg font-extrabold text-gray-900 truncate pr-4">Chi tiết bài tập</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenEdit(activeAsgDetails)} className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition">
                    <Pencil size={14} /> Sửa
                  </button>
                  <button onClick={() => handleDeleteAssignment(activeAsgDetails.id)} className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg flex items-center gap-1.5 transition">
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {activeAsgDetails.meta.attachmentUrl && renderPreviewBox(activeAsgDetails.meta.attachmentUrl, activeAsgDetails.meta.attachmentName)}
                
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                  <div className="max-w-3xl space-y-6">
                    <div>
                      <h2 className="text-2xl font-extrabold text-gray-900 mb-3">{activeAsgDetails.title}</h2>
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                          Thang điểm: {activeAsgDetails.maxPoints}
                        </span>
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <Clock size={14} /> Hạn nộp: {new Date(activeAsgDetails.dueDate).toLocaleDateString('vi-VN')}
                        </span>
                        {activeAsgDetails.meta.linkedTitle && (
                          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                            <BookOpen size={14} /> Lộ trình: {activeAsgDetails.meta.linkedTitle}
                          </span>
                        )}
                      </div>
                      
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {activeAsgDetails.meta.desc || 'Không có mô tả chi tiết.'}
                      </div>
                    </div>

                    {activeAsgDetails.meta.instructions && (
                      <div>
                        <h4 className="text-sm font-extrabold text-gray-900 mb-2">Hướng dẫn nộp bài</h4>
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-[14px] text-amber-900 leading-relaxed whitespace-pre-wrap">
                          {activeAsgDetails.meta.instructions}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900 mb-2">Tiến độ nộp bài</h4>
                      {(() => {
                        const asgSubs = (submissions || []).filter(s => s.assignmentId === activeAsgDetails.id);
                        const pct = Math.min(100, Math.round((asgSubs.length / ((users && users.length) || 1)) * 100));
                        return (
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-600">Đã nộp: <strong className="text-gray-900">{asgSubs.length} / {(users && users.length) || 1}</strong> sinh viên</span>
                              <span className="text-sm font-bold text-emerald-600">{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                              <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                              <a href="/dashboard/lecturer/grading" className="text-sm font-bold text-emerald-600 hover:underline">Đi tới màn Chấm điểm &rarr;</a>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // EDIT / CREATE MODE
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
                <h3 className="text-lg font-extrabold text-gray-900">
                  {workspaceMode === 'edit' ? 'Cập nhật bài tập' : 'Soạn bài tập mới'}
                </h3>
                <button onClick={() => setWorkspaceMode(activeAssignmentId ? 'view' : 'idle')} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAssignment} className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {newAsgForm.attachmentUrl && renderPreviewBox(newAsgForm.attachmentUrl, newAsgForm.attachmentName)}
                
                <div className="flex-1 overflow-y-auto bg-white flex flex-col">
                  <div className="p-6 space-y-6 max-w-3xl mx-auto w-full flex-1">
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Tiêu đề bài tập <span className="text-red-500">*</span></label>
                      <input
                        className="w-full p-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition"
                        placeholder="Ví dụ: Thực hành C# OOP - Phần 1"
                        value={newAsgForm.title}
                        onChange={(e) => setNewAsgForm({ ...newAsgForm, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Liên kết Lộ trình / Bài học</label>
                      <select
                        className="w-full p-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 bg-gray-50 transition"
                        value={newAsgForm.linkedItem}
                        onChange={(e) => setNewAsgForm({ ...newAsgForm, linkedItem: e.target.value })}
                      >
                        <option value="">-- Không liên kết --</option>
                        {sortedChapters.map((chName) => (
                          <optgroup key={chName} label={chName?.length > 50 ? chName.substring(0, 50) + '...' : chName}>
                            {(groupedByChapter[chName] || []).map(m => (
                              <option key={m?.id} value={m?.id}>Bài học: {m?.title}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Tài liệu đính kèm (đề bài, file mẫu...)</label>
                      <div className="flex gap-4 mb-2">
                        <label className={`flex items-center gap-2 text-xs font-bold cursor-pointer ${newAsgForm.inputType === 'file' ? 'text-emerald-600' : 'text-gray-500'}`}>
                          <input type="radio" name="inputType" value="file" checked={newAsgForm.inputType === 'file'} onChange={() => setNewAsgForm({ ...newAsgForm, inputType: 'file', linkUrl: '' })} className="accent-emerald-600" /> Tải tệp từ máy
                        </label>
                        <label className={`flex items-center gap-2 text-xs font-bold cursor-pointer ${newAsgForm.inputType === 'link' ? 'text-emerald-600' : 'text-gray-500'}`}>
                          <input type="radio" name="inputType" value="link" checked={newAsgForm.inputType === 'link'} onChange={() => setNewAsgForm({ ...newAsgForm, inputType: 'link', attachmentUrl: '', attachmentName: '', attachmentSize: '' })} className="accent-emerald-600" /> Gắn link liên kết
                        </label>
                      </div>
                      
                      {newAsgForm.inputType === 'link' ? (
                        <input
                          className="w-full p-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition"
                          type="url"
                          placeholder="https://drive.google.com/..."
                          value={newAsgForm.linkUrl}
                          onChange={(e) => setNewAsgForm({ ...newAsgForm, linkUrl: e.target.value, attachmentUrl: e.target.value, attachmentName: 'Liên kết', attachmentSize: '' })}
                        />
                      ) : (
                        <div
                          onClick={() => asgFileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setIsAsgDragging(true); }}
                          onDragLeave={() => setIsAsgDragging(false)}
                          onDrop={(e) => { e.preventDefault(); setIsAsgDragging(false); handleFileUpload(e); }}
                          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${isAsgDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                        >
                          <input ref={asgFileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                          {isAsgUploading ? (
                            <span className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Đang tải lên...</span>
                          ) : newAsgForm.attachmentName ? (
                            <div className="flex items-center justify-center gap-2">
                              <Paperclip size={18} className="text-emerald-600" />
                              <span className="text-sm font-bold text-emerald-700 truncate max-w-[200px]">{newAsgForm.attachmentName}</span>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setNewAsgForm(prev => ({ ...prev, attachmentUrl: '', attachmentName: '', attachmentSize: '' })); }} className="text-red-500 hover:text-red-700 ml-2">✕</button>
                            </div>
                          ) : (
                            <div>
                              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                              <span className="text-sm text-gray-500">Kéo thả hoặc <strong className="text-emerald-600">chọn tệp</strong></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Mô tả bài tập</label>
                      <textarea
                        className="w-full p-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none transition"
                        rows={3}
                        placeholder="Mô tả nội dung bài tập, yêu cầu đề bài..."
                        value={newAsgForm.description}
                        onChange={(e) => setNewAsgForm({ ...newAsgForm, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Hướng dẫn nộp bài chi tiết</label>
                      <textarea
                        className="w-full p-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none transition"
                        rows={2}
                        placeholder="Ví dụ: Nén mã nguồn .zip và nộp tại đây..."
                        value={newAsgForm.instructions}
                        onChange={(e) => setNewAsgForm({ ...newAsgForm, instructions: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-xs font-bold text-gray-700">Hạn nộp <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          className="w-full p-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 bg-gray-50 transition"
                          required
                          value={newAsgForm.dueDate}
                          onChange={(e) => setNewAsgForm({ ...newAsgForm, dueDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="text-xs font-bold text-gray-700">Điểm tối đa <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          min="0.1"
                          max="10"
                          step="0.1"
                          className="w-full p-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 bg-gray-50 transition"
                          value={newAsgForm.maxPoints}
                          onChange={(e) => setNewAsgForm({ ...newAsgForm, maxPoints: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={() => setWorkspaceMode(activeAssignmentId ? 'view' : 'idle')} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition">
                      Hủy
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition shadow-sm">
                      {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                      {workspaceMode === 'edit' ? 'Lưu thay đổi' : 'Tạo bài tập & Đăng tải'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
