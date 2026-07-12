import React from 'react';

/**
 * RoleBadge - A reusable component to render user role badges (Admin, Lecturer, Student)
 * Supports multiple data sources (role, authorRole, AuthorRole) and normalized comparisons.
 */
function RoleBadge({ roleData, style = {} }) {
  const r = String(
    roleData?.role || 
    roleData?.authorRole || 
    roleData?.AuthorRole || 
    (typeof roleData === 'string' ? roleData : '')
  ).toLowerCase();

  const baseStyle = {
    padding: '1px 6px',
    borderRadius: '4px',
    fontSize: '8px',
    textTransform: 'uppercase',
    fontWeight: 800,
    ...style
  };

  if (r === 'admin') {
    return (
      <span style={{ 
        ...baseStyle, 
        backgroundColor: '#fff1f2', 
        color: '#be123c', 
        border: '1px solid #ffe4e6' 
      }}>
        Admin
      </span>
    );
  }

  if (r === 'lecturer' || r === 'teacher' || r.includes('giảng viên')) {
    return (
      <span style={{ 
        ...baseStyle, 
        backgroundColor: '#f0fdf4', 
        color: '#166534', 
        border: '1px solid #dcfce7' 
      }}>
        Giảng viên
      </span>
    );
  }

  // Default to Student (Học viên)
  return (
    <span style={{ 
      ...baseStyle, 
      backgroundColor: '#f8fafc', 
      color: '#475569', 
      border: '1px solid #f1f5f9' 
    }}>
      Học viên
    </span>
  );
}

export default RoleBadge;
