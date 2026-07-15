import React, { useState, useEffect } from 'react';
import { getQuizDetailsForStudent, startQuizAttempt, submitQuizAttempt, getStudentQuizAttempts } from '../../../services/studentService';
import { HelpCircle, Clock, CheckCircle, XCircle, AlertCircle, Play, Star } from 'lucide-react';

export default function StudentQuizPlayer({ quizId, triggerNotification, addPoints, onToggleComplete }) {
    const [quizData, setQuizData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [myAttempts, setMyAttempts] = useState([]);
    const [currentAttempt, setCurrentAttempt] = useState(null);
    const [answers, setAnswers] = useState({}); // { questionId: selectedOptionId }
    const [starred, setStarred] = useState({}); // { questionId: boolean }
    
    // Timer state
    const [timeLeft, setTimeLeft] = useState(0);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const questionsPerPage = 3;

    // Custom confirm modal state
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    useEffect(() => {
        if (quizId) {
            loadQuizData();
        }
    }, [quizId]);

    useEffect(() => {
        let timer;
        if (currentAttempt && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [currentAttempt, timeLeft]);

    const loadQuizData = async () => {
        try {
            setLoading(true);
            const [detailsRes, attemptsRes] = await Promise.all([
                getQuizDetailsForStudent(quizId),
                getStudentQuizAttempts(quizId)
            ]);
            
            if (detailsRes.success) {
                setQuizData(detailsRes.data);
            }
            if (attemptsRes.success) {
                setMyAttempts(attemptsRes.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải đề thi');
        } finally {
            setLoading(false);
        }
    };

    const handleStartAttempt = async () => {
        try {
            setLoading(true);
            const res = await startQuizAttempt(quizId);
            if (res.success) {
                setCurrentAttempt(res.data);
                setAnswers({});
                setStarred({});
                setCurrentPage(1);
                if (quizData.timeLimit) {
                    setTimeLeft(quizData.timeLimit * 60);
                }
                triggerNotification('Bắt đầu làm bài!', 'info');
            }
        } catch (err) {
            console.error('Error starting attempt:', err, err.response);
            triggerNotification(err.response?.data?.message || err.message || 'Không thể bắt đầu làm bài', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (questionId, optionId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const toggleStar = (questionId) => {
        setStarred(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const handleSubmit = async () => {
        if (!currentAttempt) return;

        try {
            setLoading(true);
            const payload = {
                answers: Object.entries(answers).map(([qId, oId]) => ({
                    questionId: qId,
                    selectedOptionId: oId
                }))
            };
            
            const res = await submitQuizAttempt(quizId, currentAttempt.id, payload);
            if (res.success) {
                const score = res.data.totalScore;
                triggerNotification(`Nộp bài thành công! Điểm của bạn: ${score}`, 'success');
                addPoints(score > 5 ? 50 : 10);
                setCurrentAttempt(null);
                loadQuizData(); // Reload history
                onToggleComplete(); // Mark material completed
            }
        } catch (err) {
            triggerNotification(err.response?.data?.message || 'Không thể nộp bài', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !quizData) return <div className="p-5 text-emerald-400">Đang tải bài trắc nghiệm...</div>;
    if (error) return <div className="p-5 text-red-400">{error}</div>;
    if (!quizData) return null;

    const hasAttemptsLeft = myAttempts.length < quizData.maxAttempts;
    
    // FORMAT TIME
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            {!currentAttempt ? (
                // LOBBY STATE
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 space-y-4">
                    <h3 className="text-xl font-bold text-emerald-800 flex items-center gap-2">
                        <HelpCircle /> {quizData.title}
                    </h3>
                    <p className="text-sm text-gray-600">{quizData.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="bg-gray-50 px-3 py-1.5 rounded flex items-center gap-1 border border-gray-200">
                            <Clock size={16} /> Thời gian: {quizData.timeLimit} phút
                        </div>
                        <div className="bg-gray-50 px-3 py-1.5 rounded flex items-center gap-1 border border-gray-200">
                            <AlertCircle size={16} /> Lượt làm tối đa: {quizData.maxAttempts}
                        </div>
                    </div>

                    {myAttempts.length > 0 && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                            <h4 className="font-bold text-gray-800 mb-2">Lịch sử làm bài:</h4>
                            <div className="space-y-2">
                                {myAttempts.map((att, idx) => (
                                    <div key={att.id} className="bg-gray-50 p-2 rounded flex justify-between text-sm text-gray-700 border border-gray-100">
                                        <span>Lần {att.attemptNumber}</span>
                                        <span className="font-bold text-emerald-600">{att.totalScore} điểm</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        {hasAttemptsLeft ? (
                            <button 
                                onClick={handleStartAttempt}
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                            >
                                <Play size={16} /> {myAttempts.length > 0 ? "Làm lại" : "Bắt đầu làm bài"}
                            </button>
                        ) : (
                            <div className="text-red-400 font-bold">Bạn đã hết số lượt làm bài!</div>
                        )}
                    </div>
                </div>
            ) : (
                // IN-PROGRESS STATE
                <div className="fixed inset-0 z-[200] bg-gray-100 overflow-y-auto p-4 md:p-8 animate-fade-in">
                    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar Navigation */}
                    <div className="w-full lg:w-1/4 flex flex-col gap-4">
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 sticky top-0">
                            <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Danh sách câu hỏi</h4>
                            <div className="grid grid-cols-5 gap-2 mb-4">
                                {quizData.questions?.map((q, idx) => {
                                    const qPage = Math.ceil((idx + 1) / questionsPerPage);
                                    const isAnswered = answers[q.id] !== undefined;
                                    const isStarred = starred[q.id];
                                    const isCurrentPage = currentPage === qPage;
                                    
                                    let bgClass = 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100';
                                    if (isStarred) {
                                        bgClass = 'bg-amber-100 text-amber-800 border-amber-300';
                                    } else if (isAnswered) {
                                        bgClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                                    }
                                    
                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => setCurrentPage(qPage)}
                                            className={`w-full aspect-square rounded font-bold text-xs flex flex-col items-center justify-center transition cursor-pointer border relative ${bgClass} ${isCurrentPage ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}
                                        >
                                            {q.order}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <div className="flex gap-2 w-full justify-between">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex-1 bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 font-bold py-2 px-2 rounded transition cursor-pointer disabled:opacity-50 text-xs text-center"
                                    >
                                        Trang trước
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil((quizData.questions?.length || 0) / questionsPerPage), p + 1))}
                                        disabled={currentPage >= Math.ceil((quizData.questions?.length || 0) / questionsPerPage)}
                                        className="flex-1 bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 font-bold py-2 px-2 rounded transition cursor-pointer disabled:opacity-50 text-xs text-center"
                                    >
                                        Trang sau
                                    </button>
                                </div>
                                <span className="text-center text-gray-500 text-xs font-semibold">
                                    Trang {currentPage} / {Math.ceil((quizData.questions?.length || 0) / questionsPerPage)}
                                </span>
                            </div>
                            
                            <button 
                                onClick={() => setShowSubmitConfirm(true)}
                                disabled={loading || Object.keys(answers).length === 0}
                                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded transition cursor-pointer disabled:opacity-50"
                            >
                                Nộp Bài
                            </button>
                        </div>
                    </div>

                    {/* Right Main Content */}
                    <div className="w-full lg:w-3/4 space-y-6">
                        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10 shadow-sm rounded-xl">
                            <h3 className="font-bold text-emerald-800">{quizData.title}</h3>
                            <div className="text-2xl font-mono text-emerald-600">
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {quizData.questions?.slice((currentPage - 1) * questionsPerPage, currentPage * questionsPerPage).map((q, qIdx) => (
                                <div key={q.id} className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 space-y-3 relative">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Câu {q.order} ({q.points} điểm)</span>
                                        <button 
                                            onClick={() => toggleStar(q.id)}
                                            className="text-gray-400 hover:text-amber-500 transition cursor-pointer"
                                            title="Đánh dấu câu hỏi này"
                                        >
                                            <Star size={18} className={starred[q.id] ? "text-amber-500 fill-amber-500" : ""} />
                                        </button>
                                    </div>
                                    <h5 className="font-bold text-sm text-gray-800">{q.questionText}</h5>
                                    
                                    <div className="grid grid-cols-1 gap-2 mt-3">
                                        {q.options?.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleSelectOption(q.id, opt.id)}
                                                className={`w-full text-left p-3 rounded-lg border text-sm transition focus:outline-none cursor-pointer
                                                    ${answers[q.id] === opt.id 
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                {opt.optionText}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                </div>
            )}

            {/* Custom Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center animate-fade-in p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-scale-up">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Xác nhận nộp bài</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6 pl-11">
                            Bạn có chắc chắn muốn nộp bài? Bạn sẽ không thể thay đổi đáp án sau khi nộp.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={() => setShowSubmitConfirm(false)}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                            >
                                Quay lại
                            </button>
                            <button 
                                onClick={() => {
                                    setShowSubmitConfirm(false);
                                    handleSubmit();
                                }}
                                className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition cursor-pointer"
                            >
                                Nộp bài
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
