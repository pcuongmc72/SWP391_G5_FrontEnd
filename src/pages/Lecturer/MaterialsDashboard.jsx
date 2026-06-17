import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload, Plus, CheckSquare, Film, FileText, FileSpreadsheet, Paperclip, Pencil,
  Search, ChevronDown, ChevronRight, BookOpen, X, MessageSquare, Check, Trash2, Clock, Award, Users, CheckCircle
} from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './LecturerDashboard.module.css';

// ─── ChapterDropdown Component ───────────────────────────────────────────────
function ChapterDropdown({ value, onChange, existingChapters, hasError = false, placeholder = 'Chọn hoặc tạo chương...' }) {
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [newChapterInput, setNewChapterInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [localCustomChapters, setLocalCustomChapters] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const combinedChapters = useMemo(() => {
    return Array.from(new Set([...existingChapters, ...localCustomChapters]));
  }, [existingChapters, localCustomChapters]);

  const handleSelect = (ch) => {
    onChange(ch);
    setOpen(false);
    setShowInput(false);
    setNewChapterInput('');
  };

  const handleAddNew = () => {
    if (newChapterInput.trim()) {
      const val = newChapterInput.trim();
      setLocalCustomChapters(prev => [...prev, val]);
      onChange(val);
      setOpen(false);
      setShowInput(false);
      setNewChapterInput('');
    }
  };

  const showError = (hasError || touched) && !value;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => { setOpen(o => !o); setTouched(true); }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: `1.5px solid ${showError ? '#ef4444' : open ? '#059669' : '#64748b'}`,
          borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
          background: showError ? '#fff5f5' : '#fff',
          fontSize: 13, color: value ? '#0f172a' : '#475569',
          transition: 'border-color 0.2s, background 0.2s', userSelect: 'none', minHeight: 38,
          boxShadow: showError
            ? '0 0 0 3px rgba(239,68,68,0.12)'
            : open ? '0 0 0 3px rgba(5,150,105,0.12)' : 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={13} color={showError ? '#ef4444' : value ? '#059669' : '#475569'} />
          {value || placeholder}
        </span>
        <ChevronDown size={14} color="#1e293b" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </div>
      {showError && (
        <span style={{ fontSize: 11, color: '#ef4444', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
          ⚠️ Vui lòng chọn hoặc tạo chương học!
        </span>
      )}

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 999,
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)', overflow: 'hidden',
        }}>
          {combinedChapters.length > 0 && (
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {combinedChapters.map((ch, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(ch)}
                  style={{
                    padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                    background: value === ch ? '#ecfdf5' : 'transparent',
                    color: value === ch ? '#059669' : '#0f172a',
                    fontWeight: value === ch ? 700 : 400,
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = value === ch ? '#ecfdf5' : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = value === ch ? '#ecfdf5' : 'transparent'}
                >
                  {value === ch && <Check size={13} color="#059669" />}
                  {ch}
                </div>
              ))}
            </div>
          )}

          {combinedChapters.length === 0 && !showInput && (
            <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', fontStyle: 'italic', borderBottom: '1px solid #f1f5f9' }}>
              Chưa có chương nào trong lớp này.
            </div>
          )}

          {showInput ? (
            <div style={{ padding: '8px 10px', borderTop: combinedChapters.length > 0 ? '1px solid #e2e8f0' : 'none', display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                autoFocus
                value={newChapterInput}
                onChange={e => setNewChapterInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNew();
                  }
                }}
                placeholder="Tên chương mới..."
                style={{
                  flex: 1, border: '1.5px solid #059669', borderRadius: 6, padding: '5px 8px',
                  fontSize: 12, outline: 'none', color: '#0f172a',
                }}
              />
              <button type="button" onClick={handleAddNew}
                style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Thêm
              </button>
              <button type="button" onClick={() => { setShowInput(false); setNewChapterInput(''); }}
                style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 11, cursor: 'pointer' }}>
                Hủy
              </button>
            </div>
          ) : (
            <div
              onClick={() => setShowInput(true)}
              style={{
                padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                color: '#059669', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                borderTop: combinedChapters.length > 0 ? '1px solid #e2e8f0' : 'none',
                background: '#f0fdf4',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
              onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
            >
              <Plus size={13} />
              Tạo chương mới
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SubjectDropdown Component ────────────────────────────────────────────
function SubjectDropdown({ value, onChange, existingSubjects, hasError = false, placeholder = 'Chọn hoặc tạo môn học...' }) {
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [newInput, setNewInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [localCustomSubjects, setLocalCustomSubjects] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const combinedSubjects = useMemo(() => {
    return Array.from(new Set([...existingSubjects, ...localCustomSubjects]));
  }, [existingSubjects, localCustomSubjects]);

  const handleSelect = (s) => { onChange(s); setOpen(false); setShowInput(false); setNewInput(''); };

  const handleAddNew = () => {
    if (newInput.trim()) {
      const val = newInput.trim();
      setLocalCustomSubjects(prev => [...prev, val]);
      onChange(val);
      setOpen(false);
      setShowInput(false);
      setNewInput('');
    }
  };

  const showError = (hasError || touched) && !value;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => { setOpen(o => !o); setTouched(true); }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: `1.5px solid ${showError ? '#ef4444' : open ? '#7c3aed' : '#64748b'}`,
          borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
          background: showError ? '#fff5f5' : '#fff',
          fontSize: 13, color: value ? '#0f172a' : '#475569',
          transition: 'border-color 0.2s, background 0.2s', userSelect: 'none', minHeight: 38,
          boxShadow: showError ? '0 0 0 3px rgba(239,68,68,0.12)' : open ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={13} color={showError ? '#ef4444' : value ? '#7c3aed' : '#475569'} />
          {value || placeholder}
        </span>
        <ChevronDown size={14} color="#1e293b" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </div>
      {showError && (
        <span style={{ fontSize: 11, color: '#ef4444', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
          ⚠️ Vui lòng chọn hoặc tạo môn học!
        </span>
      )}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 999,
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)', overflow: 'hidden',
        }}>
          {combinedSubjects.length > 0 && (
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {combinedSubjects.map((s, idx) => (
                <div key={idx} onClick={() => handleSelect(s)}
                  style={{
                    padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                    background: value === s ? '#f5f3ff' : 'transparent',
                    color: value === s ? '#7c3aed' : '#0f172a',
                    fontWeight: value === s ? 700 : 400,
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = value === s ? '#f5f3ff' : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = value === s ? '#f5f3ff' : 'transparent'}
                >
                  {value === s && <Check size={13} color="#7c3aed" />}
                  {s}
                </div>
              ))}
            </div>
          )}
          {combinedSubjects.length === 0 && !showInput && (
            <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', fontStyle: 'italic', borderBottom: '1px solid #f1f5f9' }}>
              Chưa có môn nào. Hãy tạo môn đầu tiên!
            </div>
          )}
          {showInput ? (
            <div style={{ padding: '8px 10px', borderTop: combinedSubjects.length > 0 ? '1px solid #e2e8f0' : 'none', display: 'flex', gap: 6, alignItems: 'center' }}>
              <input autoFocus value={newInput} onChange={e => setNewInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNew();
                  }
                }}
                placeholder="Tên môn học mới..."
                style={{ flex: 1, border: '1.5px solid #7c3aed', borderRadius: 6, padding: '5px 8px', fontSize: 12, outline: 'none', color: '#0f172a' }} />
              <button type="button" onClick={handleAddNew}
                style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Thêm</button>
              <button type="button" onClick={() => { setShowInput(false); setNewInput(''); }}
                style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 11, cursor: 'pointer' }}>Hủy</button>
            </div>
          ) : (
            <div onClick={() => setShowInput(true)}
              style={{
                padding: '9px 14px', fontSize: 13, cursor: 'pointer', color: '#7c3aed', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                borderTop: combinedSubjects.length > 0 ? '1px solid #e2e8f0' : 'none', background: '#faf5ff',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
              onMouseLeave={e => e.currentTarget.style.background = '#faf5ff'}
            >
              <Plus size={13} /> Tạo môn học mới
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MaterialsDashboard() {
  const {
    currentUser, users, selectedClassId,
    classesLoading, classesError, workspaceLoading,
    materials, searchQuery, setSearchQuery, api,
  } = useLecturerWorkspace();

  const [toast, setToast] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [filterType, setFilterType] = useState('all'); // all | video | pdf | document | quiz
  const [filterSubject, setFilterSubject] = useState('all'); // all | <subject code>
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);

  const [newMaterialForm, setNewMaterialForm] = useState({
    title: '', description: '', type: 'video', fileName: '', fileSize: '', fileObj: null,
    publishDate: new Date().toISOString().split('T')[0],
    deadline: '',
    distributeMode: 'all',
    numGroups: 2,
    groups: [],
    comments: [],
    subject: '',
    chapter: '',
  });

  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [editMaterialForm, setEditMaterialForm] = useState({
    title: '', description: '', type: 'video', fileName: '', fileSize: '', fileObj: null,
    publishDate: '',
    deadline: '',
    distributeMode: 'all',
    numGroups: 2,
    groups: [],
    comments: [],
    subject: '',
    chapter: '',
  });

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const commentInputRef = useRef(null);
  const [isEditDragging, setIsEditDragging] = useState(false);

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
        (m) => m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
      );
    }
    // Filter by type
    if (filterType !== 'all') {
      list = list.filter((m) => m.type === filterType);
    }
    // Filter by subject
    if (filterSubject !== 'all') {
      list = list.filter((m) => {
        if (!m.chapter) return filterSubject === 'Học liệu chung';
        const subj = m.chapter.includes(' ÷ ') ? m.chapter.split(' ÷ ')[0].trim() : 'Học liệu chung';
        return subj === filterSubject;
      });
    }
    return list;
  }, [materials, searchQuery, filterType, filterSubject]);

  const groupedBySubjectAndChapter = useMemo(() => {
    const groups = {};
    classroomMaterials.forEach((m) => {
      let subject = 'Học liệu chung';
      let chapter = 'Học liệu chung';
      if (m.chapter && m.chapter.includes(' ÷ ')) {
        const parts = m.chapter.split(' ÷ ');
        subject = parts[0].trim();
        chapter = parts[1].trim();
      } else if (m.chapter) {
        chapter = m.chapter.trim();
      }
      if (!groups[subject]) groups[subject] = {};
      if (!groups[subject][chapter]) groups[subject][chapter] = [];
      groups[subject][chapter].push(m);
    });
    return groups;
  }, [classroomMaterials]);

  const sortedSubjects = useMemo(() => {
    return Object.keys(groupedBySubjectAndChapter).sort((a, b) => {
      if (a === 'Học liệu chung') return 1;
      if (b === 'Học liệu chung') return -1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [groupedBySubjectAndChapter]);

  const existingSubjects = useMemo(() => {
    return Array.from(new Set(materials.map(m => m.chapter).filter(Boolean).map(ch => {
      const parts = ch.split(' ÷ ');
      return parts.length > 1 ? parts[0].trim() : null;
    }).filter(Boolean)));
  }, [materials]);

  const existingChapters = useMemo(() => {
    return Array.from(new Set(materials.map(m => m.chapter).filter(Boolean)));
  }, [materials]);

  const existingChaptersForSubject = useMemo(() => {
    if (!newMaterialForm.subject) return existingChapters;
    const prefix = newMaterialForm.subject + ' ÷ ';
    return existingChapters.filter(ch => ch.startsWith(prefix)).map(ch => ch.replace(prefix, ''));
  }, [existingChapters, newMaterialForm.subject]);

  const existingChaptersForEditSubject = useMemo(() => {
    if (!editMaterialForm.subject) return existingChapters;
    const prefix = editMaterialForm.subject + ' ÷ ';
    return existingChapters.filter(ch => ch.startsWith(prefix)).map(ch => ch.replace(prefix, ''));
  }, [existingChapters, editMaterialForm.subject]);

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
    if (mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/.test(name)) return 'video';
    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
    if (/spreadsheet|excel|csv/.test(mime) || /\.(xlsx?|csv)$/.test(name)) return 'document';
    if (/word|msword/.test(mime) || /\.(docx?)$/.test(name)) return 'document';
    if (/quiz|json/.test(mime) || /\.(json)$/.test(name)) return 'quiz';
    return 'document';
  };

  const applyFile = (file) => {
    if (!file) return;
    const detectedType = detectFileType(file);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setNewMaterialForm((prev) => ({
      ...prev,
      fileObj: file,
      fileName: file.name,
      fileSize: `${sizeMB} MB`,
      type: detectedType,
      title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
    }));
    showToast(`Đã chọn: ${file.name} (${sizeMB} MB)`, 'info');
  };

  const handleFileInputChange = (e) => {
    applyFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDropZoneClick = () => fileInputRef.current?.click();
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    applyFile(e.dataTransfer.files?.[0]);
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

  const handleEditMaterialStart = (material) => {
    const meta = parseMaterialDesc(material.description);
    let subjectVal = '';
    let chapterVal = material.chapter || '';
    if (material.chapter && material.chapter.includes(' ÷ ')) {
      const parts = material.chapter.split(' ÷ ');
      subjectVal = parts[0].trim();
      chapterVal = parts[1].trim();
    }
    setEditingMaterialId(material.id);
    setEditMaterialForm({
      title: material.title || '',
      description: meta.desc || '',
      type: material.type || 'video',
      fileName: material.url && material.url.startsWith('#file:') ? material.url.substring(6) : (material.url !== '#' ? material.url : ''),
      fileSize: material.fileSize || '',
      fileObj: null,
      publishDate: meta.publishDate || material.uploadedAt?.substring(0, 10) || '',
      deadline: meta.deadline || '',
      distributeMode: meta.distributeMode || 'all',
      numGroups: meta.groups?.length || 2,
      groups: meta.groups || [],
      comments: meta.comments || [],
      subject: subjectVal,
      chapter: chapterVal,
      lesson: material.lesson || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingMaterialId(null);
  };

  const applyEditFile = (file) => {
    if (!file) return;
    const detectedType = detectFileType(file);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setEditMaterialForm((prev) => ({
      ...prev,
      fileObj: file,
      fileName: file.name,
      fileSize: `${sizeMB} MB`,
      type: detectedType,
      title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
    }));
    showToast(`Đã chọn tệp sửa: ${file.name} (${sizeMB} MB)`, 'info');
  };

  const handleEditFileInputChange = (e) => {
    applyEditFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleEditDropZoneClick = () => editFileInputRef.current?.click();
  const handleEditDragOver = (e) => { e.preventDefault(); setIsEditDragging(true); };
  const handleEditDragLeave = () => setIsEditDragging(false);
  const handleEditDrop = (e) => {
    e.preventDefault();
    setIsEditDragging(false);
    applyEditFile(e.dataTransfer.files?.[0]);
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setHasSubmitAttempted(true);
    if (!newMaterialForm.title) { showToast('Vui lòng nhập tên bài học', 'info'); return; }
    if (!newMaterialForm.subject) { showToast('Vui lòng chọn hoặc tạo Môn học', 'info'); return; }
    if (!newMaterialForm.chapter) { showToast('Vui lòng chọn hoặc tạo Chương (Chapter)', 'info'); return; }
    setIsUploading(true);
    const compoundChapter = `${newMaterialForm.subject} ÷ ${newMaterialForm.chapter}`;
    try {
      const payload = {
        title: newMaterialForm.title,
        description: serializeMaterialDesc({
          desc: newMaterialForm.description,
          publishDate: newMaterialForm.publishDate,
          deadline: newMaterialForm.deadline,
          distributeMode: newMaterialForm.distributeMode,
          groups: newMaterialForm.groups,
          comments: newMaterialForm.comments,
        }),
        type: newMaterialForm.type,
        fileSize: newMaterialForm.fileName ? newMaterialForm.fileSize : '',
        url: newMaterialForm.fileName ? `#file:${newMaterialForm.fileName}` : '#',
        chapter: compoundChapter,
        lesson: null,
      };
      await api.addMaterial(payload);
      showToast('Đăng tải học liệu thành công!');
      setIsAddMaterialModalOpen(false);
      setHasSubmitAttempted(false);
      setNewMaterialForm({
        title: '', description: '', type: 'video', fileName: '', fileSize: '', fileObj: null,
        publishDate: new Date().toISOString().split('T')[0],
        deadline: '', distributeMode: 'all', numGroups: 2, groups: [], comments: [],
        subject: newMaterialForm.subject,
        chapter: '',
      });
    } catch (err) {
      showToast(err.message || 'Lưu học liệu thất bại.', 'info');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateMaterial = async (e) => {
    e.preventDefault();
    if (!editMaterialForm.title) { showToast('Vui lòng nhập tên bài học', 'info'); return; }
    if (!editMaterialForm.subject) { showToast('Vui lòng chọn hoặc tạo Môn học', 'info'); return; }
    if (!editMaterialForm.chapter) { showToast('Vui lòng chọn hoặc tạo Chương (Chapter)', 'info'); return; }
    setIsUploading(true);
    const compoundChapter = `${editMaterialForm.subject} ÷ ${editMaterialForm.chapter}`;
    try {
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
        fileSize: editMaterialForm.fileName ? editMaterialForm.fileSize : '',
        url: editMaterialForm.fileName ? `#file:${editMaterialForm.fileName}` : '#',
        chapter: compoundChapter,
        lesson: null,
      };
      await api.updateMaterial(editingMaterialId, payload);
      showToast('Cập nhật học liệu thành công!');
      setEditingMaterialId(null);
    } catch (err) {
      showToast(err.message || 'Lưu học liệu thất bại.', 'info');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Vô hiệu hóa học liệu này?\nHọc liệu sẽ bị ẩn khỏi học sinh nhưng vẫn hiển thị trong danh sách của giảng viên.')) return;
    try {
      await api.removeMaterial(id);
      showToast('Đã vô hiệu hóa học liệu.');
    } catch (err) {
      showToast(err.message || 'Vô hiệu hóa thất bại.', 'info');
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
              { key: 'pdf', label: '📄 PDF' },
              { key: 'document', label: '📝 Tài liệu' },
              { key: 'quiz', label: '✅ Trắc nghiệm' },
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

            {/* Subject filters */}
            {[
              { key: 'all', label: 'Tất cả môn' },
              ...existingSubjects.map(s => ({ key: s, label: s })),
              ...(existingSubjects.length === 0 ? [] : []),
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterSubject(key)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1.5px solid ${filterSubject === key ? '#7c3aed' : '#cbd5e1'}`,
                  background: filterSubject === key ? '#f5f3ff' : '#fff',
                  color: filterSubject === key ? '#6d28d9' : '#475569',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}

            {/* Clear all filters */}
            {(filterType !== 'all' || filterSubject !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => { setFilterType('all'); setFilterSubject('all'); setSearchQuery(''); }}
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
              onClick={() => setIsAddMaterialModalOpen(true)}
            >
              <Plus size={16} /> Đăng tải học liệu mới
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {sortedSubjects.map((subjectCode) => {
              const chapters = groupedBySubjectAndChapter[subjectCode] || {};
              const sortedChapters = Object.keys(chapters).sort((a, b) => {
                if (a === 'Học liệu chung') return 1;
                if (b === 'Học liệu chung') return -1;
                return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
              });

              return (
                <div key={subjectCode} className={styles.subjectBlock}>
                  <div className={styles.subjectHeader}>
                    <Award size={18} color="#7c3aed" />
                    <h4 className={styles.subjectTitle}>{subjectCode}</h4>
                  </div>

                  <div className={styles.chaptersList}>
                    {sortedChapters.map((chName) => {
                      const chKey = `${subjectCode} / ${chName}`;
                      const list = chapters[chName] || [];
                      const isExpanded = !!expandedChapters[chKey];

                      return (
                        <div key={chName} className={styles.chapterCard}>
                          <div
                            className={styles.chapterHeader}
                            onClick={() => toggleChapter(chKey)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className={styles.chapterHeaderLeft}>
                              <BookOpen size={16} color="#059669" />
                              <span className={styles.chapterTitle}>{chName}</span>
                              <span className={styles.materialsCount}>({list.length} bài học)</span>
                            </div>
                            <ChevronRight
                              size={16}
                              style={{
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                              }}
                            />
                          </div>

                          {isExpanded && (
                            <div className={styles.chapterBody}>
                              <div className={styles.materialsGrid}>
                                {list.map((m) => {
                                  const meta = parseMaterialDesc(m.description);
                                  const commentsCount = meta.comments?.length || 0;
                                  return (
                                    <div
                                      key={m.id}
                                      className={`${styles.materialCard} ${m.isDisabled ? styles.disabledCard : ''}`}
                                    >
                                      <div className={styles.materialIconArea}>
                                        {renderFileIcon(m.type)}
                                      </div>
                                      <div className={styles.materialContent}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                          <h5 className={styles.materialTitle}>
                                            {m.title} {m.isDisabled && <span className={styles.disabledTag}>Đã VH</span>}
                                          </h5>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <button
                                              type="button"
                                              className={styles.editBtn}
                                              style={{ 
                                                color: m.completedByUsers?.length > 0 && users.length > 0 ? '#10b981' : '#cbd5e1',
                                                borderColor: m.completedByUsers?.length > 0 && users.length > 0 ? '#10b981' : '#e2e8f0',
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
                                              <CheckCircle size={14} strokeWidth={2.5} />
                                            </button>
                                            <button
                                              type="button"
                                              className={styles.editBtn}
                                              onClick={() => handleEditMaterialStart(m)}
                                              title="Chỉnh sửa"
                                            >
                                              <Pencil size={13} />
                                            </button>
                                          </div>
                                        </div>
                                        <p className={styles.materialDesc}>
                                          {meta.desc || 'Không có mô tả chi tiết.'}
                                        </p>
                                        <div className={styles.materialMetaGrid}>
                                          {meta.publishDate && (
                                            <span>Ngày mở: {meta.publishDate}</span>
                                          )}
                                          {meta.deadline && (
                                            <span>Hạn nộp: {meta.deadline}</span>
                                          )}
                                          {m.fileSize && <span>Dung lượng: {m.fileSize}</span>}
                                        </div>
                                        {commentsCount > 0 && (
                                          <div style={{ marginTop: 8, fontSize: 10, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MessageSquare size={10} /> {commentsCount} thảo luận/ghi chú
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {sortedSubjects.length === 0 && (
              <div className={styles.emptyBox}>Chưa có tài liệu học tập nào trong lớp học này.</div>
            )}
          </div>
        </div>
      </div>

      {isAddMaterialModalOpen && (
        <div className={styles.modalOverlay} onClick={() => { setIsAddMaterialModalOpen(false); setHasSubmitAttempted(false); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={18} color="#059669" /> Đăng tải Học liệu Mới
              </h3>
              <button type="button" className={styles.iconBtn} onClick={() => { setIsAddMaterialModalOpen(false); setHasSubmitAttempted(false); }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddMaterial}>
              <div className={styles.field}>
                <label>Môn học &nbsp;<span style={{ color: '#ef4444' }}>*</span></label>
                <SubjectDropdown
                  value={newMaterialForm.subject}
                  onChange={(s) => setNewMaterialForm({ ...newMaterialForm, subject: s, chapter: '' })}
                  existingSubjects={existingSubjects}
                  hasError={hasSubmitAttempted && !newMaterialForm.subject}
                />
              </div>

              <div className={styles.field}>
                <label>Chương (Chapter) &nbsp;<span style={{ color: '#ef4444' }}>*</span></label>
                <ChapterDropdown
                  value={newMaterialForm.chapter}
                  onChange={(ch) => setNewMaterialForm({ ...newMaterialForm, chapter: ch })}
                  existingChapters={existingChaptersForSubject}
                  hasError={hasSubmitAttempted && !newMaterialForm.chapter}
                  placeholder={newMaterialForm.subject ? 'Chọn hoặc tạo chương...' : 'Chọn môn học trước...'}
                />
              </div>

              <div className={styles.field}>
                <label>Tên bài học &nbsp;<span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  className={styles.input}
                  value={newMaterialForm.title}
                  onChange={(e) => setNewMaterialForm({ ...newMaterialForm, title: e.target.value })}
                  placeholder="VD: Bài 1 - Giới thiệu Agile Scrum..."
                  disabled={!newMaterialForm.chapter}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Yêu cầu / Mô tả</label>
                <textarea className={styles.textarea} rows={2} value={newMaterialForm.description}
                  onChange={(e) => setNewMaterialForm({ ...newMaterialForm, description: e.target.value })} />
              </div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Loại tệp</label>
                  <select className={styles.select} value={newMaterialForm.type}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, type: e.target.value })}>
                    <option value="video">Video bài giảng (quay trước)</option>
                    <option value="pdf">Tài liệu PDF</option>
                    <option value="document">Giáo trình doc</option>
                    <option value="quiz">Trắc nghiệm</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Ngày phát hành</label>
                  <input type="date" className={styles.input} value={newMaterialForm.publishDate}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, publishDate: e.target.value })} />
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Hạn hoàn thành</label>
                  <input type="date" className={styles.input} value={newMaterialForm.deadline}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, deadline: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>Đối tượng / Nhóm học</label>
                  <select className={styles.select} value={newMaterialForm.distributeMode}
                    onChange={(e) => {
                      const mode = e.target.value;
                      let initialGroups = [];
                      if (mode !== 'all') {
                        initialGroups = generateRandomGroups(newMaterialForm.numGroups, users);
                      }
                      setNewMaterialForm({ ...newMaterialForm, distributeMode: mode, groups: initialGroups });
                    }}>
                    <option value="all">Toàn bộ lớp học</option>
                    <option value="group_random">Chia nhóm ngẫu nhiên</option>
                  </select>
                </div>
              </div>

              {newMaterialForm.distributeMode !== 'all' && (
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 12 }}>
                  {/* Header: số nhóm + xáo trộn */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 2 }}>Số nhóm</label>
                      <input type="number" className={styles.input} style={{ padding: '4px 8px' }} min={2} max={10} value={newMaterialForm.numGroups}
                        onChange={(e) => {
                          const num = parseInt(e.target.value) || 2;
                          const newGroups = generateRandomGroups(num, users);
                          setNewMaterialForm({ ...newMaterialForm, numGroups: num, groups: newGroups });
                        }} />
                    </div>
                    <button type="button" className={styles.btnSecondary} style={{ alignSelf: 'flex-end', fontSize: 10, padding: '6px 10px' }}
                      onClick={() => {
                        const newGroups = generateRandomGroups(newMaterialForm.numGroups, users);
                        setNewMaterialForm({ ...newMaterialForm, groups: newGroups });
                        showToast('Đã phân chia lại nhóm ngẫu nhiên', 'info');
                      }}>
                      Xáo trộn nhóm
                    </button>
                  </div>

                  {/* Mô tả chế độ */}
                  {newMaterialForm.distributeMode === 'group_random' && (
                    <div style={{ fontSize: 11, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
                      ✅ <strong>Chia nhóm ngẫu nhiên:</strong> Tất cả nhóm đều được xem tài liệu này.
                    </div>
                  )}


                  {/* Danh sách nhóm */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {newMaterialForm.groups.map((group, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: '#fff',
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: '1.5px solid #e2e8f0',
                            transition: 'all 0.15s',
                          }}
                        >
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
              )}

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.webm,.jpg,.png,.zip,.json"
                onChange={handleFileInputChange}
              />

              <div
                className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleDropZoneClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleDropZoneClick()}
              >
                {newMaterialForm.fileName ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    {renderFileIcon(newMaterialForm.type)}
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: '4px 0 0', fontSize: 13, wordBreak: 'break-all' }}>
                      {newMaterialForm.fileName}
                    </p>
                    <small style={{ color: '#64748b' }}>{newMaterialForm.fileSize}</small>
                    <small style={{ color: '#059669', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={14} /> Sẵn sàng tải lên (Click để thay đổi)
                    </small>
                  </div>
                ) : (
                  <>
                    <Upload size={24} color="#94a3b8" />
                    <p style={{ margin: '8px 0 4px', fontSize: 13, color: '#475569' }}>
                      Kéo thả tệp hoặc <strong style={{ color: '#059669' }}>nhấp để chọn file</strong>
                    </p>
                    <small style={{ color: '#94a3b8' }}>PDF, Word, Excel, Video, PowerPoint, JSON...</small>
                  </>
                )}
              </div>

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
      )}

      {editingMaterialId && (
        <div className={styles.modalOverlay} onClick={handleCancelEdit}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pencil size={18} color="#059669" /> Chi tiết & Chỉnh sửa Học liệu
              </h3>
              <button type="button" className={styles.iconBtn} onClick={handleCancelEdit}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateMaterial}>
              <div style={{ display: 'flex', gap: 12, background: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', flexShrink: 0 }}>
                  {renderFileIcon(editMaterialForm.type)}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Thông tin học liệu hiện tại</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    Tệp: {editMaterialForm.fileName || 'Không có tệp'}
                  </p>
                  <small style={{ color: '#94a3b8' }}>Dung lượng: {editMaterialForm.fileSize || 'N/A'}</small>
                </div>
              </div>

              <div className={styles.field}>
                <label>Môn học &nbsp;<span style={{ color: '#ef4444' }}>*</span></label>
                <SubjectDropdown
                  value={editMaterialForm.subject}
                  onChange={(s) => setEditMaterialForm({ ...editMaterialForm, subject: s, chapter: '' })}
                  existingSubjects={existingSubjects}
                  hasError={!editMaterialForm.subject}
                />
              </div>

              <div className={styles.field}>
                <label>Chương (Chapter) &nbsp;<span style={{ color: '#ef4444' }}>*</span></label>
                <ChapterDropdown
                  value={editMaterialForm.chapter}
                  onChange={(ch) => setEditMaterialForm({ ...editMaterialForm, chapter: ch })}
                  existingChapters={existingChaptersForEditSubject}
                  hasError={!editMaterialForm.chapter}
                  placeholder={editMaterialForm.subject ? 'Chọn hoặc tạo chương...' : 'Chọn môn học trước...'}
                />
              </div>

              <div className={styles.field}>
                <label>Tên bài học &nbsp;<span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  className={styles.input}
                  required
                  value={editMaterialForm.title}
                  onChange={(e) => setEditMaterialForm({ ...editMaterialForm, title: e.target.value })}
                  placeholder="VD: Bài 1 - Giới thiệu Agile Scrum..."
                  disabled={!editMaterialForm.chapter}
                />
              </div>

              <div className={styles.field}>
                <label>Yêu cầu / Mô tả</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={editMaterialForm.description}
                  onChange={(e) => setEditMaterialForm({ ...editMaterialForm, description: e.target.value })}
                  placeholder="Mô tả hoặc yêu cầu của buổi học này..."
                />
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Loại tệp</label>
                  <select
                    className={styles.select}
                    value={editMaterialForm.type}
                    onChange={(e) => setEditMaterialForm({ ...editMaterialForm, type: e.target.value })}
                  >
                    <option value="video">Video bài giảng (quay trước)</option>
                    <option value="pdf">Tài liệu PDF</option>
                    <option value="document">Giáo trình doc</option>
                    <option value="quiz">Trắc nghiệm</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Ngày phát hành</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={editMaterialForm.publishDate}
                    onChange={(e) => setEditMaterialForm({ ...editMaterialForm, publishDate: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Hạn hoàn thành</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={editMaterialForm.deadline}
                    onChange={(e) => setEditMaterialForm({ ...editMaterialForm, deadline: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Đối tượng / Nhóm học</label>
                  <select
                    className={styles.select}
                    value={editMaterialForm.distributeMode}
                    onChange={(e) => {
                      const mode = e.target.value;
                      let initialGroups = [];
                      if (mode !== 'all') {
                        initialGroups = generateRandomGroups(editMaterialForm.numGroups, users);
                      }
                      setEditMaterialForm({ ...editMaterialForm, distributeMode: mode, groups: initialGroups });
                    }}
                  >
                    <option value="all">Toàn bộ lớp học</option>
                    <option value="group_random">Chia nhóm ngẫu nhiên</option>
                  </select>
                </div>
              </div>

              {editMaterialForm.distributeMode !== 'all' && (
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 2 }}>Số nhóm</label>
                      <input
                        type="number"
                        className={styles.input}
                        style={{ padding: '4px 8px' }}
                        min={2}
                        max={10}
                        value={editMaterialForm.numGroups}
                        onChange={(e) => {
                          const num = parseInt(e.target.value) || 2;
                          const newGroups = generateRandomGroups(num, users);
                          setEditMaterialForm({ ...editMaterialForm, numGroups: num, groups: newGroups });
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      style={{ alignSelf: 'flex-end', fontSize: 10, padding: '6px 10px' }}
                      onClick={() => {
                        const newGroups = generateRandomGroups(editMaterialForm.numGroups, users);
                        setEditMaterialForm({ ...editMaterialForm, groups: newGroups });
                        showToast('Đã phân chia lại nhóm ngẫu nhiên', 'info');
                      }}
                    >
                      Xáo trộn nhóm
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {editMaterialForm.groups.map((group, idx) => (
                      <div key={idx} style={{ background: '#fff', padding: 6, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                        <strong style={{ fontSize: 11, color: '#0f172a' }}>{group.name}</strong>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, maxHeight: 40, overflowY: 'auto' }}>
                          {group.members.length === 0 ? <em>Chưa có học viên</em> : group.members.map((m) => m.name).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.field}>
                <label>Thay đổi tệp đính kèm</label>
                <input
                  ref={editFileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.webm,.jpg,.png,.zip,.json"
                  onChange={handleEditFileInputChange}
                />

                <div
                  className={`${styles.dropZone} ${isEditDragging ? styles.dropZoneActive : ''}`}
                  onDragOver={handleEditDragOver}
                  onDragLeave={handleEditDragLeave}
                  onDrop={handleEditDrop}
                  onClick={handleEditDropZoneClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditDropZoneClick()}
                  style={{ padding: '16px 8px', background: '#fafafa' }}
                >
                  <Upload size={18} color="#94a3b8" style={{ marginBottom: 4 }} />
                  <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
                    Kéo thả tệp hoặc <strong style={{ color: '#059669' }}>nhấp để chọn tệp mới</strong>
                  </p>
                  <small style={{ fontSize: 10, color: '#94a3b8' }}>PDF, Word, Excel, Video, JSON...</small>
                </div>
              </div>

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

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                <button type="submit" className={styles.btnPrimary} disabled={isUploading} style={{ flex: '1 1 auto', minWidth: 140 }}>
                  {isUploading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>


                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={async () => {
                    if (window.confirm('Bạn có chắc chắn muốn xóa học liệu này? Thao tác này không thể hoàn tác.')) {
                      await handleDeleteMaterial(editingMaterialId);
                      setEditingMaterialId(null);
                    }
                  }}
                  style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' }}
                >
                  Xóa Học Liệu
                </button>

                <button type="button" className={styles.btnSecondary} onClick={handleCancelEdit} style={{ flexGrow: 1 }}>
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}