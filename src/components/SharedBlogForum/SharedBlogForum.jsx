/**
 * SharedBlogForum — Stub component
 * TODO: Implement full blog/forum feature
 */
function SharedBlogForum({ threads, setThreads, currentUser }) {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      color: '#64748b',
      background: '#f8fafc',
      borderRadius: '1rem',
      border: '1px dashed #e2e8f0',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Blog & Forum</p>
      <p style={{ fontSize: '0.8125rem' }}>Component đang được phát triển.</p>
    </div>
  );
}

export default SharedBlogForum;
