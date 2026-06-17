export const ROLES = {
  ADMIN: 'admin',
  LECTURER: 'lecturer',
  STUDENT: 'student',
};

/** Alias thường gặp trong yêu cầu đồ án */
const LECTURER_ALIASES = ['lecturer', 'lecture', 'teacher', 'giangvien'];

export const normalizeRole = (role) => {
  const r = (role || '').toLowerCase().trim();
  if (LECTURER_ALIASES.includes(r)) return ROLES.LECTURER;
  if (r === ROLES.ADMIN) return ROLES.ADMIN;
  if (r === ROLES.STUDENT) return ROLES.STUDENT;
  return r;
};

export const getDashboardPathForRole = (role) => {
  switch (normalizeRole(role)) {
    case ROLES.LECTURER:
      return '/lecturer/dashboard';
    case ROLES.ADMIN:
      return '/dashboard/admin';
    case ROLES.STUDENT:
      return '/dashboard/student';
    default:
      return '/';
  }
};
