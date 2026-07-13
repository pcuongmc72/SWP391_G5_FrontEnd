import { useEffect, useState, useMemo } from 'react';
import { Check, MessageSquare, Send, Search, Pencil, X, Filter } from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './LecturerDashboard.module.css';

export default function FeedbackDashboard() {
  const {
    classesLoading, classesError, workspaceLoading,
    feedbacks, api
  } = useLecturerWorkspace();

  const [toast, setToast] = useState(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState('');
  const [responseText, setResponseText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | OPEN | RESOLVED
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false); // editing existing response

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Normalize status for safe comparison
  const isOpen = (status) => status?.toUpperCase() === 'OPEN';
  const isResolved = (status) => status?.toUpperCase() === 'RESPONDED' || status?.toUpperCase() === 'RESOLVED';

  // Filtered & sorted list
  const filteredFeedbacks = useMemo(() => {
    let list = [...feedbacks];

    // Filter by status tab
    if (filterStatus === 'OPEN') list = list.filter(f => isOpen(f.status));
    if (filterStatus === 'RESOLVED') list = list.filter(f => isResolved(f.status));

    // Search by sender name or message content
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f =>
        f.senderName?.toLowerCase().includes(q) ||
        f.title?.toLowerCase().includes(q) ||
        f.message?.toLowerCase().includes(q)
      );
    }

    // Sort: OPEN first, then newest
    list.sort((a, b) => {
      if (isOpen(a.status) && !isOpen(b.status)) return -1;
      if (!isOpen(a.status) && isOpen(b.status)) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list;
  }, [feedbacks, filterStatus, searchQuery]);

  const openCount = feedbacks.filter(f => isOpen(f.status)).length;
  const resolvedCount = feedbacks.filter(f => isResolved(f.status)).length;

  useEffect(() => {
    if (filteredFeedbacks.length && !selectedFeedbackId) {
      setSelectedFeedbackId(filteredFeedbacks[0].id);
    }
  }, [filteredFeedbacks, selectedFeedbackId]);

  // When switching feedback, reset edit mode
  const handleSelectFeedback = (id) => {
    setSelectedFeedbackId(id);
    setIsEditing(false);
    setResponseText('');
  };

  const activeFeedback = feedbacks.find(f => f.id === selectedFeedbackId);

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim() || !selectedFeedbackId) return;
    try {
      await api.respondFeedback(selectedFeedbackId, { response: responseText.trim() });
      setResponseText('');
      setIsEditing(false);
      showToast('Đã gửi phản hồi đến học viên!');
    } catch (err) {
      showToast(err.message || 'Gửi phản hồi thất bại.', 'info');
    }
  };

  const handleStartEdit = () => {
    setResponseText(activeFeedback?.response || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setResponseText('');
    setIsEditing(false);
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
        <p className={styles.loading} style={{ color: '#b91c1c' }}>{classesError}</p>
      )}

      <div className={styles.panel}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className={styles.panelTitle} style={{ margin: 0 }}>Giải đáp phản hồi học viên</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 12, padding: '4px 10px', background: '#fff7ed', color: '#c2410c', borderRadius: 20, fontWeight: 700, border: '1px solid #fed7aa' }}>
              {openCount} đang đợi
            </span>
            <span style={{ fontSize: 12, padding: '4px 10px', background: '#ecfdf5', color: '#047857', borderRadius: 20, fontWeight: 700, border: '1px solid #a7f3d0' }}>
              {resolvedCount} đã giải đáp
            </span>
          </div>
        </div>

        {/* Search + Filter bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Tìm theo tên học viên, tiêu đề..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          {/* Status tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2, flexShrink: 0 }}>
            {[
              { key: 'ALL', label: 'Tất cả', count: feedbacks.length },
              { key: 'OPEN', label: 'Đang đợi', count: openCount },
              { key: 'RESOLVED', label: 'Đã giải đáp', count: resolvedCount },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterStatus(tab.key)}
                style={{
                  padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: filterStatus === tab.key ? '#fff' : 'transparent',
                  color: filterStatus === tab.key ? '#059669' : '#64748b',
                  boxShadow: filterStatus === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {tab.label}
                <span style={{
                  background: filterStatus === tab.key ? '#ecfdf5' : '#e2e8f0',
                  color: filterStatus === tab.key ? '#059669' : '#64748b',
                  borderRadius: 99, padding: '0 6px', fontSize: 10, fontWeight: 800,
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.feedbackWorkspace}>
          {/* Left panel: feedback list */}
          <div className={styles.feedbackListPanel}>
            {filteredFeedbacks.map(f => {
              const isSelected = f.id === selectedFeedbackId;
              const open = isOpen(f.status);
              return (
                <div
                  key={f.id}
                  className={`${styles.feedbackItemCard} ${isSelected ? styles.feedbackItemCardActive : ''}`}
                  onClick={() => handleSelectFeedback(f.id)}
                  style={{ position: 'relative' }}
                >
                  {/* Unread dot */}
                  {open && (
                    <span style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
                  )}
                  <div className={styles.feedbackItemHeader}>
                    <strong className={styles.feedbackSender}>{f.senderName || 'Học viên'}</strong>
                    <span className={`${styles.statusPill} ${open ? styles.statusWarning : styles.statusSuccess}`}
                      style={{ marginRight: 16 }}>
                      {open ? 'Đang đợi' : 'Đã giải đáp'}
                    </span>
                  </div>
                  <h5 className={styles.feedbackItemTitle}>{f.title}</h5>
                  <p className={styles.feedbackItemSnippet} style={{ WebkitLineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                    {f.message}
                  </p>
                  <small style={{ color: '#94a3b8' }}>
                    {f.createdAt ? new Date(f.createdAt).toLocaleString('vi-VN') : ''}
                  </small>
                </div>
              );
            })}

            {filteredFeedbacks.length === 0 && (
              <div className={styles.emptyBox} style={{ border: 'none', background: 'transparent', textAlign: 'center' }}>
                <Filter size={32} color="#cbd5e1" style={{ marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                  {feedbacks.length === 0 ? 'Lớp học chưa có phản hồi nào.' : 'Không tìm thấy phản hồi phù hợp.'}
                </p>
              </div>
            )}
          </div>

          {/* Right panel: feedback detail */}
          <div className={styles.feedbackDetailPanel}>
            {activeFeedback ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', flex: 1 }}>
                      {activeFeedback.title}
                    </h4>
                    <span className={`${styles.statusBadge} ${isResolved(activeFeedback.status) ? styles.statusSuccess : styles.statusWarning}`}>
                      {isResolved(activeFeedback.status) ? '✅ Đã giải quyết' : '⏳ Chưa giải quyết'}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
                    Gửi bởi: <strong>{activeFeedback.senderName || 'Học viên'}</strong>
                    {activeFeedback.senderId && (
                      <span style={{ marginLeft: 6, background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace' }}>
                        {activeFeedback.senderId.slice(0, 8)}...
                      </span>
                    )}
                    {' '}vào lúc {activeFeedback.createdAt ? new Date(activeFeedback.createdAt).toLocaleString('vi-VN') : ''}
                  </p>
                </div>

                {/* Message */}
                <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                    <strong style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      Nội dung thắc mắc
                    </strong>
                    <p style={{ margin: 0, fontSize: 13, color: '#0f172a', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {activeFeedback.message}
                    </p>
                  </div>

                  {/* Existing response */}
                  {isResolved(activeFeedback.status) && activeFeedback.response && !isEditing && (
                    <div style={{ background: '#ecfdf5', padding: 16, borderRadius: 12, border: '1px solid #34d399', borderLeftWidth: 5, position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <strong style={{ fontSize: 11, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Phản hồi của bạn
                        </strong>
                        {/* Edit button */}
                        <button
                          type="button"
                          title="Sửa phản hồi"
                          onClick={handleStartEdit}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fff', border: '1px solid #86efac', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#059669' }}
                        >
                          <Pencil size={12} /> Sửa
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#065f46', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {activeFeedback.response}
                      </p>
                      <small style={{ color: '#059669', display: 'block', marginTop: 8, fontSize: 11 }}>
                        Đã phản hồi vào lúc {activeFeedback.respondedAt ? new Date(activeFeedback.respondedAt).toLocaleString('vi-VN') : ''}
                      </small>
                    </div>
                  )}
                </div>

                {/* Reply / Edit Form */}
                {(isOpen(activeFeedback.status) || isEditing) && (
                  <form onSubmit={handleSendResponse} style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 16 }}>
                    <div className={styles.field} style={{ margin: 0 }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                          {isEditing ? '✏️ Sửa phản hồi' : 'Câu trả lời / Giải đáp của Giảng viên'}
                        </span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          Học viên sẽ nhận được thông báo ngay lập tức
                        </span>
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <textarea
                          className={styles.textarea}
                          rows={3}
                          required
                          placeholder="Nhập nội dung giải đáp thắc mắc..."
                          value={responseText}
                          onChange={e => setResponseText(e.target.value)}
                          style={{ flexGrow: 1, resize: 'vertical' }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <button type="submit" className={styles.btnEmerald} style={{ width: 'auto', flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <Send size={16} />
                            <span style={{ fontSize: 11 }}>Gửi</span>
                          </button>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              style={{ padding: '6px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <MessageSquare size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: 14 }}>Chọn một phản hồi bên trái để xem chi tiết và giải đáp.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
