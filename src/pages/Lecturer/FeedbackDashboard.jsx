import { useEffect, useState, useMemo, useRef } from 'react';
import { MessageSquare, Send, Search, Pencil, X, Loader2, Check, BookOpen } from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';

// ─── helpers ───────────────────────────────────────────────
const getInitial = (name) => (name || 'S').charAt(0).toUpperCase();
const isOpen      = (s) => String(s || '').toUpperCase() === 'OPEN';
const isResolved  = (s) => ['RESPONDED', 'RESOLVED'].includes(String(s || '').toUpperCase());
const fmtDate     = (d) => d ? new Date(d).toLocaleString('vi-VN') : '';
const getMaterialLabel = (f) => {
  if (f.materialTitle) return f.materialTitle;
  if (f.title?.startsWith('Hỏi về: ')) return f.title.replace('Hỏi về: ', '');
  return null;
};
const responderLabel = (f) => {
  if (!f.answeredByName) return 'Giảng viên';
  const role = String(f.answeredByRole || '').toLowerCase();
  if (role.includes('assistant')) return 'Trợ giảng';
  return 'Giảng viên';
};

export default function FeedbackDashboard() {
  const { classesLoading, workspaceLoading, feedbacks, api } = useLecturerWorkspace();

  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast]               = useState(null);

  // Per-card reply state
  const [replyingTo, setReplyingTo]       = useState(null); // feedbackId
  const [replyText, setReplyText]         = useState('');
  const [isEditingReply, setIsEditingReply] = useState(false);
  const replyRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Filtered list ──────────────────────────────────────────
  const openCount     = feedbacks.filter(f => isOpen(f.status)).length;
  const resolvedCount = feedbacks.filter(f => isResolved(f.status)).length;

  const filtered = useMemo(() => {
    let list = [...feedbacks];
    if (filterStatus === 'OPEN')     list = list.filter(f => isOpen(f.status));
    if (filterStatus === 'RESOLVED') list = list.filter(f => isResolved(f.status));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f =>
        f.senderName?.toLowerCase().includes(q) ||
        f.title?.toLowerCase().includes(q) ||
        f.message?.toLowerCase().includes(q)
      );
    }
    // OPEN first, then newest
    list.sort((a, b) => {
      if (isOpen(a.status) && !isOpen(b.status)) return -1;
      if (!isOpen(a.status) && isOpen(b.status)) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return list;
  }, [feedbacks, filterStatus, searchQuery]);

  // ── Actions ───────────────────────────────────────────────
  const openReply = (feedbackId, existingResponse = '') => {
    setReplyingTo(feedbackId);
    setReplyText(existingResponse);
    setIsEditingReply(!!existingResponse);
    setTimeout(() => replyRef.current?.focus(), 80);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
    setIsEditingReply(false);
  };

  const handleSendResponse = async (feedbackId) => {
    if (!replyText.trim()) return;
    try {
      setIsSubmitting(true);
      await api.respondFeedback(feedbackId, { response: replyText.trim() });
      cancelReply();
      showToast('✅ Đã gửi phản hồi đến học viên!');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Gửi phản hồi thất bại.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (classesLoading || workspaceLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
        <p className="text-sm text-gray-400">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="relative pb-12">

      {/* ── Toast ─────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-bold transition-all
          ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          <Check size={15} /> {toast.msg}
        </div>
      )}

      {/* ── Page header ───────────────────── */}
      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Hỏi - Đáp lớp học</h2>
        <p className="text-xs text-gray-500">Xem và giải đáp thắc mắc của học viên trong lớp học của bạn.</p>
      </div>

      {/* ── Toolbar ───────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-3 items-center mb-5">
        {/* Status tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1 flex-shrink-0">
          {[
            { key: 'ALL',      label: 'Tất cả',     count: feedbacks.length },
            { key: 'OPEN',     label: 'Chờ trả lời', count: openCount },
            { key: 'RESOLVED', label: 'Đã giải đáp', count: resolvedCount },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5
                ${filterStatus === tab.key ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
              <span className={`text-[10px] font-extrabold px-1.5 rounded-full
                ${filterStatus === tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full text-xs pl-8 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50 transition"
            placeholder="Tìm theo tên học viên, tiêu đề, nội dung..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Feed ──────────────────────────── */}
      <div className="max-w-2xl mx-auto space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <MessageSquare size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-500">
              {feedbacks.length === 0 ? 'Lớp học chưa có câu hỏi nào.' : 'Không tìm thấy câu hỏi phù hợp.'}
            </p>
          </div>
        ) : filtered.map(f => {
          const answered     = isResolved(f.status);
          const materialLabel = getMaterialLabel(f);
          const isReplying   = replyingTo === f.id;

          return (
            <div
              key={f.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md
                ${!answered ? 'border-amber-200' : 'border-gray-200'}`}
            >
              {/* ── Question Header ── */}
              <div className="p-4 pb-3">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center shrink-0 select-none">
                    {getInitial(f.senderName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">{f.senderName || 'Học viên'}</span>
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Học viên</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${answered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {answered ? '✅ Đã giải đáp' : '⏳ Chờ trả lời'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-gray-400">{fmtDate(f.createdAt)}</span>
                      {materialLabel && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                          <BookOpen size={10} /> {materialLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title + Body */}
                <h4 className="font-bold text-[15px] text-gray-900 mt-3 leading-snug">{f.title}</h4>
                <p className="text-[13px] text-gray-700 mt-1.5 leading-relaxed whitespace-pre-wrap">{f.message}</p>
              </div>

              <div className="mx-4 border-t border-gray-100" />

              {/* ── Existing Response (answered) ── */}
              {answered && f.response && !isReplying && (
                <div className="px-4 py-3 bg-emerald-50/60">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {getInitial(f.answeredByName || 'GV')}
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-emerald-100 shadow-sm">
                        {/* Responder info */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-bold text-emerald-800">{f.answeredByName || 'Giảng viên'}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                            ${responderLabel(f) === 'Trợ giảng' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {responderLabel(f)}
                          </span>
                          {f.respondedAt && (
                            <span className="text-[10px] text-gray-400 ml-auto">{fmtDate(f.respondedAt)}</span>
                          )}
                        </div>

                        <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">{f.response}</p>

                        {/* Edit button (lecturer can always re-answer) */}
                        <button
                          onClick={() => openReply(f.id, f.response)}
                          className="mt-2 text-[11px] text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil size={11} /> Sửa / Bổ sung câu trả lời
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Reply Box (for both OPEN and editing) ── */}
              {((!answered && !isReplying) || (answered && !isReplying)) && !answered && (
                <div className="px-4 py-3">
                  <button
                    onClick={() => openReply(f.id)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <MessageSquare size={14} /> Giải đáp câu hỏi này
                  </button>
                </div>
              )}

              {isReplying && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      GV
                    </div>
                    <div className="flex-1 space-y-2">
                      <textarea
                        ref={replyRef}
                        className="w-full text-sm p-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white resize-none"
                        placeholder={isEditingReply ? 'Sửa câu trả lời...' : 'Nhập câu trả lời của giảng viên...'}
                        rows={3}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">Học viên sẽ nhận được thông báo ngay lập tức</span>
                        <div className="flex gap-2">
                          <button
                            onClick={cancelReply}
                            className="text-xs text-gray-500 hover:underline cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleSendResponse(f.id)}
                            disabled={isSubmitting || !replyText.trim()}
                            className="text-xs font-bold bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:bg-emerald-700 transition"
                          >
                            {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            {isEditingReply ? 'Cập nhật' : 'Gửi trả lời'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
