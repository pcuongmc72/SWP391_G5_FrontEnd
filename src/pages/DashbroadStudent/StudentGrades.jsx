import React, { useState, useEffect } from 'react';
import { Loader2, Star, Award, BookOpen, RefreshCw, MessageSquare, FileText } from 'lucide-react';
import { getStudentAssignments } from '../../services/studentService';

function formatDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function StudentGrades({ cls }) {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!cls?.id) return;
        const fetchGrades = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await getStudentAssignments(cls.id);
                if (res.success) {
                    setAssignments(res.data || []);
                } else {
                    setError(res.message || 'Không thể tải bảng điểm.');
                }
            } catch (err) {
                setError(err.message || 'Lỗi kết nối máy chủ.');
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, [cls?.id, refreshKey]);

    const gradedAssignments = assignments.filter(a => a.mySubmission?.status === 'GRADED');

    // Stats calculations
    const totalEarned = gradedAssignments.reduce((s, a) => s + (parseFloat(a.mySubmission?.grade) || 0), 0);
    const totalMax = gradedAssignments.reduce((s, a) => s + parseFloat(a.maxPoints), 0);
    const avgPercent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#111827' }}>
                        Điểm & Nhận xét
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                        {cls?.courseName} ({cls?.id})
                    </p>
                </div>
                <button
                    onClick={() => setRefreshKey(p => p + 1)}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600, color: '#374151', cursor: loading ? 'wait' : 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => !loading && (e.currentTarget.style.background = '#e5e7eb')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#f3f4f6')}
                >
                    <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                    Làm mới
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 10 }}>
                    <Loader2 size={22} color="#0d3e26" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Đang tải bảng điểm...</span>
                </div>
            ) : error ? (
                <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, color: '#b91c1c', fontSize: '0.875rem' }}>
                    {error}
                </div>
            ) : gradedAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', border: '1px dashed #d1d5db', borderRadius: 16 }}>
                    <Star size={36} color="#d1d5db" style={{ margin: '0 auto 14px' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>Chưa có điểm nào</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Các bài tập của bạn hiện chưa được chấm điểm.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Summary Statistics bar */}
                    <div style={{ background: 'linear-gradient(135deg, #0d3e26 0%, #166534 100%)', borderRadius: 16, padding: '20px 24px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.75, marginBottom: 4 }}>Tổng điểm tích lũy</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>
                                {totalEarned.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.8 }}>/ {totalMax.toFixed(1)}</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{avgPercent}%</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>{gradedAssignments.length} bài đã chấm</div>
                        </div>
                    </div>

                    {/* Grade cards */}
                    {gradedAssignments.map(a => {
                        const grade = parseFloat(a.mySubmission?.grade) || 0;
                        const pct = a.maxPoints > 0 ? Math.round((grade / parseFloat(a.maxPoints)) * 100) : 0;
                        const barColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
                        return (
                            <div key={a.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#111827' }}>{a.title}</h4>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                                            Hạn nộp: {formatDate(a.dueDate)} • Nộp lúc: {a.mySubmission?.submittedAt} • Ngày chấm: {formatDate(a.mySubmission?.gradedAt)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: barColor }}>{grade.toFixed(1)}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>/ {parseFloat(a.maxPoints).toFixed(1)} điểm ({pct}%)</div>
                                    </div>
                                </div>
                                <div style={{ padding: '12px 20px' }}>
                                    {/* Progress bar */}
                                    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 999, marginBottom: 12, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 999, transition: 'width 0.4s ease' }} />
                                    </div>
                                    {/* File submitted */}
                                    {a.mySubmission?.fileName && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: '#374151', marginBottom: a.mySubmission?.feedback ? 10 : 0 }}>
                                            <FileText size={13} color="#6b7280" />
                                            {a.mySubmission.fileName.startsWith('http') || a.mySubmission.fileName.startsWith('/') ? (
                                                <a href={a.mySubmission.fileName} target="_blank" rel="noopener noreferrer" download style={{ fontWeight: 600, color: '#1d4ed8', textDecoration: 'underline' }}>
                                                    {a.mySubmission.fileName.split('/').pop()} (Tải xuống bài nộp)
                                                </a>
                                            ) : (
                                                <span style={{ fontWeight: 600 }}>{a.mySubmission.fileName} (Đã nộp)</span>
                                            )}
                                        </div>
                                    )}
                                    {/* Feedback */}
                                    {a.mySubmission?.feedback && (
                                        <div style={{ marginTop: 8, padding: '12px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                                <MessageSquare size={12} /> Nhận xét của giảng viên
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                                                {a.mySubmission.feedback}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
