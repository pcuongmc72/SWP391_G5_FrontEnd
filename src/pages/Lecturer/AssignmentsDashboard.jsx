import { useMemo, useState } from 'react';
import { Pencil, Trash2, Plus, Search, Clock, CheckSquare, X, Check, BookOpen, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';
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
  
  const [newAsgForm, setNewAsgForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxPoints: 10,
    linkedItem: '',
    type: 'individual',
    instructions: '',
  });

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
        };
      } catch (e) {
        // fallback
      }
    }
    return { desc: rawDesc, linkedItem: '', linkedTitle: '', type: 'individual', instructions: '' };
  };

  const serializeAssignmentDesc = (data) => {
    return JSON.stringify({
      desc: data.desc || '',
      linkedItem: data.linkedItem || '',
      linkedTitle: data.linkedTitle || '',
      type: data.type || 'individual',
      instructions: data.instructions || '',
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
        type: newAsgForm.type,
        instructions: newAsgForm.instructions,
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
        type: 'individual',
        instructions: '',
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
      type: meta.type,
      instructions: meta.instructions,
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
                type: 'individual',
                instructions: '',
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
                    <div key={asg.id} className={styles.assignmentCard}>
                      <div className={styles.asgCardHeader}>
                        <span className={styles.scoreBadge}>Thang điểm: {asg.maxPoints}đ</span>
                        <div className={styles.asgActionGroup}>
                          <button
                            type="button"
                            className={styles.miniIconBtn}
                            onClick={() => handleEditAssignmentStart(asg)}
                            title="Sửa bài tập"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className={styles.miniIconBtn}
                            style={{ color: '#ef4444' }}
                            onClick={() => handleDeleteAssignment(asg.id)}
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
                        onClick={() => setViewingSubmissionsForAsgId(asg.id)}
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

      {isAssignmentModalOpen && (
        <div className={styles.modalOverlay} onClick={() => {
          setIsAssignmentModalOpen(false);
          setEditingAssignmentId(null);
        }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingAssignmentId ? 'Cập nhật bài tập' : 'Soạn bài tập mới'}
              </h3>
              <button type="button" className={styles.iconBtn} onClick={() => {
                setIsAssignmentModalOpen(false);
                setEditingAssignmentId(null);
              }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveAssignment}>
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
                <div className={styles.field}>
                  <label>Hình thức nộp bài</label>
                  <select
                    className={styles.select}
                    value={newAsgForm.type}
                    onChange={(e) => setNewAsgForm({ ...newAsgForm, type: e.target.value })}
                  >
                    <option value="individual">Cá nhân (Individual)</option>
                    <option value="group">Nhóm (Group)</option>
                  </select>
                </div>
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
                  placeholder="Ví dụ: Nén mã nguồn .zip và nộp tại đây, không nộp file .exe..."
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

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
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
            </form>
          </div>
        </div>
      )}

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
