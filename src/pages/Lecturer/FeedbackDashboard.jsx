import { useEffect, useState } from 'react';
import { Check, X, MessageSquare, Send } from 'lucide-react';
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (feedbacks.length && !selectedFeedbackId) {
      setSelectedFeedbackId(feedbacks[0].id);
    }
  }, [feedbacks, selectedFeedbackId]);

  const activeFeedback = feedbacks.find((f) => f.id === selectedFeedbackId);
  const openFeedbackCount = feedbacks.filter((f) => f.status === 'OPEN').length;

  const handleSendFeedbackResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim() || !selectedFeedbackId) return;
    try {
      await api.respondFeedback(selectedFeedbackId, { response: responseText.trim() });
      setResponseText('');
      showToast('Đã phản hồi sinh viên!');
    } catch (err) {
      showToast(err.message || 'Gửi phản hồi thất bại.', 'info');
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className={styles.panelTitle} style={{ margin: 0 }}>Giải đáp phản hồi học viên</h3>
          <span style={{ fontSize: 12, padding: '4px 10px', background: '#ecfdf5', color: '#047857', borderRadius: 20, fontWeight: 700 }}>
            {openFeedbackCount} thắc mắc đang mở
          </span>
        </div>

        <div className={styles.feedbackWorkspace}>
          {/* Left panel: feedback items list */}
          <div className={styles.feedbackListPanel}>
            {feedbacks.map((f) => {
              const isSelected = f.id === selectedFeedbackId;
              return (
                <div
                  key={f.id}
                  className={`${styles.feedbackItemCard} ${isSelected ? styles.feedbackItemCardActive : ''}`}
                  onClick={() => setSelectedFeedbackId(f.id)}
                >
                  <div className={styles.feedbackItemHeader}>
                    <strong className={styles.feedbackSender}>{f.senderName}</strong>
                    <span className={`${styles.statusPill} ${f.status === 'RESOLVED' ? styles.statusSuccess : styles.statusWarning}`}>
                      {f.status === 'RESOLVED' ? 'Đã giải đáp' : 'Đang đợi'}
                    </span>
                  </div>
                  <h5 className={styles.feedbackItemTitle}>{f.title}</h5>
                  <p className={styles.feedbackItemSnippet}>{f.message}</p>
                  <small style={{ color: '#94a3b8' }}>
                    {f.createdAt ? new Date(f.createdAt).toLocaleDateString('vi-VN') : ''}
                  </small>
                </div>
              );
            })}

            {feedbacks.length === 0 && (
              <div className={styles.emptyBox} style={{ border: 'none', background: 'transparent' }}>
                Lớp học chưa có phản hồi nào từ học sinh.
              </div>
            )}
          </div>

          {/* Right panel: active feedback detail & reply form */}
          <div className={styles.feedbackDetailPanel}>
            {activeFeedback ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{activeFeedback.title}</h4>
                    <span className={`${styles.statusBadge} ${activeFeedback.status === 'RESOLVED' ? styles.statusSuccess : styles.statusWarning}`}>
                      {activeFeedback.status === 'RESOLVED' ? 'Đã giải quyết' : 'Chưa giải quyết'}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
                    Gửi bởi: <strong>{activeFeedback.senderName}</strong> (ID: {activeFeedback.senderId}) vào lúc{' '}
                    {activeFeedback.createdAt ? new Date(activeFeedback.createdAt).toLocaleString('vi-VN') : ''}
                  </p>
                </div>

                {/* Message */}
                <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                    <strong style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Nội dung thắc mắc</strong>
                    <p style={{ margin: 0, fontSize: 13, color: '#0f172a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {activeFeedback.message}
                    </p>
                  </div>

                  {activeFeedback.status === 'RESOLVED' && (
                    <div style={{ background: '#ecfdf5', padding: 16, borderRadius: 12, border: '1px solid #34d399', borderLeftWidth: 5 }}>
                      <strong style={{ display: 'block', fontSize: 11, color: '#047857', textTransform: 'uppercase', marginBottom: 4 }}>Phản hồi của bạn</strong>
                      <p style={{ margin: 0, fontSize: 13, color: '#065f46', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {activeFeedback.response}
                      </p>
                      <small style={{ color: '#059669', display: 'block', marginTop: 8 }}>
                        Đã phản hồi vào lúc {activeFeedback.respondedAt ? new Date(activeFeedback.respondedAt).toLocaleString('vi-VN') : ''}
                      </small>
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                {activeFeedback.status === 'OPEN' && (
                  <form onSubmit={handleSendFeedbackResponse} style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 16 }}>
                    <div className={styles.field} style={{ margin: 0 }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span>Câu trả lời / Giải đáp của Giảng viên</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Học viên sẽ nhận được thông báo ngay lập tức</span>
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <textarea
                          className={styles.textarea}
                          rows={3}
                          required
                          placeholder="Nhập nội dung giải đáp thắc mắc..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          style={{ flexGrow: 1, resize: 'none' }}
                        />
                        <button type="submit" className={styles.btnEmerald} style={{ width: 'auto', alignSelf: 'stretch', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Send size={16} />
                          <span style={{ fontSize: 12 }}>Gửi</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <MessageSquare size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: 14 }}>Chọn một phản hồi bên trái để xem chi tiết và giải đáp.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
