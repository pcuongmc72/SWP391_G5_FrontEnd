import { useMemo, useRef, useState } from 'react';
import { Pencil, Trash2, Plus, Search, Clock, CheckSquare, X, Check, BookOpen, ChevronDown, ChevronRight, ClipboardList, Upload, ExternalLink, Film, FileText, FileSpreadsheet, Paperclip, Eye } from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './LecturerDashboard.module.css';

export default function AssignmentsDashboard() {
  const {
    users, selectedClassId, classesLoading, classesError, workspaceLoading,
    assignments, submissions, materials, api
  } = useLecturerWorkspace();

  const [toast, setToast] = useState(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  
  const [activeChapterState, setActiveChapterState] = useState(null);
  const [viewingSubmissionsForAsgId, setViewingSubmissionsForAsgId] = useState(null);
  const [subTab, setSubTab] = useState('submitted');
  const [viewingAssignmentDetail, setViewingAssignmentDetail] = useState(null);
  
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
  const asgFileInputRef = useRef(null);

  const [assignmentFilter, setAssignmentFilter] = useState('all'); // all, active, overdue
  const [assignmentSearch, setAssignmentSearch] = useState('');

  const groupedByChapter = useMemo(() => {
    const groups = {};
    (materials || []).forEach((m) => {
      let chapter = 'Học liệu chung';
      if (m.chapter && m.chapter.includes(' ÷ ')) {
        const parts = m.chapter.split(' ÷ ');
        chapter = parts[1].trim();
      } else if (m.chapter) {
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
      } catch (e) {
        // fallback
      }
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredAssignments = useMemo(() => {
    let list = assignments;
    if (assignmentSearch.trim()) {
      const q = assignmentSearch.toLowerCase();
      list = list.filter((asg) => {
        const meta = parseAssignmentDesc(asg.description);
        return asg.title.toLowerCase().includes(q) ||
          meta.desc.toLowerCase().includes(q) ||
          meta.linkedTitle.toLowerCase().includes(q);
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
    return list;
  }, [assignments, assignmentSearch, assignmentFilter]);

  const assignmentsByChapter = useMemo(() => {
    const groups = {};
    filteredAssignments.forEach(asg => {
      const meta = parseAssignmentDesc(asg.description);
      let ch = 'Bài tập chung (Không liên kết)';
      if (meta.linkedItem) {
        if (meta.linkedItem.startsWith('chapter_')) {
          ch = meta.linkedItem.replace('chapter_', '');
        } else {
          const mat = (materials || []).find(m => m.id === meta.linkedItem);
          if (mat && mat.chapter) {
            ch = mat.chapter.includes(' ÷ ') ? mat.chapter.split(' ÷ ')[1].trim() : mat.chapter.trim();
          }
        }
      }
      if (!groups[ch]) groups[ch] = [];
      groups[ch].push(asg);
    });
    return groups;
  }, [filteredAssignments, materials]);

  const sortedAsgChapters = useMemo(() => {
    return Object.keys(assignmentsByChapter).sort((a, b) => {
      if (a === 'Bài tập chung (Không liên kết)') return 1;
      if (b === 'Bài tập chung (Không liên kết)') return -1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [assignmentsByChapter]);

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!newAsgForm.title || !newAsgForm.dueDate) {
      showToast('Vui lòng hoàn thành tiêu đề và hạn nộp', 'info');
      return;
    }

    let resolvedLinkedTitle = '';
    if (newAsgForm.linkedItem) {
      if (newAsgForm.linkedItem.startsWith('chapter_')) {
        resolvedLinkedTitle = newAsgForm.linkedItem.replace('chapter_', 'Chương: ');
      } else {
        const mat = (materials || []).find(m => m.id === newAsgForm.linkedItem);
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
    if (payload.maxPoints > 10 || payload.maxPoints <= 0) {
      showToast('Điểm tối đa phải lớn hơn 0 và không vượt quá 10', 'info');
      return;
    }
    try {
      if (editingAssignmentId) {
        await api.updateAssignment(editingAssignmentId, payload);
        showToast('Cập nhật bài tập thành công!');
      } else {
        await api.addAssignment(payload);
        showToast('Tạo bài tập thành công!');
      }
      setIsAssignmentModalOpen(false);
      setEditingAssignmentId(null);
      setNewAsgForm({
        title: '',
        description: '',
        dueDate: '',
        maxPoints: 10,
        linkedItem: '',
        instructions: '',
        attachmentUrl: '',
        attachmentName: '',
        attachmentSize: '',
        inputType: 'file',
        linkUrl: '',
      });
    } catch (err) {
      showToast(err.message || 'Lưu bài tập thất bại.', 'info');
    }
  };

  const handleEditAssignmentStart = (asg) => {
    const meta = parseAssignmentDesc(asg.description);
    setEditingAssignmentId(asg.id);
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
    setIsAssignmentModalOpen(true);
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài tập này? Thao tác này không thể hoàn tác.')) {
      try {
        await api.removeAssignment(id);
        showToast('Đã xóa bài tập thành công!');
      } catch (err) {
        showToast(err.message || 'Xóa bài tập thất bại.', 'info');
      }
    }
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

      <div className={styles.panel}>
        <div className={styles.assignmentToolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder="Tìm kiếm bài tập, học phần..."
                className={styles.input}
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
              />
            </div>
            <div className={styles.filterWrapper}>
              <button
                type="button"
                className={`${styles.filterBtn} ${assignmentFilter === 'all' ? styles.filterBtnActive : ''}`}
                onClick={() => setAssignmentFilter('all')}
              >
                Tất cả
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${assignmentFilter === 'active' ? styles.filterBtnActive : ''}`}
                onClick={() => setAssignmentFilter('active')}
              >
                Đang diễn ra
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${assignmentFilter === 'overdue' ? styles.filterBtnActive : ''}`}
                onClick={() => setAssignmentFilter('overdue')}
              >
                Đã quá hạn
              </button>
            </div>
          </div>
          <button
            type="button"
            className={styles.btnEmerald}
            onClick={() => {
              setEditingAssignmentId(null);
              setNewAsgForm({
                title: '',
                description: '',
                dueDate: '',
                maxPoints: 10,
                linkedItem: '',
                instructions: '',
                attachmentUrl: '',
                attachmentName: '',
                attachmentSize: '',
                inputType: 'file',
                linkUrl: '',
              });
              setIsAssignmentModalOpen(true);
            }}
          >
            <Plus size={16} /> Soạn bài tập mới
          </button>
        </div>

        <div className={styles.splitLayout}>
          <div className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Nội dung lộ trình</h3>
            {sortedAsgChapters.map(chName => (
              <button
                key={chName}
                type="button"
                className={`${styles.sidebarItem} ${activeChapterState === chName || (!activeChapterState && chName === sortedAsgChapters[0]) ? styles.sidebarItemActive : ''}`}
                onClick={() => setActiveChapterState(chName)}
              >
                <span>{chName}</span>
                <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 10 }}>
                  {assignmentsByChapter[chName].length}
                </span>
              </button>
            ))}
          </div>

          <div className={styles.mainContent}>
            {sortedAsgChapters.length > 0 && (
              <div className={styles.assignmentGrid}>
                {(assignmentsByChapter[activeChapterState] || assignmentsByChapter[sortedAsgChapters[0]] || []).map((asg) => {
                  const meta = parseAssignmentDesc(asg.description);
                  const timeInfo = calculateTimeRemaining(asg.dueDate);
                  const asgSubs = submissions.filter((s) => s.assignmentId === asg.id);
                  const asgSubsCount = asgSubs.length;
                  const totalStudents = users.length || 1;
                  const pct = Math.min(100, Math.round((asgSubsCount / totalStudents) * 100));

                  return (
                    <div
                      key={asg.id}
                      className={styles.assignmentCard}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setViewingAssignmentDetail(asg)}
                    >
                      <div className={styles.asgCardHeader} onClick={(e) => e.stopPropagation()}>
                        <span className={styles.scoreBadge}>Thang điểm: {asg.maxPoints}đ</span>
                        <div className={styles.asgActionGroup}>
                          <button
                            type="button"
                            className={styles.miniIconBtn}
                            onClick={(e) => { e.stopPropagation(); setViewingAssignmentDetail(asg); }}
                            title="Xem chi tiết"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            className={styles.miniIconBtn}
                            onClick={(e) => { e.stopPropagation(); handleEditAssignmentStart(asg); }}
                            title="Sửa bài tập"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className={styles.miniIconBtn}
                            style={{ color: '#ef4444' }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(asg.id); }}
                            title="Xóa bài tập"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <h4 className={styles.asgCardTitle}>{asg.title}</h4>
                      {meta.linkedTitle && (
                        <div className={styles.linkedSessionBadge} style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                          <BookOpen size={11} /> Thuộc {meta.linkedTitle}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
                        <span className={styles.asgTypeTag}>
                          {meta.type === 'group' ? 'Làm nhóm' : 'Làm cá nhân'}
                        </span>
                        <span
                          className={styles.countdownPill}
                          style={{ color: timeInfo.color, background: timeInfo.bg }}
                        >
                          {timeInfo.text}
                        </span>
                      </div>

                      <p className={styles.asgCardDesc}>{meta.desc || 'Không có mô tả.'}</p>

                      {meta.instructions && (
                        <div className={styles.asgInstructionsBlock}>
                          <strong>Hướng dẫn:</strong> {meta.instructions}
                        </div>
                      )}

                      <div
                        className={styles.asgProgressSection}
                        onClick={(e) => { e.stopPropagation(); setViewingSubmissionsForAsgId(asg.id); }}
                        title="Xem danh sách nộp bài"
                      >
                        <div className={styles.asgProgressHeader}>
                          <span>Bài nộp: <strong>{asgSubsCount}/{users.length}</strong></span>
                          <span>{pct}%</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredAssignments.length === 0 && (
              <div className={styles.emptyBox}>Không tìm thấy bài tập nào. Hãy bấm Soạn bài tập mới.</div>
            )}
          </div>
        </div>
      </div>

      {isAssignmentModalOpen && (() => {
        const hasAttachmentPreview = !!newAsgForm.attachmentUrl;
        const isImage = hasAttachmentPreview && /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(newAsgForm.attachmentUrl);
        const isVideo = hasAttachmentPreview && /\.(mp4|webm|ogg)($|\?)/i.test(newAsgForm.attachmentUrl);
        const ytMatch = hasAttachmentPreview && newAsgForm.attachmentUrl.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
        const ytId = ytMatch ? ytMatch[1] : null;
        const isCloudinary = hasAttachmentPreview && newAsgForm.attachmentUrl.includes('cloudinary.com');
        const isDocType = hasAttachmentPreview && /\.(pptx?|docx?|xlsx?)($|\?)/i.test(newAsgForm.attachmentUrl);
        const previewSrc = hasAttachmentPreview
          ? (isCloudinary && !isDocType
            ? newAsgForm.attachmentUrl.replace('/upload/', '/upload/fl_attachment:false/').split('?')[0] + '.pdf'
            : isDocType
              ? `https://docs.google.com/gview?url=${encodeURIComponent(newAsgForm.attachmentUrl)}&embedded=true`
              : newAsgForm.attachmentUrl)
          : null;

        return (
          <div className={styles.modalOverlay} onClick={() => {
            setIsAssignmentModalOpen(false);
            setEditingAssignmentId(null);
          }}>
            <div
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: hasAttachmentPreview ? 1100 : 580,
                width: hasAttachmentPreview ? '95%' : undefined,
                padding: 0,
                overflow: 'hidden',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                height: hasAttachmentPreview ? '88vh' : undefined
              }}
            >
              <form onSubmit={handleSaveAssignment} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                {/* Header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, zIndex: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    {editingAssignmentId ? 'Cập nhật bài tập' : 'Soạn bài tập mới'}
                  </h3>
                  <button type="button" onClick={() => { setIsAssignmentModalOpen(false); setEditingAssignmentId(null); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <X size={18} color="#64748b" />
                  </button>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: hasAttachmentPreview ? 'row' : 'column' }}>
                  
                  {/* Left: Preview */}
                  {hasAttachmentPreview && (
                    <div style={{ flex: 1.4, background: '#0f172a', display: 'flex', flexDirection: 'column', minWidth: 340, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
                        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                          {newAsgForm.attachmentName || 'Tài liệu đính kèm'}
                          {newAsgForm.attachmentSize && <span style={{ marginLeft: 6, color: '#64748b' }}>({newAsgForm.attachmentSize})</span>}
                        </span>
                        <a href={newAsgForm.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#34d399', fontWeight: 700, textDecoration: 'none', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap' }}>
                          <ExternalLink size={12} /> Mở file
                        </a>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {ytId ? (
                          <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}`} title="YouTube" style={{ border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        ) : isVideo ? (
                          <video src={newAsgForm.attachmentUrl} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%' }} />
                        ) : isImage ? (
                          <div style={{ overflow: 'auto', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={newAsgForm.attachmentUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Preview" />
                          </div>
                        ) : newAsgForm.attachmentName === 'Liên kết' ? (
                          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                            <ExternalLink size={48} color="#3b82f6" style={{ marginBottom: 12 }} />
                            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Liên kết ngoài</p>
                            <a href={newAsgForm.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3b82f6', fontWeight: 700, textDecoration: 'none', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '8px 18px', marginTop: 10 }}>
                              <ExternalLink size={14} /> Mở liên kết
                            </a>
                          </div>
                        ) : (
                          <iframe src={previewSrc} title="Document Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Right/Center: Form */}
                  <div style={{ width: hasAttachmentPreview ? 420 : '100%', display: 'flex', flexDirection: 'column', background: '#fff', borderLeft: hasAttachmentPreview ? '1px solid #e2e8f0' : 'none', overflowY: 'auto' }}>
                    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className={styles.field}>
                        <label>Tiêu đề bài tập</label>
                        <input
                          className={styles.input}
                          required
                          placeholder="Ví dụ: Thực hành C# OOP - Phần 1"
                          value={newAsgForm.title}
                          onChange={(e) => setNewAsgForm({ ...newAsgForm, title: e.target.value })}
                        />
                      </div>

                      <div className={styles.row2}>
                        <div className={styles.field}>
                          <label>Liên kết Lộ trình / Bài học</label>
                          <select
                            className={styles.select}
                            value={newAsgForm.linkedItem}
                            onChange={(e) => setNewAsgForm({ ...newAsgForm, linkedItem: e.target.value })}
                          >
                            <option value="">-- Không liên kết --</option>
                            {sortedChapters.map((chName) => (
                              <optgroup key={chName} label={chName}>
                                <option value={`chapter_${chName}`}>[Giao toàn bộ chương] {chName}</option>
                                {(groupedByChapter[chName] || []).map(m => (
                                  <option key={m.id} value={m.id}>
                                    Bài học: {m.title}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* File attachment section */}
                      <div className={styles.field}>
                        <label>Tài liệu đính kèm (đề bài, file mẫu...)</label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: newAsgForm.inputType === 'file' ? '#059669' : '#64748b' }}>
                            <input type="radio" name="asgInputType" value="file" checked={newAsgForm.inputType === 'file'} onChange={() => setNewAsgForm({ ...newAsgForm, inputType: 'file', linkUrl: '' })} style={{ accentColor: '#059669' }} />
                            Tải tệp từ máy
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: newAsgForm.inputType === 'link' ? '#059669' : '#64748b' }}>
                            <input type="radio" name="asgInputType" value="link" checked={newAsgForm.inputType === 'link'} onChange={() => setNewAsgForm({ ...newAsgForm, inputType: 'link', attachmentUrl: '', attachmentName: '', attachmentSize: '' })} style={{ accentColor: '#059669' }} />
                            Gắn link liên kết
                          </label>
                        </div>
                        {newAsgForm.inputType === 'link' ? (
                          <input
                            className={styles.input}
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
                            onDrop={async (e) => {
                              e.preventDefault(); setIsAsgDragging(false);
                              const file = e.dataTransfer.files[0];
                              if (!file) return;
                              setIsAsgUploading(true);
                              try {
                                const result = await api.uploadFile(file);
                                setNewAsgForm(prev => ({ ...prev, attachmentUrl: result.url, attachmentName: file.name, attachmentSize: `${(result.size / (1024*1024)).toFixed(1)} MB` }));
                                showToast('Đã tải tệp lên thành công!');
                              } catch { showToast('Tải tệp thất bại.', 'info'); }
                              finally { setIsAsgUploading(false); }
                            }}
                            style={{ border: `2px dashed ${isAsgDragging ? '#059669' : '#cbd5e1'}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', background: isAsgDragging ? '#f0fdf4' : '#f8fafc', textAlign: 'center', transition: 'all 0.2s' }}
                          >
                            <input ref={asgFileInputRef} type="file" style={{ display: 'none' }} onChange={async (e) => {
                              const file = e.target.files[0]; if (!file) return;
                              setIsAsgUploading(true);
                              try {
                                const result = await api.uploadFile(file);
                                setNewAsgForm(prev => ({ ...prev, attachmentUrl: result.url, attachmentName: file.name, attachmentSize: `${(result.size / (1024*1024)).toFixed(1)} MB` }));
                                showToast('Đã tải tệp lên thành công!');
                              } catch { showToast('Tải tệp thất bại.', 'info'); }
                              finally { setIsAsgUploading(false); e.target.value = ''; }
                            }} />
                            {isAsgUploading ? (
                              <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>⏳ Đang tải lên...</span>
                            ) : newAsgForm.attachmentName ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                <Paperclip size={16} color="#059669" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#059669', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{newAsgForm.attachmentName}</span>
                                {newAsgForm.attachmentSize && <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>({newAsgForm.attachmentSize})</span>}
                                <button type="button" onClick={(e) => { e.stopPropagation(); setNewAsgForm(prev => ({ ...prev, attachmentUrl: '', attachmentName: '', attachmentSize: '' })); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: 4, flexShrink: 0 }}>✕</button>
                              </div>
                            ) : (
                              <div>
                                <Upload size={20} color="#94a3b8" style={{ margin: '0 auto 4px' }} />
                                <span style={{ fontSize: 12, color: '#94a3b8' }}>Kéo thả hoặc <strong style={{ color: '#059669' }}>chọn tệp</strong></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label>Mô tả bài tập</label>
                        <textarea
                          className={styles.textarea}
                          rows={3}
                          placeholder="Mô tả nội dung bài tập, yêu cầu đề bài..."
                          value={newAsgForm.description}
                          onChange={(e) => setNewAsgForm({ ...newAsgForm, description: e.target.value })}
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Hướng dẫn nộp bài chi tiết</label>
                        <textarea
                          className={styles.textarea}
                          rows={2}
                          placeholder="Ví dụ: Nén mã nguồn .zip và nộp tại đây..."
                          value={newAsgForm.instructions}
                          onChange={(e) => setNewAsgForm({ ...newAsgForm, instructions: e.target.value })}
                        />
                      </div>

                      <div className={styles.row2}>
                        <div className={styles.field}>
                          <label>Hạn nộp</label>
                          <input
                            type="date"
                            className={styles.input}
                            required
                            value={newAsgForm.dueDate}
                            onChange={(e) => setNewAsgForm({ ...newAsgForm, dueDate: e.target.value })}
                          />
                        </div>
                        <div className={styles.field}>
                          <label>Điểm tối đa</label>
                          <input
                            type="number"
                            min="0.1"
                            max="10"
                            step="0.1"
                            className={styles.input}
                            value={newAsgForm.maxPoints}
                            onKeyDown={(e) => {
                              if (['e', 'E', '+', '-'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => setNewAsgForm({ ...newAsgForm, maxPoints: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button type="submit" className={styles.btnEmerald} style={{ flex: 1 }}>
                          {editingAssignmentId ? 'Lưu thay đổi' : 'Tạo bài tập & Đăng tải'}
                        </button>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          style={{ flex: 1 }}
                          onClick={() => {
                            setIsAssignmentModalOpen(false);
                            setEditingAssignmentId(null);
                          }}
                        >
                          Đóng
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ── Assignment Detail Modal ── */}
      {viewingAssignmentDetail && (() => {
        const asg = viewingAssignmentDetail;
        const meta = parseAssignmentDesc(asg.description);
        const timeInfo = calculateTimeRemaining(asg.dueDate);
        const asgSubs = submissions.filter(s => s.assignmentId === asg.id);
        const pct = Math.min(100, Math.round((asgSubs.length / (users.length || 1)) * 100));
        const hasAttachment = !!meta.attachmentUrl;
        const isImage = hasAttachment && /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(meta.attachmentUrl);
        const isVideo = hasAttachment && /\.(mp4|webm|ogg)($|\?)/i.test(meta.attachmentUrl);
        const ytMatch = hasAttachment && meta.attachmentUrl.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
        const ytId = ytMatch ? ytMatch[1] : null;
        const isCloudinary = hasAttachment && meta.attachmentUrl.includes('cloudinary.com');
        const isDocType = hasAttachment && /\.(pptx?|docx?|xlsx?)($|\?)/i.test(meta.attachmentUrl);
        const previewSrc = hasAttachment
          ? (isCloudinary && !isDocType
            ? meta.attachmentUrl.replace('/upload/', '/upload/fl_attachment:false/').split('?')[0] + '.pdf'
            : isDocType
              ? `https://docs.google.com/gview?url=${encodeURIComponent(meta.attachmentUrl)}&embedded=true`
              : meta.attachmentUrl)
          : null;
        return (
          <div className={styles.modalOverlay} onClick={() => setViewingAssignmentDetail(null)}>
            <div
              className={styles.modal}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 1100, width: '95%', padding: 0, overflow: 'hidden', borderRadius: 16, display: 'flex', flexDirection: 'column', height: '88vh' }}
            >
              {/* Header */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <ClipboardList size={16} color="#059669" />
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Chi tiết bài tập</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{asg.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  <button
                    type="button"
                    title="Chỉnh sửa bài tập"
                    onClick={() => { setViewingAssignmentDetail(null); handleEditAssignmentStart(asg); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#059669' }}
                  >
                    <Pencil size={13} /> Sửa
                  </button>
                  <button
                    type="button"
                    title="Xóa bài tập"
                    onClick={() => { setViewingAssignmentDetail(null); handleDeleteAssignment(asg.id); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#ef4444' }}
                  >
                    <Trash2 size={13} /> Xóa
                  </button>
                  <button type="button" onClick={() => setViewingAssignmentDetail(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <X size={16} color="#64748b" />
                  </button>
                </div>
              </div>

              {/* Body — 2-column layout */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Left: File preview */}
                {hasAttachment && (
                  <div style={{ flex: 1.4, background: '#0f172a', display: 'flex', flexDirection: 'column', minWidth: 340, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                        {meta.attachmentName || 'Tài liệu đính kèm'}
                        {meta.attachmentSize && <span style={{ marginLeft: 6, color: '#64748b' }}>({meta.attachmentSize})</span>}
                      </span>
                      <a href={meta.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#34d399', fontWeight: 700, textDecoration: 'none', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap' }}>
                        <ExternalLink size={12} /> Mở file
                      </a>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {ytId ? (
                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}`} title="YouTube" style={{ border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                      ) : isVideo ? (
                        <video src={meta.attachmentUrl} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%' }} />
                      ) : isImage ? (
                        <div style={{ overflow: 'auto', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={meta.attachmentUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Preview" />
                        </div>
                      ) : meta.attachmentName === 'Liên kết' ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                          <ExternalLink size={48} color="#3b82f6" style={{ marginBottom: 12 }} />
                          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Liên kết ngoài</p>
                          <a href={meta.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3b82f6', fontWeight: 700, textDecoration: 'none', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '8px 18px', marginTop: 10 }}>
                            <ExternalLink size={14} /> Mở liên kết
                          </a>
                        </div>
                      ) : (
                        <iframe src={previewSrc} title="Document Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
                      )}
                    </div>
                  </div>
                )}

                {/* Right: Details */}
                <div style={{ width: hasAttachment ? 420 : '100%', background: '#fff', display: 'flex', flexDirection: 'column', borderLeft: hasAttachment ? '1px solid #e2e8f0' : 'none', overflowY: 'auto' }}>
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Badges row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                    ★ {asg.maxPoints} điểm
                  </span>
                  <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: timeInfo.color, background: timeInfo.bg, border: `1px solid ${timeInfo.color}33` }}>
                    ⏰ {timeInfo.text}
                  </span>
                  {asg.dueDate && (
                    <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                      Hạn: {new Date(asg.dueDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>

                {/* Linked material */}
                {meta.linkedTitle && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13, color: '#166534', fontWeight: 600 }}>
                    <BookOpen size={14} /> Liên kết: {meta.linkedTitle}
                  </div>
                )}

                {/* Description */}
                {meta.desc && (
                  <div>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Mô tả bài tập</p>
                    <p style={{ margin: 0, fontSize: 14, color: '#1e293b', lineHeight: 1.6, background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>{meta.desc}</p>
                  </div>
                )}

                {/* Instructions */}
                {meta.instructions && (
                  <div>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Hướng dẫn nộp bài</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.6, background: '#fffbeb', padding: '10px 14px', borderRadius: 8, border: '1px solid #fde68a', whiteSpace: 'pre-wrap' }}>{meta.instructions}</p>
                  </div>
                )}

                {/* Attachment */}
                {meta.attachmentUrl && (
                  <div>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Tài liệu đính kèm</p>
                    <a
                      href={meta.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}
                    >
                      <Paperclip size={14} />
                      {meta.attachmentName || 'Xem tài liệu'}
                      {meta.attachmentSize && <span style={{ fontWeight: 400, color: '#64748b' }}>({meta.attachmentSize})</span>}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {/* Submission progress */}
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#334155' }}>
                    <span>Tiến độ nộp bài</span>
                    <span style={{ color: '#059669' }}>{asgSubs.length}/{users.length} ({pct}%)</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#059669,#34d399)', borderRadius: 999, transition: 'width 0.4s' }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setViewingAssignmentDetail(null); setViewingSubmissionsForAsgId(asg.id); }}
                    style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Xem danh sách nộp bài →
                  </button>
                </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {viewingSubmissionsForAsgId && (
        (() => {
          const asg = assignments.find(a => a.id === viewingSubmissionsForAsgId);
          if (!asg) return null;
          
          const asgSubs = submissions.filter(s => s.assignmentId === asg.id);
          const submittedUserIds = asgSubs.map(s => s.studentId);
          
          const submittedUsers = users.filter(u => submittedUserIds.includes(u.id));
          const pendingUsers = users.filter(u => !submittedUserIds.includes(u.id));

          return (
            <div className={styles.modalOverlay} onClick={() => setViewingSubmissionsForAsgId(null)}>
              <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, padding: 0, overflow: 'hidden' }}>
                <div className={styles.modalHeader} style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: 0 }}>
                  <div>
                    <h3 className={styles.modalTitle} style={{ fontSize: 16 }}>Tình trạng nộp bài: {asg.title}</h3>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>{submittedUsers.length} / {users.length} học viên đã nộp</p>
                  </div>
                  <button type="button" className={styles.iconBtn} onClick={() => setViewingSubmissionsForAsgId(null)}>
                    <X size={16} />
                  </button>
                </div>
                
                <div style={{ padding: '0 24px' }}>
                  <div className={styles.subModalTabs} style={{ marginTop: 16 }}>
                    <button 
                      className={`${styles.subTab} ${subTab === 'submitted' ? styles.subTabActive : ''}`}
                      onClick={() => setSubTab('submitted')}
                    >
                      Đã nộp ({submittedUsers.length})
                    </button>
                    <button 
                      className={`${styles.subTab} ${subTab === 'pending' ? styles.subTabActive : ''}`}
                      onClick={() => setSubTab('pending')}
                    >
                      Chưa nộp ({pendingUsers.length})
                    </button>
                  </div>

                  <div className={styles.subList} style={{ marginBottom: 24 }}>
                    {subTab === 'submitted' && (
                      submittedUsers.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '20px 0' }}>Chưa có học viên nào nộp bài.</p>
                      ) : (
                        submittedUsers.map(u => {
                          return (
                            <div key={u.id} className={styles.subItem}>
                              <div className={styles.subItemInfo}>
                                <span className={styles.subItemName}>{u.name}</span>
                                <span className={styles.subItemEmail}>{u.email}</span>
                              </div>
                              <div className={styles.subItemTime}>
                                <Check size={14} /> Đã nộp
                              </div>
                            </div>
                          );
                        })
                      )
                    )}
                    
                    {subTab === 'pending' && (
                      pendingUsers.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '20px 0' }}>Tuyệt vời! Tất cả học viên đã nộp bài.</p>
                      ) : (
                        pendingUsers.map(u => (
                          <div key={u.id} className={styles.subItem}>
                            <div className={styles.subItemInfo}>
                              <span className={styles.subItemName}>{u.name}</span>
                              <span className={styles.subItemEmail}>{u.email}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                              Chưa nộp
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
