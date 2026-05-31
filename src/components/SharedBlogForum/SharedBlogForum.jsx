import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Search, Filter, Loader2, 
  AlertCircle, MessageSquare, BookOpen 
} from 'lucide-react';
import { 
  fetchPublicBlogs, fetchClassBlogs, fetchPendingBlogs, fetchAllBlogs, fetchPrivateBlogs,
  createBlog, updateBlog, deleteBlog, approveBlog 
} from '../../services/blogService';
import { fetchCourses } from '../../services/courseService';
import { getRole, getUser } from '../../services/authService';
import BlogCard from './BlogCard';
import BlogForm from './BlogForm';
import BlogDetails from './BlogDetails';

/**
 * SharedBlogForum — The main blog & discussion component
 */
function SharedBlogForum({ defaultTab = 'PUBLIC' }) {
  const [blogs, setBlogs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState(defaultTab); // 'PUBLIC', 'CLASS', 'PENDING', 'MANAGEMENT'

  const currentUser = getUser();
  const userRole = getRole();
  const isAdmin = userRole && String(userRole).toLowerCase() === 'admin';
  const isLecturer = userRole && String(userRole).toLowerCase() === 'lecturer';
  
  console.log('--- BlogForum Debug ---', { 
    userRole, 
    isAdmin, 
    isLecturer,
    currentTab,
    defaultTab 
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch blogs based on current tab
      let blogsRes = { success: false, data: [] };
      let coursesRes = { success: false, data: [] };

      try {
        if (currentTab === 'PENDING') {
          blogsRes = await fetchPendingBlogs();
        } else if (currentTab === 'MANAGEMENT' && isAdmin) {
          blogsRes = await fetchAllBlogs();
        } else if (currentTab === 'PRIVATE' && isAdmin) {
          blogsRes = await fetchPrivateBlogs(selectedCourse === 'ALL' ? null : selectedCourse);
        } else {
          blogsRes = await fetchPublicBlogs(selectedCourse === 'ALL' ? null : selectedCourse);
        }
      } catch (err) {
        console.error('Failed to fetch blogs:', err);
      }

      try {
        if (isAdmin) {
          coursesRes = await fetchCourses();
        }
      } catch (err) {
        console.warn('Failed to fetch courses (likely unauthorized):', err);
      }

      // Normalize blogs - Handle { success: true, data: [...] } structure
      let blogList = [];
      const blogsData = blogsRes.success ? blogsRes.data : blogsRes;
      if (Array.isArray(blogsData)) blogList = blogsData;
      else if (blogsData?.$values) blogList = blogsData.$values;

      // Normalize courses
      let courseList = [];
      const coursesData = coursesRes.success ? coursesRes.data : coursesRes;
      if (Array.isArray(coursesData)) courseList = coursesData;
      else if (coursesData?.$values) courseList = coursesData.$values;

      setBlogs(blogList);
      setCourses(courseList);
      setError(null);
    } catch (err) {
      console.error('Failed to load blog data:', err);
      setError('Không thể tải dữ liệu bài viết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, currentTab, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter blogs (Client-side search)
  const filteredBlogs = useMemo(() => {
    return blogs.filter(blog => {
      // Backend fields are PascalCase: Title, Content, AuthorFullName, etc.
      const title = blog.title ?? blog.Title ?? '';
      const content = blog.content ?? blog.Content ?? '';
      
      const matchesSearch = 
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [blogs, searchQuery]);

  // CRUD Handlers
  const handleSave = async (formData) => {
    try {
      setIsSaving(true);
      
      // Map frontend formData to backend DTO (PascalCase)
      const payload = {
        Title: formData.title,
        Content: formData.content,
        CourseId: formData.courseId,
        AuthorId: currentUser?.id || currentUser?.Id || '',
        IsPrivate: !formData.isPublic,
        isPrivate: !formData.isPublic,
        ClassId: formData.classId || null
      };

      if (editingBlog) {
        await updateBlog(editingBlog.id ?? editingBlog.Id, payload);
      } else {
        await createBlog(payload);
      }
      
      setIsModalOpen(false);
      setEditingBlog(null);
      await loadData();
    } catch (err) {
      alert('Lỗi khi lưu bài viết: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await approveBlog(id, status);
      await loadData();
    } catch (err) {
      alert('Lỗi khi duyệt bài viết: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      await deleteBlog(id);
      await loadData();
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

      {/* Header & Stats */}
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
        
        {/* User context action: Only show Create button if logged in */}
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

      {/* Tabs for Admin/Lecturer */}
      {(isAdmin || isLecturer) && (
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0'
        }}>
          {[
            { key: 'PUBLIC', label: 'Thảo luận công khai' },
            { key: 'PRIVATE', label: 'Thảo luận riêng tư', adminOnly: true },
            { key: 'MANAGEMENT', label: 'Tất cả bài viết', adminOnly: true },
            { key: 'PENDING', label: 'Chờ duyệt' },
          ]
            .filter(tab => !tab.adminOnly || isAdmin)
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
                {tab.key === 'PENDING' && currentTab !== 'PENDING' && blogs.some(b => (b.status ?? b.Status) === 0) && (
                  <span style={{ background: '#f43f5e', color: '#fff', fontSize: '0.6rem', padding: '0.1rem 0.45rem', borderRadius: '1rem', fontWeight: 700 }}>!</span>
                )}
              </button>
            ))
          }
        </div>
      )}

      {/* Filters & Search */}
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
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0',
              fontSize: '0.875rem',
              outline: 'none',
              background: '#f8fafc'
            }}
            placeholder="Tìm kiếm chủ đề, nội dung bài viết..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
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

      {/* Error State */}
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
          <button onClick={loadData} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#be123c', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Thử lại</button>
        </div>
      )}

      {/* Blog Grid */}
      {filteredBlogs.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredBlogs.map(blog => (
            <BlogCard 
              key={blog.id ?? blog.Id} 
              thread={blog}
              isAdmin={isAdmin || (blog.authorId ?? blog.AuthorId) === currentUser?.id}
              isPendingView={currentTab === 'PENDING'}
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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Chưa có bài viết nào</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Hãy là người đầu tiên chia sẻ kiến thức của bạn!</p>
        </div>
      )}

      {/* Blog Details View */}
      {selectedBlog && (
        <BlogDetails 
          blog={selectedBlog} 
          onClose={() => setSelectedBlog(null)} 
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
