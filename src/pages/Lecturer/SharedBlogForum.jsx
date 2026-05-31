import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './SharedBlogForum.module.css';

function SharedBlogForum() {
  const { users, activeClass, threads, api } = useLecturerWorkspace();
  const [replyText, setReplyText] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState('');

  const classThreads = threads.filter(
    (t) => !activeClass?.id || !t.classId || t.classId === activeClass.id
  );

  const selected = classThreads.find((t) => t.id === selectedThreadId) || classThreads[0];

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selected) return;
    try {
      await api.addReply(selected.id, { content: replyText.trim() });
      setReplyText('');
    } catch {
      /* api.reload handles errors via context */
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        <h3 className={styles.listTitle}>Chủ đề thảo luận</h3>
        {classThreads.map((t) => {
          const author = users.find((u) => u.id === t.authorId);
          return (
            <button
              key={t.id}
              type="button"
              className={`${styles.threadBtn} ${selected?.id === t.id ? styles.threadActive : ''}`}
              onClick={() => setSelectedThreadId(t.id)}
            >
              <MessageSquare size={14} />
              <div>
                <p className={styles.threadTitle}>{t.title}</p>
                <p className={styles.threadMeta}>{author?.name} · {t.createdAt}</p>
              </div>
            </button>
          );
        })}
        {classThreads.length === 0 && (
          <p className={styles.empty}>Chưa có chủ đề. Sinh viên sẽ tạo từ cổng SV.</p>
        )}
      </div>

      <div className={styles.detail}>
        {selected ? (
          <>
            <h3 className={styles.detailTitle}>{selected.title}</h3>
            <p className={styles.detailContent}>{selected.content}</p>
            <div className={styles.replies}>
              {(selected.replies || []).map((r) => {
                const author = users.find((u) => u.id === r.authorId);
                return (
                  <div key={r.id} className={styles.reply}>
                    <strong>{author?.name || 'Ẩn danh'}</strong>
                    <p>{r.content}</p>
                  </div>
                );
              })}
            </div>
            <form className={styles.replyForm} onSubmit={handleReply}>
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Viết bình luận của bạn..."
                className={styles.replyInput}
              />
              <button type="submit" className={styles.replySubmit}>
                <Send size={14} /> Gửi
              </button>
            </form>
          </>
        ) : (
          <p className={styles.empty}>Chọn chủ đề để xem thảo luận.</p>
        )}
      </div>
    </div>
  );
}

export default SharedBlogForum;
