import React, { useState, useEffect, useCallback } from 'react';
import {
    ClipboardList, Clock, CheckCircle2, XCircle, AlertTriangle,
    Upload, FileText, ChevronDown, ChevronUp, Loader2,
    Star, MessageSquare, RefreshCw, Award, BookOpen, Send
} from 'lucide-react';
import { getStudentAssignments, submitAssignment } from '../../services/studentService';

// ─── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Tính trạng thái deadline của bài tập.
 * Trả về { label, color, bg, border, icon }
 */
function getDeadlineStatus(dueDateStr, submissionStatus) {
    if (submissionStatus === 'GRADED') {
        return { label: 'Đã chấm điểm', color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', Icon: Award };
    }
    if (submissionStatus === 'SUBMITTED') {
        return { label: 'Đã nộp', color: '#1e40af', bg: '#dbeafe', border: '#93c5fd', Icon: CheckCircle2 };
    }
    if (submissionStatus === 'LATE') {
        return { label: 'Nộp muộn', color: '#92400e', bg: '#fef3c7', border: '#fcd34d', Icon: AlertTriangle };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(23, 59, 59, 999);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Đã quá hạn', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5', Icon: XCircle };
    if (diffDays === 0) return { label: 'Hết hạn hôm nay', color: '#9a3412', bg: '#fff7ed', border: '#fdba74', Icon: AlertTriangle };
    if (diffDays <= 3) return { label: `Còn ${diffDays} ngày`, color: '#92400e', bg: '#fef3c7', border: '#fcd34d', Icon: Clock };
    return { label: `Còn ${diffDays} ngày`, color: '#166534', bg: '#dcfce7', border: '#86efac', Icon: Clock };
}

function formatDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Submission Form ─────────────────────────────────────────────────────────────

function SubmissionForm({ assignment, classId, onSuccess, onCancel }) {
    const [fileName, setFileName] = useState(assignment.mySubmission?.fileName || '');
    const [studentNotes, setStudentNotes] = useState(assignment.mySubmission?.studentNotes || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isAlreadyGraded = assignment.mySubmission?.status === 'GRADED';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fileName.trim()) {
            setError('Vui lòng nhập tên file nộp bài.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const res = await submitAssignment(classId, assignment.id, {
                fileName: fileName.trim(),
                studentNotes: studentNotes.trim() || null,
            });
            if (res.success) {
                onSuccess(res.data);
            } else {
                setError(res.message || 'Nộp bài thất bại.');
            }
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi khi nộp bài.');
        } finally {
            setSubmitting(false);
        }
    };

    if (isAlreadyGraded) {
        return (
            <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', color: '#166534', fontSize: '0.875rem', fontWeight: 600 }}>
                ✅ Bài tập đã được giảng viên chấm điểm. Không thể nộp lại.
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Tên file nộp bài *
                </label>
                <div style={{ position: 'relative' }}>
                    <FileText size={14} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                        type="text"
                        value={fileName}
                        onChange={e => setFileName(e.target.value)}
                        placeholder="Ví dụ: Lab1_HE187001.zip"
                        maxLength={255}
                        style={{
                            width: '100%', padding: '10px 12px 10px 34px', border: '1.5px solid #d1d5db',
                            borderRadius: 10, fontSize: '0.875rem', color: '#111827', outline: 'none',
                            boxSizing: 'border-box', transition: 'border-color 0.15s', background: '#fff',
                        }}
                        onFocus={e => e.target.style.borderColor = '#0d3e26'}
                        onBlur={e => e.target.style.borderColor = '#d1d5db'}
                        disabled={submitting}
                    />
                </div>
            </div>

            <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Ghi chú cho giảng viên (không bắt buộc)
                </label>
                <textarea
                    value={studentNotes}
                    onChange={e => setStudentNotes(e.target.value)}
                    placeholder="Nhập lời nhắn, giải thích hoặc ghi chú thêm về bài nộp..."
                    rows={3}
                    maxLength={2000}
                    style={{
                        width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: 10,
                        fontSize: '0.875rem', color: '#111827', outline: 'none', resize: 'vertical',
                        boxSizing: 'border-box', transition: 'border-color 0.15s', background: '#fff', fontFamily: 'inherit',
                    }}
                    onFocus={e => e.target.style.borderColor = '#0d3e26'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                    disabled={submitting}
                />
            </div>

            {error && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#b91c1c', fontSize: '0.8125rem' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    style={{ padding: '8px 18px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600, color: '#374151', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '8px 20px', background: submitting ? '#6b7280' : '#0d3e26', border: 'none', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 700, color: '#fff', cursor: submitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'background 0.15s' }}
                    onMouseEnter={e => !submitting && (e.currentTarget.style.background = '#072416')}
                    onMouseLeave={e => !submitting && (e.currentTarget.style.background = '#0d3e26')}
                >
                    {submitting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                    {assignment.mySubmission ? 'Cập nhật bài nộp' : 'Nộp bài'}
                </button>
            </div>
        </form>
    );
}

// ─── Assignment Card ─────────────────────────────────────────────────────────────

function AssignmentCard({ assignment, classId, onUpdated }) {
    const [expanded, setExpanded] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const { mySubmission } = assignment;
    const status = getDeadlineStatus(assignment.dueDate, mySubmission?.status);
    const { Icon: StatusIcon } = status;

    // Parse description JSON nếu có (theo convention của dự án)
    let descText = assignment.description || '';
    try {
        const parsed = JSON.parse(assignment.description);
        descText = parsed.desc || parsed.instructions || assignment.description || '';
    } catch (_) { /* chuỗi thường */ }

    const handleSubmitSuccess = (updatedSubmission) => {
        setShowForm(false);
        onUpdated(assignment.id, updatedSubmission);
    };

    return (
        <div style={{
            background: '#fff', border: `1.5px solid ${expanded ? '#0d3e26' : '#e5e7eb'}`,
            borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: expanded ? '0 4px 12px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)'
        }}>
            {/* Card Header */}
            <div
                onClick={() => { setExpanded(p => !p); if (showForm) setShowForm(false); }}
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, userSelect: 'none' }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0 }}>
                    {/* Status dot */}
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: status.bg, border: `1px solid ${status.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <StatusIcon size={16} color={status.color} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 5px', fontSize: '0.9375rem', fontWeight: 700, color: '#111827', lineHeight: 1.4 }}>
                            {assignment.title}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', fontSize: '0.75rem', color: '#6b7280' }}>
                            <span>Hạn nộp: <strong style={{ color: '#374151' }}>{formatDate(assignment.dueDate)}</strong></span>
                            <span>Điểm tối đa: <strong style={{ color: '#374151' }}>{parseFloat(assignment.maxPoints).toFixed(1)}</strong></span>
                            {mySubmission && (
                                <span style={{
                                    background: status.bg, color: status.color, border: `1px solid ${status.border}`,
                                    borderRadius: 999, padding: '2px 8px', fontWeight: 700, fontSize: '0.7rem'
                                }}>
                                    {status.label}
                                </span>
                            )}
                            {!mySubmission && (
                                <span style={{
                                    background: status.bg, color: status.color, border: `1px solid ${status.border}`,
                                    borderRadius: 999, padding: '2px 8px', fontWeight: 700, fontSize: '0.7rem'
                                }}>
                                    {status.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ flexShrink: 0, color: '#9ca3af', marginTop: 4 }}>
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </div>

            {/* Expanded body */}
            {expanded && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Description */}
                    {descText && (
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: 6 }}>Mô tả bài tập</div>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{descText}</p>
                        </div>
                    )}

                    {/* Current submission info */}
                    {mySubmission && (
                        <div style={{ padding: '14px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: 10 }}>
                                Bài nộp của bạn
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8125rem' }}>
                                {mySubmission.fileName && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <FileText size={13} color="#6b7280" />
                                        {mySubmission.fileName.startsWith('http') || mySubmission.fileName.startsWith('/') ? (
                                            <a href={mySubmission.fileName} target="_blank" rel="noopener noreferrer" download style={{ fontWeight: 600, color: '#1d4ed8', textDecoration: 'underline' }}>
                                                {mySubmission.fileName.split('/').pop()} (Nhấn để tải xuống)
                                            </a>
                                        ) : (
                                            <span style={{ fontWeight: 600, color: '#111827' }}>{mySubmission.fileName}</span>
                                        )}
                                    </div>
                                )}
                                {mySubmission.studentNotes && (
                                    <div style={{ color: '#4b5563', fontStyle: 'italic', paddingLeft: 20 }}>"{mySubmission.studentNotes}"</div>
                                )}
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingLeft: 20, marginTop: 2 }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                        Nộp lúc: {mySubmission.submittedAt}
                                    </span>
                                    <span style={{
                                        background: status.bg, color: status.color, border: `1px solid ${status.border}`,
                                        borderRadius: 999, padding: '1px 8px', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase'
                                    }}>
                                        Trạng thái: {status.label}
                                    </span>
                                </div>
                                {mySubmission.status === 'GRADED' && mySubmission.grade != null && (
                                    <div style={{ marginTop: 8, padding: '10px 14px', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8 }}>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#065f46' }}>
                                            Điểm: {parseFloat(mySubmission.grade).toFixed(1)} / {parseFloat(assignment.maxPoints).toFixed(1)}
                                        </div>
                                        {mySubmission.feedback && (
                                            <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: '#047857', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                                                📝 {mySubmission.feedback}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Submission form or toggle button */}
                    {mySubmission?.status !== 'GRADED' && (
                        <>
                            {showForm ? (
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: 12 }}>
                                        {mySubmission ? 'Cập nhật bài nộp' : 'Nộp bài'}
                                    </div>
                                    <SubmissionForm
                                        assignment={assignment}
                                        classId={classId}
                                        onSuccess={handleSubmitSuccess}
                                        onCancel={() => setShowForm(false)}
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowForm(true)}
                                    style={{
                                        alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '9px 18px', background: '#0d3e26', border: 'none', borderRadius: 9,
                                        fontSize: '0.8125rem', fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#072416'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#0d3e26'}
                                >
                                    <Upload size={14} />
                                    {mySubmission ? 'Nộp lại bài' : 'Nộp bài tập'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Root Component ──────────────────────────────────────────────────────────────

export default function StudentAssignments({ cls }) {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!cls?.id) return;
        const fetch = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await getStudentAssignments(cls.id);
                if (res.success) {
                    setAssignments(res.data || []);
                } else {
                    setError(res.message || 'Không thể tải danh sách bài tập.');
                }
            } catch (err) {
                setError(err.message || 'Lỗi kết nối máy chủ.');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [cls?.id, refreshKey]);

    const handleAssignmentUpdated = useCallback((assignmentId, updatedSubmission) => {
        setAssignments(prev => prev.map(a =>
            a.id === assignmentId ? { ...a, mySubmission: updatedSubmission } : a
        ));
    }, []);

    // Stats
    const total = assignments.length;
    const submitted = assignments.filter(a => a.mySubmission && ['SUBMITTED', 'LATE', 'GRADED'].includes(a.mySubmission?.status)).length;
    const graded = assignments.filter(a => a.mySubmission?.status === 'GRADED').length;
    const overdue = assignments.filter(a => !a.mySubmission && new Date(a.dueDate) < new Date()).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#111827' }}>
                        Danh sách bài tập & Deadlines
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

            {/* Stats row */}
            {!loading && !error && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                    {[
                        { label: 'Tổng bài tập', value: total, color: '#374151', bg: '#f9fafb', border: '#e5e7eb' },
                        { label: 'Đã nộp', value: submitted, color: '#1e40af', bg: '#dbeafe', border: '#93c5fd' },
                        { label: 'Đã chấm', value: graded, color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
                        { label: 'Quá hạn', value: overdue, color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
                    ].map(s => (
                        <div key={s.label} style={{ padding: '14px 16px', background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 12 }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, opacity: 0.8, marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 10 }}>
                    <Loader2 size={22} color="#0d3e26" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Đang tải dữ liệu...</span>
                </div>
            ) : error ? (
                <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, color: '#b91c1c', fontSize: '0.875rem' }}>
                    {error}
                </div>
            ) : assignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', border: '1px dashed #d1d5db', borderRadius: 16 }}>
                    <BookOpen size={36} color="#d1d5db" style={{ margin: '0 auto 14px' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>Chưa có bài tập nào</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Giảng viên chưa tạo bài tập cho lớp học này.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {assignments.map(a => (
                        <AssignmentCard
                            key={a.id}
                            assignment={a}
                            classId={cls.id}
                            onUpdated={handleAssignmentUpdated}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
