import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload, Plus, CheckSquare, Film, FileText, FileSpreadsheet, ImageIcon, Paperclip, Pencil,
  Search, ChevronDown, ChevronRight, BookOpen, X, MessageSquare, Check, Trash2, Clock, Award, Users, CheckCircle, ExternalLink,
  ZoomIn, ZoomOut, Maximize, Edit3, RefreshCw
} from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './LecturerDashboard.module.css';
import { createQuiz, getQuizDetails, updateQuiz, deleteQuiz, getQuizAttempts } from '../../services/lecturerService';

// ─── ChapterDropdown Component ───────────────────────────────────────────────
function GenericDropdown({ value, onChange, existingItems, hasError = false, placeholder, icon: Icon, color, emptyText, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [newInput, setNewInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [localCustom, setLocalCustom] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const combinedItems = useMemo(() => Array.from(new Set([...existingItems, ...localCustom])), [existingItems, localCustom]);

  const handleSelect = (val) => { onChange(val); setOpen(false); setShowInput(false); setNewInput(''); };

  const handleAddNew = () => {
    if (newInput.trim()) {
      const val = newInput.trim();
      setLocalCustom(prev => [...prev, val]);
      handleSelect(val);
    }
  };

  const showError = (hasError || touched) && !value;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => {
          if (disabled) return;
          setOpen(o => !o);
          setTouched(true);
        }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: `1.5px solid ${disabled ? '#e2e8f0' : showError ? '#ef4444' : open ? color : '#64748b'}`,
          borderRadius: 8, padding: '8px 12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? '#f1f5f9' : showError ? '#fff5f5' : '#fff',
          fontSize: 13, color: disabled ? '#334155' : value ? '#0f172a' : '#475569',
          fontWeight: disabled ? 600 : 400,
          transition: 'border-color 0.2s, background 0.2s', userSelect: 'none', minHeight: 38,
          boxShadow: !disabled && showError ? '0 0 0 3px rgba(239,68,68,0.12)' : !disabled && open ? `0 0 0 3px ${color}1A` : 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={13} color={disabled ? '#64748b' : showError ? '#ef4444' : value ? color : '#475569'} />
          {value || placeholder}
        </span>
        {!disabled && <ChevronDown size={14} color="#1e293b" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
      </div>
      {!disabled && showError && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>⚠️ Vui lòng chọn hoặc tạo!</span>}
      {!disabled && open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 999,
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)', overflow: 'hidden',
        }}>
          {combinedItems.length > 0 && (
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {combinedItems.map((item, idx) => (
                <div key={idx} onClick={() => handleSelect(item)}
                  style={{
                    padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                    background: value === item ? `${color}1A` : 'transparent',
                    color: value === item ? color : '#0f172a',
                    fontWeight: value === item ? 700 : 400,
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = value === item ? `${color}1A` : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = value === item ? `${color}1A` : 'transparent'}
                >
                  {value === item && <Check size={13} color={color} />}
                  {item}
                </div>
              ))}
            </div>
          )}
          {combinedItems.length === 0 && !showInput && <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', fontStyle: 'italic', borderBottom: '1px solid #f1f5f9' }}>{emptyText}</div>}
          {showInput ? (
            <div style={{ padding: '8px 10px', borderTop: combinedItems.length > 0 ? '1px solid #e2e8f0' : 'none', display: 'flex', gap: 6, alignItems: 'center' }}>
              <input autoFocus value={newInput} onChange={e => setNewInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); } }}
                placeholder="Nhập tên mới..."
                style={{ flex: 1, border: `1.5px solid ${color}`, borderRadius: 6, padding: '5px 8px', fontSize: 12, outline: 'none', color: '#0f172a' }} />
              <button type="button" onClick={handleAddNew} style={{ background: color, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Thêm</button>
              <button type="button" onClick={() => { setShowInput(false); setNewInput(''); }} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 11, cursor: 'pointer' }}>Hủy</button>
            </div>
          ) : (
            <div onClick={() => setShowInput(true)}
              style={{ padding: '9px 14px', fontSize: 13, cursor: 'pointer', color: color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, borderTop: combinedItems.length > 0 ? '1px solid #e2e8f0' : 'none', background: `${color}0D` }}
              onMouseEnter={e => e.currentTarget.style.background = `${color}1A`}
              onMouseLeave={e => e.currentTarget.style.background = `${color}0D`}
            >
              <Plus size={13} /> Tạo mới
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GroupDistributionConfig({ formState, setFormState, users, showToast }) {
  if (formState.distributeMode === 'all') return null;
  return (
    <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 2 }}>Số nhóm</label>
          <input type="number" className={styles.input} style={{ padding: '4px 8px' }} min={2} max={10} value={formState.numGroups}
            onChange={(e) => {
              const num = parseInt(e.target.value) || 2;
              setFormState({ ...formState, numGroups: num, groups: generateRandomGroups(num, users) });
            }} />
        </div>
        <button type="button" className={styles.btnSecondary} style={{ alignSelf: 'flex-end', fontSize: 10, padding: '6px 10px' }}
          onClick={() => {
            setFormState({ ...formState, groups: generateRandomGroups(formState.numGroups, users) });
            if (showToast) showToast('Đã phân chia lại nhóm ngẫu nhiên', 'info');
          }}>Xáo trộn nhóm</button>
      </div>
      {formState.distributeMode === 'group_random' && (
        <div style={{ fontSize: 11, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
          ✅ <strong>Chia nhóm ngẫu nhiên:</strong> Tất cả nhóm đều được xem tài liệu này.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {formState.groups.map((group, idx) => (
          <div key={idx} style={{ background: '#fff', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <strong style={{ fontSize: 11, color: '#0f172a' }}>{group.name}</strong>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', maxHeight: 40, overflowY: 'auto' }}>
              {group.members.length === 0 ? <em>Chưa có học viên</em> : group.members.map((m) => m.name).join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MaterialsDashboard() {
  const {
    currentUser, users, classrooms, selectedClassId,
    classesLoading, classesError, workspaceLoading,
    materials, searchQuery, setSearchQuery, api,
  } = useLecturerWorkspace();

  const [toast, setToast] = useState(null);
  const [questionToDeleteIdx, setQuestionToDeleteIdx] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [renamingChapter, setRenamingChapter] = useState(null);
  const [newChapterName, setNewChapterName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all | video | pdf | document | quiz
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);
  const [isRefreshingAttempts, setIsRefreshingAttempts] = useState(false);

  const handleRefreshAttempts = async () => {
    const material = materials.find(m => m.id === editingMaterialId);
    let quizId = (material && material.url && material.url !== '#') ? material.url : editingMaterialId;
    console.log("[handleRefreshAttempts] material:", material, "quizId:", quizId);
    if (!quizId) return;
    setIsRefreshingAttempts(true);
    try {
      const attemptsData = await getQuizAttempts(quizId);
      console.log("[handleRefreshAttempts] attemptsData returned:", attemptsData);
      if (attemptsData) {
        setEditMaterialForm(prev => ({ ...prev, attempts: attemptsData }));
      }
    } catch (err) {
      console.error("Lỗi khi tải lại danh sách lượt làm", err);
    } finally {
      setIsRefreshingAttempts(false);
    }
  };

  const [newMaterialForm, setNewMaterialForm] = useState({
    title: '', description: '', type: 'image', fileName: '', fileSize: '', fileObj: null, files: [],
    publishDate: new Date().toISOString().split('T')[0],
    deadline: '',
    distributeMode: 'all',
    numGroups: 2,
    groups: [],
    comments: [],
    subject: '',
    chapter: '',
    inputType: 'file',
    linkUrl: '',
    timeLimit: '',
    maxAttempts: 1,
    questions: [
      {
        questionText: '',
        points: 2,
        options: [
          { optionText: '', isCorrect: true },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }
        ]
      }
    ]
  });

  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [editMaterialForm, setEditMaterialForm] = useState({
    title: '', description: '', type: 'video', fileName: '', fileSize: '', fileObj: null, files: [],
    publishDate: '',
    deadline: '',
    distributeMode: 'all',
    numGroups: 2,
    groups: [],
    comments: [],
    subject: '',
    chapter: '',
    inputType: 'file',
    linkUrl: '',
    timeLimit: '',
    maxAttempts: 1,
    questions: [
      {
        questionText: '',
        points: 2,
        options: [
          { optionText: '', isCorrect: true },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }
        ]
      }
    ]
  });

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const commentInputRef = useRef(null);
  const [isEditDragging, setIsEditDragging] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);

  // Helper: Get YouTube Video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Helper: Fetch YouTube Info
  const fetchYouTubeInfo = async (url) => {
    try {
      const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
      const response = await fetch(oembedUrl);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching YouTube info", error);
      return null;
    }
  };

  const parseMaterialDesc = (rawDesc) => {
    if (!rawDesc) {
      return { desc: '', publishDate: null, deadline: '', distributeMode: 'all', groups: [], comments: [] };
    }
    const clean = rawDesc.trim();
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const data = JSON.parse(clean);
        return {
          desc: data.desc || '',
          publishDate: data.publishDate || null,
          deadline: data.deadline || '',
          distributeMode: data.distributeMode || 'all',
          groups: data.groups || [],
          comments: data.comments || [],
        };
      } catch (e) {
        // fallback
      }
    }
    return { desc: rawDesc, publishDate: null, deadline: '', distributeMode: 'all', groups: [], comments: [] };
  };

  const serializeMaterialDesc = (data) => {
    return JSON.stringify({
      desc: data.desc || '',
      publishDate: data.publishDate || null,
      deadline: data.deadline || '',
      distributeMode: data.distributeMode || 'all',
      groups: data.groups || [],
      comments: data.comments || [],
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const classroomMaterials = useMemo(() => {
    let list = materials;
    // Filter by text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) => (m.title || '').toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q)
      );
    }
    // Filter by type
    if (filterType !== 'all') {
      list = list.filter((m) => m.type === filterType);
    }
    return list;
  }, [materials, searchQuery, filterType]);

  // ─── Chapter normalization helpers ───────────────────────────────────
  // Extract pure chapter name: "Subject ÷ Chapter" → "Chapter", or raw string
  const extractChapterName = (raw) => {
    if (!raw) return '';
    return raw.includes(' ÷ ') ? raw.split(' ÷ ')[1].trim() : raw.trim();
  };
  // Extract subject name: "Subject ÷ Chapter" → "Subject", or fallback
  const extractSubjectName = (raw, fallback = '') => {
    if (!raw) return fallback;
    return raw.includes(' ÷ ') ? raw.split(' ÷ ')[0].trim() : fallback;
  };

  const groupedByChapter = useMemo(() => {
    const groups = {};
    classroomMaterials.forEach((m) => {
      const chapter = extractChapterName(m.chapter) || 'Học liệu chung';
      if (!groups[chapter]) groups[chapter] = [];
      groups[chapter].push(m);
    });

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const dateA = new Date(a.publishDate || 0).getTime();
        const dateB = new Date(b.publishDate || 0).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (a.title || '').localeCompare(b.title || '', undefined, { numeric: true, sensitivity: 'base' });
      });
    });

    return groups;
  }, [classroomMaterials]);

  const sortedChapters = useMemo(() => {
    return Object.keys(groupedByChapter).sort((a, b) => {
      if (a === 'Học liệu chung') return 1;
      if (b === 'Học liệu chung') return -1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [groupedByChapter]);

  const existingSubjects = useMemo(() => {
    return Array.from(new Set(materials.map(m => extractSubjectName(m.chapter)).filter(Boolean)));
  }, [materials]);

  // All unique chapter names (clean, deduped, sorted)
  const existingChapters = useMemo(() => {
    const seen = new Set();
    materials.forEach(m => {
      const ch = extractChapterName(m.chapter);
      if (ch) seen.add(ch);
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [materials]);

  // Both Add and Edit modals use the same chapter list (class-scoped, all chapters)
  const existingChaptersForSubject = useMemo(() => existingChapters, [existingChapters]);
  const existingChaptersForEditSubject = useMemo(() => existingChapters, [existingChapters]);

  const generateRandomGroups = (num, studentsList) => {
    const list = [...studentsList];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    const result = Array.from({ length: num }, (_, index) => ({
      name: `Nhóm ${index + 1}`,
      members: [],
      canView: true, // default: group can view the material
    }));
    list.forEach((student, index) => {
      result[index % num].members.push({ id: student.id, name: student.name });
    });
    return result;
  };

  const handleAddComment = (text) => {
    if (!text.trim()) return;
    const authorName = currentUser?.fullName || currentUser?.name || 'Giảng viên';
    const cleanTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
    const newCommentObj = { author: authorName, text: text.trim(), time: cleanTime };

    setEditMaterialForm((prev) => {
      const updatedComments = [...(prev.comments || []), newCommentObj];
      const payload = {
        title: prev.title,
        description: serializeMaterialDesc({
          desc: prev.description,
          publishDate: prev.publishDate,
          deadline: prev.deadline,
          distributeMode: prev.distributeMode,
          groups: prev.groups,
          comments: updatedComments,
        }),
        type: prev.type,
        fileSize: prev.fileName ? prev.fileSize : '',
        url: prev.fileName ? `#file:${prev.fileName}` : '#',
        chapter: `${prev.subject} ÷ ${prev.chapter}`,
      };

      api.updateMaterial(editingMaterialId, payload).then(() => {
        showToast('Đã lưu bình luận!');
      }).catch((e) => {
        showToast(e.message || 'Lưu bình luận thất bại', 'info');
      });

      return { ...prev, comments: updatedComments };
    });
  };

  const detectFileType = (file) => {
    const mime = file.type || '';
    const name = file.name.toLowerCase();
    if (mime.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/.test(name)) return 'image';
    if (mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/.test(name)) return 'video';
    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
    if (/spreadsheet|excel|csv/.test(mime) || /\.(xlsx?|csv)$/.test(name)) return 'document';
    if (/word|msword/.test(mime) || /\.(docx?)$/.test(name)) return 'document';
    if (/quiz|json/.test(mime) || /\.(json)$/.test(name)) return 'quiz';
    return 'document';
  };

  const applyFile = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const newFilesArray = Array.from(fileList).map(file => ({
      fileObj: file,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: detectFileType(file),
      previewUrl: URL.createObjectURL(file)
    }));

    setNewMaterialForm((prev) => {
      const mergedFiles = [...(prev.files || []), ...newFilesArray];
      return {
        ...prev,
        files: mergedFiles,
        title: prev.title || newFilesArray[0].fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        fileObj: mergedFiles[0].fileObj,
        fileName: mergedFiles[0].fileName,
        type: mergedFiles[0].type
      };
    });
    showToast(`Đã thêm ${newFilesArray.length} tệp`, 'info');
  };

  const handleFileInputChange = (e) => {
    applyFile(e.target.files);
    e.target.value = '';
  };

  const handleDropZoneClick = () => fileInputRef.current?.click();
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    applyFile(e.dataTransfer.files);
  };

  const renderFileIcon = (type) => {
    switch (type) {
      case 'video': return <Film size={32} color="#3b82f6" />;
      case 'pdf': return <FileText size={32} color="#ef4444" />;
      case 'document': return <FileSpreadsheet size={32} color="#10b981" />;
      case 'quiz': return <CheckSquare size={32} color="#f59e0b" />;
      default: return <Paperclip size={32} color="#64748b" />;
    }
  };

  const handleEditMaterialStart = async (material) => {
    const meta = parseMaterialDesc(material.description);
    // Resolve subject & chapter from raw DB value (unified handling)
    let subjectVal = extractSubjectName(material.chapter, '');
    let chapterVal = extractChapterName(material.chapter);

    const activeClass = classrooms?.find(c => c.id === selectedClassId);
    if (!subjectVal) {
      subjectVal = activeClass ? (activeClass.courseCode || activeClass.id) : '';
    } else {
      const matchingClass = classrooms?.find(c => c.id === subjectVal);
      if (matchingClass && matchingClass.courseCode) {
        subjectVal = matchingClass.courseCode;
      }
    }

    setEditingMaterialId(material.id);
    setIframeError(false);

    let quizQuestions = [];
    let quizTimeLimit = '';
    let quizMaxAttempts = 1;
    let quizAttempts = [];

    if (material.type === 'quiz') {
      const quizId = (material.url && material.url !== '#') ? material.url : material.id;
      console.log("[handleEditMaterialStart] Quiz Edit - quizId:", quizId, "material:", material);
      if (quizId) {
        try {
          const quizDetails = await getQuizDetails(quizId);
          console.log("[handleEditMaterialStart] quizDetails:", quizDetails);
          if (quizDetails) {
            quizTimeLimit = quizDetails.timeLimit || '';
            quizMaxAttempts = quizDetails.maxAttempts || 1;
            quizQuestions = (quizDetails.questions || []).map(q => ({
              questionText: q.questionText,
              points: q.points,
              options: (q.options || []).map(o => ({
                optionText: o.optionText,
                isCorrect: o.isCorrect || false
              }))
            }));
          }
        } catch (err) {
          console.error("Lỗi khi tải câu hỏi trắc nghiệm", err);
          showToast('Không tải được câu hỏi trắc nghiệm, vui lòng tạo lại.', 'info');
        }

        try {
          const attemptsData = await getQuizAttempts(quizId);
          console.log("[handleEditMaterialStart] attemptsData:", attemptsData);
          if (attemptsData) {
            quizAttempts = attemptsData;
          }
        } catch (err) {
          console.error("Lỗi khi tải lượt làm trắc nghiệm", err);
        }
      }
    }

    setEditMaterialForm({
      title: material.title || '',
      description: meta.desc || '',
      type: material.type || 'video',
      fileName: material.url && material.url.startsWith('#file:') ? material.url.substring(6) : (material.url !== '#' ? material.url : ''),
      fileSize: material.fileSize || '',
      fileObj: null,
      files: [],
      publishDate: meta.publishDate || material.uploadedAt?.substring(0, 10) || '',
      deadline: meta.deadline || '',
      distributeMode: meta.distributeMode || 'all',
      numGroups: meta.groups?.length || 2,
      groups: meta.groups || [],
      comments: meta.comments || [],
      subject: subjectVal,
      chapter: chapterVal,
      lesson: material.lesson || '',
      inputType: material.type === 'quiz' ? 'quiz' : (material.fileSize === 'Liên kết' ? 'link' : 'file'),
      linkUrl: material.fileSize === 'Liên kết' ? material.url : '',
      timeLimit: quizTimeLimit,
      maxAttempts: quizMaxAttempts,
      attempts: quizAttempts,
      questions: quizQuestions.length > 0 ? quizQuestions : [
        {
          questionText: '',
          points: 2,
          options: [
            { optionText: '', isCorrect: true },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false }
          ]
        }
      ]
    });
  };


  const handleCancelEdit = () => {
    setEditingMaterialId(null);
    setHasSubmitAttempted(false);
  };

  const applyEditFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const newFilesArray = Array.from(fileList).map(file => ({
      fileObj: file,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: detectFileType(file),
      previewUrl: URL.createObjectURL(file)
    }));
    setEditMaterialForm((prev) => {
      const mergedFiles = [...(prev.files || []), ...newFilesArray];
      return {
        ...prev,
        files: mergedFiles,
        title: prev.title || newFilesArray[0].fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
      };
    });
    showToast(`Đã thêm ${newFilesArray.length} tệp mới`, 'info');
  };

  const handleEditFileInputChange = (e) => {
    applyEditFiles(e.target.files);
    e.target.value = '';
  };

  const handleEditDropZoneClick = () => editFileInputRef.current?.click();
  const handleEditDragOver = (e) => { e.preventDefault(); setIsEditDragging(true); };
  const handleEditDragLeave = () => setIsEditDragging(false);
  const handleEditDrop = (e) => {
    e.preventDefault();
    setIsEditDragging(false);
    applyEditFiles(e.dataTransfer.files);
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setHasSubmitAttempted(true);
    if (!newMaterialForm.title) { showToast('Vui lòng nhập tên bài học', 'info'); return; }
    if (!newMaterialForm.subject) { showToast('Vui lòng chọn hoặc tạo Môn học', 'info'); return; }
    if (!newMaterialForm.chapter) { showToast('Vui lòng chọn hoặc tạo Chương (Chapter)', 'error'); return; }
    if (!newMaterialForm.description?.trim()) { showToast('Vui lòng nhập Yêu cầu / Mô tả', 'error'); return; }
    if (!newMaterialForm.deadline) { showToast('Vui lòng chọn Hạn hoàn thành', 'error'); return; }
    if (newMaterialForm.deadline && new Date(newMaterialForm.deadline) < new Date(newMaterialForm.publishDate)) {
      showToast('Hạn hoàn thành không được trước Ngày phát hành!', 'error');
      return;
    }
    if (newMaterialForm.inputType === 'file' && (!newMaterialForm.files || newMaterialForm.files.length === 0) && !newMaterialForm.fileObj) {
      showToast('Vui lòng chọn ít nhất 1 file để đăng tải!', 'error');
      return;
    }
    if (newMaterialForm.inputType === 'link' && !newMaterialForm.linkUrl) {
      showToast('Vui lòng nhập đường dẫn liên kết!', 'error');
      return;
    }
    if (newMaterialForm.inputType === 'quiz') {
      const hasEmptyQuestion = newMaterialForm.questions.some(q => !q.questionText?.trim());
      const hasEmptyOption = newMaterialForm.questions.some(q => q.options.some(o => !o.optionText?.trim()));
      if (hasEmptyQuestion || hasEmptyOption) {
        showToast('Vui lòng nhập đầy đủ nội dung câu hỏi và các lựa chọn!', 'error');
        return;
      }
    }
    setIsUploading(true);
    const selectedCleanChapter = newMaterialForm.chapter.trim().toLowerCase();
    const existingMat = (materials || []).find(m => m.chapter && extractChapterName(m.chapter).trim().toLowerCase() === selectedCleanChapter);
    const compoundChapter = existingMat ? existingMat.chapter : `${newMaterialForm.subject} ÷ ${newMaterialForm.chapter}`;
    try {
      if (newMaterialForm.inputType === 'quiz') {
        const payload = {
          classId: selectedClassId,
          title: newMaterialForm.title.trim(),
          description: newMaterialForm.description?.trim() || '',
          timeLimit: newMaterialForm.timeLimit ? parseInt(newMaterialForm.timeLimit) : null,
          maxAttempts: newMaterialForm.maxAttempts || 1,
          chapter: compoundChapter,
          lesson: null,
          publishDate: newMaterialForm.publishDate,
          deadline: newMaterialForm.deadline,
          questions: newMaterialForm.questions.map(q => ({
            questionText: q.questionText.trim(),
            points: q.points || 0,
            options: q.options.map(o => ({
              optionText: o.optionText.trim(),
              isCorrect: o.isCorrect
            }))
          }))
        };

        await createQuiz(payload);
        await api.reload();
        showToast('Đã tạo bài trắc nghiệm thành công!');
      } else if (newMaterialForm.inputType === 'link') {
        if (!newMaterialForm.linkUrl) {
          showToast('Vui lòng nhập đường dẫn liên kết', 'info');
          setIsUploading(false);
          return;
        }

        const ytId = getYouTubeVideoId(newMaterialForm.linkUrl);
        const autoType = ytId ? 'video' : newMaterialForm.type;

        const payload = {
          title: newMaterialForm.title || 'Liên kết học liệu',
          description: serializeMaterialDesc({
            desc: newMaterialForm.description,
            publishDate: newMaterialForm.publishDate,
            deadline: newMaterialForm.deadline,
            distributeMode: newMaterialForm.distributeMode,
            groups: newMaterialForm.groups,
            comments: newMaterialForm.comments,
          }),
          type: autoType,
          fileSize: 'Liên kết',
          url: newMaterialForm.linkUrl,
          chapter: compoundChapter,
          lesson: null,
        };
        await api.addMaterial(payload);
        showToast('Đã thêm liên kết học liệu thành công!');
      } else {
        const filesToUpload = (newMaterialForm.files && newMaterialForm.files.length > 0)
          ? newMaterialForm.files
          : [{ fileObj: newMaterialForm.fileObj, fileName: newMaterialForm.fileName, fileSize: newMaterialForm.fileSize, type: newMaterialForm.type }];

        if (!filesToUpload[0].fileObj && !filesToUpload[0].fileName) {
          showToast('Vui lòng chọn ít nhất 1 tệp', 'info');
          setIsUploading(false);
          return;
        }

        for (let i = 0; i < filesToUpload.length; i++) {
          const fileData = filesToUpload[i];
          let finalUrl = '#';
          let finalFileSize = fileData.fileSize;
          if (fileData.fileObj) {
            const uploadResult = await api.uploadFile(fileData.fileObj);
            finalUrl = uploadResult.url;
            finalFileSize = `${(uploadResult.size / (1024 * 1024)).toFixed(1)} MB`;
          }

          const itemTitle = filesToUpload.length > 1
            ? (newMaterialForm.title ? `${newMaterialForm.title} - ${fileData.fileName}` : fileData.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '))
            : newMaterialForm.title;

          const payload = {
            title: itemTitle,
            description: serializeMaterialDesc({
              desc: newMaterialForm.description,
              publishDate: newMaterialForm.publishDate,
              deadline: newMaterialForm.deadline,
              distributeMode: newMaterialForm.distributeMode,
              groups: newMaterialForm.groups,
              comments: newMaterialForm.comments,
            }),
            type: fileData.type || newMaterialForm.type,
            fileSize: finalFileSize,
            url: finalUrl !== '#' ? finalUrl : (fileData.fileName ? `#file:${fileData.fileName}` : '#'),
            chapter: compoundChapter,
            lesson: null,
          };
          await api.addMaterial(payload);
        }
        showToast(`Đã tải lên thành công ${filesToUpload.length} học liệu!`);
      }

      setIsAddMaterialModalOpen(false);
      setHasSubmitAttempted(false);
      setNewMaterialForm({
        title: '', description: '', type: 'image', fileName: '', fileSize: '', fileObj: null, files: [],
        publishDate: new Date().toISOString().split('T')[0],
        deadline: '', distributeMode: 'all', numGroups: 2, groups: [], comments: [],
        subject: newMaterialForm.subject,
        chapter: '',
        inputType: 'file',
        linkUrl: '',
        timeLimit: '',
        maxAttempts: 1,
        questions: [
          {
            questionText: '',
            points: 2,
            options: [
              { optionText: '', isCorrect: true },
              { optionText: '', isCorrect: false },
              { optionText: '', isCorrect: false },
              { optionText: '', isCorrect: false }
            ]
          }
        ]
      });
    } catch (err) {
      showToast(err.message || 'Lưu học liệu thất bại.', 'info');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateMaterial = async (e) => {
    e.preventDefault();
    setHasSubmitAttempted(true);
    if (!editMaterialForm.title) { showToast('Vui lòng nhập tên bài học', 'info'); return; }
    if (!editMaterialForm.subject) { showToast('Vui lòng chọn hoặc tạo Môn học', 'info'); return; }
    if (!editMaterialForm.chapter) { showToast('Vui lòng chọn hoặc tạo Chương (Chapter)', 'error'); return; }
    if (!editMaterialForm.description?.trim()) { showToast('Vui lòng nhập Yêu cầu / Mô tả', 'error'); return; }
    if (!editMaterialForm.deadline) { showToast('Vui lòng chọn Hạn hoàn thành', 'error'); return; }
    if (editMaterialForm.deadline && new Date(editMaterialForm.deadline) < new Date(editMaterialForm.publishDate)) {
      showToast('Hạn hoàn thành không được trước Ngày phát hành!', 'error');
      return;
    }
    if (editMaterialForm.inputType === 'link' && !editMaterialForm.linkUrl) {
      showToast('Vui lòng nhập đường dẫn liên kết!', 'error');
      return;
    }
    if (editMaterialForm.inputType === 'quiz') {
      const hasEmptyQuestion = editMaterialForm.questions.some(q => !q.questionText?.trim());
      const hasEmptyOption = editMaterialForm.questions.some(q => q.options.some(o => !o.optionText?.trim()));
      if (hasEmptyQuestion || hasEmptyOption) {
        showToast('Vui lòng nhập đầy đủ nội dung câu hỏi và các lựa chọn!', 'error');
        return;
      }
    }
    setIsUploading(true);
    const selectedCleanChapter = editMaterialForm.chapter.trim().toLowerCase();
    const existingMat = (materials || []).find(m => m.chapter && extractChapterName(m.chapter).trim().toLowerCase() === selectedCleanChapter);
    const compoundChapter = existingMat ? existingMat.chapter : `${editMaterialForm.subject} ÷ ${editMaterialForm.chapter}`;
    try {
      if (editMaterialForm.inputType === 'quiz') {
        const material = materials.find(m => m.id === editingMaterialId);
        const quizId = material.url;

        const payload = {
          title: editMaterialForm.title.trim(),
          description: editMaterialForm.description?.trim() || '',
          timeLimit: editMaterialForm.timeLimit ? parseInt(editMaterialForm.timeLimit) : null,
          maxAttempts: editMaterialForm.maxAttempts || 1,
          publishDate: editMaterialForm.publishDate,
          deadline: editMaterialForm.deadline,
          questions: editMaterialForm.questions.map(q => ({
            questionText: q.questionText.trim(),
            points: q.points || 0,
            options: q.options.map(o => ({
              optionText: o.optionText.trim(),
              isCorrect: o.isCorrect
            }))
          }))
        };

        await updateQuiz(quizId, payload);
        await api.reload();
        showToast('Cập nhật bài trắc nghiệm thành công!');
      } else if (editMaterialForm.inputType === 'link') {
        if (!editMaterialForm.linkUrl) {
          showToast('Vui lòng nhập đường dẫn liên kết', 'info');
          setIsUploading(false);
          return;
        }

        const ytId = getYouTubeVideoId(editMaterialForm.linkUrl);
        const autoType = ytId ? 'video' : editMaterialForm.type;

        const payload = {
          title: editMaterialForm.title,
          description: serializeMaterialDesc({
            desc: editMaterialForm.description,
            publishDate: editMaterialForm.publishDate,
            deadline: editMaterialForm.deadline,
            distributeMode: editMaterialForm.distributeMode,
            groups: editMaterialForm.groups,
            comments: editMaterialForm.comments,
          }),
          type: autoType,
          fileSize: 'Liên kết',
          url: editMaterialForm.linkUrl,
          chapter: compoundChapter,
          lesson: null,
        };
        await api.updateMaterial(editingMaterialId, payload);
        showToast('Cập nhật học liệu thành công!');
      } else {
        const newFiles = editMaterialForm.files || [];

        if (newFiles.length > 0) {
          // Upload first new file as replacement for current material
          const firstFile = newFiles[0];
          let finalUrl = '#';
          let finalFileSize = firstFile.fileSize;
          const uploadResult = await api.uploadFile(firstFile.fileObj);
          finalUrl = uploadResult.url;
          finalFileSize = `${(uploadResult.size / (1024 * 1024)).toFixed(1)} MB`;

          const payload = {
            title: editMaterialForm.title,
            description: serializeMaterialDesc({
              desc: editMaterialForm.description,
              publishDate: editMaterialForm.publishDate,
              deadline: editMaterialForm.deadline,
              distributeMode: editMaterialForm.distributeMode,
              groups: editMaterialForm.groups,
              comments: editMaterialForm.comments,
            }),
            type: firstFile.type || editMaterialForm.type,
            fileSize: finalFileSize,
            url: finalUrl,
            chapter: compoundChapter,
            lesson: null,
          };
          await api.updateMaterial(editingMaterialId, payload);

          // Upload remaining new files as NEW separate materials
          for (let i = 1; i < newFiles.length; i++) {
            const fileData = newFiles[i];
            const uploadRes = await api.uploadFile(fileData.fileObj);
            const extraPayload = {
              title: `${editMaterialForm.title} - ${fileData.fileName}`,
              description: serializeMaterialDesc({
                desc: editMaterialForm.description,
                publishDate: editMaterialForm.publishDate,
                deadline: editMaterialForm.deadline,
                distributeMode: editMaterialForm.distributeMode,
                groups: editMaterialForm.groups,
                comments: [],
              }),
              type: fileData.type || editMaterialForm.type,
              fileSize: `${(uploadRes.size / (1024 * 1024)).toFixed(1)} MB`,
              url: uploadRes.url,
              chapter: compoundChapter,
              lesson: null,
            };
            await api.addMaterial(extraPayload);
          }

          showToast(`Cập nhật thành công! ${newFiles.length > 1 ? `Đã thêm ${newFiles.length - 1} học liệu phụ.` : ''}`);
        } else {
          // No new files — just update metadata
          let finalUrl = editMaterialForm.fileName ? `#file:${editMaterialForm.fileName}` : '#';
          if (editMaterialForm.fileName && !editMaterialForm.fileName.startsWith('#file:') && (editMaterialForm.fileName.startsWith('http') || editMaterialForm.fileName.startsWith('/'))) {
            finalUrl = editMaterialForm.fileName;
          }

          let finalFileSize = editMaterialForm.fileSize;

          const payload = {
            title: editMaterialForm.title,
            description: serializeMaterialDesc({
              desc: editMaterialForm.description,
              publishDate: editMaterialForm.publishDate,
              deadline: editMaterialForm.deadline,
              distributeMode: editMaterialForm.distributeMode,
              groups: editMaterialForm.groups,
              comments: editMaterialForm.comments,
            }),
            type: editMaterialForm.type,
            fileSize: finalFileSize,
            url: finalUrl,
            chapter: compoundChapter,
            lesson: null,
          };
          await api.updateMaterial(editingMaterialId, payload);
          showToast('Cập nhật học liệu thành công!');
        }
      }

      setEditingMaterialId(null);
    } catch (err) {
      showToast(err.message || 'Lưu học liệu thất bại.', 'info');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = async (id) => {
    const material = materials.find(m => m.id === id);
    const isQuiz = material && material.type === 'quiz';

    if (isQuiz) {
      const quizId = (material?.url && material.url !== '#') ? material.url : id;
      let attemptsCount = 0;

      if (editingMaterialId === id && editMaterialForm.attempts) {
        attemptsCount = editMaterialForm.attempts.length;
      } else if (quizId) {
        try {
          const attemptsData = await getQuizAttempts(quizId);
          attemptsCount = attemptsData ? attemptsData.length : 0;
        } catch (err) {
          console.error("Lỗi khi kiểm tra lượt làm trắc nghiệm:", err);
        }
      }

      if (attemptsCount > 0) {
        showToast('Không thể xóa bài trắc nghiệm này vì đã có sinh viên làm bài!', 'error');
        return false;
      }
    }

    if (!window.confirm(isQuiz ? 'Bạn có chắc chắn muốn xóa bài trắc nghiệm này? Thao tác này không thể hoàn tác.' : 'Bạn có chắc chắn muốn xóa học liệu này? Thao tác này không thể hoàn tác.')) return false;

    try {
      if (isQuiz) {
        const quizId = (material?.url && material.url !== '#') ? material.url : id;
        await deleteQuiz(quizId);
        await api.reload();
      } else {
        await api.removeMaterial(id);
      }
      showToast('Đã xóa thành công.');
      return true;
    } catch (err) {
      showToast(err.message || 'Xóa thất bại.', 'error');
      return false;
    }
  };

  const handleAddQuestion = (isEdit = false) => {
    const defaultQuestion = {
      questionText: '',
      points: 2,
      options: [
        { optionText: '', isCorrect: true },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false }
      ]
    };
    if (isEdit) {
      setEditMaterialForm(prev => ({
        ...prev,
        questions: [...(prev.questions || []), defaultQuestion]
      }));
    } else {
      setNewMaterialForm(prev => ({
        ...prev,
        questions: [...(prev.questions || []), defaultQuestion]
      }));
    }
  };

  const handleRemoveQuestion = (idx, isEdit = false) => {
    if (isEdit) {
      setQuestionToDeleteIdx(idx);
    } else {
      const q = [...(newMaterialForm.questions || [])];
      q.splice(idx, 1);
      setNewMaterialForm(prev => ({ ...prev, questions: q }));
    }
  };

  const handleUpdateQuestionField = (qIdx, field, val, isEdit = false) => {
    if (isEdit) {
      const q = [...(editMaterialForm.questions || [])];
      q[qIdx] = { ...q[qIdx], [field]: val };
      setEditMaterialForm(prev => ({ ...prev, questions: q }));
    } else {
      const q = [...(newMaterialForm.questions || [])];
      q[qIdx] = { ...q[qIdx], [field]: val };
      setNewMaterialForm(prev => ({ ...prev, questions: q }));
    }
  };

  const handleUpdateOption = (qIdx, oIdx, field, val, isEdit = false) => {
    if (isEdit) {
      const q = [...(editMaterialForm.questions || [])];
      const opts = [...q[qIdx].options];
      if (field === 'isCorrect') {
        opts[oIdx] = { ...opts[oIdx], isCorrect: val };
      } else {
        opts[oIdx] = { ...opts[oIdx], [field]: val };
      }
      q[qIdx].options = opts;
      setEditMaterialForm(prev => ({ ...prev, questions: q }));
    } else {
      const q = [...(newMaterialForm.questions || [])];
      const opts = [...q[qIdx].options];
      if (field === 'isCorrect') {
        opts[oIdx] = { ...opts[oIdx], isCorrect: val };
      } else {
        opts[oIdx] = { ...opts[oIdx], [field]: val };
      }
      q[qIdx].options = opts;
      setNewMaterialForm(prev => ({ ...prev, questions: q }));
    }
  };

  const renderQuizBuilder = (formState, setFormState, isEdit = false) => {
    const questions = formState.questions || [];
    return (
      <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, padding: 16, marginTop: 16, textAlign: 'left' }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          Thiết lập Câu hỏi Trắc nghiệm
        </h4>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Thời gian làm bài (Phút)</label>
            <input
              type="number"
              className={styles.input}
              placeholder="VD: 15 (để trống nếu không giới hạn)"
              value={formState.timeLimit || ''}
              onChange={(e) => setFormState({ ...formState, timeLimit: e.target.value ? parseInt(e.target.value) : '' })}
              min={1}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Số lượt làm bài tối đa</label>
            <input
              type="number"
              className={styles.input}
              value={formState.maxAttempts || 1}
              onChange={(e) => setFormState({ ...formState, maxAttempts: parseInt(e.target.value) || 1 })}
              min={1}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {questions.map((q, qIdx) => (
            <div key={qIdx} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: 12, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', textTransform: 'uppercase' }}>Câu hỏi {qIdx + 1}</span>
                {!isEdit && questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx, isEdit)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <Trash2 size={12} /> Xóa
                  </button>
                )}
              </div>

              <div className={styles.field} style={{ marginBottom: 10 }}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Nhập nội dung câu hỏi..."
                  value={q.questionText}
                  onChange={(e) => handleUpdateQuestionField(qIdx, 'questionText', e.target.value, isEdit)}
                  style={{ borderColor: hasSubmitAttempted && !q.questionText?.trim() ? '#ef4444' : undefined }}
                />
                {hasSubmitAttempted && !q.questionText?.trim() && (
                  <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>Vui lòng nhập nội dung câu hỏi.</p>
                )}
              </div>

              <div style={{ marginBottom: 12, fontSize: 11, fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '6px 12px', borderRadius: 6, display: 'inline-block' }}>
                Điểm số: {questions.length > 0 ? (10 / questions.length).toFixed(2) : 0}đ
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 2 }}>Các lựa chọn (Tích chọn tất cả các đáp án đúng):</label>
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={opt.isCorrect}
                        onChange={(e) => handleUpdateOption(qIdx, oIdx, 'isCorrect', e.target.checked, isEdit)}
                        style={{ cursor: 'pointer', accentColor: '#059669' }}
                      />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder={`Lựa chọn ${String.fromCharCode(65 + oIdx)}...`}
                        value={opt.optionText}
                        onChange={(e) => handleUpdateOption(qIdx, oIdx, 'optionText', e.target.value, isEdit)}
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          borderColor: hasSubmitAttempted && !opt.optionText?.trim() ? '#ef4444' : undefined
                        }}
                      />
                    </div>
                    {hasSubmitAttempted && !opt.optionText?.trim() && (
                      <p style={{ color: '#ef4444', fontSize: 11, marginLeft: 34, marginTop: 2 }}>Vui lòng nhập lựa chọn này.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!isEdit && (
          <button
            type="button"
            onClick={() => handleAddQuestion(isEdit)}
            style={{
              marginTop: 14, width: '100%', padding: '8px', border: '1px dashed #059669',
              background: '#fff', color: '#059669', borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <Plus size={14} /> Thêm câu hỏi mới
          </button>
        )}
      </div>
    );
  };

  
  const handleRenameChapter = async (oldName) => {
    if (!newChapterName.trim()) return;
    setIsRenaming(true);
    try {
      const list = groupedByChapter[oldName] || [];
      const firstMat = list[0];
      const subjectPart = extractSubjectName(firstMat?.chapter || '');
      const newCompound = `${subjectPart} ÷ ${newChapterName.trim()}`;
      
      await Promise.all(list.map(m => api.updateMaterial(m.id, {
        title: m.title,
        description: m.description,
        type: m.type,
        url: m.url,
        fileSize: m.fileSize,
        lesson: m.lesson,
        chapter: newCompound 
      })));
      
      showToast('Đã đổi tên chương thành công!');
      setRenamingChapter(null);
      fetchMaterials();
    } catch (e) {
      showToast(e.message || 'Lỗi khi đổi tên chương', 'error');
    } finally {
      setIsRenaming(false);
    }
  };

  const toggleChapter = (chKey) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chKey]: !prev[chKey]
    }));
  };

  if (classesLoading || workspaceLoading) {
    return <p className={styles.loading}>Đang tải dữ liệu từ database...</p>;
  }

  return (
    <div className={styles.root}>
      {toast && (
        <div className={styles.toast}>
          <Check size={16} /> {toast.message}
        </div>
      )}

      {classesError && (
        <p className={styles.loading} style={{ color: '#b91c1c' }}>
          {classesError}
        </p>
      )}

      {selectedClassId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Row 1: Search input */}
          <div className={styles.searchFilterBar}>
            <div className={styles.searchFilterInputWrap}>
              <Search size={16} className={styles.searchFilterIcon} />
              <input
                type="text"
                placeholder="Tìm kiếm tên bài học, mô tả..."
                className={styles.searchFilterInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute', right: 10, background: 'none', border: 'none',
                    cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Filter chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {/* Label */}
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lọc:
            </span>

            {/* Type filters */}
            {[
              { key: 'all', label: 'Tất cả loại' },
              { key: 'video', label: '🎬 Video' },
              { key: 'image', label: '🖼️ Ảnh' },



            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterType(key)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1.5px solid ${filterType === key ? '#059669' : '#cbd5e1'}`,
                  background: filterType === key ? '#ecfdf5' : '#fff',
                  color: filterType === key ? '#047857' : '#475569',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}

            {/* Divider */}
            <span style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

            {/* Clear all filters */}
            {(filterType !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => { setFilterType('all'); setSearchQuery(''); }}
                style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', border: '1.5px solid #fca5a5',
                  background: '#fef2f2', color: '#b91c1c', marginLeft: 4, transition: 'all 0.15s',
                }}
              >
                ✕ Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      )}

      <div className={styles.panel}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 className={styles.panelTitle} style={{ margin: 0 }}>Lộ trình Tài liệu lớp học</h3>
            <button
              type="button"
              className={styles.btnEmerald}
              style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}
              onClick={() => {
                if (!selectedClassId || selectedClassId === 'all') {
                  showToast('Vui lòng chọn một lớp học cụ thể trước khi đăng tải học liệu!', 'error');
                  return;
                }
                const activeClass = classrooms?.find(c => c.id === selectedClassId);
                const activeClassName = activeClass ? (activeClass.courseCode || activeClass.id) : '';
                if (!activeClassName || activeClassName.trim() === '') {
                  showToast('Lớp học này chưa được gán môn học xác định. Vui lòng kiểm tra lại!', 'error');
                  return;
                }
                setNewMaterialForm(prev => ({ ...prev, subject: activeClassName }));
                setIsAddMaterialModalOpen(true);
              }}
            >
              <Plus size={16} /> Đăng tải học liệu mới
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className={styles.chaptersList}>
              {sortedChapters.map((chName, chIdx) => {
                const list = groupedByChapter[chName] || [];
                const chKey = chName;
                const isExpanded = !!expandedChapters[chKey];

                return (
                  <div key={chName} className={styles.chapterCard}>
                    <div className={styles.chapterInner}>
                      <div
                        className={`${styles.chapterHeader} ${isExpanded ? styles.chapterHeaderExpanded : ''}`}
                        onClick={() => toggleChapter(chKey)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={styles.chapterHeaderLeft}>
                          <span className={styles.chapterIndex}>{chIdx + 1}</span>
                          <BookOpen size={14} color="#059669" />
                          {renamingChapter === chName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                              <input 
                                autoFocus
                                value={newChapterName} 
                                onChange={e => setNewChapterName(e.target.value)}
                                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', outline: 'none', width: '200px' }}
                                onKeyDown={e => { if (e.key === 'Enter') handleRenameChapter(chName); else if (e.key === 'Escape') setRenamingChapter(null); }}
                              />
                              <button onClick={() => handleRenameChapter(chName)} disabled={isRenaming} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}><Check size={14} /></button>
                              <button onClick={() => setRenamingChapter(null)} disabled={isRenaming} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}><X size={14} /></button>
                            </div>
                          ) : (
                            <span className={styles.chapterTitle}>{chName}</span>
                          )}
                          {renamingChapter !== chName && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setRenamingChapter(chName); setNewChapterName(chName); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 4 }}
                              title="Đổi tên chương"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          <span className={styles.materialsCount}>{list.length} bài học</span>
                        </div>
                        <ChevronRight
                          size={16}
                          color="#059669"
                          style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            flexShrink: 0,
                          }}
                        />
                      </div>

                      {isExpanded && (
                        <div className={styles.chapterBody}>
                          <div className={styles.materialsGrid}>
                            {list.map((m) => {
                              const meta = parseMaterialDesc(m.description);
                              const commentsCount = meta.comments?.length || 0;
                              const typeBadge = {
                                video: { label: '🎬 Video', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                                image: { label: '🖼️ Ảnh', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
                                pdf: { label: '📄 PDF', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
                                document: { label: 'Tài liệu', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
                                quiz: { label: 'Quiz', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
                              }[m.type] || { label: '📎 File', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };

                              return (
                                <div
                                  key={m.id}
                                  className={`${styles.materialCard} ${m.isDisabled ? styles.disabledCard : ''}`}
                                  data-type={m.type}
                                >
                                  <div className={styles.materialIconArea}>
                                    {renderFileIcon(m.type)}
                                  </div>
                                  <div className={styles.materialContent}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                                          <h5 className={styles.materialTitle} style={{ flex: 'none', maxWidth: '100%' }}>
                                            {m.title}
                                          </h5>
                                          <span style={{
                                            fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 6,
                                            color: typeBadge.color, background: typeBadge.bg, border: `1px solid ${typeBadge.border}`,
                                            flexShrink: 0,
                                          }}>
                                            {typeBadge.label}
                                          </span>
                                          {m.isDisabled && <span className={styles.disabledTag}>Đã VH</span>}
                                        </div>
                                        <p className={styles.materialDesc}>
                                          {meta.desc || 'Chưa có mô tả.'}
                                        </p>
                                        {(meta.publishDate || meta.deadline || m.fileSize || commentsCount > 0) && (
                                          <div className={styles.materialMetaGrid}>
                                            {meta.publishDate && <span>📅 Mở: {meta.publishDate}</span>}
                                            {meta.deadline && <span>⏰ Hạn: {meta.deadline}</span>}
                                            {m.fileSize && <span>{['Quiz', 'Tài liệu'].includes(m.fileSize) ? m.fileSize : `💾 ${m.fileSize}`}</span>}
                                            {commentsCount > 0 && <span>💬 {commentsCount} ghi chú</span>}
                                          </div>
                                        )}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                        <button
                                          type="button"
                                          className={styles.editBtn}
                                          style={{
                                            color: m.completedByUsers?.length > 0 && users.length > 0 ? '#10b981' : '#cbd5e1',
                                            borderColor: m.completedByUsers?.length > 0 && users.length > 0 ? '#a7f3d0' : '#e2e8f0',
                                            background: m.completedByUsers?.length > 0 && users.length > 0 ? '#ecfdf5' : '#fff',
                                            cursor: m.completedByUsers?.length > 0 && users.length > 0 ? 'default' : 'pointer'
                                          }}
                                          title={m.completedByUsers?.length > 0 && users.length > 0 ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (m.completedByUsers?.length > 0 && users.length > 0) return;
                                            if (window.confirm(`Đánh dấu hoàn thành bài học "${m.title}" cho toàn bộ học sinh?`)) {
                                              try {
                                                await api.completeMaterialAll(m.id);
                                                showToast('Đã đánh dấu hoàn thành!');
                                              } catch (err) {
                                                showToast(err.message || 'Lỗi khi đánh dấu', 'info');
                                              }
                                            }
                                          }}
                                        >
                                          <CheckCircle size={13} strokeWidth={2.5} />
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.editBtn}
                                          onClick={() => handleEditMaterialStart(m)}
                                          title="Chỉnh sửa"
                                        >
                                          <Pencil size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>


            {sortedChapters.length === 0 && (
              <div className={styles.emptyBox}>Chưa có tài liệu học tập nào trong lớp học này.</div>
            )}
          </div>
        </div>
      </div>

      {isAddMaterialModalOpen && (
        <div 
          onClick={() => { setIsAddMaterialModalOpen(false); setHasSubmitAttempted(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(248, 250, 252, 0.4)', zIndex: 9998 }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '600px', 
              background: '#ffffff', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', 
              zIndex: 9999, display: 'flex', flexDirection: 'column',
              animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderLeft: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                <div style={{ padding: 8, background: '#d1fae5', borderRadius: 8, color: '#059669', display: 'flex' }}><Upload size={20} /></div>
                Đăng tải Học liệu Mới
              </h3>
              <button type="button" onClick={() => { setIsAddMaterialModalOpen(false); setHasSubmitAttempted(false); }} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <form onSubmit={handleAddMaterial}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div className={styles.field} style={{ flex: 1, margin: 0 }}>
                  <label>Lớp học</label>
                  <input
                    className={styles.input}
                    value={selectedClassId || 'Không xác định'}
                    disabled
                    style={{ background: '#f1f5f9', color: '#334155', fontWeight: 600, cursor: 'not-allowed', border: '1.5px solid #e2e8f0' }}
                  />
                </div>
                <div className={styles.field} style={{ flex: 1.5, margin: 0 }}>
                  <label>Môn học</label>
                  <div style={{ position: 'relative' }}>
                    <Award size={14} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      className={styles.input}
                      value={newMaterialForm.subject || 'Không xác định'}
                      disabled
                      style={{ paddingLeft: 34, background: '#f1f5f9', color: '#334155', fontWeight: 600, cursor: 'not-allowed', border: '1.5px solid #e2e8f0' }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.field}>
                <label>Chương (Chapter) &nbsp;<span style={{ color: '#ef4444' }}>*</span></label>
                <GenericDropdown
                  value={newMaterialForm.chapter}
                  onChange={(ch) => setNewMaterialForm({ ...newMaterialForm, chapter: ch })}
                  existingItems={existingChaptersForSubject}
                  hasError={hasSubmitAttempted && !newMaterialForm.chapter}
                  placeholder={newMaterialForm.subject ? 'Chọn hoặc tạo chương...' : 'Chọn môn học trước...'}
                  icon={BookOpen}
                  color="#059669"
                  emptyText="Chưa có chương nào trong lớp này."
                />
              </div>

              <div className={styles.field}>
                <label>Tên bài học &nbsp;<span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  className={styles.input}
                  value={newMaterialForm.title}
                  onChange={(e) => setNewMaterialForm({ ...newMaterialForm, title: e.target.value })}
                  placeholder="VD: Bài 1 - Giới thiệu Agile Scrum..."
                  style={{ borderColor: hasSubmitAttempted && !newMaterialForm.title?.trim() ? '#ef4444' : undefined }}
                />
                {hasSubmitAttempted && !newMaterialForm.title?.trim() && (
                  <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>Vui lòng nhập tên bài học.</p>
                )}
              </div>

              <div className={styles.field}>
                <label>Yêu cầu / Mô tả</label>
                <textarea className={styles.textarea} rows={2} value={newMaterialForm.description}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, description: e.target.value })}
                    style={{ borderColor: hasSubmitAttempted && !newMaterialForm.description?.trim() ? '#ef4444' : undefined }} />
                  {hasSubmitAttempted && !newMaterialForm.description?.trim() && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>Vui lòng nhập yêu cầu/mô tả.</p>}
              </div>
              <div className={styles.row2}>
                <div className={styles.field} style={{ width: '100%' }}>
                  <label>Ngày phát hành</label>
                  <input type="date" className={styles.input} value={newMaterialForm.publishDate}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, publishDate: e.target.value })} />
                </div>
                <div className={styles.field} style={{ width: '100%' }}>
                  <label>Hạn hoàn thành</label>
                  <input type="date" className={styles.input} value={newMaterialForm.deadline}
                    min={newMaterialForm.publishDate}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, deadline: e.target.value })}
                    style={{ borderColor: hasSubmitAttempted && !newMaterialForm.deadline ? '#ef4444' : undefined }} />
                  {hasSubmitAttempted && !newMaterialForm.deadline && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>Bắt buộc nhập hạn hoàn thành.</p>}
                </div>
              </div>

              <div className={styles.field}>
                <label>Nội dung đính kèm</label>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: newMaterialForm.inputType === 'file' ? '#059669' : '#64748b' }}>
                    <input type="radio" name="inputType" checked={newMaterialForm.inputType === 'file'} onChange={() => setNewMaterialForm({ ...newMaterialForm, inputType: 'file', type: 'image' })} />
                    Tải tệp từ máy (Local)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: newMaterialForm.inputType === 'link' ? '#059669' : '#64748b' }}>
                    <input type="radio" name="inputType" checked={newMaterialForm.inputType === 'link'} onChange={() => setNewMaterialForm({ ...newMaterialForm, inputType: 'link', type: 'link' })} />
                    Gắn link liên kết
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: newMaterialForm.inputType === 'quiz' ? '#059669' : '#64748b' }}>
                    <input type="radio" name="inputType" checked={newMaterialForm.inputType === 'quiz'} onChange={() => setNewMaterialForm({ ...newMaterialForm, inputType: 'quiz', type: 'quiz' })} />
                    Tạo bài trắc nghiệm (Quiz)
                  </label>
                </div>
              </div>

              {newMaterialForm.inputType === 'file' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.webm,.jpg,.png,.zip,.json"
                    onChange={handleFileInputChange}
                  />

                  <div
                    className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={(e) => {
                      if (e.target.closest('button')) return;
                      handleDropZoneClick();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleDropZoneClick()}
                  >
                    {newMaterialForm.files && newMaterialForm.files.length > 0 ? (
                      <div style={{ width: '100%', padding: '10px' }} onClick={(e) => { e.stopPropagation(); handleDropZoneClick(); }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                          {newMaterialForm.files.map((f, idx) => (
                            <div key={idx} style={{ position: 'relative', width: 80, height: 80, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                              {f.type === 'video' || f.fileName.match(/\.(mp4|webm|ogg)$/i) ? (
                                <Film size={28} color="#3b82f6" />
                              ) : f.fileName.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                <img src={f.previewUrl} alt={f.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                renderFileIcon(f.type)
                              )}
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, padding: '2px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                                {f.fileName}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newFiles = [...newMaterialForm.files];
                                  newFiles.splice(idx, 1);
                                  setNewMaterialForm({ ...newMaterialForm, files: newFiles });
                                }}
                                style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 12, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                          Đã chọn {newMaterialForm.files.length} tệp (Nhấn để thêm tiếp)
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.dropZoneIcon}><Upload size={32} /></div>
                        <p className={styles.dropZoneText}>Nhấn hoặc kéo thả tệp vào đây</p>
                        <p className={styles.dropZoneSubtext}>Hỗ trợ Hình ảnh (Max 50MB)</p>
                      </>
                    )}
                  </div>
                </>
              )}

              {newMaterialForm.inputType === 'link' && (
                <div className={styles.field} style={{ background: '#f8fafc', padding: '16px', borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 16 }}>
                  <label>Đường dẫn liên kết (URL)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="url"
                      className={styles.input}
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={newMaterialForm.linkUrl}
                      onChange={(e) => setNewMaterialForm({ ...newMaterialForm, linkUrl: e.target.value })}
                    />
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}
                      onClick={async () => {
                        if (!newMaterialForm.linkUrl) {
                          showToast('Vui lòng nhập đường dẫn trước', 'info');
                          return;
                        }
                        const info = await fetchYouTubeInfo(newMaterialForm.linkUrl);
                        if (info && info.title) {
                          setNewMaterialForm({ ...newMaterialForm, title: info.title, type: 'video' });
                          showToast('Đã lấy thông tin thành công!');
                        } else {
                          showToast('Không lấy được tiêu đề từ liên kết này', 'info');
                        }
                      }}
                    >
                      Lấy thông tin
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>* Hỗ trợ tự động lấy tiêu đề Video từ YouTube.</p>
                </div>
              )}

              {newMaterialForm.inputType === 'quiz' && (
                renderQuizBuilder(newMaterialForm, setNewMaterialForm, false)
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button type="submit" className={styles.btnPrimary} disabled={isUploading} style={{ flex: 1 }}>
                  {isUploading ? 'Đang tải lên...' : 'Lưu học liệu & Phát hành'}
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ flex: 1 }}
                  onClick={() => setIsAddMaterialModalOpen(false)}
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      )}

      {editingMaterialId && (
        <div className={styles.modalOverlay} onClick={handleCancelEdit} style={{ zIndex: 9999 }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{
            maxWidth: editMaterialForm.fileName ? 1140 : 540,
            width: '95%',
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: editMaterialForm.fileName ? '88vh' : 'auto',
            maxHeight: '90vh',
            borderRadius: 16
          }}>
            <div className={styles.modalHeader} style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: '#0f172a' }}>
                <BookOpen size={18} color="#059669" /> Chi tiết & Xem Học liệu
              </h3>
              <button type="button" className={styles.iconBtn} onClick={handleCancelEdit} style={{ background: '#f1f5f9', padding: 8, borderRadius: 50, border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'flex', flex: 1, flexDirection: 'row', overflow: 'hidden', background: '#f8fafc', padding: editMaterialForm.fileName ? 24 : 0, gap: editMaterialForm.fileName ? 24 : 0 }}>

              {/* Left Column: Preview File / Quiz Attempts */}
              {editMaterialForm.fileName && (
                editMaterialForm.type === 'quiz' ? (() => {
                  const map = {};
                  (users || []).forEach(u => {
                    if (!u.id) return;
                    const key = String(u.id).toLowerCase();
                    map[key] = {
                      studentId: u.id,
                      studentName: u.name || 'Học sinh',
                      email: u.email || '',
                      attempts: []
                    };
                  });

                  (editMaterialForm.attempts || []).forEach(att => {
                    const sId = att.studentId ? String(att.studentId).toLowerCase() : null;
                    const sName = att.studentFullName ? String(att.studentFullName).toLowerCase().trim() : null;

                    let targetKey = null;
                    if (sId && map[sId]) {
                      targetKey = sId;
                    } else if (sName) {
                      targetKey = Object.keys(map).find(k => map[k].studentName && map[k].studentName.toLowerCase().trim() === sName);
                    }

                    if (targetKey && map[targetKey]) {
                      map[targetKey].attempts.push(att);
                    } else {
                      const newKey = sId || sName || Math.random().toString();
                      map[newKey] = {
                        studentId: att.studentId || '',
                        studentName: att.studentFullName || 'Học sinh',
                        email: '',
                        attempts: [att]
                      };
                    }
                  });

                  const studentList = Object.values(map);
                  const completedCount = studentList.filter(s => s.attempts.length > 0).length;
                  const totalAttemptsCount = editMaterialForm.attempts?.length || 0;

                  return (
                    <div style={{ flex: 1.5, background: '#fff', borderRadius: 16, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 400, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={16} color="#059669" /> Kết quả & Lịch sử làm bài
                        </h4>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={handleRefreshAttempts}
                            disabled={isRefreshingAttempts}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                              color: '#0f766e', background: '#e6f4ea', border: '1px solid #a3cfbb',
                              cursor: isRefreshingAttempts ? 'wait' : 'pointer', transition: 'all 0.15s'
                            }}
                            title="Tải lại danh sách làm bài mới nhất"
                          >
                            <RefreshCw size={12} style={{ animation: isRefreshingAttempts ? 'spin 1s linear infinite' : 'none' }} />
                            {isRefreshingAttempts ? 'Đang tải...' : 'Tải lại'}
                          </button>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color: '#047857', background: '#d1fae5' }}>
                            {completedCount}/{studentList.length || (users ? users.length : 0)} sinh viên đã làm
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color: '#4338ca', background: '#e0e7ff' }}>
                            {totalAttemptsCount} lượt nộp
                          </span>
                        </div>
                      </div>

                      <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#fff' }}>
                        {studentList.length === 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', padding: '40px 0', minHeight: 250 }}>
                            <Users size={36} style={{ marginBottom: 8, color: '#cbd5e1' }} />
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>Chưa có sinh viên nào trong lớp này</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {studentList.map((st) => {
                              const hasAttempts = st.attempts.length > 0;
                              const validScores = st.attempts.map(a => a.totalScore).filter(sc => sc != null);
                              const maxScore = validScores.length > 0 ? Math.max(...validScores) : null;
                              return (
                                <div key={st.studentId || st.studentName} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', background: hasAttempts ? '#f8fafc' : '#fff' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{st.studentName}</span>
                                      {st.studentId && <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>({st.studentId})</span>}
                                    </div>
                                    <div>
                                      {hasAttempts ? (
                                        <span style={{ fontSize: 11, fontWeight: 800, color: maxScore >= 5 ? '#047857' : '#dc2626', background: maxScore >= 5 ? '#ecfdf5' : '#fef2f2', padding: '3px 8px', borderRadius: 6, border: `1px solid ${maxScore >= 5 ? '#a7f3d0' : '#fecaca'}` }}>
                                          Điểm cao nhất: {maxScore}đ ({st.attempts.length} lượt)
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
                                          Chưa làm bài
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {hasAttempts && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, borderTop: '1px dashed #e2e8f0', paddingTop: 8 }}>
                                      {st.attempts.map((att, idx) => (
                                        <div key={att.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '6px 10px', background: '#fff', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                                          <span style={{ fontWeight: 600, color: '#334155' }}>Lượt #{att.attemptNumber || (idx + 1)}</span>
                                          <span style={{ fontWeight: 800, color: att.totalScore != null && att.totalScore >= 5 ? '#059669' : '#dc2626' }}>
                                            {att.totalScore != null ? `${att.totalScore} điểm` : 'Đang làm...'}
                                          </span>
                                          <span style={{ fontSize: 11, color: '#64748b' }}>
                                            {att.submittedAt ? new Date(att.submittedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'N/A'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <div style={{ flex: 1.5, background: '#0f172a', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 400, position: 'relative', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    {/* Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                        {editMaterialForm.fileName.split('/').pop()?.split('?')[0] || 'Tệp học liệu'}
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {/* Zoom controls — only for image preview */}
                        {editMaterialForm.type !== 'video' && editMaterialForm.inputType !== 'quiz' && (
                          <>
                            <button
                              type="button"
                              title="Thu nhỏ"
                              onClick={() => setPreviewZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, cursor: 'pointer', color: '#e2e8f0', flexShrink: 0 }}
                            >
                              <ZoomOut size={13} />
                            </button>
                            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, minWidth: 34, textAlign: 'center' }}>
                              {Math.round(previewZoom * 100)}%
                            </span>
                            <button
                              type="button"
                              title="Phóng to"
                              onClick={() => setPreviewZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, cursor: 'pointer', color: '#e2e8f0', flexShrink: 0 }}
                            >
                              <ZoomIn size={13} />
                              </button>
                              <button
                                type="button"
                                title="Toàn màn hình"
                                onClick={() => {
                                  const el = document.getElementById('document-preview-container');
                                  if (el) {
                                    if (document.fullscreenElement) {
                                      document.exitFullscreen();
                                    } else {
                                      el.requestFullscreen();
                                    }
                                  }
                                }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, cursor: 'pointer', color: '#e2e8f0', flexShrink: 0, marginLeft: 4 }}
                              >
                                <Maximize size={13} />
                              </button>
                            <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
                          </>
                        )}
                        {iframeError && (
                          <button
                            type="button"
                            onClick={() => setIframeError(false)}
                            style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            🔄 Thử lại
                          </button>
                        )}
                        <a
                          href={editMaterialForm.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#34d399', fontWeight: 700, textDecoration: 'none', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, padding: '6px 12px', whiteSpace: 'nowrap', flexShrink: 0, transition: '0.2s' }}
                        >
                          <ExternalLink size={12} /> Mở file
                        </a>
                      </div>
                    </div>

                    {/* Preview Body */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {editMaterialForm.inputType === 'link' ? (() => {
                        const ytId = getYouTubeVideoId(editMaterialForm.linkUrl);
                        if (ytId) {
                          return <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}`} title="YouTube video player" style={{ border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>;
                        } else {
                          return (
                            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                              <ExternalLink size={48} color="#3b82f6" style={{ marginBottom: 12 }} />
                              <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>Liên kết ngoài</p>
                              <a href={editMaterialForm.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3b82f6', fontWeight: 700, textDecoration: 'none', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '8px 18px', marginTop: 10 }}>
                                <ExternalLink size={14} /> Mở liên kết
                              </a>
                            </div>
                          );
                        }
                      })() : editMaterialForm.type === 'video' || editMaterialForm.fileName.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={editMaterialForm.fileName} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%' }} />
                      ) : editMaterialForm.fileName.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <div style={{ overflow: 'auto', width: '100%', height: '100%', display: 'flex', alignItems: previewZoom <= 1 ? 'center' : 'flex-start', justifyContent: previewZoom <= 1 ? 'center' : 'flex-start' }}>
                          <img
                            src={editMaterialForm.fileName}
                            style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top left', transition: 'transform 0.2s ease', objectFit: 'contain', display: 'block', margin: previewZoom <= 1 ? 'auto' : 0 }}
                            alt="Preview"
                          />
                        </div>
                      ) : iframeError ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                          <FileText size={48} color="#ef4444" style={{ marginBottom: 12 }} />
                          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Không thể xem trực tiếp trong trình duyệt</p>
                          <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>
                            File có thể bị CORS hoặc loại tệp không hỗ trợ inline preview.<br />
                            Nhấn để tải về hoặc mở bằng ứng dụng ngoài.
                          </p>
                          <a
                            href={editMaterialForm.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#34d399', fontWeight: 700, textDecoration: 'none', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: 8, padding: '8px 18px', marginBottom: 10 }}
                          >
                            <ExternalLink size={14} /> Tải / Mở file
                          </a>
                        </div>
                      ) : (() => {
                        const url = editMaterialForm.fileName;
                        const isCloudinary = url.includes('cloudinary.com');
                        const isPdfType = editMaterialForm.type === 'pdf' || url.match(/\.pdf($|\?)/i);
                        const isDocType = url.match(/\.(pptx?|docx?|xlsx?)($|\?)/i);

                        const getCloudinaryPdfUrl = (rawUrl) => {
                          if (rawUrl.match(/\.pdf($|\?)/i)) return rawUrl;
                          const base = rawUrl.split('?')[0];
                          return base.replace('/upload/', '/upload/fl_attachment:false/') + '.pdf';
                        };

                        if (isCloudinary && !isDocType) {
                          const pdfUrl = getCloudinaryPdfUrl(url);
                          return <iframe key={pdfUrl} src={pdfUrl} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} onError={() => setIframeError(true)} />;
                        } else if (isPdfType) {
                          return <iframe key={url} src={url} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} onError={() => setIframeError(true)} />;
                        } else {
                          return (
                            <iframe
                              key={url}
                              src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                              title="Document Preview"
                              style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                              onError={() => setIframeError(true)}
                              onLoad={(e) => {
                                try {
                                  const doc = e.target.contentDocument;
                                  if (doc && doc.body && doc.body.innerHTML.trim() === '') setIframeError(true);
                                } catch { }
                              }}
                            />
                          );
                        }
                      })()}
                    </div>
                  </div>
                )
              )}

              {/* Right Column: Form */}
              <div style={{ width: editMaterialForm.fileName ? 480 : '100%', background: '#fff', borderRadius: editMaterialForm.fileName ? 16 : 0, display: 'flex', flexDirection: 'column', zIndex: 5, border: editMaterialForm.fileName ? '1px solid #e2e8f0' : 'none', boxShadow: editMaterialForm.fileName ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  <form id="editMaterialForm" onSubmit={handleUpdateMaterial}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <div className={styles.field} style={{ flex: 1, margin: 0 }}>
                        <label>Lớp học</label>
                        <input
                          className={styles.input}
                          value={selectedClassId || 'Không xác định'}
                          disabled
                          style={{ background: '#f1f5f9', color: '#334155', fontWeight: 600, cursor: 'not-allowed', border: '1.5px solid #e2e8f0' }}
                        />
                      </div>
                      <div className={styles.field} style={{ flex: 1.5, margin: 0 }}>
                        <label>Môn học</label>
                        <div style={{ position: 'relative' }}>
                          <Award size={14} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                          <input
                            className={styles.input}
                            value={editMaterialForm.subject || 'Không xác định'}
                            disabled
                            style={{ paddingLeft: 34, background: '#f1f5f9', color: '#334155', fontWeight: 600, cursor: 'not-allowed', border: '1.5px solid #e2e8f0' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label>Chương (Chapter) &nbsp;<span style={{ color: '#ef4444' }}>*</span></label>
                      <GenericDropdown
                        value={editMaterialForm.chapter}
                        onChange={(ch) => setEditMaterialForm({ ...editMaterialForm, chapter: ch })}
                        existingItems={existingChaptersForEditSubject}
                        hasError={!editMaterialForm.chapter}
                        placeholder={editMaterialForm.subject ? 'Chọn hoặc tạo chương...' : 'Chọn môn học trước...'}
                        icon={BookOpen}
                        color="#059669"
                        emptyText="Chưa có chương nào trong lớp này."
                        disabled={true}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Tên bài học &nbsp;<span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        className={styles.input}
                        value={editMaterialForm.title}
                        onChange={(e) => setEditMaterialForm({ ...editMaterialForm, title: e.target.value })}
                        placeholder="VD: Bài 1 - Giới thiệu Agile Scrum..."
                        style={{ borderColor: hasSubmitAttempted && !editMaterialForm.title?.trim() ? '#ef4444' : undefined }}
                      />
                      {hasSubmitAttempted && !editMaterialForm.title?.trim() && (
                        <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>Vui lòng nhập tên bài học.</p>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Yêu cầu / Mô tả</label>
                      <textarea
                          className={styles.textarea}
                          rows={3}
                          value={editMaterialForm.description}
                          onChange={(e) => setEditMaterialForm({ ...editMaterialForm, description: e.target.value })}
                          placeholder="Mô tả hoặc yêu cầu của buổi học này..."
                          style={{ borderColor: hasSubmitAttempted && !editMaterialForm.description?.trim() ? '#ef4444' : undefined }}
                        />
                        {hasSubmitAttempted && !editMaterialForm.description?.trim() && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>Vui lòng nhập yêu cầu/mô tả.</p>}
                    </div>

                    <div className={styles.row2}>
                      <div className={styles.field} style={{ width: '100%' }}>
                        <label>Ngày phát hành</label>
                        <input
                          type="date"
                          className={styles.input}
                          value={editMaterialForm.publishDate}
                          disabled
                          style={{ background: '#f1f5f9', color: '#334155', fontWeight: 600, cursor: 'not-allowed', border: '1.5px solid #e2e8f0' }}
                        />
                      </div>
                      <div className={styles.field} style={{ width: '100%' }}>
                        <label>Hạn hoàn thành</label>
                        <input type="date" className={styles.input} value={editMaterialForm.deadline}
                    min={editMaterialForm.publishDate}
                    onChange={(e) => setEditMaterialForm({ ...editMaterialForm, deadline: e.target.value })}
                    style={{ borderColor: hasSubmitAttempted && !editMaterialForm.deadline ? '#ef4444' : undefined }} />
                  {hasSubmitAttempted && !editMaterialForm.deadline && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>Bắt buộc nhập hạn hoàn thành.</p>}
                      </div>
                    </div>

                    <div className={styles.field}>
                      {editMaterialForm.inputType !== 'quiz' && (
                        <>
                          <label>Nội dung đính kèm</label>
                          <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 10, marginBottom: 16 }}>
                            <button type="button" onClick={() => setEditMaterialForm({ ...editMaterialForm, inputType: 'file' })} style={{ flex: 1, padding: '8px 0', border: 'none', background: editMaterialForm.inputType === 'file' ? '#fff' : 'transparent', color: editMaterialForm.inputType === 'file' ? '#059669' : '#64748b', fontWeight: 700, fontSize: 13, borderRadius: 8, cursor: 'pointer', boxShadow: editMaterialForm.inputType === 'file' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                              Tải tệp từ máy
                            </button>
                            <button type="button" onClick={() => setEditMaterialForm({ ...editMaterialForm, inputType: 'link' })} style={{ flex: 1, padding: '8px 0', border: 'none', background: editMaterialForm.inputType === 'link' ? '#fff' : 'transparent', color: editMaterialForm.inputType === 'link' ? '#059669' : '#64748b', fontWeight: 700, fontSize: 13, borderRadius: 8, cursor: 'pointer', boxShadow: editMaterialForm.inputType === 'link' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                              Gắn link liên kết
                            </button>
                          </div>
                        </>
                      )}


                      {editMaterialForm.inputType === 'file' && (
                        <>
                          <input
                            ref={editFileInputRef}
                            type="file"
                            multiple
                            style={{ display: 'none' }}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.webm,.jpg,.png,.zip,.json"
                            onChange={handleEditFileInputChange}
                          />

                          <div
                            className={`${styles.dropZone} ${isEditDragging ? styles.dropZoneActive : ''}`}
                            onDragOver={handleEditDragOver}
                            onDragLeave={handleEditDragLeave}
                            onDrop={handleEditDrop}
                            onClick={(e) => { if (e.target.closest('button')) return; handleEditDropZoneClick(); }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleEditDropZoneClick()}
                            style={{ padding: '24px 16px', background: isEditDragging ? '#ecfdf5' : '#f0fdf4', border: `2px dashed ${isEditDragging ? '#059669' : '#86efac'}`, transition: 'all 0.2s ease', borderRadius: 12 }}
                          >
                            {editMaterialForm.files && editMaterialForm.files.length > 0 ? (
                              <div style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
                                  {editMaterialForm.files.map((f, idx) => (
                                    <div key={idx} style={{ position: 'relative', width: 72, height: 72, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                                      {f.type === 'video' || f.fileName.match(/\.(mp4|webm|ogg)$/i) ? (
                                        <Film size={24} color="#3b82f6" />
                                      ) : f.fileName.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                        <img src={f.previewUrl} alt={f.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        renderFileIcon(f.type)
                                      )}
                                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 8, padding: '2px 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                                        {f.fileName}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditMaterialForm(prev => ({
                                            ...prev,
                                            files: prev.files.filter((_, i) => i !== idx)
                                          }));
                                        }}
                                        style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ textAlign: 'center', color: '#059669', fontSize: 11, fontWeight: 600 }}>
                                  <Check size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                                  Đã chọn {editMaterialForm.files.length} tệp mới (nhấn để thêm tiếp)
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Upload size={22} color="#059669" />
                                </div>
                                <p style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                                  Kéo thả tệp vào đây hoặc <strong style={{ color: '#059669', cursor: 'pointer' }}>nhấp để tải lên</strong>
                                </p>
                                <small style={{ fontSize: 11, color: '#94a3b8' }}>Hỗ trợ PDF, DOCX, XLSX, MP4, PNG, JPG (Tối đa 50MB)</small>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {editMaterialForm.inputType === 'link' && (
                        <div className={styles.field} style={{ background: '#f8fafc', padding: '16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <label>Đường dẫn liên kết (URL)</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              type="url"
                              className={styles.input}
                              placeholder="https://www.youtube.com/watch?v=..."
                              value={editMaterialForm.linkUrl}
                              onChange={(e) => setEditMaterialForm({ ...editMaterialForm, linkUrl: e.target.value })}
                            />
                            <button
                              type="button"
                              className={styles.btnSecondary}
                              style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}
                              onClick={async () => {
                                if (!editMaterialForm.linkUrl) {
                                  showToast('Vui lòng nhập đường dẫn trước', 'info');
                                  return;
                                }
                                const info = await fetchYouTubeInfo(editMaterialForm.linkUrl);
                                if (info && info.title) {
                                  setEditMaterialForm({ ...editMaterialForm, title: info.title, type: 'video' });
                                  showToast('Đã lấy thông tin thành công!');
                                } else {
                                  showToast('Không lấy được tiêu đề từ liên kết này', 'info');
                                }
                              }}
                            >
                              Lấy thông tin
                            </button>
                          </div>
                          <p style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>* Hỗ trợ tự động lấy tiêu đề Video từ YouTube.</p>
                        </div>
                      )}

                      {editMaterialForm.inputType === 'quiz' && (
                        renderQuizBuilder(editMaterialForm, setEditMaterialForm, true)
                      )}
                    </div>

                    {editMaterialForm.type !== 'quiz' && (
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '2px dashed #cbd5e1' }}>
                        <h4 style={{ fontSize: 13, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0f172a' }}>
                          <MessageSquare size={14} color="#059669" /> Thảo luận & Ghi chú ({editMaterialForm.comments?.length || 0})
                        </h4>

                        <div style={{ maxHeight: 120, overflowY: 'auto', background: '#f8fafc', padding: 8, borderRadius: 10, marginBottom: 8, border: '1px solid #cbd5e1' }}>
                          {(!editMaterialForm.comments || editMaterialForm.comments.length === 0) ? (
                            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                              Chưa có thảo luận nào. Hãy gửi bình luận đầu tiên!
                            </p>
                          ) : (
                            editMaterialForm.comments.map((c, idx) => (
                              <div key={idx} style={{ marginBottom: 6, borderBottom: idx < editMaterialForm.comments.length - 1 ? '1px solid #e2e8f0' : 'none', paddingBottom: 4 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#0f172a' }}>
                                  <span>{c.author}</span>
                                  <span style={{ fontWeight: 400, color: '#94a3b8' }}>{c.time || 'Vừa xong'}</span>
                                </div>
                                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569' }}>{c.text}</p>
                              </div>
                            ))
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            ref={commentInputRef}
                            className={styles.input}
                            placeholder="Viết ghi chú / bình luận..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddComment(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            style={{ padding: '4px 8px', fontSize: 11 }}
                          />
                          <button
                            type="button"
                            className={styles.btnEmerald}
                            onClick={() => {
                              const input = commentInputRef.current;
                              if (input && input.value.trim()) {
                                handleAddComment(input.value);
                                input.value = '';
                              }
                            }}
                            style={{ padding: '4px 10px', fontSize: 11, height: 'auto' }}
                          >
                            Gửi
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>


                {/* Sticky Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', gap: 12, alignItems: 'center', zIndex: 10 }}>
                  <button type="submit" form="editMaterialForm" className={styles.btnPrimary} disabled={isUploading} style={{ flex: 2, padding: '12px 0', fontSize: 13, fontWeight: 700, borderRadius: 10, boxShadow: '0 4px 12px rgba(6, 78, 59, 0.2)', transition: 'all 0.2s' }}>
                    {isUploading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </button>
                  <button type="button" className={styles.btnSecondary} onClick={handleCancelEdit} style={{ flex: 1, padding: '12px 0', fontSize: 13, borderRadius: 10, fontWeight: 600 }}>
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const deleted = await handleDeleteMaterial(editingMaterialId);
                      if (deleted) {
                        setEditingMaterialId(null);
                      }
                    }}
                    title="Xóa Học Liệu"
                    style={{ background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {questionToDeleteIdx !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 32,
            width: '90%', maxWidth: 400, textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderTop: '4px solid #dc2626'
          }}>
            {/* Icon Area */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#fef2f2', border: '1px solid #fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Trash2 size={24} color="#dc2626" />
            </div>

            {/* Title */}
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Xóa câu hỏi
            </h3>

            {/* Subtitle */}
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: '1.5', margin: '0 0 24px' }}>
              Bạn có chắc chắn muốn xóa Câu hỏi {questionToDeleteIdx + 1} khỏi bài trắc nghiệm này không? Hành động này không thể hoàn tác.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setQuestionToDeleteIdx(null)}
                style={{
                  flex: 1, padding: '10px 0', border: '1px solid #cbd5e1',
                  borderRadius: 10, background: '#fff', color: '#475569',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  const q = [...(editMaterialForm.questions || [])];
                  q.splice(questionToDeleteIdx, 1);
                  setEditMaterialForm(prev => ({ ...prev, questions: q }));
                  setQuestionToDeleteIdx(null);
                }}
                style={{
                  flex: 1, padding: '10px 0', border: 'none',
                  borderRadius: 10, background: '#dc2626', color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{ zIndex: 9999 }} className={`fixed bottom-5 right-5 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl transition-all border ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {toast.type === 'error' ? <X size={18} className="text-rose-600" /> : <Check size={18} className="text-emerald-600" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}