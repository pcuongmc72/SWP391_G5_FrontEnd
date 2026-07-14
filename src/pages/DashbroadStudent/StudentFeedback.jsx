import React, { useState, useEffect, useMemo } from 'react';
import { getStudentFeedbacks, createStudentFeedback, respondFeedbackAsAssistant, getClassStudents } from '../../services/studentService';
import api from '../../services/api';
import { Loader2, MessageSquare, Send, Check, Search, Filter, Plus, X, Pencil, BookOpen } from 'lucide-react';
import { getUser } from '../../services/authService';

const responderLabel = (f) => {
    const role = String(f.answeredByRole || '').toLowerCase();
    if (role.includes('assistant')) return 'Trợ giảng';
    return 'Giảng viên';
};

export default function StudentFeedback({ cls, activeLecture }) {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [classRole, setClassRole] = useState('student');
    const [currentUser, setCurrentUser] = useState(null);
    
    const [newQuestionTitle, setNewQuestionTitle] = useState('');
    const [newQuestionMessage, setNewQuestionMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // feedback ID
    const [isEditingReply, setIsEditingReply] = useState(false);
    
    // New UX states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMode, setFilterMode] = useState('ALL'); // ALL, MY, OPEN, RESPONDED
    
    useEffect(() => {
        const fetchFeedbacksAndRole = async () => {
            try {
                setLoading(true);
                const user = getUser();
                setCurrentUser(user);
                console.log('[StudentFeedback] Passed cls object (JSON):', JSON.stringify(cls));
                console.log('[StudentFeedback] Current user (JSON):', JSON.stringify(user));
                
                // Fetch feedbacks
                const res = await getStudentFeedbacks(cls.id);
                console.log('[StudentFeedback] API response:', res);
                
                if (res?.success && Array.isArray(res.data)) {
                    setFeedbacks(res.data);
                } else if (res?.success && res.data) {
                    // handle non-array data from backend
                    const arr = Object.values(res.data);
                    setFeedbacks(Array.isArray(arr) ? arr : []);
                } else if (!res?.success) {
                    console.warn('[StudentFeedback] API returned success=false:', res);
                    setError('API trả về lỗi: ' + (res?.message || 'Không xác định'));
                }
                
                let myRole = 'student';
                
                // Attempt 1: Try Lecturer API to get students (which includes classRole). 
                // TAs might have permission to call this. Normal students will get 403 Forbidden.
                try {
                    const lecRes = await api.get(`/api/Lecturer/classes/${encodeURIComponent(cls.id)}/students`);
                    const lecStudents = lecRes.data?.data || lecRes.data;
                    if (Array.isArray(lecStudents)) {
                        const meLec = lecStudents.find(s => s.id === user.id || s.studentId === user.id);
                        if (meLec && meLec.classRole) {
                            myRole = String(meLec.classRole).toLowerCase();
                            console.log('[StudentFeedback] Found role via Lecturer API:', myRole);
                        }
                    }
                } catch (lecErr) {
                    console.log('[StudentFeedback] Lecturer API not accessible (normal for students). Falling back...');
                }

                // Attempt 2: If still student, check student API just in case backend updated it
                if (myRole === 'student') {
                    const studentsRes = await getClassStudents(cls.id);
                    if (studentsRes?.success && Array.isArray(studentsRes.data)) {
                        const me = studentsRes.data.find(s =>
                            s.id === user.id ||
                            s.userId === user.id ||
                            s.studentId === user.id ||
                            s.studentId === user.username ||
                            s.user?.id === user.id ||
                            s.accountId === user.id ||
                            String(s.studentId) === String(user.id)
                        );
                        if (me && (me.classRole || me.role)) {
                            myRole = String(me.classRole || me.role).toLowerCase();
                            console.log('[StudentFeedback] Found role via Student API:', myRole);
                        }
                    }
                }
                
                // Final fallback: check localStorage
                if (myRole === 'student') {
                    const storedClassRole = user.classRole || user.ClassRole;
                    if (storedClassRole) {
                        myRole = String(storedClassRole).toLowerCase();
                        console.log('[StudentFeedback] Found role via stored user:', myRole);
                    }
                }

                setClassRole(myRole);
            } catch (err) {
                console.error("[StudentFeedback] Error:", err.response || err);
                setError("Không thể tải danh sách câu hỏi. (" + (err.response?.data?.message || err.message) + ")");
            } finally {
                setLoading(false);
            }
        };
        if (cls?.id) {
            fetchFeedbacksAndRole();
        }
    }, [cls]);
    
    const filteredFeedbacks = useMemo(() => {
        let list = [...feedbacks];
        
        // If activeLecture is provided, filter by materialId
        if (activeLecture) {
            list = list.filter(f => f.materialId === activeLecture.id);
        }
        
        // Filter by Mode
        if (filterMode === 'MY') {
            list = list.filter(f => f.senderId === currentUser?.id);
        } else if (filterMode === 'OPEN') {
            // Bug #4 fix: normalize to uppercase trước so sánh
            list = list.filter(f => f.status?.toUpperCase() === 'OPEN');
        } else if (filterMode === 'RESPONDED') {
            // Bug #4 fix: chấp nhận cả 'RESPONDED' và 'RESOLVED' từ backend
            list = list.filter(f => ['RESPONDED', 'RESOLVED'].includes(f.status?.toUpperCase()));
        }
        
        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(f => 
                f.title?.toLowerCase().includes(q) || 
                f.message?.toLowerCase().includes(q) || 
                f.senderName?.toLowerCase().includes(q)
            );
        }
        
        return list;
    }, [feedbacks, filterMode, searchQuery, currentUser]);
    
    const handleAskQuestion = async (e) => {
        e.preventDefault();
        const effectiveTitle = activeLecture ? `Hỏi về: ${activeLecture.title}` : newQuestionTitle;
        if (!effectiveTitle.trim() || !newQuestionMessage.trim()) return;
        
        try {
            setIsSubmitting(true);
            const res = await createStudentFeedback(cls.id, {
                title: activeLecture ? `Hỏi về: ${activeLecture.title}` : newQuestionTitle,
                message: newQuestionMessage,
                materialId: activeLecture ? activeLecture.id : null
            });
            if (res.success) {
                setFeedbacks([res.data, ...feedbacks]);
                setNewQuestionTitle('');
                setNewQuestionMessage('');
                setIsFormOpen(false); // Close form after success
                setFilterMode('ALL'); // Reset filter to see the new question
            }
        } catch (err) {
            alert(err.response?.data?.message || "Có lỗi xảy ra khi gửi câu hỏi.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleReply = async (feedbackId) => {
        if (!replyText.trim()) return;
        
        try {
            setIsSubmitting(true);
            const res = await respondFeedbackAsAssistant(cls.id, feedbackId, {
                response: replyText
            });
            if (res.success) {
                setFeedbacks(feedbacks.map(f => f.id === feedbackId ? res.data : f));
                setReplyingTo(null);
                setReplyText('');
                setIsEditingReply(false);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Có lỗi xảy ra khi gửi câu trả lời.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleStartEdit = (f) => {
        setReplyingTo(f.id);
        setReplyText(f.response);
        setIsEditingReply(true);
    };
    
    // Helper: lấy 1-2 ký tự đầu làm avatar
    const getInitial = (name) => (name || 'S').charAt(0).toUpperCase();

    // Helper: parse materialTitle từ title nếu backend không trả về riêng
    const getMaterialLabel = (f) => {
        if (f.materialTitle) return f.materialTitle;
        if (f.title?.startsWith('Hỏi về: ')) return f.title.replace('Hỏi về: ', '');
        return null;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
                <p className="text-sm text-gray-400">Đang tải câu hỏi...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-12 space-y-4">

            {/* ── "What's on your mind?" composer ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4">
                    <div className="flex items-center gap-3">
                        {/* Current user avatar */}
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0 select-none">
                            {getInitial(currentUser?.fullName || currentUser?.username)}
                        </div>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex-1 text-left text-sm text-gray-400 bg-gray-100 hover:bg-gray-150 px-4 py-2.5 rounded-full cursor-pointer transition-colors"
                        >
                            Bạn đang thắc mắc điều gì về bài học?
                        </button>
                    </div>
                </div>

                {/* Expandable form */}
                {(isFormOpen || activeLecture) && (
                    <form onSubmit={handleAskQuestion} className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                        {!activeLecture && (
                            <input
                                className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
                                placeholder="Tiêu đề câu hỏi..."
                                value={newQuestionTitle}
                                onChange={(e) => setNewQuestionTitle(e.target.value)}
                                required
                                autoFocus
                            />
                        )}
                        <textarea
                            className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition resize-none"
                            placeholder={activeLecture ? `Bạn có thắc mắc gì về bài học "${activeLecture.title}"?` : "Mô tả chi tiết thắc mắc của bạn..."}
                            rows={4}
                            value={newQuestionMessage}
                            onChange={(e) => setNewQuestionMessage(e.target.value)}
                            required
                            autoFocus={!!activeLecture}
                        />
                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => { setIsFormOpen(false); setNewQuestionTitle(''); setNewQuestionMessage(''); }}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || (!activeLecture && !newQuestionTitle.trim()) || !newQuestionMessage.trim()}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Đăng câu hỏi
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* ── Filter tabs + Search ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex bg-gray-100 p-1 rounded-xl gap-1 flex-shrink-0">
                    {[
                        { key: 'ALL', label: 'Tất cả' },
                        { key: 'MY', label: 'Của tôi' },
                        { key: 'OPEN', label: 'Chờ trả lời' },
                        { key: 'RESPONDED', label: 'Đã giải đáp' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilterMode(tab.key)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                                filterMode === tab.key
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        className="w-full text-xs pl-8 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50 transition"
                        placeholder="Tìm kiếm câu hỏi, người hỏi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Error ── */}
            {error && <p className="text-red-500 text-xs bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

            {/* ── Feed ── */}
            {filteredFeedbacks.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <MessageSquare size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-bold text-gray-500">Chưa có câu hỏi nào ở mục này.</p>
                    <p className="text-xs text-gray-400 mt-1">Hãy là người đầu tiên đặt câu hỏi!</p>
                </div>
            ) : (
                filteredFeedbacks.map(f => {
                    const isOwn = f.senderId === currentUser?.id;
                    const isAnswered = ['RESPONDED', 'RESOLVED'].includes(f.status?.toUpperCase());
                    const materialLabel = getMaterialLabel(f);

                    return (
                        <div
                            key={f.id}
                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                                isOwn ? 'border-emerald-200' : 'border-gray-200'
                            }`}
                        >
                            {/* ── Post Header ── */}
                            <div className="p-4 pb-3">
                                <div className="flex items-start gap-3">
                                    {/* Sender avatar */}
                                    <div className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center shrink-0 select-none ${
                                        isOwn ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                        {getInitial(f.senderName)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-bold text-gray-900">{f.senderName || 'Học viên'}</span>
                                            {isOwn && (
                                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    Của bạn
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                isAnswered
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {isAnswered ? '✅ Đã giải đáp' : '⏳ Chờ trả lời'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] text-gray-400">
                                                {f.createdAt ? new Date(f.createdAt).toLocaleString('vi-VN') : ''}
                                            </span>
                                            {materialLabel && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                                    🏷️ {materialLabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Post title */}
                                <h4 className="font-bold text-[15px] text-gray-900 mt-3 leading-snug">{f.title}</h4>

                                {/* Post body */}
                                <p className="text-[13px] text-gray-700 mt-1.5 leading-relaxed whitespace-pre-wrap">{f.message}</p>
                            </div>

                            {/* ── Divider ── */}
                            <div className="mx-4 border-t border-gray-100" />

                            {/* ── Lecturer Reply (like a comment) ── */}
                            {isAnswered && f.response && (
                                <div className="px-4 py-3 bg-emerald-50/60">
                                    <div className="flex items-start gap-3">
                                        {/* Lecturer avatar */}
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                            {getInitial(f.answeredByName || 'GV')}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-emerald-100 shadow-sm">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className="text-xs font-bold text-emerald-800">{f.answeredByName || 'Giảng viên'}</span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                        responderLabel(f) === 'Trợ giảng' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {responderLabel(f)}
                                                    </span>
                                                    {f.respondedAt && (
                                                        <span className="text-[10px] text-gray-400 ml-auto">{new Date(f.respondedAt).toLocaleString('vi-VN')}</span>
                                                    )}
                                                </div>

                                                {/* Edit mode */}
                                                {replyingTo === f.id && isEditingReply ? (
                                                    <div className="space-y-2 mt-2">
                                                        <textarea
                                                            className="w-full text-sm p-3 rounded-xl border border-emerald-200 focus:outline-none focus:border-emerald-500 bg-gray-50 resize-none"
                                                            rows={3}
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => { setReplyingTo(null); setIsEditingReply(false); }} className="text-xs text-gray-500 hover:underline cursor-pointer">Hủy</button>
                                                            <button onClick={() => handleReply(f.id)} disabled={isSubmitting} className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg cursor-pointer">Cập nhật</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">{f.response}</p>
                                                        {classRole === 'assistant' && (
                                                            <button onClick={() => handleStartEdit(f)} className="mt-2 text-[11px] text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer">
                                                                <Pencil size={11} /> Chỉnh sửa
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Assistant Reply Box ── */}
                            {classRole === 'assistant' && (
                                <div className="px-4 py-3 border-t border-gray-100">
                                    {replyingTo === f.id ? (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                {getInitial(currentUser?.fullName)}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <textarea
                                                    className="w-full text-sm p-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50 resize-none"
                                                    placeholder={isEditingReply ? 'Sửa câu trả lời...' : 'Nhập câu trả lời của trợ giảng...'}
                                                    rows={3}
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-gray-400">Học viên sẽ nhận được thông báo ngay</span>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setReplyingTo(null); setIsEditingReply(false); }} className="text-xs text-gray-500 hover:underline cursor-pointer">Hủy</button>
                                                        <button onClick={() => handleReply(f.id)} disabled={isSubmitting || !replyText.trim()} className="text-xs font-bold bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:bg-emerald-700 transition">
                                                            {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                                            {isEditingReply ? 'Cập nhật' : 'Gửi trả lời'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setReplyingTo(f.id); setReplyText(isAnswered ? f.response : ''); setIsEditingReply(isAnswered); }}
                                            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                                        >
                                            <MessageSquare size={14} />
                                            {isAnswered ? 'Trợ giảng: Sửa / Bổ sung câu trả lời' : 'Trợ giảng: Giải đáp câu hỏi này'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
