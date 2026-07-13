import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ClipboardList, Clock, CheckCircle2, XCircle, AlertTriangle,
    Upload, FileText, ChevronDown, ChevronUp, Loader2,
    Star, MessageSquare, RefreshCw, Award, BookOpen, Send,
    ExternalLink, X, Paperclip, Eye, FileSpreadsheet, Film
} from 'lucide-react';
import { getStudentAssignments, submitAssignment, uploadFile } from '../../services/studentService';

// ─── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Tính trạng thái deadline của bài tập.
 * Trả về { label, color, bg, border, icon }
 */
function getDeadlineStatus(dueDateStr, submissionStatus) {
    if (submissionStatus === 'GRADED') {
        return { label: 'Đã chấm điểm', color: '#0f766e', bg: '#f0fdf4', border: '#bfe5dc', Icon: Award };
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
    return { label: `Còn ${diffDays} ngày`, color: '#0f766e', bg: '#f0fdf4', border: '#bfe5dc', Icon: Clock };
}

function formatDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Phân tích Assignment.description chứa thông tin bổ sung dạng JSON (giống Lecturer)
 */
function parseAssignmentDesc(rawDesc) {
    if (!rawDesc) {
        return { desc: '', linkedItem: '', linkedTitle: '', type: 'individual', instructions: '', attachmentUrl: '', attachmentName: '', attachmentSize: '' };
    }
    const clean = rawDesc.trim();
    if (clean.startsWith('{') && clean.endsWith('}')) {
        try {
            const data = JSON.parse(clean);
            return {
                desc: data.desc || '',
                linkedItem: data.linkedItem || data.sessionId || '',
                linkedTitle: data.linkedTitle || data.sessionTitle || '',
                type: data.type || 'individual',
                instructions: data.instructions || '',
                attachmentUrl: data.attachmentUrl || '',
                attachmentName: data.attachmentName || '',
                attachmentSize: data.attachmentSize || '',
            };
        } catch (e) {
            // fallback
        }
    }
    return { desc: rawDesc, linkedItem: '', linkedTitle: '', type: 'individual', instructions: '', attachmentUrl: '', attachmentName: '', attachmentSize: '' };
}

/**
 * Trích xuất các liên kết web từ nội dung văn bản thường
 */
function extractUrls(text) {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex) || [];
    return [...new Set(matches)];
}

// ─── Material Preview Modal Component ───────────────────────────────────────────

function MaterialPreviewModal({ isOpen, onClose, fileUrl, fileName }) {
    if (!isOpen || !fileUrl) return null;

    const isImage = /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(fileUrl);
    const isVideo = /\.(mp4|webm|ogg)($|\?)/i.test(fileUrl);
    const ytMatch = fileUrl.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
    const ytId = ytMatch ? ytMatch[1] : null;
    const isCloudinary = fileUrl.includes('cloudinary.com');
    const isDocType = /\.(pptx?|docx?|xlsx?)($|\?)/i.test(fileUrl);
    const isPdf = /\.pdf($|\?)/i.test(fileUrl) || (isCloudinary && !isDocType);

    const previewSrc = isCloudinary && !isDocType
        ? fileUrl.replace('/upload/', '/upload/fl_attachment:false/').split('?')[0] + '.pdf'
        : isDocType
            ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
            : fileUrl;

    return (
        <div 
            onClick={onClose}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 99999, padding: 16
            }}
        >
            <div 
                onClick={e => e.stopPropagation()}
                style={{
                    backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 1000,
                    height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
                }}
            >
                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#0f766e', letterSpacing: '0.05em', display: 'block', marginBottom: 2 }}>Xem trước đề bài / tài liệu</span>
                        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 850, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                            {fileName || 'Tài liệu hướng dẫn'}
                        </h4>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#0f766e', fontWeight: 700, textDecoration: 'none', background: 'rgba(15,118,110,0.1)', border: '1px solid rgba(15,118,110,0.2)', borderRadius: 8, padding: '6px 12px' }}
                        >
                            <ExternalLink size={12} /> Tải trực tiếp
                        </a>
                        <button 
                            onClick={onClose} 
                            style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#4b5563' }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Preview Frame */}
                <div style={{ flex: 1, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {ytId ? (
                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}`} title="YouTube preview" style={{ border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    ) : isVideo ? (
                        <video src={fileUrl} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
                    ) : isImage ? (
                        <div style={{ overflow: 'auto', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={fileUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Preview" />
                        </div>
                    ) : isPdf ? (
                        <iframe src={previewSrc} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
                    ) : isDocType ? (
                        <iframe src={previewSrc} title="Document Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
                    ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                            <ExternalLink size={48} color="#ef4444" style={{ marginBottom: 16 }} />
                            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Loại tệp không hỗ trợ xem trực tuyến</p>
                            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#94a3b8' }}>Hệ thống không thể kết xuất trước loại tệp này. Vui lòng tải xuống để học tập.</p>
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#fff', fontWeight: 700, textDecoration: 'none', background: '#0f766e', borderRadius: 8, padding: '10px 20px' }}>
                                <ExternalLink size={14} /> Tải xuống tệp
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Submission Form ─────────────────────────────────────────────────────────────

function SubmissionForm({ assignment, classId, onSuccess, onCancel }) {
    const [fileName, setFileName] = useState(assignment.mySubmission?.fileName || '');
    const [studentNotes, setStudentNotes] = useState(assignment.mySubmission?.studentNotes || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // State cho drag-and-drop upload
    const [inputType, setInputType] = useState('file'); // 'file' | 'text'
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [attachedFileMeta, setAttachedFileMeta] = useState(null);
    const fileInputRef = useRef(null);

    const isAlreadyGraded = assignment.mySubmission?.status === 'GRADED';

    const handleFileUpload = async (file) => {
        if (!file) return;
        // Giới hạn 20MB
        if (file.size > 20 * 1024 * 1024) {
            setError('Kích thước tệp tối đa được phép tải lên là 20MB.');
            return;
        }
        setUploading(true);
        setError('');
        try {
            const res = await uploadFile(file);
            if (res && res.data) {
                const fileUrl = res.data.url;
                setFileName(fileUrl);
                setAttachedFileMeta({
                    name: file.name,
                    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                });
            } else {
                setError('Tải file lên thất bại. Vui lòng thử lại.');
            }
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi trong quá trình tải tệp lên.');
        } finally {
            setUploading(false);
        }
    };

    const handleClearFile = () => {
        setFileName('');
        setAttachedFileMeta(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Kiểm tra quá hạn trước khi submit
        const isOverdue = new Date(assignment.dueDate).setHours(23, 59, 59, 999) < new Date();
        if (isOverdue) {
            setError('Không thể nộp bài. Hạn nộp đã kết thúc.');
            return;
        }

        if (!fileName.trim()) {
            setError('Vui lòng chọn tệp hoặc nhập nội dung nộp bài.');
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
            {/* Bộ chọn phương thức nộp */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 2 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', color: inputType === 'file' ? '#0f766e' : '#6b7280' }}>
                    <input type="radio" name="submissionInputType" value="file" checked={inputType === 'file'} onChange={() => { setInputType('file'); handleClearFile(); }} style={{ accentColor: '#0f766e' }} />
                    Tải tệp đính kèm
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', color: inputType === 'text' ? '#0f766e' : '#6b7280' }}>
                    <input type="radio" name="submissionInputType" value="text" checked={inputType === 'text'} onChange={() => { setInputType('text'); handleClearFile(); }} style={{ accentColor: '#0f766e' }} />
                    Nhập tên file / link thủ công
                </label>
            </div>

            {inputType === 'file' ? (
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Chọn hoặc kéo thả tệp *
                    </label>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={async (e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const file = e.dataTransfer.files[0];
                            if (file) await handleFileUpload(file);
                        }}
                        style={{
                            border: `2px dashed ${isDragging ? '#0f766e' : '#cbd5e1'}`,
                            borderRadius: 12,
                            padding: '24px 16px',
                            cursor: 'pointer',
                            background: isDragging ? 'rgba(15,118,110,0.05)' : '#f9fafb',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) await handleFileUpload(file);
                                e.target.value = ''; // Reset input
                            }}
                            disabled={uploading || submitting}
                        />

                        {uploading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <Loader2 size={24} style={{ color: '#0f766e', animation: 'spin 1s linear infinite' }} />
                                <span style={{ fontSize: '0.8125rem', color: '#0f766e', fontWeight: 600 }}>⏳ Đang tải tệp lên máy chủ...</span>
                            </div>
                        ) : fileName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#e6f4ea', border: '1px solid #a3cfbb', borderRadius: 8, maxWidth: '90%' }}>
                                <Paperclip size={16} color="#0f766e" />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f766e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                                        {attachedFileMeta?.name || fileName.split('/').pop()}
                                    </span>
                                    {attachedFileMeta?.size && (
                                        <span style={{ fontSize: '0.6875rem', color: '#0d3e26', opacity: 0.8 }}>{attachedFileMeta.size}</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleClearFile(); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}
                                    title="Xóa tệp đã chọn"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <Upload size={24} color="#9ca3af" />
                                <span style={{ fontSize: '0.8125rem', color: '#4b5563' }}>
                                    Kéo thả tệp vào đây hoặc <strong style={{ color: '#0f766e' }}>chọn tệp từ thiết bị</strong>
                                </span>
                                <span style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>Hỗ trợ nén (.zip, .rar), PDF, Word, Excel... (Tối đa 20MB)</span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Đường dẫn hoặc tên tệp nộp bài *
                    </label>
                    <div style={{ position: 'relative' }}>
                        <FileText size={14} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            value={fileName}
                            onChange={e => setFileName(e.target.value)}
                            placeholder="Ví dụ: Lab1_HE187001.zip hoặc URL github/drive..."
                            maxLength={255}
                            style={{
                                width: '100%', padding: '10px 12px 10px 34px', border: '1.5px solid #d1d5db',
                                borderRadius: 10, fontSize: '0.875rem', color: '#111827', outline: 'none',
                                boxSizing: 'border-box', transition: 'border-color 0.15s', background: '#fff',
                            }}
                            onFocus={e => e.target.style.borderColor = '#0f766e'}
                            onBlur={e => e.target.style.borderColor = '#d1d5db'}
                            disabled={submitting}
                        />
                    </div>
                </div>
            )}

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
                    onFocus={e => e.target.style.borderColor = '#0f766e'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                    disabled={submitting || uploading}
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
                    disabled={submitting || uploading}
                    style={{ padding: '8px 18px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600, color: '#374151', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={submitting || uploading}
                    style={{ padding: '8px 20px', background: (submitting || uploading) ? '#6b7280' : '#0f766e', border: 'none', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 700, color: '#fff', cursor: (submitting || uploading) ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'background 0.15s' }}
                    onMouseEnter={e => !(submitting || uploading) && (e.currentTarget.style.background = '#115e59')}
                    onMouseLeave={e => !(submitting || uploading) && (e.currentTarget.style.background = '#0f766e')}
                >
                    {submitting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                    {assignment.mySubmission ? 'Cập nhật bài nộp' : 'Nộp bài'}
                </button>
            </div>
        </form>
    );
}

// ─── Assignment Card ─────────────────────────────────────────────────────────────

function AssignmentCard({ assignment, classId, onUpdated, onPreviewFile }) {
    const [expanded, setExpanded] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const { mySubmission } = assignment;
    const status = getDeadlineStatus(assignment.dueDate, mySubmission?.status);
    const { Icon: StatusIcon } = status;

    // Parse description JSON / Plain Text theo convention
    const meta = parseAssignmentDesc(assignment.description);
    const hasAttachment = !!meta.attachmentUrl;
    
    // Trích xuất link tham khảo tự động trong phần mô tả
    const extractedUrls = extractUrls(meta.desc);

    // Kiểm tra đã quá hạn nộp bài chưa
    const isOverdue = new Date(assignment.dueDate).setHours(23, 59, 59, 999) < new Date();

    const handleSubmitSuccess = (updatedSubmission) => {
        setShowForm(false);
        onUpdated(assignment.id, updatedSubmission);
    };

    return (
        <div style={{
            background: '#fff', border: `1.5px solid ${expanded ? '#0f766e' : '#e5e7eb'}`,
            borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s ease',
            boxShadow: expanded ? '0 4px 14px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.02)'
        }}>
            {/* Card Header */}
            <div
                onClick={() => { setExpanded(p => !p); if (showForm) setShowForm(false); }}
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, userSelect: 'none' }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0 }}>
                    {/* Icon đại diện trạng thái */}
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
                            <span style={{
                                background: status.bg, color: status.color, border: `1px solid ${status.border}`,
                                borderRadius: 999, padding: '2px 8px', fontWeight: 700, fontSize: '0.7rem'
                            }}>
                                {status.label}
                            </span>
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
                    
                    {/* Text description */}
                    {meta.desc && (
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Mô tả bài tập</div>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{meta.desc}</p>
                        </div>
                    )}

                    {/* Teacher guidelines & files */}
                    {(hasAttachment || meta.instructions || extractedUrls.length > 0) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px dashed #e5e7eb', paddingTop: 14 }}>
                            {meta.instructions && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Hướng dẫn làm bài</div>
                                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#78350f', background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: 8, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                        {meta.instructions}
                                    </p>
                                </div>
                            )}

                            {hasAttachment && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Tài liệu đính kèm từ GV</div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#f0fdf4', border: '1px solid #bfe5dc', borderRadius: 10, padding: '8px 14px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Paperclip size={14} color="#0f766e" />
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0d3e26', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {meta.attachmentName || 'Tài liệu hướng dẫn'}
                                            </span>
                                            {meta.attachmentSize && (
                                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>({meta.attachmentSize})</span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                type="button"
                                                onClick={() => onPreviewFile(meta.attachmentUrl, meta.attachmentName || 'Tài liệu hướng dẫn')}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#e6f4ea', border: '1px solid #a3cfbb', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, color: '#0f766e', cursor: 'pointer', transition: 'all 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#d1e7dd'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#e6f4ea'}
                                            >
                                                <Eye size={12} /> Xem trước
                                            </button>
                                            <a
                                                href={meta.attachmentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#e6f4ea', border: '1px solid #a3cfbb', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, color: '#0f766e', textDecoration: 'none', transition: 'all 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#d1e7dd'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#e6f4ea'}
                                            >
                                                <ExternalLink size={12} /> Tải xuống
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {extractedUrls.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Liên kết tham khảo</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {extractedUrls.map((url, idx) => (
                                            <a
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: '#2563eb', textDecoration: 'underline', width: 'fit-content' }}
                                            >
                                                <ExternalLink size={12} /> {url}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Current submission info */}
                    {mySubmission && (
                        <div style={{ padding: '14px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>
                                Bài nộp của bạn
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8125rem' }}>
                                {mySubmission.fileName && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <FileText size={13} color="#6b7280" />
                                        {mySubmission.fileName.startsWith('http') || mySubmission.fileName.startsWith('/') ? (
                                            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                                                <a href={mySubmission.fileName} target="_blank" rel="noopener noreferrer" download style={{ fontWeight: 600, color: '#0f766e', textDecoration: 'underline' }}>
                                                    {mySubmission.fileName.split('/').pop()}
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => onPreviewFile(mySubmission.fileName, mySubmission.fileName.split('/').pop())}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 5, fontSize: '0.6875rem', color: '#4b5563', cursor: 'pointer', transition: 'all 0.1s' }}
                                                >
                                                    <Eye size={10} /> Xem trước bài nộp
                                                </button>
                                            </div>
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
                        isOverdue ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '12px 16px',
                                background: '#fef2f2',
                                border: '1px solid #fca5a5',
                                borderRadius: 10,
                                color: '#b91c1c',
                                fontSize: '0.8125rem',
                                fontWeight: 600
                            }}>
                                <AlertTriangle size={16} color="#b91c1c" />
                                <span>
                                    {mySubmission 
                                        ? "Đã quá hạn nộp. Bạn không thể cập nhật hoặc nộp lại bài." 
                                        : "Đã quá hạn nộp bài. Hệ thống không tiếp nhận thêm bài nộp mới."}
                                </span>
                            </div>
                        ) : (
                            <>
                                {showForm ? (
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
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
                                            padding: '9px 18px', background: '#0f766e', border: 'none', borderRadius: 9,
                                            fontSize: '0.8125rem', fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#115e59'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#0f766e'}
                                    >
                                        <Upload size={14} />
                                        {mySubmission ? 'Nộp lại bài' : 'Nộp bài tập'}
                                    </button>
                                )}
                            </>
                        )
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

    // Trạng thái modal xem trước tài liệu
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewName, setPreviewName] = useState('');

    const handlePreviewFile = (url, name) => {
        setPreviewUrl(url);
        setPreviewName(name);
        setPreviewOpen(true);
    };

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

    // Trạng thái hiển thị thông báo thành công (toast)
    const [toast, setToast] = useState(null);

    const showToast = (message, subtext = '') => {
        setToast({ message, subtext });
        setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    const handleAssignmentUpdated = useCallback((assignmentId, updatedSubmission) => {
        // Cập nhật giao diện lập tức
        setAssignments(prev => prev.map(a =>
            a.id === assignmentId ? { ...a, mySubmission: updatedSubmission } : a
        ));

        // Chuẩn bị thông tin hiển thị trên Toast
        const timeText = updatedSubmission?.submittedAt 
            ? `Thời gian nộp: ${updatedSubmission.submittedAt}` 
            : '';
        showToast('Assignment submitted successfully.', timeText);

        // Kích hoạt re-fetch dữ liệu & số liệu thống kê mới từ server
        setRefreshKey(p => p + 1);
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
                        { label: 'Đã chấm', value: graded, color: '#0f766e', bg: '#f0fdf4', border: '#bfe5dc' },
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
                    <Loader2 size={22} color="#0f766e" style={{ animation: 'spin 1s linear infinite' }} />
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
                            onPreviewFile={handlePreviewFile}
                        />
                    ))}
                </div>
            )}

            {/* Modal xem trước học liệu */}
            <MaterialPreviewModal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                fileUrl={previewUrl}
                fileName={previewName}
            />

            {/* Success toast notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    backgroundColor: '#0f766e',
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: 12,
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    zIndex: 999999,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    animation: 'slide-in 0.3s ease-out'
                }}>
                    <CheckCircle2 size={18} color="#fff" />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span>{toast.message}</span>
                        {toast.subtext && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
                                {toast.subtext}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
