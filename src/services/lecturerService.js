import api from './api';
import { uploadFileToCloudinary } from './cloudinaryService';

const unwrap = (response) => response.data?.data ?? response.data;

export const getMyClasses = async () => {
  const response = await api.get('/api/Lecturer/classes');
  return unwrap(response);
};

export const getClassDetail = async (classId) => {
  const response = await api.get(`/api/Lecturer/classes/${encodeURIComponent(classId)}`);
  return unwrap(response);
};

export const getClassStudents = async (classId) => {
  const response = await api.get(`/api/Lecturer/classes/${encodeURIComponent(classId)}/students`);
  return unwrap(response);
};

// Materials
export const getMaterials = async (classId) => {
  const response = await api.get(`/api/Lecturer/classes/${encodeURIComponent(classId)}/materials`);
  return unwrap(response);
};

export const createMaterial = async (classId, body) => {
  const response = await api.post(`/api/Lecturer/classes/${encodeURIComponent(classId)}/materials`, body);
  return unwrap(response);
};

export const updateMaterial = async (classId, materialId, body) => {
  const response = await api.put(
    `/api/Lecturer/classes/${encodeURIComponent(classId)}/materials/${materialId}`,
    body
  );
  return unwrap(response);
};

export const deleteMaterial = async (classId, materialId) => {
  await api.delete(`/api/Lecturer/classes/${encodeURIComponent(classId)}/materials/${materialId}`);
};

export const markMaterialCompleteAll = async (classId, materialId) => {
  await api.post(
    `/api/Lecturer/classes/${encodeURIComponent(classId)}/materials/${materialId}/complete-all`
  );
};

// Assignments
export const getAssignments = async (classId) => {
  const response = await api.get(`/api/Lecturer/classes/${encodeURIComponent(classId)}/assignments`);
  return unwrap(response);
};

export const createAssignment = async (classId, body) => {
  const response = await api.post(`/api/Lecturer/classes/${encodeURIComponent(classId)}/assignments`, body);
  return unwrap(response);
};

export const updateAssignment = async (classId, assignmentId, body) => {
  const response = await api.put(
    `/api/Lecturer/classes/${encodeURIComponent(classId)}/assignments/${assignmentId}`,
    body
  );
  return unwrap(response);
};

export const deleteAssignment = async (classId, assignmentId) => {
  await api.delete(
    `/api/Lecturer/classes/${encodeURIComponent(classId)}/assignments/${assignmentId}`
  );
};

// Submissions
export const getSubmissions = async (classId) => {
  const response = await api.get(`/api/Lecturer/classes/${encodeURIComponent(classId)}/submissions`);
  return unwrap(response);
};

export const gradeSubmission = async (classId, submissionId, body) => {
  const response = await api.put(
    `/api/Lecturer/classes/${encodeURIComponent(classId)}/submissions/${submissionId}/grade`,
    body
  );
  return unwrap(response);
};

// Feedbacks
export const getFeedbacks = async (classId) => {
  const response = await api.get(`/api/Lecturer/classes/${encodeURIComponent(classId)}/feedbacks`);
  return unwrap(response);
};

export const respondFeedback = async (classId, feedbackId, body) => {
  const response = await api.put(
    `/api/Lecturer/classes/${encodeURIComponent(classId)}/feedbacks/${feedbackId}/respond`,
    body
  );
  return unwrap(response);
};

// Threads
export const getThreads = async (classId) => {
  const response = await api.get(`/api/Lecturer/classes/${encodeURIComponent(classId)}/threads`);
  return unwrap(response);
};

export const createThread = async (classId, body) => {
  const response = await api.post(`/api/Lecturer/classes/${encodeURIComponent(classId)}/threads`, body);
  return unwrap(response);
};

export const createReply = async (classId, threadId, body) => {
  const response = await api.post(
    `/api/Lecturer/classes/${encodeURIComponent(classId)}/threads/${threadId}/replies`,
    body
  );
  return unwrap(response);
};

// Academic promotion
export const promoteStudentInClass = async (classId, studentId, role = 'assistant') => {
  const response = await api.put(
    `/api/Lecturer/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(studentId)}/promote?role=${encodeURIComponent(role)}`
  );
  return unwrap(response);
};

// File Upload
export const uploadFile = async (file, onProgress) => {
  return await uploadFileToCloudinary(file, onProgress);
};

// Quizzes
export const createQuiz = async (body) => {
  const response = await api.post('/api/Lecturer/quizzes', body);
  return unwrap(response);
};

export const getQuizDetails = async (quizId) => {
  const response = await api.get(`/api/Lecturer/quizzes/${encodeURIComponent(quizId)}`);
  return unwrap(response);
};

export const updateQuiz = async (quizId, body) => {
  const response = await api.put(`/api/Lecturer/quizzes/${encodeURIComponent(quizId)}`, body);
  return unwrap(response);
};

export const deleteQuiz = async (quizId) => {
  await api.delete(`/api/Lecturer/quizzes/${encodeURIComponent(quizId)}`);
};

export const getQuizAttempts = async (quizId) => {
  const response = await api.get(`/api/Lecturer/quizzes/${encodeURIComponent(quizId)}/attempts`);
  return unwrap(response);
};
