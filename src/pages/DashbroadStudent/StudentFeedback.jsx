import React, { useState, useEffect, useMemo } from 'react';
import { getStudentFeedbacks, createStudentFeedback, respondFeedbackAsAssistant, getClassStudents } from '../../services/studentService';
import { Loader2, MessageSquare, Send, Check, Search, Filter, Plus, X, Pencil } from 'lucide-react';
import { getUser } from '../../services/authService';

export default function StudentFeedback({ cls }) {
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
                
                // Fetch feedbacks
                const res = await getStudentFeedbacks(cls.id);
                if (res.success) {
                    setFeedbacks(res.data);
                }
                
                // Determine classRole from students list
                const studentsRes = await getClassStudents(cls.id);
                if (studentsRes.success) {
                    const me = studentsRes.data.find(s => s.studentId === user.id);
                    if (me) {
                        setClassRole(me.classRole || 'student');
                    }
                }
            } catch (err) {
                console.error("Error fetching feedbacks:", err);
                setError("Không thể tải danh sách câu hỏi.");
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
        
        // Filter by Mode
        if (filterMode === 'MY') {
            list = list.filter(f => f.senderId === currentUser?.id);
        } else if (filterMode === 'OPEN') {
            list = list.filter(f => f.status === 'OPEN');
        } else if (filterMode === 'RESPONDED') {
            list = list.filter(f => f.status === 'RESPONDED');
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
        if (!newQuestionTitle.trim() || !newQuestionMessage.trim()) return;
        
        try {
            setIsSubmitting(true);
            const res = await createStudentFeedback(cls.id, {
                title: newQuestionTitle,
                message: newQuestionMessage
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
    
    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-emerald-600" />
            </div>
        );
    }
    
    return (
        <div className="space-y-6 text-left max-w-4xl mx-auto pb-10">
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border shadow-sm sticky top-0 z-10 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    {/* Filter Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg self-stretch sm:self-auto overflow-x-auto hide-scrollbar">
                        {[
                            { key: 'ALL', label: 'Tất cả' },
                            { key: 'MY', label: 'Câu hỏi của tôi' },
                            { key: 'OPEN', label: 'Chưa giải đáp' },
                            { key: 'RESPONDED', label: 'Đã giải đáp' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilterMode(tab.key)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
                                    filterMode === tab.key 
                                        ? 'bg-white text-emerald-700 shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap w-full sm:w-auto justify-center"
                    >
                        {isFormOpen ? <X size={14} /> : <Plus size={14} />}
                        {isFormOpen ? 'Đóng lại' : 'Tạo câu hỏi mới'}
                    </button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        className="w-full text-xs pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-gray-50"
                        placeholder="Tìm kiếm câu hỏi, người hỏi, nội dung..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Ask Question Form (Collapsible) */}
            {isFormOpen && (
                <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-emerald-800 mb-4 text-sm flex items-center gap-2">
                        <MessageSquare size={16} /> Đặt câu hỏi mới cho lớp học
                    </h3>
                    <form onSubmit={handleAskQuestion} className="space-y-4">
                        <input
                            className="w-full text-xs p-3 rounded-lg border border-emerald-200 focus:outline-none focus:border-emerald-500 bg-white"
                            placeholder="Tiêu đề câu hỏi (Ví dụ: Thắc mắc về Bài tập tuần 2)..."
                            value={newQuestionTitle}
                            onChange={(e) => setNewQuestionTitle(e.target.value)}
                            required
                        />
                        <textarea
                            className="w-full text-xs p-3 rounded-lg border border-emerald-200 focus:outline-none focus:border-emerald-500 bg-white"
                            placeholder="Nội dung câu hỏi chi tiết..."
                            rows={4}
                            value={newQuestionMessage}
                            onChange={(e) => setNewQuestionMessage(e.target.value)}
                            required
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Gửi câu hỏi lên diễn đàn
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {/* List of questions */}
            <div className="space-y-4">
                {error && <p className="text-red-500 text-xs bg-red-50 p-3 rounded-lg">{error}</p>}
                
                {filteredFeedbacks.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                        <Filter size={32} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm font-bold text-gray-500">Chưa có câu hỏi nào ở mục này.</p>
                        <p className="text-xs text-gray-400 mt-1">Hãy thử đổi bộ lọc hoặc đặt câu hỏi mới!</p>
                    </div>
                ) : (
                    filteredFeedbacks.map(f => (
                        <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-[15px] text-gray-900 leading-tight">{f.title}</h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">Bởi: {f.senderName}</span>
                                        <span className="text-[11px] text-gray-500">• {f.createdAt}</span>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${f.status === 'OPEN' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                    {f.status === 'OPEN' ? '⏳ Đang mở' : '✅ Đã trả lời'}
                                </span>
                            </div>
                            <p className="text-[13px] text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">{f.message}</p>
                            
                            {/* Answer section */}
                            {f.status === 'RESPONDED' && (
                                <div className="mt-4 flex gap-3">
                                    {/* Thread line visual */}
                                    <div className="flex flex-col items-center ml-2">
                                        <div className="w-0.5 h-4 bg-emerald-200"></div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <div className="w-0.5 h-full bg-emerald-100 mt-1"></div>
                                    </div>
                                    
                                    {/* Reply Content */}
                                    <div className="flex-1 bg-emerald-50/70 p-4 rounded-2xl rounded-tl-sm border border-emerald-100 shadow-sm relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2.5 text-emerald-800">
                                                <div className="bg-white shadow-sm p-1.5 rounded-full border border-emerald-100">
                                                    <Check size={14} className="text-emerald-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold">Trả lời bởi: {f.answeredByName || 'Giảng viên'}</span>
                                                    {f.respondedAt && (
                                                        <span className="text-[11px] text-emerald-600/80 font-medium">Lúc: {new Date(f.respondedAt).toLocaleString('vi-VN')}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Edit button for the assistant who answered it */}
                                            {classRole === 'assistant' && f.answeredByUserId === currentUser?.id && !replyingTo && (
                                                <button 
                                                    onClick={() => handleStartEdit(f)}
                                                    className="text-[11px] font-bold text-emerald-600 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 transition-colors shadow-sm"
                                                >
                                                    <Pencil size={12} /> Chỉnh sửa
                                                </button>
                                            )}
                                        </div>
                                        
                                        {replyingTo === f.id && isEditingReply ? (
                                            <div className="bg-white p-4 rounded-xl border border-emerald-200 mt-2 shadow-sm">
                                                <label className="block text-[12px] font-bold text-emerald-800 mb-2">Chỉnh sửa câu trả lời:</label>
                                                <textarea
                                                    className="w-full text-[13px] p-3 rounded-lg border border-emerald-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-gray-50/50"
                                                    rows={4}
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                />
                                                <div className="flex justify-end gap-2 mt-3">
                                                    <button 
                                                        onClick={() => { setReplyingTo(null); setIsEditingReply(false); }}
                                                        className="px-4 py-2 text-[12px] font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        Hủy
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReply(f.id)}
                                                        disabled={isSubmitting}
                                                        className="px-5 py-2 text-[12px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                                                    >
                                                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                        Cập nhật
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-[14px] text-emerald-950 whitespace-pre-wrap leading-relaxed bg-white/40 p-3 rounded-lg border border-emerald-50/50">{f.response}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Reply Form for Assistants on Open Questions */}
                            {f.status === 'OPEN' && classRole === 'assistant' && (
                                <div className="mt-5 flex gap-3">
                                    {/* Thread line visual */}
                                    <div className="flex flex-col items-center ml-2">
                                        <div className="w-0.5 h-6 bg-gray-200"></div>
                                        <div className="w-2 h-2 rounded-full border-2 border-emerald-400 bg-white"></div>
                                    </div>
                                    
                                    <div className="flex-1">
                                        {replyingTo === f.id ? (
                                            <div className="bg-gray-50 p-4 rounded-xl border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                                                <label className="block text-[12px] font-bold text-emerald-800 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                                    <MessageSquare size={14} /> Trợ giảng phản hồi:
                                                </label>
                                                <textarea
                                                    className="w-full text-[13px] p-3 rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white shadow-inner"
                                                    placeholder="Nhập câu trả lời chi tiết của bạn để giải đáp thắc mắc này..."
                                                    rows={4}
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-2 mt-3">
                                                    <button 
                                                        onClick={() => setReplyingTo(null)}
                                                        className="px-5 py-2 text-[12px] font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                                    >
                                                        Hủy bỏ
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReply(f.id)}
                                                        disabled={isSubmitting}
                                                        className="px-5 py-2 text-[12px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                                                    >
                                                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                        Gửi câu trả lời
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => { setReplyingTo(f.id); setReplyText(''); setIsEditingReply(false); }}
                                                className="inline-flex items-center gap-2 text-[13px] bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 font-bold py-2.5 px-4 rounded-xl border border-emerald-200 transition-all hover:shadow-sm"
                                            >
                                                <MessageSquare size={16} className="text-emerald-600" />
                                                Trợ giảng: Giải đáp câu hỏi này
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
