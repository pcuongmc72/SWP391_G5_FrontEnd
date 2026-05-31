import api from './api';

/**
 * Service for Blog API
 * Base: /api/Blogs
 */

/**
 * Fetch all public blogs
 * GET /api/Blogs/public
 */
export async function fetchPublicBlogs(courseId = null) {
  const params = courseId ? { courseId } : {};
  const res = await api.get('/api/Blogs/public', { params });
  return res.data;
}

/**
 * Fetch blogs for a specific class
 * GET /api/Blogs/class/{classId}
 */
export async function fetchClassBlogs(classId, courseId = null) {
  const params = courseId ? { courseId } : {};
  const res = await api.get(`/api/Blogs/class/${classId}`, { params });
  return res.data;
}

/**
 * Fetch all blogs (Admin)
 * Note: Backend BlogsController doesn't have a dedicated GetAll for Admin yet, 
 * but usually Admin uses the public or specific class endpoints.
 * Assuming Admin might want a specific list or we can use public for now.
 */
export async function fetchAllBlogs() {
  const res = await api.get('/api/Blogs/all');
  return res.data;
}

/**
 * Fetch private/internal blogs (Admin only)
 * GET /api/Blogs/private
 */
export async function fetchPrivateBlogs(courseId = null) {
  const params = courseId ? { courseId } : {};
  const res = await api.get('/api/Blogs/private', { params });
  return res.data;
}

/**
 * Fetch a single blog by ID
 * GET /api/Blogs/{id}
 */
export async function fetchBlogById(id) {
  const res = await api.get(`/api/Blogs/${id}`);
  return res.data;
}

/**
 * Create a new blog
 * POST /api/Blogs
 * Body: BlogRequestDto
 */
export async function createBlog(data) {
  const res = await api.post('/api/Blogs', data);
  return res.data;
}

/**
 * Update a blog
 * PUT /api/Blogs/{id}
 * Body: BlogRequestDto
 */
export async function updateBlog(id, data) {
  const res = await api.put(`/api/Blogs/${id}`, data);
  return res.data;
}

/**
 * Fetch blogs pending approval (Admin/Lecturer)
 * GET /api/Blogs/pending
 */
export async function fetchPendingBlogs() {
  const res = await api.get('/api/Blogs/pending');
  return res.data;
}

/**
 * Approve or Reject a blog
 * PUT /api/Blogs/{id}/approve?status={status}
 */
export async function approveBlog(id, status) {
  const res = await api.put(`/api/Blogs/${id}/approve`, null, {
    params: { status }
  });
  return res.data;
}

/**
 * Delete a blog
 * DELETE /api/Blogs/{id}
 */
export async function deleteBlog(id) {
  const res = await api.delete(`/api/Blogs/${id}`);
  return res.data;
}

/* ===========================
   Comments API
   =========================== */

/**
 * Fetch all comments for a blog
 * GET /api/Blogs/{blogId}/comments
 */
export async function fetchComments(blogId) {
  const res = await api.get(`/api/Blogs/${blogId}/comments`);
  return res.data;
}

/**
 * Create a new comment
 * POST /api/Blogs/comments
 * Body: CommentRequestDto
 */
export async function createComment(data) {
  const res = await api.post('/api/Blogs/comments', data);
  return res.data;
}

/**
 * Delete a comment
 * DELETE /api/Blogs/comments/{id}
 */
export async function deleteComment(id) {
  const res = await api.delete(`/api/Blogs/comments/${id}`);
  return res.data;
}
