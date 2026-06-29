import api from './api';
import { normalizeData } from '../utils/dataNormalization';

// ─── Blog API ── Base: /api/Blogs ───────────────────────────────────────────

export async function fetchPublicBlogs(courseId = null) {
  const params = {};
  if (courseId) params.courseId = courseId;
  const res = await api.get('/api/Blogs/public', { params });
  return normalizeData(res.data);
}

export async function fetchClassBlogs(classId, courseId = null) {
  const params = courseId ? { courseId } : {};
  const res = await api.get(`/api/Blogs/class/${classId}`, { params });
  return normalizeData(res.data);
}

export async function fetchAllBlogs() {
  const res = await api.get('/api/Blogs/all');
  return normalizeData(res.data);
}

export async function fetchPrivateBlogs(courseId = null) {
  const params = courseId ? { courseId } : {};
  const res = await api.get('/api/Blogs/private', { params });
  return normalizeData(res.data);
}

export async function fetchBlogById(id) {
  const res = await api.get(`/api/Blogs/${id}`);
  return normalizeData(res.data);
}

export async function createBlog(data) {
  const res = await api.post('/api/Blogs', data);
  return normalizeData(res.data);
}

export async function updateBlog(id, data) {
  const res = await api.put(`/api/Blogs/${id}`, data);
  return normalizeData(res.data);
}

export async function fetchPendingBlogs() {
  const res = await api.get('/api/Blogs/pending');
  return normalizeData(res.data);
}

export async function approveBlog(id, status) {
  const res = await api.put(`/api/Blogs/${id}/approve`, null, { params: { status } });
  return normalizeData(res.data);
}

export async function deleteBlog(id) {
  const res = await api.delete(`/api/Blogs/${id}`);
  return normalizeData(res.data);
}

// ─── Comments API ───────────────────────────────────────────────────────────

export async function fetchComments(blogId) {
  const res = await api.get(`/api/Blogs/${blogId}/comments`);
  return normalizeData(res.data);
}

export async function createComment(data) {
  const res = await api.post('/api/Blogs/comments', data);
  return normalizeData(res.data);
}

export async function fetchUserBlogs(userId) {
  const res = await api.get(`/api/Blogs/user/${userId}`);
  return normalizeData(res.data);
}

export async function fetchMyClassesBlogs(studentId, courseId = null) {
  const params = courseId ? { courseId } : {};
  const res = await api.get(`/api/Blogs/my-classes/${studentId}`, { params });
  return normalizeData(res.data);
}

export async function fetchLecturerClassesBlogs(lecturerId, courseId = null) {
  const params = courseId ? { courseId } : {};
  const res = await api.get(`/api/Blogs/lecturer-classes/${lecturerId}`, { params });
  return normalizeData(res.data);
}

export async function deleteComment(id) {
  const res = await api.delete(`/api/Blogs/comments/${id}`);
  return res.data;
}
