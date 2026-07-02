import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getMyClasses,
  getClassWorkspace,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  markMaterialCompleteAll,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  gradeSubmission,
  respondFeedback,
  createThread,
  createReply,
  promoteStudentInClass,
  uploadFile,
} from '../services/lecturerService';
import { getStoredUser, getUserDisplayName } from '../utils/authStorage';

const LecturerWorkspaceContext = createContext(null);

const mapStudent = (s) => ({
  id: s.id,
  name: s.fullName,
  email: s.email,
  role: s.classRole || 'student',
  avatarUrl: s.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`,
});

const mapMaterial = (m) => ({
  id: m.id,
  classId: m.classId,
  title: m.title,
  description: m.description,
  type: m.type,
  url: m.fileUrl,
  fileSize: m.fileSize,
  uploadedAt: m.uploadedAt,
  completedByUsers: m.completedByUsers || [],
  isDisabled: m.isDisabled ?? false,
  chapter: m.chapter,
  lesson: m.lesson,
});

const mapAssignment = (a) => ({
  id: a.id,
  classId: a.classId,
  title: a.title,
  description: a.description,
  dueDate: a.dueDate,
  maxPoints: a.maxPoints,
});

const mapSubmission = (s) => ({
  id: s.id,
  assignmentId: s.assignmentId,
  studentId: s.studentId,
  studentName: s.studentName,
  fileName: s.fileName,
  studentNotes: s.studentNotes,
  status: s.status,
  grade: s.grade,
  feedback: s.feedback,
  submittedAt: s.submittedAt,
  gradedAt: s.gradedAt,
});

const mapFeedback = (f) => ({
  id: f.id,
  classId: f.classId,
  senderId: f.senderId,
  senderName: f.senderName,
  title: f.title,
  message: f.message,
  status: f.status,
  response: f.response,
  createdAt: f.createdAt,
  respondedAt: f.respondedAt,
});

const mapThread = (t) => ({
  id: t.id,
  classId: t.classId,
  authorId: t.authorId,
  title: t.title,
  content: t.content,
  createdAt: t.createdAt,
  replies: (t.replies || []).map((r) => ({
    id: r.id,
    authorId: r.authorId,
    content: r.content,
    createdAt: r.createdAt,
  })),
});

export function LecturerWorkspaceProvider({ children }) {
  const storedUser = getStoredUser();
  const currentUser = useMemo(
    () => ({
      id: storedUser?.id || 'lecturer',
      name: getUserDisplayName(storedUser),
      email: storedUser?.email || '',
      role: 'lecturer',
      avatarUrl:
        storedUser?.avatarUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${storedUser?.id || 'lecturer'}`,
    }),
    [storedUser]
  );

  const [classrooms, setClassrooms] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState('');
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [threads, setThreads] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classDetail, setClassDetail] = useState(null);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('materials');
  const [searchQuery, setSearchQuery] = useState('');

  const loadClasses = useCallback(async () => {
    setClassesLoading(true);
    setClassesError('');
    try {
      const data = await getMyClasses();
      const mapped = (Array.isArray(data) ? data : []).map((c) => ({
        id: c.id,
        name: c.name,
        courseCode: c.courseCode,
        courseName: c.courseName,
        termName: c.termName,
        lecturerIds: [currentUser.id],
        studentIds: [],
      }));
      setClassrooms(mapped);
      if (mapped.length > 0) {
        setSelectedClassId((prev) => prev || mapped[0].id);
      }
    } catch (err) {
      const msg = err.message || '';
      // Nếu lỗi 401/403 (token hết hạn hoặc sai role) → tự động logout
      if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('forbidden') || msg.includes('đã xảy ra lỗi')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
      }
      setClassesError(err.message || 'Không tải được danh sách lớp.');
    } finally {
      setClassesLoading(false);
    }
  }, [currentUser.id]);

  const loadWorkspace = useCallback(async (classId) => {
    if (!classId) return;
    setWorkspaceLoading(true);
    try {
      const ws = await getClassWorkspace(classId);
      setClassDetail(ws.class);
      setUsers((ws.students || []).map(mapStudent));
      setMaterials((ws.materials || []).map(mapMaterial));
      setAssignments((ws.assignments || []).map(mapAssignment));
      setSubmissions((ws.submissions || []).map(mapSubmission));
      setFeedbacks((ws.feedbacks || []).map(mapFeedback));
      setThreads((ws.threads || []).map(mapThread));
      setSessions(ws.sessions || []);

      setClassrooms((prev) =>
        prev.map((c) =>
          c.id === classId
            ? { ...c, studentIds: (ws.students || []).map((s) => s.id) }
            : c
        )
      );
    } catch (err) {
      setClassesError(err.message || 'Không tải được dữ liệu lớp.');
    } finally {
      setWorkspaceLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (selectedClassId) loadWorkspace(selectedClassId);
  }, [selectedClassId, loadWorkspace]);

  const activeClass = useMemo(() => {
    const fromList = classrooms.find((c) => c.id === selectedClassId);
    if (!fromList) return null;
    return {
      ...fromList,
      termStartDate: classDetail?.termStartDate,
      termEndDate: classDetail?.termEndDate,
      courseCode: classDetail?.courseCode || fromList.courseCode,
      courseName: classDetail?.courseName || fromList.courseName,
    };
  }, [classrooms, selectedClassId, classDetail]);

  const myClassrooms = classrooms;

  const api = useMemo(
    () => ({
      uploadFile,
      reload: () => loadWorkspace(selectedClassId),
      addMaterial: async (body) => {
        await createMaterial(selectedClassId, {
          title: body.title,
          description: body.description,
          type: body.type,
          fileUrl: body.url || '#',
          fileSize: body.fileSize,
          chapter: body.chapter,
          lesson: body.lesson,
        });
        await loadWorkspace(selectedClassId);
      },
      updateMaterial: async (id, body) => {
        await updateMaterial(selectedClassId, id, {
          title: body.title,
          description: body.description,
          type: body.type,
          fileUrl: body.url || '#',
          fileSize: body.fileSize,
          chapter: body.chapter,
          lesson: body.lesson,
        });
        await loadWorkspace(selectedClassId);
      },
      removeMaterial: async (id) => {
        await deleteMaterial(selectedClassId, id);
        await loadWorkspace(selectedClassId);
      },
      completeMaterialAll: async (id) => {
        await markMaterialCompleteAll(selectedClassId, id);
        await loadWorkspace(selectedClassId);
      },
      addAssignment: async (body) => {
        await createAssignment(selectedClassId, body);
        await loadWorkspace(selectedClassId);
      },
      updateAssignment: async (id, body) => {
        await updateAssignment(selectedClassId, id, body);
        await loadWorkspace(selectedClassId);
      },
      removeAssignment: async (id) => {
        await deleteAssignment(selectedClassId, id);
        await loadWorkspace(selectedClassId);
      },
      gradeSubmission: async (id, body) => {
        await gradeSubmission(selectedClassId, id, body);
        await loadWorkspace(selectedClassId);
      },
      respondFeedback: async (id, body) => {
        await respondFeedback(selectedClassId, id, body);
        await loadWorkspace(selectedClassId);
      },
      addThread: async (body) => {
        await createThread(selectedClassId, body);
        await loadWorkspace(selectedClassId);
      },
      addReply: async (threadId, body) => {
        await createReply(selectedClassId, threadId, body);
        await loadWorkspace(selectedClassId);
      },
      promoteStudent: async (studentId, role = 'assistant') => {
        await promoteStudentInClass(selectedClassId, studentId, role);
        await loadWorkspace(selectedClassId);
      },
    }),
    [selectedClassId, loadWorkspace]
  );

  const value = {
    currentUser,
    users,
    setUsers,
    classrooms,
    myClassrooms,
    activeClass,
    classDetail,
    selectedClassId,
    setSelectedClassId,
    classesLoading,
    classesError,
    workspaceLoading,
    materials,
    setMaterials,
    assignments,
    setAssignments,
    submissions,
    setSubmissions,
    threads,
    setThreads,
    feedbacks,
    setFeedbacks,
    sessions,
    activeSubTab,
    setActiveSubTab,
    searchQuery,
    setSearchQuery,
    loadWorkspace,
    api,
  };

  return (
    <LecturerWorkspaceContext.Provider value={value}>
      {children}
    </LecturerWorkspaceContext.Provider>
  );
}

export const useLecturerWorkspace = () => {
  const ctx = useContext(LecturerWorkspaceContext);
  if (!ctx) throw new Error('useLecturerWorkspace must be used within LecturerWorkspaceProvider');
  return ctx;
};
