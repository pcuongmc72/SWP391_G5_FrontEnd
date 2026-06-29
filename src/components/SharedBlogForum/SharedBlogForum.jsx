import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Search, Filter, Loader2, 
  AlertCircle 
} from 'lucide-react';
import { 
  fetchPublicBlogs, fetchClassBlogs, fetchPendingBlogs, fetchAllBlogs, fetchPrivateBlogs,
  fetchUserBlogs, fetchMyClassesBlogs, fetchLecturerClassesBlogs,
  createBlog, updateBlog, deleteBlog, approveBlog 
} from '../../services/blogService';
import { fetchCourses, getUserCourses } from '../../services/courseService';
import { getRole, getUser } from '../../services/authService';
import BlogCard from './BlogCard';
import BlogForm from './BlogForm';
import BlogDetails from './BlogDetails';

function SharedBlogForum({ defaultTab = null, initialSelectedBlog = null, onClearInitialBlog = null }) {
  const [blogs, setBlogs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(initialSelectedBlog);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState(defaultTab);

  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const user = getUser();
    const role = getRole();
    if (user) setCurrentUser(user);
    if (role) setUserRole(role);
  }, []);

  useEffect(() => {
    if (initialSelectedBlog) {
      setSelectedBlog(initialSelectedBlog);
    }
  }, [initialSelectedBlog]);

  const isAdmin = useMemo(() => userRole?.toLowerCase() === 'admin', [userRole]);
  const isLecturer = useMemo(() => userRole?.toLowerCase() === 'lecturer', [userRole]);
  const isStudent = useMemo(() => userRole?.toLowerCase() === 'student', [userRole]);

  useEffect(() => {
    if (!defaultTab) {
      if (isStudent) setCurrentTab('CLASS');
      else if (isAdmin || isLecturer) setCurrentTab('PENDING');
      else setCurrentTab('PUBLIC');
    } else {
      setCurrentTab(defaultTab);
    }
  }, [isStudent, isAdmin, isLecturer, defaultTab]);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const courseFilter = selectedCourse === 'ALL' ? null : selectedCourse;
        const userId = currentUser.id;

        let blogsData = [];
        try {
          if (currentTab === 'PENDING') {
            blogsData = await fetchPendingBlogs();
          } else if (currentTab === 'MANAGEMENT' && isAdmin) {
            blogsData = await fetchAllBlogs();
          } else if (currentTab === 'PRIVATE' && isAdmin) {
            blogsData = await fetchPrivateBlogs(courseFilter);
          } else if (currentTab === 'MY_POSTS') {
            blogsData = await fetchUserBlogs(userId);
          } else if (currentTab === 'CLASS' && (isStudent || isLecturer)) {
            if (isStudent) {
              blogsData = await fetchMyClassesBlogs(userId, courseFilter);
            } else if (isLecturer) {
              blogsData = await fetchLecturerClassesBlogs(userId, courseFilter);
            }
          } else {
            blogsData = await fetchPublicBlogs(courseFilter);
          }
        } catch (err) {
          console.error('Failed to fetch blogs:', err);
        }

        let coursesData = [];
        try {
          if (isAdmin) {
            coursesData = await fetchCourses();
          } else if (userId && userRole) {
            coursesData = await getUserCourses(userId, userRole);
          }
        } catch (err) {
          console.warn('Failed to fetch courses:', err);
        }

        if (!isCancelled) {
          setBlogs(Array.isArray(blogsData) ? blogsData : []);
          setCourses(Array.isArray(coursesData) ? coursesData : []);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load blog data:', err);
          setError('Không thể tải dữ liệu bài viết. Vui lòng thử lại sau.');
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [selectedCourse, currentTab, isAdmin, isStudent, isLecturer, currentUser, userRole, refreshKey]);

  // Client-side search filter
  const filteredBlogs = useMemo(() => {
    return blogs.filter(blog => {
      const blogCourseId = blog.courseId ?? blog.CourseId;
      const matchesCourse = selectedCourse === 'ALL' || String(blogCourseId) === String(selectedCourse);
      const blogTitle = blog.title ?? blog.Title ?? '';
      const blogContent = blog.content ?? blog.Content ?? '';
      const matchesSearch = 
        blogTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blogContent.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch && matchesCourse;
    });
  }, [blogs, searchQuery, selectedCourse]);

  // CRUD Handlers
  const handleSave = async (formData) => {
    try {
      setIsSaving(true);
      const payload = {
        title: formData.title,
        content: formData.content,
        courseId: formData.courseId,
        authorId: currentUser?.id || '',
        isPrivate: !formData.isPublic,
        classId: formData.classId || null,
        keywords: formData.keywords || null
      };

      if (editingBlog) {
        await updateBlog(editingBlog.id, payload);
      } else {
        await createBlog(payload);
        if (!formData.isPublic && isStudent) {
          setCurrentTab('CLASS');
        } else {
          setCurrentTab('MY_POSTS');
        }
      }
      
      setIsModalOpen(false);
      setEditingBlog(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Save error:', err.response?.data || err.message);
      alert('Lỗi khi lưu bài viết: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await approveBlog(id, status);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert('Lỗi khi duyệt bài viết: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      await deleteBlog(id);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert('Lỗi khi xóa bài viết: ' + err.message);
    }
  };

  if (loading && blogs.length === 0) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
        <p>Đang tải bài viết...</p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1.5rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {!selectedBlog ? (
        <>
          <div style={{
            marginBottom: '2.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Thảo luận & Blog
              </h1>
              <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '1rem' }}>
                Nơi chia sẻ kiến thức và giải đáp thắc mắc về các môn học
              </p>
            </div>
            
            {currentUser && (
              <button 
                onClick={() => { setEditingBlog(null); setIsModalOpen(true); }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #0D3E26, #166534)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.875rem',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(13, 62, 38, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(13, 62, 38, 0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 62, 38, 0.2)'; }}
              >
                <Plus size={20} />
                Tạo bài viết mới
              </button>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '0.25rem',
            marginBottom: '2rem',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '0'
          }}>
            {[
              { key: 'PUBLIC', label: 'Thảo luận công khai' },
              { key: 'CLASS', label: 'Lớp học của tôi' },
              { key: 'MY_POSTS', label: 'Bài viết của tôi', authenticatedOnly: true },
              { key: 'PRIVATE', label: 'Thảo luận riêng tư', adminOnly: true },
              { key: 'MANAGEMENT', label: 'Tất cả bài viết', adminOnly: true },
              { key: 'PENDING', label: 'Chờ duyệt', roles: ['admin', 'lecturer'] },
            ]
              .filter(tab => {
                if (tab.adminOnly && !isAdmin) return false;
                if (tab.studentOnly && !isStudent) return false;
                if (tab.key === 'CLASS' && !(isStudent || isLecturer)) return false;
                if (tab.authenticatedOnly && !currentUser) return false;
                if (tab.roles && !tab.roles.includes(userRole?.toLowerCase())) return false;
                return true;
              })
              .map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setCurrentTab(tab.key)}
                  style={{
                    padding: '0.6rem 1.1rem',
                    border: 'none',
                    background: 'none',
                    color: currentTab === tab.key ? '#0D3E26' : '#64748b',
                    fontWeight: currentTab === tab.key ? 700 : 500,
                    fontSize: '0.875rem',
                    borderBottom: currentTab === tab.key ? '2.5px solid #0D3E26' : '2.5px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {tab.label}
                  {tab.key === 'PENDING' && currentTab !== 'PENDING' && blogs.some(b => b.status === 0) && (
                    <span style={{ background: '#f43f5e', color: '#fff', fontSize: '0.6rem', padding: '0.1rem 0.45rem', borderRadius: '1rem', fontWeight: 700 }}>!</span>
                  )}
                </button>
              ))
            }
          </div>

          <div style={{
            background: '#fff',
            padding: '1.25rem',
            borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  outline: 'none',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: 500
                }}
                placeholder="Tìm kiếm chủ đề, nội dung bài viết..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 700 }}>
                <Filter size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Môn học:
              </div>
              <select 
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  background: '#fff',
                  color: '#0f172a',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
              >
                <option value="ALL">Tất cả môn học</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.code}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '1.25rem',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '1rem',
              color: '#be123c',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '2rem'
            }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{error}</span>
              <button onClick={() => setRefreshKey(prev => prev + 1)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#be123c', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Thử lại</button>
            </div>
          )}

          {filteredBlogs.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredBlogs.map(blog => (
                <BlogCard 
                  key={blog.id} 
                  thread={blog}
                  isAdmin={isAdmin || isLecturer}
                  isAuthor={blog.authorId === currentUser?.id}
                  isPendingView={currentTab === 'PENDING'}
                  showStatus={currentTab === 'MY_POSTS'}
                  onClick={() => setSelectedBlog(blog)}
                  onEdit={(b) => { setEditingBlog(b); setIsModalOpen(true); }}
                  onDelete={handleDelete}
                  onApprove={handleApprove}
                />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '5rem 2rem',
              background: '#f8fafc',
              borderRadius: '2rem',
              border: '2px dashed #e2e8f0'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Chưa tìm thấy bài viết nào</h3>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                {searchQuery || selectedCourse !== 'ALL' 
                  ? 'Không có bài viết nào khớp với tìm kiếm hoặc bộ lọc của bạn. Hãy thử thay đổi bộ lọc nhé!' 
                  : currentTab === 'CLASS' 
                    ? 'Lớp học của bạn chưa có bài viết riêng tư. Hãy kiểm tra tab Thảo luận công khai hoặc là người đầu tiên chia sẻ kiến thức!'
                    : 'Hãy là người đầu tiên chia sẻ kiến thức của bạn!'}
              </p>
              {currentTab === 'CLASS' && !searchQuery && selectedCourse === 'ALL' && (
                <button 
                  onClick={() => setCurrentTab('PUBLIC')}
                  style={{ marginTop: '1.5rem', padding: '0.625rem 1.25rem', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '0.75rem', color: '#065f46', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Xem thảo luận công khai
                </button>
              )}
              {(searchQuery || selectedCourse !== 'ALL') && (
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCourse('ALL'); }}
                  style={{ marginTop: '1.5rem', padding: '0.625rem 1.25rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', color: '#0D3E26', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <BlogDetails 
          blog={selectedBlog} 
          onBack={() => {
            setSelectedBlog(null);
            if (onClearInitialBlog) onClearInitialBlog();
          }} 
          onEdit={(b) => { setEditingBlog(b); setIsModalOpen(true); }}
          onDelete={(id) => { 
            handleDelete(id); 
            setSelectedBlog(null); 
            if (onClearInitialBlog) onClearInitialBlog();
          }}
          isAdmin={isAdmin || isLecturer}
          isAuthor={selectedBlog.authorId === currentUser?.id}
        />
      )}

      {/* Blog Form Modal */}
      <BlogForm 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingBlog(null); }}
        onSave={handleSave}
        initialData={editingBlog}
        courses={courses}
        isSaving={isSaving}
      />
    </div>
  );
}

export default SharedBlogForum;
