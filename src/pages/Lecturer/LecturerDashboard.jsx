import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload, Plus, CheckSquare, TrendingUp, MessageSquare, Award,
  Clock, Check, Send, Eye, X, Sparkles, Trash2, FileText, Film, FileSpreadsheet, Paperclip, Pencil,
  Users, Search,
} from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import SharedBlogForum from './SharedBlogForum';
import styles from './LecturerDashboard.module.css';

const SUB_TABS = [
  { id: 'materials', label: 'Học liệu & Drag-Drop', icon: Upload },
  { id: 'classList', label: 'Danh sách Lớp', icon: Users },
  { id: 'assignments', label: 'Tạo Bài Tập', icon: Plus },
  { id: 'grading', label: 'Chấm bài tập', icon: CheckSquare },
  { id: 'progress', label: 'Báo cáo Tiến độ', icon: TrendingUp },
  { id: 'feedback', label: 'Giải đáp phản hồi', icon: MessageSquare },
  { id: 'promotion', label: 'Thăng cấp Học Thuật', icon: Award },
  { id: 'forum', label: 'Blog Thảo Luận', icon: MessageSquare },
];

function LecturerDashboard() {
  const {
    currentUser, users, setUsers,
    classrooms, myClassrooms, selectedClassId, setSelectedClassId,
    classesLoading, classesError, workspaceLoading,
    materials, assignments, submissions, feedbacks, threads, sessions,
    activeSubTab, setActiveSubTab, searchQuery, api,
  } = useLecturerWorkspace();

  // ─── Pure Helpers (hoisted to the top of component scope to avoid TDZ ReferenceErrors) ───
  const parseMaterialDesc = (rawDesc) => {
    if (!rawDesc) {
      return {
        desc: '',
        publishDate: null,
        deadline: '',
        distributeMode: 'all',
        groups: [],
        comments: [],
      };
    }
    const clean = rawDesc.trim();
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const data = JSON.parse(clean);
        return {
          desc: data.desc || '',
          publishDate: data.publishDate || null,
          deadline: data.deadline || '',
          distributeMode: data.distributeMode || 'all',
          groups: data.groups || [],
          comments: data.comments || [],
        };
      } catch (e) {
        // fallback
      }
    }
    return {
      desc: rawDesc,
      publishDate: null,
      deadline: '',
      distributeMode: 'all',
      groups: [],
      comments: [],
    };
  };

  const serializeMaterialDesc = (data) => {
    return JSON.stringify({
      desc: data.desc || '',
      publishDate: data.publishDate || null,
      deadline: data.deadline || '',
      distributeMode: data.distributeMode || 'all',
      groups: data.groups || [],
      comments: data.comments || [],
    });
  };

  const parseAssignmentDesc = (rawDesc) => {
    if (!rawDesc) {
      return {
        desc: '',
        sessionId: '',
        sessionTitle: '',
        type: 'individual',
        instructions: '',
      };
    }
    const clean = rawDesc.trim();
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const data = JSON.parse(clean);
        return {
          desc: data.desc || '',
          sessionId: data.sessionId || '',
          sessionTitle: data.sessionTitle || '',
          type: data.type || 'individual',
          instructions: data.instructions || '',
        };
      } catch (e) {
        // fallback
      }
    }
    return {
      desc: rawDesc,
      sessionId: '',
      sessionTitle: '',
      type: 'individual',
      instructions: '',
    };
  };

  const serializeAssignmentDesc = (data) => {
    return JSON.stringify({
      desc: data.desc || '',
      sessionId: data.sessionId || '',
      sessionTitle: data.sessionTitle || '',
      type: data.type || 'individual',
      instructions: data.instructions || '',
    });
  };

  const calculateTimeRemaining = (dueDateString) => {
    if (!dueDateString) return { text: 'N/A', status: 'unknown', color: '#64748b', bg: '#f1f5f9' };
    const due = new Date(dueDateString);
    const now = new Date();
    due.setHours(23, 59, 59, 999);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Đã quá hạn ${Math.abs(diffDays)} ngày`, status: 'overdue', color: '#ef4444', bg: '#fef2f2' };
    }
    if (diffDays === 0) {
      return { text: 'Hết hạn hôm nay!', status: 'warning', color: '#ea580c', bg: '#fff7ed' };
    }
    if (diffDays <= 3) {
      return { text: `Còn ${diffDays} ngày`, status: 'warning', color: '#d97706', bg: '#fef3c7' };
    }
    return { text: `Còn ${diffDays} ngày`, status: 'normal', color: '#059669', bg: '#ecfdf5' };
  };

  // ─── Component State ───
  const [toast, setToast] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newMaterialForm, setNewMaterialForm] = useState({
    title: '', description: '', type: 'video', fileName: '', fileSize: '', fileObj: null,
    publishDate: new Date().toISOString().split('T')[0],
    deadline: '',
    distributeMode: 'all',
    numGroups: 2,
    groups: [],
    comments: [],
  });
  const fileInputRef = useRef(null);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [editMaterialForm, setEditMaterialForm] = useState({
    title: '', description: '', type: 'video', fileName: '', fileSize: '', fileObj: null,
    publishDate: '',
    deadline: '',
    distributeMode: 'all',
    numGroups: 2,
    groups: [],
    comments: [],
  });
  const editFileInputRef = useRef(null);
  const commentInputRef = useRef(null);
  const [isEditDragging, setIsEditDragging] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [newAsgForm, setNewAsgForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxPoints: 10,
    sessionId: '',
    type: 'individual',
    instructions: '',
  });
  const [assignmentFilter, setAssignmentFilter] = useState('all'); // all, active, overdue
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [classListSearch, setClassListSearch] = useState('');
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeInput, setGradeInput] = useState(10);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState('');
  const [responseText, setResponseText] = useState('');
  const [trackingStudent, setTrackingStudent] = useState(null);
  const [progressViewMode, setProgressViewMode] = useState('individual');
  const [trackingStudentTab, setTrackingStudentTab] = useState('completed');

  const aggregatedGroups = useMemo(() => {
    const groupsMap = new Map();
    const studentIdToGroupNames = new Map();
    
    materials.forEach(m => {
      const meta = parseMaterialDesc(m.description);
      if (meta.distributeMode !== 'all' && Array.isArray(meta.groups)) {
        meta.groups.forEach(g => {
          if (g.name && Array.isArray(g.members)) {
            if (!groupsMap.has(g.name)) {
              groupsMap.set(g.name, new Set());
            }
            g.members.forEach(member => {
              if (member.id) {
                groupsMap.get(g.name).add(member.id);
                if (!studentIdToGroupNames.has(member.id)) {
                  studentIdToGroupNames.set(member.id, new Set());
                }
                studentIdToGroupNames.get(member.id).add(g.name);
              }
            });
          }
        });
      }
    });

    const resultGroups = [];
    const groupedStudentIds = new Set();

    groupsMap.forEach((studentIdsSet, groupName) => {
      const members = users.filter(s => studentIdsSet.has(s.id));
      if (members.length > 0) {
        resultGroups.push({
          name: groupName,
          members: members
        });
        members.forEach(m => groupedStudentIds.add(m.id));
      }
    });

    const ungroupedMembers = users.filter(s => !groupedStudentIds.has(s.id));
    if (ungroupedMembers.length > 0) {
      resultGroups.push({
        name: 'Chưa chia nhóm / Tự do',
        members: ungroupedMembers
      });
    }

    return resultGroups;
  }, [materials, users]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const classroomMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    const q = searchQuery.toLowerCase();
    return materials.filter(
      (m) => m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
    );
  }, [materials, searchQuery]);

  const classroomAssignments = assignments;
  const filteredAssignments = useMemo(() => {
    let list = classroomAssignments;
    if (assignmentSearch.trim()) {
      const q = assignmentSearch.toLowerCase();
      list = list.filter((asg) => {
        const meta = parseAssignmentDesc(asg.description);
        return asg.title.toLowerCase().includes(q) ||
               meta.desc.toLowerCase().includes(q) ||
               meta.sessionTitle.toLowerCase().includes(q);
      });
    }
    if (assignmentFilter !== 'all') {
      list = list.filter((asg) => {
        const remaining = calculateTimeRemaining(asg.dueDate);
        if (assignmentFilter === 'active') return remaining.status !== 'overdue';
        if (assignmentFilter === 'overdue') return remaining.status === 'overdue';
        return true;
      });
    }
    return list;
  }, [classroomAssignments, assignmentSearch, assignmentFilter]);

  const activeAsgIds = classroomAssignments.map((a) => a.id);
  const activeSubmissions = submissions.filter((s) => activeAsgIds.includes(s.assignmentId));
  const classStudents = users;
  const openFeedbackCount = feedbacks.filter((f) => f.status === 'OPEN').length;
  const pendingGradeCount = activeSubmissions.filter((s) => s.status === 'SUBMITTED').length;

  useEffect(() => {
    if (feedbacks.length && !selectedFeedbackId) {
      setSelectedFeedbackId(feedbacks[0].id);
    }
  }, [feedbacks, selectedFeedbackId]);

  const generateRandomGroups = (num, studentsList) => {
    const list = [...studentsList];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    const result = Array.from({ length: num }, (_, index) => ({
      name: `Nhóm ${index + 1}`,
      members: [],
    }));
    list.forEach((student, index) => {
      result[index % num].members.push({ id: student.id, name: student.name });
    });
    return result;
  };

  const handleAddComment = (text) => {
    if (!text.trim()) return;
    const authorName = currentUser?.fullName || currentUser?.name || 'Giảng viên';
    const cleanTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
    const newCommentObj = {
      author: authorName,
      text: text.trim(),
      time: cleanTime
    };
    
    setEditMaterialForm((prev) => {
      const updatedComments = [...(prev.comments || []), newCommentObj];
      const payload = {
        title: prev.title,
        description: serializeMaterialDesc({
          desc: prev.description,
          publishDate: prev.publishDate,
          deadline: prev.deadline,
          distributeMode: prev.distributeMode,
          groups: prev.groups,
          comments: updatedComments,
        }),
        type: prev.type,
        fileSize: prev.fileName ? prev.fileSize : '',
        url: prev.fileName ? `#file:${prev.fileName}` : '#',
      };
      
      api.updateMaterial(editingMaterialId, payload).then(() => {
        showToast('Đã lưu bình luận!');
      }).catch((e) => {
        showToast(e.message || 'Lưu bình luận thất bại', 'info');
      });

      return {
        ...prev,
        comments: updatedComments
      };
    });
  };

  // ─── Detect file type from MIME / extension ───
  const detectFileType = (file) => {
    const mime = file.type || '';
    const name = file.name.toLowerCase();
    if (mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/.test(name)) return 'video';
    if (mime === 'application/pdf' || name.endsWith('.pdf'))                    return 'pdf';
    if (/spreadsheet|excel|csv/.test(mime) || /\.(xlsx?|csv)$/.test(name))    return 'document';
    if (/word|msword/.test(mime) || /\.(docx?)$/.test(name))                   return 'document';
    if (/quiz|json/.test(mime) || /\.(json)$/.test(name))                      return 'quiz';
    return 'document';
  };

  const applyFile = (file) => {
    if (!file) return;
    const detectedType = detectFileType(file);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setNewMaterialForm((prev) => ({
      ...prev,
      fileObj: file,
      fileName: file.name,
      fileSize: `${sizeMB} MB`,
      type: detectedType,
      title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
    }));
    showToast(`Đã chọn: ${file.name} (${sizeMB} MB)`, 'info');
  };

  // Real file input change
  const handleFileInputChange = (e) => {
    applyFile(e.target.files?.[0]);
    e.target.value = ''; // reset so same file can be re-selected
  };

  // Click dropzone → open system file picker
  const handleDropZoneClick = () => fileInputRef.current?.click();

  const handleDragOver   = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave  = () => setIsDragging(false);
  const handleDrop       = (e) => {
    e.preventDefault();
    setIsDragging(false);
    applyFile(e.dataTransfer.files?.[0]);
  };

  const renderFileIcon = (type) => {
    switch (type) {
      case 'video':
        return <Film size={32} color="#3b82f6" />;
      case 'pdf':
        return <FileText size={32} color="#ef4444" />;
      case 'document':
        return <FileSpreadsheet size={32} color="#10b981" />;
      case 'quiz':
        return <CheckSquare size={32} color="#f59e0b" />;
      default:
        return <Paperclip size={32} color="#64748b" />;
    }
  };

  const handleEditMaterialStart = (material) => {
    const meta = parseMaterialDesc(material.description);
    setEditingMaterialId(material.id);
    setEditMaterialForm({
      title: material.title || '',
      description: meta.desc || '',
      type: material.type || 'video',
      fileName: material.url && material.url.startsWith('#file:') ? material.url.substring(6) : (material.url !== '#' ? material.url : ''),
      fileSize: material.fileSize || '',
      fileObj: null,
      publishDate: meta.publishDate || material.uploadedAt || '',
      deadline: meta.deadline || '',
      distributeMode: meta.distributeMode || 'all',
      numGroups: meta.groups?.length || 2,
      groups: meta.groups || [],
      comments: meta.comments || [],
    });
  };

  const handleCancelEdit = () => {
    setEditingMaterialId(null);
    setEditMaterialForm({
      title: '', description: '', type: 'video', fileName: '', fileSize: '', fileObj: null,
      publishDate: '', deadline: '', distributeMode: 'all', numGroups: 2, groups: [], comments: []
    });
  };

  const applyEditFile = (file) => {
    if (!file) return;
    const detectedType = detectFileType(file);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setEditMaterialForm((prev) => ({
      ...prev,
      fileObj: file,
      fileName: file.name,
      fileSize: `${sizeMB} MB`,
      type: detectedType,
      title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
    }));
    showToast(`Đã chọn tệp sửa: ${file.name} (${sizeMB} MB)`, 'info');
  };

  const handleEditFileInputChange = (e) => {
    applyEditFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleEditDropZoneClick = () => editFileInputRef.current?.click();

  const handleEditDragOver   = (e) => { e.preventDefault(); setIsEditDragging(true); };
  const handleEditDragLeave  = () => setIsEditDragging(false);
  const handleEditDrop       = (e) => {
    e.preventDefault();
    setIsEditDragging(false);
    applyEditFile(e.dataTransfer.files?.[0]);
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterialForm.title) {
      showToast('Vui lòng điền tiêu đề học liệu', 'info');
      return;
    }
    setIsUploading(true);
    try {
      const payload = {
        title: newMaterialForm.title,
        description: serializeMaterialDesc({
          desc: newMaterialForm.description,
          publishDate: newMaterialForm.publishDate,
          deadline: newMaterialForm.deadline,
          distributeMode: newMaterialForm.distributeMode,
          groups: newMaterialForm.groups,
          comments: newMaterialForm.comments,
        }),
        type: newMaterialForm.type,
        fileSize: newMaterialForm.fileName ? newMaterialForm.fileSize : '',
        url: newMaterialForm.fileName ? `#file:${newMaterialForm.fileName}` : '#',
      };
      await api.addMaterial(payload);
      showToast('Đăng tải học liệu thành công!');
      setNewMaterialForm({
        title: '', description: '', type: 'video', fileName: '', fileSize: '', fileObj: null,
        publishDate: new Date().toISOString().split('T')[0],
        deadline: '', distributeMode: 'all', numGroups: 2, groups: [], comments: []
      });
    } catch (err) {
      showToast(err.message || 'Lưu học liệu thất bại.', 'info');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateMaterial = async (e) => {
    e.preventDefault();
    if (!editMaterialForm.title) {
      showToast('Vui lòng điền tiêu đề học liệu', 'info');
      return;
    }
    setIsUploading(true);
    try {
      const payload = {
        title: editMaterialForm.title,
        description: serializeMaterialDesc({
          desc: editMaterialForm.description,
          publishDate: editMaterialForm.publishDate,
          deadline: editMaterialForm.deadline,
          distributeMode: editMaterialForm.distributeMode,
          groups: editMaterialForm.groups,
          comments: editMaterialForm.comments,
        }),
        type: editMaterialForm.type,
        fileSize: editMaterialForm.fileName ? editMaterialForm.fileSize : '',
        url: editMaterialForm.fileName ? `#file:${editMaterialForm.fileName}` : '#',
      };
      await api.updateMaterial(editingMaterialId, payload);
      showToast('Cập nhật học liệu thành công!');
      setEditingMaterialId(null);
    } catch (err) {
      showToast(err.message || 'Lưu học liệu thất bại.', 'info');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Vô hiệu hóa học liệu này?\nHọc liệu sẽ bị ẩn khỏi học sinh nhưng vẫn hiển thị trong danh sách của giảng viên với trạng thái "Đã VH".')) return;
    try {
      await api.removeMaterial(id);
      showToast('Đã vô hiệu hóa học liệu.');
    } catch (err) {
      showToast(err.message || 'Vô hiệu hóa thất bại.', 'info');
    }
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!newAsgForm.title || !newAsgForm.dueDate) {
      showToast('Vui lòng hoàn thành tiêu đề và hạn nộp', 'info');
      return;
    }
    const payload = {
      title: newAsgForm.title,
      description: serializeAssignmentDesc({
        desc: newAsgForm.description,
        sessionId: newAsgForm.sessionId,
        sessionTitle: sessions.find((s) => s.id === newAsgForm.sessionId)?.title || '',
        type: newAsgForm.type,
        instructions: newAsgForm.instructions,
      }),
      dueDate: newAsgForm.dueDate,
      maxPoints: Number(newAsgForm.maxPoints),
    };
    try {
      if (editingAssignmentId) {
        await api.updateAssignment(editingAssignmentId, payload);
        showToast('Cập nhật bài tập thành công!');
      } else {
        await api.addAssignment(payload);
        showToast('Tạo bài tập thành công!');
      }
      setIsAssignmentModalOpen(false);
      setEditingAssignmentId(null);
      setNewAsgForm({
        title: '',
        description: '',
        dueDate: '',
        maxPoints: 10,
        sessionId: '',
        type: 'individual',
        instructions: '',
      });
    } catch (err) {
      showToast(err.message || 'Lưu bài tập thất bại.', 'info');
    }
  };

  const handleEditAssignmentStart = (asg) => {
    const meta = parseAssignmentDesc(asg.description);
    setEditingAssignmentId(asg.id);
    setNewAsgForm({
      title: asg.title,
      description: meta.desc,
      dueDate: asg.dueDate,
      maxPoints: asg.maxPoints,
      sessionId: meta.sessionId,
      type: meta.type,
      instructions: meta.instructions,
    });
    setIsAssignmentModalOpen(true);
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài tập này? Thao tác này không thể hoàn tác.')) {
      try {
        await api.removeAssignment(id);
        showToast('Đã xóa bài tập thành công!');
      } catch (err) {
        showToast(err.message || 'Xóa bài tập thất bại.', 'info');
      }
    }
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    try {
      await api.gradeSubmission(gradingSubmission.id, {
        grade: gradeInput,
        feedback: gradeFeedback,
      });
      setGradingSubmission(null);
      showToast('Đã chấm điểm & gửi phản hồi!');
    } catch (err) {
      showToast(err.message || 'Chấm điểm thất bại.', 'info');
    }
  };

  const handleSendFeedbackResponse = async (e) => {
    e.preventDefault();
    if (!responseText || !selectedFeedbackId) return;
    try {
      await api.respondFeedback(selectedFeedbackId, { response: responseText });
      setResponseText('');
      showToast('Đã phản hồi sinh viên!');
    } catch (err) {
      showToast(err.message || 'Gửi phản hồi thất bại.', 'info');
    }
  };

  const handlePromoteStudent = async (studentId, currentRole) => {
    try {
      const targetRole = currentRole === 'assistant' ? 'student' : 'assistant';
      await api.promoteStudent(studentId, targetRole);
      showToast(targetRole === 'assistant' ? 'Đã thăng cấp trợ giảng thành công!' : 'Đã hạ chức vụ trợ giảng.');
    } catch (err) {
      showToast(err.message || 'Thao tác thất bại.', 'info');
    }
  };

  const typeClass = (type) => {
    if (type === 'video') return styles.typeVideo;
    if (type === 'pdf') return styles.typePdf;
    if (type === 'quiz') return styles.typeQuiz;
    return styles.typeDoc;
  };

  if (classesLoading || workspaceLoading) {
    return <p className={styles.loading}>Đang tải dữ liệu từ database...</p>;
  }

  return (
    <div className={styles.root}>
      {toast && (
        <div className={styles.toast}>
          <Check size={16} /> {toast.message}
        </div>
      )}

      {classesError && (
        <p className={styles.loading} style={{ color: '#b91c1c' }}>
          {classesError}
        </p>
      )}


      {selectedClassId && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Học liệu tải lên</span>
            <p className={styles.statValue}>{classroomMaterials.length}</p>
            <p className={styles.statHint}>Upload Materials</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Bài tập giao</span>
            <p className={styles.statValue}>{classroomAssignments.length}</p>
            <p className={styles.statHint}>Chờ chấm: {pendingGradeCount}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Sĩ số thành viên</span>
            <p className={styles.statValue}>{classStudents.length}</p>
            <p className={styles.statHint}>Track Student Progress</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Phản hồi mở</span>
            <p className={styles.statValue}>{openFeedbackCount}</p>
            <p className={styles.statHint}>Respond Feedback</p>
          </div>
        </div>
      )}

      <div className={styles.panel}>
        {activeSubTab === 'materials' && (
          <div className={styles.grid2}>
            <div className={styles.formBox}>
              <h3 className={styles.panelTitle}>
                <Upload size={16} /> Đăng tải Học liệu Mới
              </h3>
              <form onSubmit={handleAddMaterial}>
                <div className={styles.field}>
                  <label>Tiêu đề học liệu</label>
                  <input className={styles.input} value={newMaterialForm.title}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, title: e.target.value })}
                    placeholder="Tuần 5: Mô hình ERD..." />
                </div>
                <div className={styles.field}>
                  <label>Yêu cầu / Mô tả</label>
                  <textarea className={styles.textarea} rows={2} value={newMaterialForm.description}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, description: e.target.value })} />
                </div>
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Loại tệp</label>
                    <select className={styles.select} value={newMaterialForm.type}
                      onChange={(e) => setNewMaterialForm({ ...newMaterialForm, type: e.target.value })}>
                      <option value="video">Video bài giảng (quay trước)</option>
                      <option value="pdf">Tài liệu PDF</option>
                      <option value="document">Giáo trình doc</option>
                      <option value="quiz">Trắc nghiệm</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Ngày phát hành</label>
                    <input type="date" className={styles.input} value={newMaterialForm.publishDate}
                      onChange={(e) => setNewMaterialForm({ ...newMaterialForm, publishDate: e.target.value })} />
                  </div>
                </div>

                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Hạn hoàn thành</label>
                    <input type="date" className={styles.input} value={newMaterialForm.deadline}
                      onChange={(e) => setNewMaterialForm({ ...newMaterialForm, deadline: e.target.value })} />
                  </div>
                  <div className={styles.field}>
                    <label>Đối tượng / Nhóm học</label>
                    <select className={styles.select} value={newMaterialForm.distributeMode}
                      onChange={(e) => {
                        const mode = e.target.value;
                        let initialGroups = [];
                        if (mode !== 'all') {
                          initialGroups = generateRandomGroups(newMaterialForm.numGroups, classStudents);
                        }
                        setNewMaterialForm({ ...newMaterialForm, distributeMode: mode, groups: initialGroups });
                      }}>
                      <option value="all">Toàn bộ lớp học</option>
                      <option value="group_random">Chia nhóm ngẫu nhiên</option>
                      <option value="group_assigned">Chia nhóm chỉ định</option>
                    </select>
                  </div>
                </div>

                {newMaterialForm.distributeMode !== 'all' && (
                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 2 }}>Số nhóm</label>
                        <input type="number" className={styles.input} style={{ padding: '4px 8px' }} min={2} max={10} value={newMaterialForm.numGroups}
                          onChange={(e) => {
                            const num = parseInt(e.target.value) || 2;
                            const newGroups = generateRandomGroups(num, classStudents);
                            setNewMaterialForm({ ...newMaterialForm, numGroups: num, groups: newGroups });
                          }} />
                      </div>
                      <button type="button" className={styles.btnSecondary} style={{ alignSelf: 'flex-end', fontSize: 10, padding: '6px 10px' }}
                        onClick={() => {
                          const newGroups = generateRandomGroups(newMaterialForm.numGroups, classStudents);
                          setNewMaterialForm({ ...newMaterialForm, groups: newGroups });
                          showToast('Đã phân chia lại nhóm ngẫu nhiên', 'info');
                        }}>
                        Xáo trộn nhóm
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {newMaterialForm.groups.map((group, idx) => (
                        <div key={idx} style={{ background: '#fff', padding: 6, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                          <strong style={{ fontSize: 11, color: '#0f172a' }}>{group.name}</strong>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, maxHeight: 40, overflowY: 'auto' }}>
                            {group.members.length === 0 ? <em>Chưa có ai</em> : group.members.map((m) => m.name).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden real file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.webm,.jpg,.png,.zip,.json"
                  onChange={handleFileInputChange}
                />

                <div
                  className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleDropZoneClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleDropZoneClick()}
                >
                  {newMaterialForm.fileName ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      {renderFileIcon(newMaterialForm.type)}
                      <p style={{ fontWeight: 600, color: '#0f172a', margin: '4px 0 0', fontSize: 13, wordBreak: 'break-all' }}>
                        {newMaterialForm.fileName}
                      </p>
                      <small style={{ color: '#64748b' }}>{newMaterialForm.fileSize}</small>
                      <small style={{ color: '#059669', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={14} /> Sẵn sàng tải lên (Click để thay đổi)
                      </small>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} color="#94a3b8" />
                      <p style={{ margin: '8px 0 4px', fontSize: 13, color: '#475569' }}>
                        Kéo thả tệp hoặc <strong style={{ color: '#059669' }}>nhấp để chọn file</strong>
                      </p>
                      <small style={{ color: '#94a3b8' }}>PDF, Word, Excel, Video, PowerPoint, JSON...</small>
                    </>
                  )}
                </div>

                <button type="submit" className={styles.btnPrimary} disabled={isUploading}>
                  {isUploading ? 'Đang tải lên...' : 'Lưu học liệu & Phát hành'}
                </button>
              </form>
            </div>
            <div>
              <h3 className={styles.panelTitle}>Lộ trình Tài liệu lớp đảo ngược</h3>
              {classroomMaterials.map((m, index) => {
                const isCompletedByAll = classStudents.length > 0 && m.completedByUsers?.length >= classStudents.length;
                const hasSomeCompletion = m.completedByUsers?.length > 0;
                return (
                  <div
                    key={m.id}
                    className={`${styles.materialItem} ${m.isDisabled ? styles.materialItemDisabled : ''}`}
                    style={isCompletedByAll && !m.isDisabled ? { borderLeft: '4px solid #10b981', background: '#f8fafc' } : m.isDisabled ? { borderLeft: '4px solid #cbd5e1' } : undefined}
                  >
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span
                        className={styles.indexBadge}
                        style={isCompletedByAll && !m.isDisabled ? { background: '#d1fae5', color: '#065f46' } : undefined}
                      >
                        {index + 1}
                      </span>
                      <div>
                        {(() => {
                          const meta = parseMaterialDesc(m.description);
                          const displayDesc = meta.desc || m.description;
                          const displayPublishDate = meta.publishDate || m.uploadedAt;
                          return (
                            <>
                              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                                <span className={`${styles.typeTag} ${typeClass(m.type)}`}>{m.type}</span>
                                {m.isDisabled && (
                                  <span className={styles.disabledBadge}>Đã VH</span>
                                )}
                                <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>Đăng: {displayPublishDate}</span>
                                {meta.deadline && (
                                  <span style={{ fontSize: 10, background: '#fef2f2', color: '#b91c1c', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                    Hạn: {meta.deadline}
                                  </span>
                                )}
                                {meta.distributeMode !== 'all' && (
                                  <span style={{ fontSize: 10, background: '#f0fdf4', color: '#16a34a', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                    {meta.distributeMode === 'group_random' ? 'Nhóm Ngẫu Nhiên' : 'Nhóm Chỉ Định'} ({meta.groups?.length} nhóm)
                                  </span>
                                )}
                                {meta.comments?.length > 0 && (
                                  <span style={{ fontSize: 10, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 3, background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>
                                    <MessageSquare size={10} /> {meta.comments.length}
                                  </span>
                                )}
                              </div>
                              <h4 style={{ margin: '4px 0', fontSize: 14 }}>{m.title}</h4>
                              <p style={{ fontSize: 12, color: '#64748b', whiteSpace: 'pre-wrap' }}>{displayDesc}</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                      {!m.isDisabled && (isCompletedByAll ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 12px',
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <Check size={14} strokeWidth={3} /> Đã hoàn thành (100%)
                        </div>
                      ) : hasSomeCompletion ? (
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={async () => {
                            try {
                              await api.completeMaterialAll(m.id);
                              showToast('Đã đánh dấu hoàn thành cho cả lớp.');
                            } catch (err) {
                              showToast(err.message || 'Cập nhật thất bại.', 'info');
                            }
                          }}
                          style={{
                            background: '#fffbeb',
                            color: '#b45309',
                            borderColor: '#fde68a',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title="Click để đánh dấu hoàn thành cho toàn bộ lớp"
                        >
                          Tiến độ: {m.completedByUsers.length}/{classStudents.length} (Đạt)
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={async () => {
                            try {
                              await api.completeMaterialAll(m.id);
                              showToast('Đã đánh dấu hoàn thành cho cả lớp.');
                            } catch (err) {
                              showToast(err.message || 'Cập nhật thất bại.', 'info');
                            }
                          }}
                        >
                          Cập nhật hoàn thành
                        </button>
                      ))}
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => handleEditMaterialStart(m)}
                        title="Sửa học liệu"
                        disabled={m.isDisabled}
                        style={m.isDisabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className={m.isDisabled ? styles.iconBtn : styles.iconBtnDanger}
                        onClick={() => !m.isDisabled && handleDeleteMaterial(m.id)}
                        title={m.isDisabled ? 'Đã vô hiệu hóa' : 'Vô hiệu hóa học liệu'}
                        style={m.isDisabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {classroomMaterials.length === 0 && (
                <div className={styles.emptyBox}>Chưa có tài liệu. Hãy đăng tải bên trái.</div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'classList' && (
          <>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 className={styles.panelTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={20} color="#059669" /> Danh sách Lớp & Trợ giảng
                </h3>
                <p className={styles.panelDesc} style={{ margin: '4px 0 0' }}>
                  Quản lý và theo dõi thông tin học sinh, trợ giảng học thuật trong lớp học này.
                </p>
              </div>
              
              {/* Stats badges */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: '#166534', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Trợ giảng</span>
                  <strong style={{ fontSize: 16, color: '#15803d' }}>
                    {classStudents.filter((s) => s.role === 'assistant').length}
                  </strong>
                </div>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: '#1e40af', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Học viên</span>
                  <strong style={{ fontSize: 16, color: '#1d4ed8' }}>
                    {classStudents.filter((s) => s.role !== 'assistant').length}
                  </strong>
                </div>
              </div>
            </div>

            {/* Search toolbar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo họ tên hoặc email..."
                  className={styles.input}
                  style={{ paddingLeft: 36, width: '100%', margin: 0 }}
                  value={classListSearch}
                  onChange={(e) => setClassListSearch(e.target.value)}
                />
              </div>
              {classListSearch && (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ padding: '8px 12px', margin: 0 }}
                  onClick={() => setClassListSearch('')}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {(() => {
              const q = classListSearch.toLowerCase().trim();
              const filteredMembers = classStudents.filter((s) => 
                s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
              );
              
              const assistants = filteredMembers.filter((s) => s.role === 'assistant');
              const regularStudents = filteredMembers.filter((s) => s.role !== 'assistant');

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* 1. TEACHING ASSISTANTS SECTION */}
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Award size={16} color="#ea580c" /> Trợ giảng học thuật ({assistants.length})
                    </h4>
                    
                    {assistants.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                        {assistants.map((ast) => {
                          const done = classroomMaterials.filter((m) => m.completedByUsers?.includes(ast.id)).length;
                          const pct = classroomMaterials.length ? Math.round((done / classroomMaterials.length) * 100) : 0;
                          return (
                            <div
                              key={ast.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                background: 'linear-gradient(135deg, #fffbeb 0%, #fff 100%)',
                                border: '1px solid #fde68a',
                                boxShadow: '0 4px 15px rgba(251, 191, 36, 0.05)',
                                padding: 14,
                                borderRadius: 12,
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              {/* Accent top line */}
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
                              
                              <img
                                src={ast.avatarUrl}
                                alt={ast.name}
                                style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #fbbf24', flexShrink: 0 }}
                              />
                              <div style={{ overflow: 'hidden', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: 13, color: '#78350f' }}>{ast.name}</strong>
                                  <span style={{ fontSize: 8, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', fontWeight: 800 }}>
                                    Trợ giảng
                                  </span>
                                </div>
                                <span style={{ fontSize: 11, color: '#b45309', opacity: 0.8, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {ast.email}
                                </span>
                                <small style={{ fontSize: 10, color: '#92400e', marginTop: 4, display: 'block' }}>
                                  Đã xem: <strong>{pct}% ({done}/{classroomMaterials.length})</strong> tài liệu
                                </small>
                              </div>
                              
                              <button
                                type="button"
                                className={styles.groupMemberActionBtn}
                                onClick={() => {
                                  setTrackingStudent(ast);
                                  setTrackingStudentTab('completed');
                                }}
                                style={{ background: '#fef3c7', color: '#b45309' }}
                                title="Xem học bạ trợ giảng"
                              >
                                <Eye size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Chưa có trợ giảng nào cho lớp học này.</p>
                          <small style={{ color: '#94a3b8' }}>Bạn có thể thăng cấp học viên xuất sắc làm trợ giảng cục bộ để hỗ trợ quản lý lớp.</small>
                        </div>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          style={{ fontSize: 11, padding: '6px 12px', background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309' }}
                          onClick={() => setActiveSubTab('promotion')}
                        >
                          <Sparkles size={11} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} />
                          Đi thăng cấp ngay
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. REGULAR STUDENTS SECTION */}
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={16} color="#0284c7" /> Danh sách Học viên thường ({regularStudents.length})
                    </h4>
                    
                    {regularStudents.length > 0 ? (
                      <div className={styles.tableWrap} style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.01)', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                        <table className={styles.table} style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th>Học viên</th>
                              <th>Tiến độ Học liệu</th>
                              <th>Bài tập Đã nộp</th>
                              <th>Điểm Trung bình</th>
                              <th style={{ textAlign: 'right' }}>Học bạ điện tử</th>
                            </tr>
                          </thead>
                          <tbody>
                            {regularStudents.map((st) => {
                              const done = classroomMaterials.filter((m) => m.completedByUsers?.includes(st.id)).length;
                              const pct = classroomMaterials.length ? Math.round((done / classroomMaterials.length) * 100) : 0;
                              const hw = submissions.filter((sub) => sub.studentId === st.id && activeAsgIds.includes(sub.assignmentId)).length;
                              const graded = submissions.filter((sub) => sub.studentId === st.id && sub.status === 'GRADED' && sub.grade != null);
                              const avg = graded.length
                                ? (graded.reduce((sum, curr) => sum + curr.grade, 0) / graded.length).toFixed(1)
                                : 'Chưa có';
                              
                              return (
                                <tr key={st.id} style={{ transition: 'background 0.15s' }}>
                                  <td style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: 'none' }}>
                                    <img
                                      src={st.avatarUrl}
                                      alt={st.name}
                                      style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e2e8f0' }}
                                    />
                                    <div>
                                      <strong style={{ fontSize: 12, color: '#1e293b', display: 'block' }}>{st.name}</strong>
                                      <span style={{ fontSize: 11, color: '#64748b' }}>{st.email}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span className={styles.progressBar} style={{ width: 60, margin: 0 }}>
                                        <span className={styles.progressFill} style={{ width: `${pct}%` }} />
                                      </span>
                                      <span style={{ fontSize: 11, fontWeight: 600 }}>{pct}%</span>
                                      <span style={{ fontSize: 10, color: '#94a3b8' }}>({done}/{classroomMaterials.length})</span>
                                    </div>
                                  </td>
                                  <td style={{ fontSize: 12, fontWeight: 500 }}>
                                    {hw} / {classroomAssignments.length} bài
                                  </td>
                                  <td>
                                    <strong style={{ color: avg !== 'Chưa có' ? '#047857' : '#64748b', fontSize: 12 }}>
                                      {avg} {avg !== 'Chưa có' && 'đ'}
                                    </strong>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <button
                                      type="button"
                                      className={styles.btnSecondary}
                                      onClick={() => {
                                        setTrackingStudent(st);
                                        setTrackingStudentTab('completed');
                                      }}
                                      style={{ fontSize: 11, padding: '5px 10px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <Eye size={12} /> Học bạ
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className={styles.emptyBox}>Không tìm thấy học viên nào phù hợp.</div>
                    )}
                  </div>
                  
                </div>
              );
            })()}
          </>
        )}

        {activeSubTab === 'assignments' && (
          <>
            {/* ─── Assignment Toolbar & Filters ─── */}
            <div className={styles.assignmentToolbar}>
              <div className={styles.toolbarLeft}>
                <div className={styles.searchWrapper}>
                  <input
                    type="text"
                    placeholder="Tìm kiếm bài tập, học phần..."
                    className={styles.input}
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                  />
                </div>
                <div className={styles.filterWrapper}>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${assignmentFilter === 'all' ? styles.filterBtnActive : ''}`}
                    onClick={() => setAssignmentFilter('all')}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${assignmentFilter === 'active' ? styles.filterBtnActive : ''}`}
                    onClick={() => setAssignmentFilter('active')}
                  >
                    Đang diễn ra
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${assignmentFilter === 'overdue' ? styles.filterBtnActive : ''}`}
                    onClick={() => setAssignmentFilter('overdue')}
                  >
                    Đã quá hạn
                  </button>
                </div>
              </div>
              <button
                type="button"
                className={styles.btnEmerald}
                onClick={() => {
                  setEditingAssignmentId(null);
                  setNewAsgForm({
                    title: '',
                    description: '',
                    dueDate: '',
                    maxPoints: 10,
                    sessionId: '',
                    type: 'individual',
                    instructions: '',
                  });
                  setIsAssignmentModalOpen(true);
                }}
              >
                <Plus size={16} /> Soạn bài tập mới
              </button>
            </div>

            {/* ─── Assignment Card Grid ─── */}
            <div className={styles.assignmentGrid}>
              {filteredAssignments.map((asg) => {
                const meta = parseAssignmentDesc(asg.description);
                const timeInfo = calculateTimeRemaining(asg.dueDate);
                const asgSubs = submissions.filter((s) => s.assignmentId === asg.id);
                const asgSubsCount = asgSubs.length;
                const totalStudents = classStudents.length || 1;
                const pct = Math.min(100, Math.round((asgSubsCount / totalStudents) * 100));

                return (
                  <div key={asg.id} className={styles.assignmentCard}>
                    {/* Header */}
                    <div className={styles.asgCardHeader}>
                      <span className={styles.scoreBadge}>Thang điểm: {asg.maxPoints}đ</span>
                      <div className={styles.asgActionGroup}>
                        <button
                          type="button"
                          className={styles.miniIconBtn}
                          onClick={() => handleEditAssignmentStart(asg)}
                          title="Sửa bài tập"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className={styles.miniIconBtn}
                          style={{ color: '#ef4444' }}
                          onClick={() => handleDeleteAssignment(asg.id)}
                          title="Xóa bài tập"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Title & Session Link */}
                    <h4 className={styles.asgCardTitle}>{asg.title}</h4>
                    {meta.sessionTitle && (
                      <div className={styles.linkedSessionBadge}>
                        <Clock size={11} /> Học phần: {meta.sessionTitle}
                      </div>
                    )}

                    {/* Meta info tags */}
                    <div style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
                      <span className={styles.asgTypeTag}>
                        {meta.type === 'group' ? 'Làm nhóm' : 'Làm cá nhân'}
                      </span>
                      <span
                        className={styles.countdownPill}
                        style={{ color: timeInfo.color, background: timeInfo.bg }}
                      >
                        {timeInfo.text}
                      </span>
                    </div>

                    {/* Description */}
                    <p className={styles.asgCardDesc}>{meta.desc || 'Không có mô tả.'}</p>

                    {/* Detailed Instructions if present */}
                    {meta.instructions && (
                      <div className={styles.asgInstructionsBlock}>
                        <strong>Hướng dẫn:</strong> {meta.instructions}
                      </div>
                    )}

                    {/* Submissions Progress */}
                    <div className={styles.asgProgressSection}>
                      <div className={styles.asgProgressHeader}>
                        <span>Bài nộp: <strong>{asgSubsCount}/{classStudents.length}</strong></span>
                        <span>{pct}%</span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      style={{ width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      onClick={() => setActiveSubTab('grading')}
                    >
                      <CheckSquare size={14} /> Kiểm tra bài nộp
                    </button>
                  </div>
                );
              })}
            </div>

            {filteredAssignments.length === 0 && (
              <div className={styles.emptyBox}>Không tìm thấy bài tập nào. Hãy bấm Soạn bài tập mới.</div>
            )}
          </>
        )}

        {activeSubTab === 'grading' && (
          <div className={styles.grid2}>
            <div>
              <h3 className={styles.panelTitle}>Danh sách bài nộp</h3>
              {activeSubmissions.map((sub) => {
                const student = users.find((u) => u.id === sub.studentId) || { name: sub.studentName };
                const asg = classroomAssignments.find((a) => a.id === sub.assignmentId);
                const isSelected = gradingSubmission?.id === sub.id;
                const isGraded = sub.status === 'GRADED';
                return (
                  <button
                    key={sub.id}
                    type="button"
                    className={`${styles.card} ${isSelected ? styles.activeCard : ''}`}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      marginBottom: 12,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setGradingSubmission(sub);
                      setGradeInput(sub.grade ?? 10);
                      setGradeFeedback(sub.feedback || 'Bài làm đạt yêu cầu.');
                    }}
                  >
                    <strong>{student?.name}</strong>
                    <p style={{ fontSize: 12, margin: '4px 0' }}>{asg?.title}</p>
                    <span className={isGraded ? styles.statusBadgeGraded : styles.statusBadgePending}>
                      {isGraded ? `Đã chấm: ${sub.grade}đ` : 'Chờ chấm'}
                    </span>
                  </button>
                );
              })}
              {activeSubmissions.length === 0 && (
                <div className={styles.emptyBox}>Chưa có bài nộp.</div>
              )}
            </div>
            <div className={styles.formBox}>
              {gradingSubmission ? (
                (() => {
                  const student = users.find((u) => u.id === gradingSubmission.studentId) || { name: gradingSubmission.studentName };
                  const asg = classroomAssignments.find((a) => a.id === gradingSubmission.assignmentId);
                  const GRADE_CHOICES = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0];

                  return (
                    <div>
                      {/* Thông tin bài nộp chi tiết */}
                      <div className={styles.submissionDetails}>
                        <h4 className={styles.detailsHeader}>Thông tin bài nộp</h4>
                        <div className={styles.detailsRow}>
                          <strong>Học sinh nộp:</strong>
                          <span>
                            {student?.name} {student?.email && `(${student.email})`}
                          </span>
                        </div>
                        <div className={styles.detailsRow}>
                          <strong>Bài tập:</strong>
                          <span>{asg?.title}</span>
                        </div>
                        <div className={styles.detailsRow}>
                          <strong>Giờ nộp:</strong>
                          <span>{new Date(gradingSubmission.submittedAt).toLocaleString('vi-VN')}</span>
                        </div>
                        {gradingSubmission.fileName && (
                          <div className={styles.detailsRow}>
                            <strong>Tệp đính kèm:</strong>
                            <a
                              href={`#file:${gradingSubmission.fileName}`}
                              className={styles.fileLink}
                              title="Tải xuống tệp nộp bài"
                            >
                              <Paperclip size={12} style={{ marginRight: 4 }} />
                              {gradingSubmission.fileName}
                            </a>
                          </div>
                        )}
                        {gradingSubmission.studentNotes && (
                          <div className={styles.notesBox}>
                            <strong>Nội dung bài làm:</strong>
                            <p className={styles.notesText}>{gradingSubmission.studentNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* Form Chấm điểm */}
                      <form onSubmit={handleSubmitGrade}>
                        <h3 className={styles.panelTitle}>Chấm điểm & Nhận xét</h3>
                        
                        <div className={styles.field}>
                          <label>Chọn điểm số (Thang 10)</label>
                          <div className={styles.gradeGrid}>
                            {GRADE_CHOICES.map((val) => (
                              <button
                                key={val}
                                type="button"
                                className={`${styles.gradeOptionBtn} ${gradeInput === val ? styles.gradeOptionBtnActive : ''}`}
                                onClick={() => setGradeInput(val)}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: -6, marginBottom: 12 }}>
                            Điểm đang chọn: <strong style={{ color: '#065f46', fontSize: 13 }}>{gradeInput}đ</strong>
                          </div>
                        </div>

                        <div className={styles.field}>
                          <label>Phản hồi</label>
                          <textarea
                            className={styles.textarea}
                            rows={4}
                            value={gradeFeedback}
                            onChange={(e) => setGradeFeedback(e.target.value)}
                            required
                          />
                        </div>
                        <button type="submit" className={styles.btnPrimary}>
                          Lưu điểm & Trả bài
                        </button>
                      </form>
                    </div>
                  );
                })()
              ) : (
                <div className={styles.emptyBox}>Chọn bài nộp bên trái để chấm.</div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'progress' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>Báo cáo Tiến độ học viên</h3>
                <p className={styles.panelDesc} style={{ margin: '4px 0 0' }}>Xem tiến độ học tập, nộp bài tập và điểm trung bình của cả lớp</p>
              </div>
              <div className={styles.progressToggleContainer}>
                <button
                  type="button"
                  className={`${styles.progressToggleBtn} ${progressViewMode === 'individual' ? styles.progressToggleBtnActive : ''}`}
                  onClick={() => setProgressViewMode('individual')}
                >
                  Cá nhân
                </button>
                <button
                  type="button"
                  className={`${styles.progressToggleBtn} ${progressViewMode === 'group' ? styles.progressToggleBtnActive : ''}`}
                  onClick={() => setProgressViewMode('group')}
                >
                  Theo nhóm
                </button>
              </div>
            </div>

            {progressViewMode === 'individual' ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Học viên</th>
                      <th>Học liệu hoàn tất</th>
                      <th>Nộp bài</th>
                      <th>Điểm TB</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student) => {
                      const done = classroomMaterials.filter((m) => m.completedByUsers?.includes(student.id)).length;
                      const pct = classroomMaterials.length ? Math.round((done / classroomMaterials.length) * 100) : 0;
                      const hw = submissions.filter((s) => s.studentId === student.id && activeAsgIds.includes(s.assignmentId)).length;
                      const graded = submissions.filter((s) => s.studentId === student.id && s.status === 'GRADED' && s.grade != null);
                      const avg = graded.length
                        ? (graded.reduce((s, c) => s + c.grade, 0) / graded.length).toFixed(1)
                        : 'Chưa có';
                      return (
                        <tr key={student.id}>
                          <td>
                            <strong>{student.name}</strong>
                            <br /><small>{student.email}</small>
                          </td>
                          <td>
                            <span className={styles.progressBar}>
                              <span className={styles.progressFill} style={{ width: `${pct}%` }} />
                            </span>
                            {pct}% ({done}/{classroomMaterials.length})
                          </td>
                          <td>{hw} / {classroomAssignments.length}</td>
                          <td><strong style={{ color: '#065f46' }}>{avg}</strong></td>
                          <td style={{ textAlign: 'right' }}>
                            <button type="button" className={styles.btnSecondary}
                              onClick={() => {
                                setTrackingStudent(student);
                                setTrackingStudentTab('completed');
                              }}>
                              <Eye size={14} /> Xem báo cáo
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.groupGrid}>
                {aggregatedGroups.map((group, idx) => {
                  return (
                    <div key={idx} className={styles.groupCard}>
                      <div className={styles.groupCardHeader}>
                        <h4 className={styles.groupCardTitle}>{group.name}</h4>
                        <span className={styles.groupMembersCount}>
                          Sĩ số: {group.members.length} học sinh
                        </span>
                      </div>
                      
                      <div className={styles.groupMembersList}>
                        {group.members.map((student) => {
                          const done = classroomMaterials.filter((m) => m.completedByUsers?.includes(student.id)).length;
                          const pct = classroomMaterials.length ? Math.round((done / classroomMaterials.length) * 100) : 0;
                          const hw = submissions.filter((s) => s.studentId === student.id && activeAsgIds.includes(s.assignmentId)).length;
                          const graded = submissions.filter((s) => s.studentId === student.id && s.status === 'GRADED' && s.grade != null);
                          const avg = graded.length
                            ? (graded.reduce((s, c) => s + c.grade, 0) / graded.length).toFixed(1)
                            : 'Chưa có';
                          
                          return (
                            <div key={student.id} className={styles.groupMemberRow}>
                              <div className={styles.memberInfo}>
                                <strong className={styles.memberName}>{student.name}</strong>
                                <span className={styles.memberEmail}>{student.email}</span>
                              </div>
                              <div className={styles.memberStats}>
                                <div className={styles.memberStatPill} title="Học liệu đã xem">
                                  <span>TL: </span><strong>{pct}%</strong>
                                </div>
                                <div className={styles.memberStatPill} title="Bài tập đã nộp">
                                  <span>BT: </span><strong>{hw}/{classroomAssignments.length}</strong>
                                </div>
                                <div className={styles.memberStatPill} title="Điểm trung bình">
                                  <span>TB: </span><strong style={{ color: avg !== 'Chưa có' ? '#047857' : '#64748b' }}>{avg}</strong>
                                </div>
                                <button type="button" className={styles.groupMemberActionBtn}
                                  onClick={() => {
                                    setTrackingStudent(student);
                                    setTrackingStudentTab('completed');
                                  }}
                                  title="Xem báo cáo chi tiết"
                                >
                                  <Eye size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeSubTab === 'feedback' && (
          <div className={styles.grid2}>
            {/* ── Left: feedback list ── */}
            <div>
              <h3 className={styles.panelTitle} style={{ marginBottom: 12 }}>
                <MessageSquare size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Danh sách phản hồi ({feedbacks.length})
              </h3>
              {feedbacks.length === 0 && (
                <div className={styles.emptyBox}>Chưa có phản hồi nào từ học sinh.</div>
              )}
              {feedbacks.map((fb) => {
                const isResponded = fb.status === 'RESPONDED';
                const isActive = selectedFeedbackId === fb.id;
                return (
                  <button
                    key={fb.id}
                    type="button"
                    className={`${styles.feedbackListItem} ${isActive ? styles.feedbackListItemActive : ''}`}
                    onClick={() => setSelectedFeedbackId(fb.id)}
                  >
                    <p className={styles.feedbackListTitle}>{fb.title}</p>
                    <p className={styles.feedbackListSender}>
                      &#128100; {fb.senderName || fb.senderId}
                    </p>
                    <div className={styles.feedbackListFooter}>
                      <span className={isResponded ? styles.statusBadgeEmerald : styles.statusBadgeOrange}>
                        {isResponded ? '✓ Đã trả lời' : '⏳ Chờ trả lời'}
                      </span>
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>🕐 {fb.createdAt}</span>
                      {fb.respondedAt && (
                        <span style={{ fontSize: 10, color: '#6ee7b7' }}>✉ Đã trả lời: {fb.respondedAt}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Right: feedback detail + reply ── */}
            <div className={styles.formBox}>
              {(() => {
                const fb = feedbacks.find((f) => f.id === selectedFeedbackId);
                if (!fb) return <div className={styles.emptyBox}>&#128072; Chọn một phản hồi bên trái để xem chi tiết và trả lời.</div>;

                const isResponded = fb.status === 'RESPONDED';
                return (
                  <>
                    <div className={styles.feedbackDetailCard}>
                      <h4>{fb.title}</h4>

                      {/* Meta info */}
                      <div className={styles.feedbackMeta}>
                        <span className={isResponded ? styles.statusBadgeEmerald : styles.statusBadgeOrange}>
                          {isResponded ? '✓ Đã trả lời' : '⏳ Chờ trả lời'}
                        </span>
                        <span className={styles.feedbackMetaItem}>
                          &#128100; <strong>{fb.senderName || fb.senderId}</strong>
                        </span>
                        <span className={styles.feedbackMetaItem}>
                          🕐 Gửi lúc: {fb.createdAt}
                        </span>
                        {fb.respondedAt && (
                          <span className={styles.feedbackMetaItem} style={{ color: '#059669' }}>
                            ✅ Đã trả lời: {fb.respondedAt}
                          </span>
                        )}
                      </div>

                      {/* Message */}
                      <p className={styles.feedbackMessage}>{fb.message}</p>

                      {/* Previous response */}
                      {fb.response && (
                        <div className={styles.feedbackResponseBox}>
                          <strong>Câu trả lời của bạn</strong>
                          <p>{fb.response}</p>
                          {fb.respondedAt && (
                            <div className={styles.feedbackResponseMeta}>Đã gửi lúc: {fb.respondedAt}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reply form */}
                    <form onSubmit={handleSendFeedbackResponse} className={styles.feedbackReplyForm}>
                      <label>{fb.response ? '✏️ Cập nhật câu trả lời' : '💬 Gửi câu trả lời'}</label>
                      <textarea
                        className={styles.textarea}
                        rows={4}
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Nhập câu trả lời chi tiết cho học sinh..."
                        required
                      />
                      <button type="submit" className={styles.btnEmerald} style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                        <Send size={14} /> {fb.response ? 'Cập nhật trả lời' : 'Gửi trả lời'}
                      </button>
                    </form>
                  </>
                );
              })()}
            </div>
          </div>
        )}


        {activeSubTab === 'promotion' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h3 className={styles.panelTitle}>Thăng cấp Trợ giảng cục bộ</h3>
              <p className={styles.panelDesc} style={{ margin: '4px 0 0' }}>
                Thăng chức trợ giảng học tập cục bộ cho học sinh có kết quả xuất sắc để hỗ trợ bạn điều hành và giải đáp thắc mắc của các học viên khác trong lớp này.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {classStudents.map((student) => {
                const done = classroomMaterials.filter((m) => m.completedByUsers?.includes(student.id)).length;
                const isAssistant = student.role === 'assistant';
                return (
                  <div key={student.id} className={styles.materialItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: isAssistant ? '1px solid #10b981' : '1px solid #e2e8f0', boxShadow: isAssistant ? '0 4px 12px rgba(16, 185, 129, 0.08)' : 'none' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 13, color: '#0f172a' }}>{student.name}</strong>
                        {isAssistant && (
                          <span style={{ fontSize: 9, fontWeight: 800, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                            Trợ giảng
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
                        Email: {student.email} · Đã hoàn thành <strong>{done}/{classroomMaterials.length}</strong> học liệu
                      </p>
                    </div>
                    <button
                      type="button"
                      className={isAssistant ? styles.btnSecondary : styles.btnEmerald}
                      onClick={() => handlePromoteStudent(student.id, student.role)}
                      style={{ padding: '6px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: isAssistant ? '#b91c1c' : '#fff', borderColor: isAssistant ? '#fca5a5' : 'transparent', background: isAssistant ? '#fef2f2' : '#065f46' }}
                    >
                      {isAssistant ? (
                        <>
                          <Trash2 size={13} /> Hạ chức vụ
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} /> Thăng cấp trợ giảng
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
              {classStudents.length === 0 && (
                <div className={styles.emptyBox}>Lớp học hiện tại chưa có học sinh nào tham gia.</div>
              )}
            </div>
          </>
        )}

        {activeSubTab === 'forum' && <SharedBlogForum />}
      </div>

      {isAssignmentModalOpen && (
        <div className={styles.modalOverlay} onClick={() => {
          setIsAssignmentModalOpen(false);
          setEditingAssignmentId(null);
        }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingAssignmentId ? 'Cập nhật bài tập' : 'Soạn bài tập mới'}
              </h3>
              <button type="button" className={styles.iconBtn} onClick={() => {
                setIsAssignmentModalOpen(false);
                setEditingAssignmentId(null);
              }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveAssignment}>
              <div className={styles.field}>
                <label>Tiêu đề bài tập</label>
                <input
                  className={styles.input}
                  required
                  placeholder="Ví dụ: Thực hành C# OOP - Phần 1"
                  value={newAsgForm.title}
                  onChange={(e) => setNewAsgForm({ ...newAsgForm, title: e.target.value })}
                />
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Liên kết học phần / Buổi học</label>
                  <select
                    className={styles.select}
                    value={newAsgForm.sessionId}
                    onChange={(e) => setNewAsgForm({ ...newAsgForm, sessionId: e.target.value })}
                  >
                    <option value="">-- Không liên kết --</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.sessionDate})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Hình thức nộp bài</label>
                  <select
                    className={styles.select}
                    value={newAsgForm.type}
                    onChange={(e) => setNewAsgForm({ ...newAsgForm, type: e.target.value })}
                  >
                    <option value="individual">Cá nhân (Individual)</option>
                    <option value="group">Nhóm (Group)</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label>Mô tả bài tập</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Mô tả nội dung bài tập, yêu cầu đề bài..."
                  value={newAsgForm.description}
                  onChange={(e) => setNewAsgForm({ ...newAsgForm, description: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label>Hướng dẫn nộp bài chi tiết</label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  placeholder="Ví dụ: Nén mã nguồn .zip và nộp tại đây, không nộp file .exe..."
                  value={newAsgForm.instructions}
                  onChange={(e) => setNewAsgForm({ ...newAsgForm, instructions: e.target.value })}
                />
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Hạn nộp</label>
                  <input
                    type="date"
                    className={styles.input}
                    required
                    value={newAsgForm.dueDate}
                    onChange={(e) => setNewAsgForm({ ...newAsgForm, dueDate: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Điểm tối đa</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className={styles.input}
                    value={newAsgForm.maxPoints}
                    onChange={(e) => setNewAsgForm({ ...newAsgForm, maxPoints: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button type="submit" className={styles.btnPrimary} style={{ flex: 1 }}>
                  {editingAssignmentId ? 'Lưu thay đổi' : 'Tạo bài tập mới'}
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ flex: 1 }}
                  onClick={() => {
                    setIsAssignmentModalOpen(false);
                    setEditingAssignmentId(null);
                  }}
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {trackingStudent && (() => {
        const student = trackingStudent;
        const studentMaterialsDone = classroomMaterials.filter((m) => m.completedByUsers?.includes(student.id));
        const studentMaterialsPending = classroomMaterials.filter((m) => !m.completedByUsers?.includes(student.id));
        
        const studentGroups = aggregatedGroups.filter(g => g.members.some(m => m.id === student.id)).map(g => g.name);
        const groupLabel = studentGroups.length > 0 ? studentGroups.join(', ') : 'Cá nhân tự do';

        const completedAssignments = [];
        const pendingAssignments = [];
        
        classroomAssignments.forEach(asg => {
          const sub = submissions.find(s => s.studentId === student.id && s.assignmentId === asg.id);
          if (sub) {
            completedAssignments.push({ asg, sub });
          } else {
            pendingAssignments.push(asg);
          }
        });

        const isMaterialAssigned = (m) => {
          const meta = parseMaterialDesc(m.description);
          if (meta.distributeMode === 'all') return true;
          return meta.groups?.some(g => g.members?.some(mem => mem.id === student.id)) || false;
        };
        const studentAssignedMaterials = classroomMaterials.filter(isMaterialAssigned);

        const studentThreads = threads.filter(t => t.authorId === student.id);
        const studentReplies = [];
        threads.forEach(t => {
          t.replies?.forEach(r => {
            if (r.authorId === student.id) {
              studentReplies.push({ threadId: t.id, threadTitle: t.title, reply: r });
            }
          });
        });

        const studentFeedbacks = feedbacks.filter(f => f.senderId === student.id);

        return (
          <div className={styles.modalOverlay} onClick={() => setTrackingStudent(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720, width: '100%' }}>
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                    alt={student.name}
                    className={styles.modalStudentAvatar}
                  />
                  <div>
                    <h3 className={styles.modalTitle} style={{ margin: 0 }}>Học bạ điện tử: {student.name}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                      {student.email} · <strong style={{ color: '#047857' }}>{groupLabel}</strong>
                    </p>
                  </div>
                </div>
                <button type="button" className={styles.iconBtn} onClick={() => setTrackingStudent(null)}>
                  <X size={16} />
                </button>
              </div>

              {/* Tabs list */}
              <div className={styles.modalTabs}>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${trackingStudentTab === 'completed' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setTrackingStudentTab('completed')}
                >
                  <Check size={13} /> Đã làm ({studentMaterialsDone.length + completedAssignments.length})
                </button>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${trackingStudentTab === 'pending' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setTrackingStudentTab('pending')}
                >
                  <Clock size={13} /> Chưa làm ({studentMaterialsPending.length + pendingAssignments.length})
                </button>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${trackingStudentTab === 'assigned' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setTrackingStudentTab('assigned')}
                >
                  <FileText size={13} /> Được giao ({studentAssignedMaterials.length + classroomAssignments.length})
                </button>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${trackingStudentTab === 'activity' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setTrackingStudentTab('activity')}
                >
                  <MessageSquare size={13} /> Hoạt động ({studentThreads.length + studentReplies.length + studentFeedbacks.length})
                </button>
              </div>

              {/* Tab Contents */}
              <div className={styles.modalTabPanel} style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: 6 }}>
                
                {/* 1. COMPLETED TAB */}
                {trackingStudentTab === 'completed' && (
                  <div>
                    <h5 className={styles.panelSectionTitle}>Học liệu đã xem / hoàn thành ({studentMaterialsDone.length})</h5>
                    {studentMaterialsDone.map(m => {
                      const meta = parseMaterialDesc(m.description);
                      return (
                        <div key={m.id} className={styles.panelListItem}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {renderFileIcon(m.type)}
                            <div>
                              <strong style={{ fontSize: 12, color: '#1e293b' }}>{m.title}</strong>
                              {meta.desc && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{meta.desc}</p>}
                            </div>
                          </div>
                          <span className={styles.statusBadgeGreen}>Đã hoàn thành</span>
                        </div>
                      );
                    })}
                    {studentMaterialsDone.length === 0 && (
                      <p className={styles.panelEmptyText}>Chưa có học liệu nào được hoàn thành.</p>
                    )}

                    <h5 className={styles.panelSectionTitle} style={{ marginTop: 18 }}>Bài tập đã nộp ({completedAssignments.length})</h5>
                    {completedAssignments.map(({ asg, sub }) => {
                      const meta = parseAssignmentDesc(asg.description);
                      const isGraded = sub.status === 'GRADED';
                      return (
                        <div key={asg.id} className={styles.panelListItem} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ fontSize: 12, color: '#1e293b' }}>{asg.title}</strong>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                                Tệp nộp: <span style={{ color: '#0284c7', textDecoration: 'underline' }}>{sub.fileName}</span>
                              </p>
                              <small style={{ color: '#94a3b8' }}>Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}</small>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className={isGraded ? styles.statusBadgeEmerald : styles.statusBadgeOrange}>
                                {isGraded ? 'Đã chấm điểm' : 'Đang chờ chấm'}
                              </span>
                              {isGraded && (
                                <div style={{ fontSize: 13, fontWeight: 900, color: '#047857', marginTop: 4 }}>
                                  {sub.grade} / {asg.maxPoints}đ
                                </div>
                              )}
                            </div>
                          </div>
                          {sub.feedback && (
                            <div className={styles.subFeedbackComment}>
                              <strong>Nhận xét của giảng viên:</strong> {sub.feedback}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {completedAssignments.length === 0 && (
                      <p className={styles.panelEmptyText}>Chưa nộp bài tập nào.</p>
                    )}
                  </div>
                )}

                {/* 2. PENDING TAB */}
                {trackingStudentTab === 'pending' && (
                  <div>
                    <h5 className={styles.panelSectionTitle}>Học liệu chưa xem ({studentMaterialsPending.length})</h5>
                    {studentMaterialsPending.map(m => {
                      const meta = parseMaterialDesc(m.description);
                      return (
                        <div key={m.id} className={styles.panelListItem}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {renderFileIcon(m.type)}
                            <div>
                              <strong style={{ fontSize: 12, color: '#1e293b' }}>{m.title}</strong>
                              {meta.deadline && (
                                <p style={{ margin: '2px 0 0', fontSize: 10, color: '#e11d48' }}>
                                  Hạn: {new Date(meta.deadline).toLocaleDateString('vi-VN')}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className={styles.statusBadgeRed}>Chưa xem</span>
                        </div>
                      );
                    })}
                    {studentMaterialsPending.length === 0 && (
                      <p className={styles.panelEmptyText}>Tất cả học liệu đã được xem!</p>
                    )}

                    <h5 className={styles.panelSectionTitle} style={{ marginTop: 18 }}>Bài tập chưa nộp ({pendingAssignments.length})</h5>
                    {pendingAssignments.map(asg => {
                      const timeInfo = calculateTimeRemaining(asg.dueDate);
                      return (
                        <div key={asg.id} className={styles.panelListItem}>
                          <div>
                            <strong style={{ fontSize: 12, color: '#1e293b' }}>{asg.title}</strong>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>Thang điểm tối đa: {asg.maxPoints}đ</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <span className={styles.statusBadgeRed}>Chưa nộp</span>
                            <span className={styles.countdownPill} style={{ color: timeInfo.color, background: timeInfo.bg, fontSize: 9 }}>
                              {timeInfo.text}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {pendingAssignments.length === 0 && (
                      <p className={styles.panelEmptyText}>Tất cả bài tập đã được nộp!</p>
                    )}
                  </div>
                )}

                {/* 3. ASSIGNED CONTENT TAB */}
                {trackingStudentTab === 'assigned' && (
                  <div>
                    <h5 className={styles.panelSectionTitle}>Học liệu được giao cho học viên ({studentAssignedMaterials.length})</h5>
                    {studentAssignedMaterials.map(m => {
                      const meta = parseMaterialDesc(m.description);
                      const done = m.completedByUsers?.includes(student.id);
                      return (
                        <div key={m.id} className={styles.panelListItem}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {renderFileIcon(m.type)}
                            <div>
                              <strong style={{ fontSize: 12, color: '#1e293b' }}>{m.title}</strong>
                              <span style={{ fontSize: 9, marginLeft: 6 }} className={`${styles.typeTag} ${typeClass(m.type)}`}>
                                {m.type}
                              </span>
                            </div>
                          </div>
                          <span className={done ? styles.statusBadgeGreen : styles.statusBadgeRed}>
                            {done ? 'Đã xem' : 'Chưa xem'}
                          </span>
                        </div>
                      );
                    })}

                    <h5 className={styles.panelSectionTitle} style={{ marginTop: 18 }}>Bài tập được giao ({classroomAssignments.length})</h5>
                    {classroomAssignments.map(asg => {
                      const meta = parseAssignmentDesc(asg.description);
                      const sub = submissions.find(s => s.studentId === student.id && s.assignmentId === asg.id);
                      return (
                        <div key={asg.id} className={styles.panelListItem}>
                          <div>
                            <strong style={{ fontSize: 12, color: '#1e293b' }}>{asg.title}</strong>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                              Hình thức: {meta.type === 'group' ? 'Làm nhóm' : 'Cá nhân'}
                            </p>
                          </div>
                          <span className={sub ? styles.statusBadgeGreen : styles.statusBadgeRed}>
                            {sub ? 'Đã nộp' : 'Chưa nộp'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. ACTIVITY LOG TAB */}
                {trackingStudentTab === 'activity' && (
                  <div>
                    <h5 className={styles.panelSectionTitle}>Diễn đàn thảo luận ({studentThreads.length + studentReplies.length})</h5>
                    {studentThreads.map(t => (
                      <div key={t.id} className={styles.panelListItem} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: '#0369a1', fontWeight: 700 }}>Đã mở chủ đề thảo luận</span>
                          <span style={{ color: '#94a3b8' }}>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <strong style={{ fontSize: 12, color: '#0f172a' }}>{t.title}</strong>
                        <p style={{ margin: 0, fontSize: 11, color: '#475569', fontStyle: 'italic' }}>"{t.content}"</p>
                      </div>
                    ))}
                    {studentReplies.map((rInfo, idx) => (
                      <div key={idx} className={styles.panelListItem} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: '#047857', fontWeight: 700 }}>Đã trả lời chủ đề: "{rInfo.threadTitle}"</span>
                          <span style={{ color: '#94a3b8' }}>{new Date(rInfo.reply.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: '#475569', fontStyle: 'italic' }}>"{rInfo.reply.content}"</p>
                      </div>
                    ))}
                    {studentThreads.length === 0 && studentReplies.length === 0 && (
                      <p className={styles.panelEmptyText}>Chưa có đóng góp nào trên diễn đàn lớp học.</p>
                    )}

                    <h5 className={styles.panelSectionTitle} style={{ marginTop: 18 }}>Phản hồi giải đáp thắc mắc ({studentFeedbacks.length})</h5>
                    {studentFeedbacks.map(f => (
                      <div key={f.id} className={styles.panelListItem} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: 12, color: '#0f172a' }}>{f.title}</strong>
                          <span className={f.status === 'RESOLVED' ? styles.statusBadgeEmerald : styles.statusBadgeOrange}>
                            {f.status === 'RESOLVED' ? 'Đã giải đáp' : 'Đang xử lý'}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: '#475569' }}>Yêu cầu: "{f.message}"</p>
                        {f.response && (
                          <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 8, padding: 8, fontSize: 11, color: '#166534', marginTop: 4 }}>
                            <strong>Phản hồi của bạn:</strong> "{f.response}"
                          </div>
                        )}
                      </div>
                    ))}
                    {studentFeedbacks.length === 0 && (
                      <p className={styles.panelEmptyText}>Chưa gửi phản hồi thắc mắc nào.</p>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className={styles.btnSecondary} onClick={() => setTrackingStudent(null)} style={{ padding: '8px 20px' }}>
                  Đóng học bạ
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {editingMaterialId && (() => {
        const m = materials.find((item) => item.id === editingMaterialId);
        const isCompletedByAll = m && classStudents.length > 0 && m.completedByUsers?.length >= classStudents.length;
        const completionsCount = m?.completedByUsers?.length || 0;
        return (
          <div className={styles.modalOverlay} onClick={handleCancelEdit}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Pencil size={18} color="#059669" /> Chi tiết & Chỉnh sửa Học liệu
                </h3>
                <button type="button" className={styles.iconBtn} onClick={handleCancelEdit}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUpdateMaterial}>
                {/* Display Meta details */}
                <div style={{ display: 'flex', gap: 12, background: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', flexShrink: 0 }}>
                    {renderFileIcon(editMaterialForm.type)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Thông tin học liệu hiện tại</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      Tệp: {editMaterialForm.fileName || 'Không có tệp'}
                    </p>
                    <small style={{ color: '#94a3b8' }}>Dung lượng: {editMaterialForm.fileSize || 'N/A'}</small>
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Tiêu đề học liệu</label>
                  <input
                    className={styles.input}
                    required
                    value={editMaterialForm.title}
                    onChange={(e) => setEditMaterialForm({ ...editMaterialForm, title: e.target.value })}
                    placeholder="Tiêu đề học liệu..."
                  />
                </div>

                <div className={styles.field}>
                  <label>Yêu cầu / Mô tả</label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    value={editMaterialForm.description}
                    onChange={(e) => setEditMaterialForm({ ...editMaterialForm, description: e.target.value })}
                    placeholder="Mô tả hoặc yêu cầu của buổi học này..."
                  />
                </div>

                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Loại tệp</label>
                    <select
                      className={styles.select}
                      value={editMaterialForm.type}
                      onChange={(e) => setEditMaterialForm({ ...editMaterialForm, type: e.target.value })}
                    >
                      <option value="video">Video bài giảng (quay trước)</option>
                      <option value="pdf">Tài liệu PDF</option>
                      <option value="document">Giáo trình doc</option>
                      <option value="quiz">Trắc nghiệm</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Ngày phát hành</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={editMaterialForm.publishDate}
                      onChange={(e) => setEditMaterialForm({ ...editMaterialForm, publishDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Hạn hoàn thành</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={editMaterialForm.deadline}
                      onChange={(e) => setEditMaterialForm({ ...editMaterialForm, deadline: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Đối tượng / Nhóm học</label>
                    <select
                      className={styles.select}
                      value={editMaterialForm.distributeMode}
                      onChange={(e) => {
                        const mode = e.target.value;
                        let initialGroups = [];
                        if (mode !== 'all') {
                          initialGroups = generateRandomGroups(editMaterialForm.numGroups, classStudents);
                        }
                        setEditMaterialForm({ ...editMaterialForm, distributeMode: mode, groups: initialGroups });
                      }}
                    >
                      <option value="all">Toàn bộ lớp học</option>
                      <option value="group_random">Chia nhóm ngẫu nhiên</option>
                      <option value="group_assigned">Chia nhóm chỉ định</option>
                    </select>
                  </div>
                </div>

                {editMaterialForm.distributeMode !== 'all' && (
                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 2 }}>Số nhóm</label>
                        <input
                          type="number"
                          className={styles.input}
                          style={{ padding: '4px 8px' }}
                          min={2}
                          max={10}
                          value={editMaterialForm.numGroups}
                          onChange={(e) => {
                            const num = parseInt(e.target.value) || 2;
                            const newGroups = generateRandomGroups(num, classStudents);
                            setEditMaterialForm({ ...editMaterialForm, numGroups: num, groups: newGroups });
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        style={{ alignSelf: 'flex-end', fontSize: 10, padding: '6px 10px' }}
                        onClick={() => {
                          const newGroups = generateRandomGroups(editMaterialForm.numGroups, classStudents);
                          setEditMaterialForm({ ...editMaterialForm, groups: newGroups });
                          showToast('Đã phân chia lại nhóm ngẫu nhiên', 'info');
                        }}
                      >
                        Xáo trộn nhóm
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {editMaterialForm.groups.map((group, idx) => (
                        <div key={idx} style={{ background: '#fff', padding: 6, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                          <strong style={{ fontSize: 11, color: '#0f172a' }}>{group.name}</strong>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, maxHeight: 40, overflowY: 'auto' }}>
                            {group.members.length === 0 ? <em>Chưa có học viên</em> : group.members.map((m) => m.name).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.field}>
                  <label>Thay đổi tệp đính kèm</label>
                  {/* Hidden edit file input */}
                  <input
                    ref={editFileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.webm,.jpg,.png,.zip,.json"
                    onChange={handleEditFileInputChange}
                  />
                  
                  <div
                    className={`${styles.dropZone} ${isEditDragging ? styles.dropZoneActive : ''}`}
                    onDragOver={handleEditDragOver}
                    onDragLeave={handleEditDragLeave}
                    onDrop={handleEditDrop}
                    onClick={handleEditDropZoneClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditDropZoneClick()}
                    style={{ padding: '16px 8px', background: '#fafafa' }}
                  >
                    <Upload size={18} color="#94a3b8" style={{ marginBottom: 4 }} />
                    <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
                      Kéo thả tệp hoặc <strong style={{ color: '#059669' }}>nhấp để chọn tệp mới</strong>
                    </p>
                    <small style={{ fontSize: 10, color: '#94a3b8' }}>PDF, Word, Excel, Video, JSON...</small>
                  </div>
                </div>

                {/* Discussion / Comments Section */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '2px dashed #cbd5e1' }}>
                  <h4 style={{ fontSize: 13, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0f172a' }}>
                    <MessageSquare size={14} color="#059669" /> Thảo luận & Ghi chú ({editMaterialForm.comments?.length || 0})
                  </h4>
                  
                  <div style={{ maxHeight: 120, overflowY: 'auto', background: '#f8fafc', padding: 8, borderRadius: 10, marginBottom: 8, border: '1px solid #cbd5e1' }}>
                    {(!editMaterialForm.comments || editMaterialForm.comments.length === 0) ? (
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                        Chưa có thảo luận nào. Hãy gửi bình luận đầu tiên!
                      </p>
                    ) : (
                      editMaterialForm.comments.map((c, idx) => (
                        <div key={idx} style={{ marginBottom: 6, borderBottom: idx < editMaterialForm.comments.length - 1 ? '1px solid #e2e8f0' : 'none', paddingBottom: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#0f172a' }}>
                            <span>{c.author}</span>
                            <span style={{ fontWeight: 400, color: '#94a3b8' }}>{c.time || 'Vừa xong'}</span>
                          </div>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569' }}>{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      ref={commentInputRef}
                      className={styles.input}
                      placeholder="Viết ghi chú / bình luận..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComment(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      style={{ padding: '4px 8px', fontSize: 11 }}
                    />
                    <button
                      type="button"
                      className={styles.btnEmerald}
                      onClick={() => {
                        const input = commentInputRef.current;
                        if (input && input.value.trim()) {
                          handleAddComment(input.value);
                          input.value = '';
                        }
                      }}
                      style={{ padding: '4px 10px', fontSize: 11, height: 'auto' }}
                    >
                      Gửi
                    </button>
                  </div>
                </div>

                {/* CRUD Actions Panel */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <button type="submit" className={styles.btnPrimary} disabled={isUploading} style={{ flex: '1 1 auto', minWidth: 140 }}>
                    {isUploading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </button>

                  <button
                    type="button"
                    className={styles.btnSecondary}
                    disabled={isCompletedByAll}
                    onClick={async () => {
                      if (window.confirm('Đánh dấu hoàn thành toàn bộ học liệu này cho tất cả học sinh trong lớp?')) {
                        try {
                          await api.completeMaterialAll(editingMaterialId);
                          showToast('Đã đánh dấu hoàn thành cho cả lớp!');
                        } catch (err) {
                          showToast(err.message || 'Thao tác thất bại.', 'info');
                        }
                      }
                    }}
                    style={isCompletedByAll ? { background: '#ecfdf5', color: '#047857', borderColor: '#34d399', cursor: 'default' } : { background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                  >
                    {isCompletedByAll ? '✓ Đã Hoàn Thành Cả Lớp' : completionsCount > 0 ? `Tiến độ: ${completionsCount}/${classStudents.length} (Đạt)` : 'Hoàn Thành Cả Lớp'}
                  </button>

                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={async () => {
                      if (window.confirm('Bạn có chắc chắn muốn xóa học liệu này? Thao tác này không thể hoàn tác.')) {
                        await handleDeleteMaterial(editingMaterialId);
                        setEditingMaterialId(null);
                      }
                    }}
                    style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' }}
                  >
                    Xóa Học Liệu
                  </button>

                  <button type="button" className={styles.btnSecondary} onClick={handleCancelEdit} style={{ flexGrow: 1 }}>
                    Đóng
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default LecturerDashboard;
