import { useEffect, useState, useMemo, useRef } from 'react';
import { MessageSquare, Send, Search, Pencil, X, Loader2, Check, BookOpen, User } from 'lucide-react';
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

  const [activeFeedbackId, setActiveFeedbackId] = useState(null);

  // Per-card reply state
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

  const activeFeedback = useMemo(() => {
    return feedbacks.find(f => f.id === activeFeedbackId) || null;
  }, [feedbacks, activeFeedbackId]);

  // When clicking a feedback, auto-focus reply if OPEN, or set replyText if modifying
  const handleSelectFeedback = (f) => {
    setActiveFeedbackId(f.id);
    if (isResolved(f.status) && f.response) {
      setReplyText('');
      setIsEditingReply(false);
    } else {
      setReplyText('');
      setIsEditingReply(false);
      setTimeout(() => replyRef.current?.focus(), 100);
    }
  };

  const handleEditResponse = () => {
    if (activeFeedback) {
      setReplyText(activeFeedback.response || '');
      setIsEditingReply(true);
      setTimeout(() => replyRef.current?.focus(), 100);
    }
  };

  const handleSendResponse = async () => {
    if (!replyText.trim() || !activeFeedbackId) return;
    try {
      setIsSubmitting(true);
      await api.respondFeedback(activeFeedbackId, { response: replyText.trim() });
      showToast('✅ Đã gửi phản hồi đến học viên!');
      setReplyText('');
      setIsEditingReply(false);
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
    <div className="relative pb-12 h-full">

      {/* ── Toast ─────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-bold transition-all
          ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          <Check size={15} /> {toast.msg}
        </div>
      )}

      {/* ── Page header ───────────────────── */}
      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Hỏi - Đáp lớp học</h2>
        <p className="text-xs text-gray-500">Xem và giải đáp thắc mắc của học viên trong lớp học của bạn.</p>
      </div>

      {/* ── 2-COLUMN LAYOUT ───────────────────────── */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 160px)', minHeight: 500 }}>
        
        {/* LEFT COLUMN: LIST */}
        <div className="w-[320px] lg:w-[380px] xl:w-[420px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden shrink-0">
          
          {/* Filters & Search */}
          <div className="p-4 border-b border-gray-100 flex flex-col gap-3 shrink-0">
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
              {[
                { key: 'ALL',      label: 'Tất cả',     count: feedbacks.length },
                { key: 'OPEN',     label: 'Chờ trả lời', count: openCount },
                { key: 'RESOLVED', label: 'Đã giải đáp', count: resolvedCount },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`flex-1 px-2 py-1.5 text-[11px] lg:text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer flex justify-center items-center gap-1.5
                    ${filterStatus === tab.key ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.label}
                  <span className={`text-[9px] lg:text-[10px] font-extrabold px-1.5 rounded-full
                    ${filterStatus === tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full text-xs pl-8 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50 transition"
                placeholder="Tìm tên học viên, tiêu đề..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* List Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-400">Không có câu hỏi nào.</p>
              </div>
            ) : filtered.map(f => {
              const answered = isResolved(f.status);
              const isActive = activeFeedbackId === f.id;
              
              return (
                <div
                  key={f.id}
                  onClick={() => handleSelectFeedback(f)}
                  className={`p-3.5 rounded-xl cursor-pointer border transition-all ${isActive ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                        {getInitial(f.senderName)}
                      </div>
                      <span className="text-xs font-bold text-gray-900 truncate">{f.senderName || 'Học viên'}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 mt-1">{fmtDate(f.createdAt).split(' ')[1]}</span>
                  </div>
                  <h4 className={`text-sm font-bold truncate mb-1.5 ${isActive ? 'text-emerald-900' : 'text-gray-800'}`}>{f.title}</h4>
                  <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed mb-2">{f.message}</p>
                  
                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase
                      ${answered ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>
                      {answered ? '✅ Đã giải đáp' : '⏳ Chờ trả lời'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL & REPLY */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden relative">
          {activeFeedback ? (
            <>
              {/* Detail Area */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50/30">
                {/* Student Question */}
                <div className="mb-8 max-w-3xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 font-bold text-lg flex items-center justify-center shrink-0 select-none">
                      {getInitial(activeFeedback.senderName)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-lg">{activeFeedback.senderName || 'Học viên'}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{fmtDate(activeFeedback.createdAt)}</span>
                        {getMaterialLabel(activeFeedback) && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                              <BookOpen size={12} /> {getMaterialLabel(activeFeedback)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 leading-snug">{activeFeedback.title}</h2>
                  <div className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    {activeFeedback.message}
                  </div>
                </div>

                {/* Response History */}
                {isResolved(activeFeedback.status) && activeFeedback.response && (
                  <div className="pl-4 lg:pl-6 border-l-2 border-emerald-200 max-w-3xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 select-none">
                        {getInitial(activeFeedback.answeredByName || 'GV')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-emerald-800">{activeFeedback.answeredByName || 'Giảng viên'}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                            ${responderLabel(activeFeedback) === 'Trợ giảng' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {responderLabel(activeFeedback)}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400">{fmtDate(activeFeedback.respondedAt)}</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-2xl rounded-tl-sm text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap border border-emerald-100 shadow-sm">
                      {activeFeedback.response}
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Input Area */}
              <div className="p-4 lg:p-6 border-t border-gray-200 bg-white shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                {isResolved(activeFeedback.status) && !isEditingReply ? (
                  <button
                    onClick={handleEditResponse}
                    className="w-full max-w-3xl mx-auto py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 font-bold text-sm hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-2 transition"
                  >
                    <Pencil size={16} /> Bổ sung hoặc Sửa lại câu trả lời
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 max-w-3xl mx-auto">
                    <textarea
                      ref={replyRef}
                      className="w-full text-sm p-4 rounded-2xl border border-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-gray-50 focus:bg-white resize-none transition-all shadow-inner"
                      placeholder={isEditingReply ? 'Sửa câu trả lời của bạn...' : 'Viết câu trả lời chi tiết cho học viên...'}
                      rows={4}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                    />
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] text-gray-400 font-medium">Học viên sẽ nhận được thông báo ngay sau khi bạn gửi.</span>
                      <div className="flex items-center gap-3">
                        {isEditingReply && (
                          <button
                            onClick={() => { setIsEditingReply(false); setReplyText(''); }}
                            className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                          >
                            Hủy sửa
                          </button>
                        )}
                        <button
                          onClick={handleSendResponse}
                          disabled={isSubmitting || !replyText.trim()}
                          className="text-sm font-bold bg-emerald-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:bg-emerald-700 transition shadow-sm hover:shadow-md"
                        >
                          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                          {isEditingReply ? 'Cập nhật trả lời' : 'Gửi câu trả lời'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-5">
                <MessageSquare size={40} className="text-emerald-500" strokeWidth={1.5} />
              </div>
              <p className="text-xl font-bold text-gray-800 mb-1">Chưa chọn câu hỏi nào</p>
              <p className="text-sm text-gray-500 max-w-xs text-center leading-relaxed">
                Hãy chọn một câu hỏi ở danh sách bên trái để xem chi tiết và giải đáp thắc mắc cho học viên.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
