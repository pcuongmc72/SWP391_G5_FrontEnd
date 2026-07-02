import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload, Plus, CheckSquare, Film, FileText, FileSpreadsheet, Paperclip, Pencil,
  Search, ChevronDown, ChevronRight, BookOpen, X, MessageSquare, Check, Trash2, Clock, Award, Users, CheckCircle, ExternalLink
} from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './LecturerDashboard.module.css';

// ─── ChapterDropdown Component ───────────────────────────────────────────────
function GenericDropdown({ value, onChange, existingItems, hasError = false, placeholder, icon: Icon, color, emptyText }) {
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
        onClick={() => { setOpen(o => !o); setTouched(true); }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: `1.5px solid ${showError ? '#ef4444' : open ? color : '#64748b'}`,
          borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
          background: showError ? '#fff5f5' : '#fff',
          fontSize: 13, color: value ? '#0f172a' : '#475569',
          transition: 'border-color 0.2s, background 0.2s', userSelect: 'none', minHeight: 38,
          boxShadow: showError ? '0 0 0 3px rgba(239,68,68,0.12)' : open ? `0 0 0 3px ${color}1A` : 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={13} color={showError ? '#ef4444' : value ? color : '#475569'} />
          {value || placeholder}
        </span>
        <ChevronDown size={14} color="#1e293b" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </div>
      {showError && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>⚠️ Vui lòng chọn hoặc tạo!</span>}
      {open && (
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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [filterType, setFilterType] = useState('all'); // all | video | pdf | document | quiz
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);

  const [newMaterialForm, setNewMaterialForm] = useState({
    title: '', description: '', type: 'video', fileName: '', fileSize: '', fileObj: null, files: [],
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
  });

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const commentInputRef = useRef(null);
  const [isEditDragging, setIsEditDragging] = useState(false);
  const [iframeError, setIframeError] = useState(false);

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

  const handleEditMaterialStart = (material) => {
    const meta = parseMaterialDesc(material.description);
    // Resolve subject & chapter from raw DB value (unified handling)
    let subjectVal = extractSubjectName(material.chapter, '');
    let chapterVal = extractChapterName(material.chapter);

    // Legacy data: no subject in chapter → fall back to current class name
    if (!subjectVal) {
      const activeClass = classrooms?.find(c => c.id === selectedClassId);
      subjectVal = activeClass ? activeClass.name : '';
    }

    setEditingMaterialId(material.id);
    setIframeError(false);
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
      inputType: material.fileSize === 'Liên kết' ? 'link' : 'file',
      linkUrl: material.fileSize === 'Liên kết' ? material.url : '',
    });
  };


  const handleCancelEdit = () => {
    setEditingMaterialId(null);
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
    if (!newMaterialForm.chapter) { showToast('Vui lòng chọn hoặc tạo Chương (Chapter)', 'info'); return; }
    setIsUploading(true);
    const compoundChapter = `${newMaterialForm.subject} ÷ ${newMaterialForm.chapter}`;
    try {
      if (newMaterialForm.inputType === 'link') {
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
        title: '', description: '', type: 'video', fileName: '', fileSize: '', fileObj: null, files: [],
        publishDate: new Date().toISOString().split('T')[0],
        deadline: '', distributeMode: 'all', numGroups: 2, groups: [], comments: [],
        subject: newMaterialForm.subject,
        chapter: '',
        inputType: 'file',
        linkUrl: '',
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
      if (editMaterialForm.inputType === 'link') {
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
          let finalFileSize = editMaterialForm.fileName ? editMaterialForm.fileSize : '';
          if (editMaterialForm.fileName && !editMaterialForm.fileName.startsWith('#file:') && editMaterialForm.fileName.startsWith('http')) {
            finalUrl = editMaterialForm.fileName;
          }

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
                const activeClass = classrooms?.find(c => c.id === selectedClassId);
                const activeClassName = activeClass ? activeClass.name : '';
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
                          <span className={styles.chapterTitle}>{chName}</span>
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
                                video:    { label: '🎬 Video',     color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                                pdf:      { label: '📄 PDF',       color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
                                document: { label: '📝 Tài liệu', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
                                quiz:     { label: '✅ Quiz',      color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
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
                                            {m.fileSize && <span>💾 {m.fileSize}</span>}
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

              <GroupDistributionConfig formState={newMaterialForm} setFormState={setNewMaterialForm} users={users} showToast={showToast} />

              <div style={{ display: 'flex', gap: 16, marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: newMaterialForm.inputType === 'file' ? '#059669' : '#64748b' }}>
                  <input type="radio" name="inputType" checked={newMaterialForm.inputType === 'file'} onChange={() => setNewMaterialForm({ ...newMaterialForm, inputType: 'file' })} />
                  Tải lên từ máy
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: newMaterialForm.inputType === 'link' ? '#059669' : '#64748b' }}>
                  <input type="radio" name="inputType" checked={newMaterialForm.inputType === 'link'} onChange={() => setNewMaterialForm({ ...newMaterialForm, inputType: 'link' })} />
                  Đính kèm liên kết
                </label>
              </div>

              {newMaterialForm.inputType === 'file' ? (
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
                    <p className={styles.dropZoneSubtext}>Hỗ trợ PDF, Word, Excel, Video (Max 50MB)</p>
                  </>
                )}
              </div>
              </>
              ) : (
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
        <div className={styles.modalOverlay} onClick={handleCancelEdit} style={{ zIndex: 9999 }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1200, width: '95%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '90vh', borderRadius: 16 }}>
            <div className={styles.modalHeader} style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: '#0f172a' }}>
                <BookOpen size={18} color="#059669" /> Chi tiết & Xem Học liệu
              </h3>
              <button type="button" className={styles.iconBtn} onClick={handleCancelEdit} style={{ background: '#f1f5f9', padding: 8, borderRadius: 50 }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'flex', flex: 1, flexDirection: 'row', overflow: 'hidden', background: '#f8fafc' }}>
              
              {/* Left Column: Preview File */}
              {editMaterialForm.fileName && editMaterialForm.fileName.startsWith('http') && (
                <div style={{ flex: 1.5, background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'stretch', overflow: 'hidden', minWidth: 400, position: 'relative' }}>
                  {/* Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                      {editMaterialForm.fileName.split('/').pop()?.split('?')[0] || 'Tệp học liệu'}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
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
                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#34d399', fontWeight: 700, textDecoration: 'none', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}
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
                              <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Liên kết ngoài</p>
                              <a href={editMaterialForm.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3b82f6', fontWeight: 700, textDecoration: 'none', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 18px', marginTop: 10 }}>
                                <ExternalLink size={14} /> Mở liên kết
                              </a>
                            </div>
                          );
                        }
                    })() : editMaterialForm.type === 'video' || editMaterialForm.fileName.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={editMaterialForm.fileName} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    ) : editMaterialForm.fileName.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <img src={editMaterialForm.fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Preview" />
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

                      // For Cloudinary: build direct PDF-accessible URL
                      const getCloudinaryPdfUrl = (rawUrl) => {
                        if (rawUrl.match(/\.pdf($|\?)/i)) return rawUrl;
                        const base = rawUrl.split('?')[0];
                        // Insert fl_attachment:false flag and append .pdf
                        return base.replace('/upload/', '/upload/fl_attachment:false/') + '.pdf';
                      };

                      if (isCloudinary && !isDocType) {
                        // Cloudinary PDF/slide → direct URL with .pdf extension
                        const pdfUrl = getCloudinaryPdfUrl(url);
                        return (
                          <iframe
                            key={pdfUrl}
                            src={pdfUrl}
                            title="PDF Preview"
                            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                            onError={() => setIframeError(true)}
                          />
                        );
                      } else if (isPdfType) {
                        // Non-Cloudinary PDF: native browser viewer
                        return (
                          <iframe
                            key={url}
                            src={url}
                            title="PDF Preview"
                            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                            onError={() => setIframeError(true)}
                          />
                        );
                      } else {
                        // Word / PowerPoint / Excel → Google Docs Viewer
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
                                if (doc && doc.body && doc.body.innerHTML.trim() === '') {
                                  setIframeError(true);
                                }
                              } catch {}
                            }}
                          />
                        );
                      }
                    })()}
                  </div>
                </div>
              )}


              {/* Right Column: Form */}
              <div style={{ width: (editMaterialForm.fileName && editMaterialForm.fileName.startsWith('http')) ? 500 : '100%', background: '#fff', display: 'flex', flexDirection: 'column', zIndex: 5, borderLeft: '1px solid #e2e8f0' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  <form id="editMaterialForm" onSubmit={handleUpdateMaterial}>
                  <div style={{ display: 'flex', gap: 12, background: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', flexShrink: 0 }}>
                      {renderFileIcon(editMaterialForm.type)}
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Thông tin học liệu hiện tại</p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        Tệp: {editMaterialForm.fileName || 'Không có tệp'}
                      </p>
                      <small style={{ color: '#94a3b8' }}>Dung lượng: {editMaterialForm.fileSize || 'N/A'}</small>
                    </div>
                  </div>

                  <div className={styles.field}>
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

                  <GroupDistributionConfig formState={editMaterialForm} setFormState={setEditMaterialForm} users={users} showToast={showToast} />

                  <div className={styles.field}>
                    <label>Nội dung đính kèm</label>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: editMaterialForm.inputType === 'file' ? '#059669' : '#64748b' }}>
                        <input type="radio" name="editInputType" checked={editMaterialForm.inputType === 'file'} onChange={() => setEditMaterialForm({ ...editMaterialForm, inputType: 'file' })} />
                        Tải lên từ máy
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: editMaterialForm.inputType === 'link' ? '#059669' : '#64748b' }}>
                        <input type="radio" name="editInputType" checked={editMaterialForm.inputType === 'link'} onChange={() => setEditMaterialForm({ ...editMaterialForm, inputType: 'link' })} />
                        Đính kèm liên kết
                      </label>
                    </div>

                    {editMaterialForm.inputType === 'file' ? (
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
                      style={{ padding: '16px 8px', background: '#fafafa' }}
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
                        <>
                          <Upload size={18} color="#94a3b8" style={{ marginBottom: 4 }} />
                          <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
                            Kéo thả tệp hoặc <strong style={{ color: '#059669' }}>nhấp để chọn nhiều tệp mới</strong>
                          </p>
                          <small style={{ fontSize: 10, color: '#94a3b8' }}>PDF, Word, Excel, Video, JSON...</small>
                        </>
                      )}
                    </div>
                    </>
                    ) : (
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
                </form>
                </div>


                {/* Sticky Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button type="submit" form="editMaterialForm" className={styles.btnPrimary} disabled={isUploading} style={{ flex: 2, padding: '12px 0', fontSize: 13, fontWeight: 700 }}>
                    {isUploading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </button>
                  <button type="button" className={styles.btnSecondary} onClick={handleCancelEdit} style={{ flex: 1, padding: '12px 0', fontSize: 13 }}>
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Bạn có chắc chắn muốn xóa học liệu này? Thao tác này không thể hoàn tác.')) {
                        await handleDeleteMaterial(editingMaterialId);
                        setEditingMaterialId(null);
                      }
                    }}
                    title="Xóa Học Liệu"
                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}