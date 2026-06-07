import React, { useState, useEffect } from 'react';
import { getAcademicTerms, getStudentClasses, getClassStudents } from '../../services/studentService';
import { BookOpen, User, Calendar, Loader2, X, Users, Milestone, Award } from 'lucide-react';
import styles from './DashbroadStudent.module.css'; // Sử dụng lại CSS module của Dashboard

export default function StudentDashboard() {
    const [terms, setTerms] = useState([]);

    // Thêm các State mới phục vụ tìm kiếm & lọc
    const [years, setYears] = useState([]);                 // Danh sách các Năm học trích xuất được
    const [selectedYear, setSelectedYear] = useState('');   // Năm học đang chọn (Ví dụ: 2026)
    const [selectedSemester, setSelectedSemester] = useState(''); // Kỳ học đang chọn (Spring/Summer/Fall)
    const [searchTerm, setSearchTerm] = useState('');       // Từ khóa tìm kiếm môn học

    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

        // Các state phục vụ Modal chi tiết lớp học
    const [selectedClass, setSelectedClass] = useState(null); // Lớp đang được mở chi tiết
    const [classStudents, setClassStudents] = useState([]);   // Danh sách bạn học trong lớp đó
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentSearchTerm, setStudentSearchTerm] = useState(''); // Tìm kiếm bạn học

    // 1. Tải danh sách Học kỳ và trích xuất danh sách các Năm học
    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const response = await getAcademicTerms();
                if (response.success && response.data.length > 0) {
                    const termsData = response.data;
                    setTerms(termsData);

                    // Trích xuất danh sách Năm học không trùng lặp từ startDate
                    const uniqueYears = [
                        ...new Set(termsData.map(term => term.startDate.split('-')[0])) // Cắt lấy 4 ký tự năm
                    ].sort((a, b) => b - a);


                    setYears(uniqueYears);

                    // Xác định Năm học và Kỳ học hiện tại dựa trên ngày hôm nay
                    const today = new Date();
                    const currentTerm = termsData.find(term => {
                        const start = new Date(term.startDate);
                        const end = new Date(term.endDate);
                        return today >= start && today <= end;
                    });

                    if (currentTerm) {
                        setSelectedYear(currentTerm.startDate.split('-')[0]); // Cắt lấy năm học hiện tại
                        // Xác định kỳ học dựa trên tên hoặc mã viết tắt (SP/SU/FA)
                        const nameLower = currentTerm.name.toLowerCase();
                        const codeLower = (currentTerm.termCode || '').toLowerCase();

                        if (nameLower.includes('spring') || codeLower.includes('sp')) setSelectedSemester('Spring');
                        else if (nameLower.includes('summer') || codeLower.includes('su')) setSelectedSemester('Summer');
                        else if (nameLower.includes('fall') || codeLower.includes('fa')) setSelectedSemester('Fall');

                    } else if (uniqueYears.length > 0) {
                        // Mặc định chọn năm đầu tiên và kỳ Spring
                        setSelectedYear(uniqueYears[0].toString());
                        setSelectedSemester('Spring');
                    }
                } else {
                    setError('Không tìm thấy học kỳ nào trong hệ thống.');
                    setLoading(false);
                }
            } catch (err) {
                setError(err.message || 'Lỗi tải danh sách học kỳ.');
                setLoading(false);
            }
        };
        fetchTerms();
    }, []);

    // 2. Tự động tìm AcademicTermId tương ứng khi thay đổi selectedYear hoặc selectedSemester
    useEffect(() => {
        if (!selectedYear || !selectedSemester || terms.length === 0) return;

        // Tìm học kỳ có Năm trùng với selectedYear và khớp tên/mã học kỳ
        const matchedTerm = terms.find(term => {
            const termYear = term.startDate.split('-')[0]; // Lấy năm học an toàn
            const termNameLower = term.name.toLowerCase();
            const termCodeLower = (term.termCode || '').toLowerCase();

            // Khớp kỳ Spring nếu tên chứa "spring" hoặc mã chứa "sp"
            const isSpring = selectedSemester === 'Spring' && (termNameLower.includes('spring') || termCodeLower.includes('sp'));
            // Khớp kỳ Summer nếu tên chứa "summer" hoặc mã chứa "su"
            const isSummer = selectedSemester === 'Summer' && (termNameLower.includes('summer') || termCodeLower.includes('su'));
            // Khớp kỳ Fall nếu tên chứa "fall" hoặc mã chứa "fa"
            const isFall = selectedSemester === 'Fall' && (termNameLower.includes('fall') || termCodeLower.includes('fa'));

            return termYear === selectedYear && (isSpring || isSummer || isFall);
        });


        const fetchClasses = async () => {
            setLoading(true);
            setError('');
            try {
                if (matchedTerm) {
                    const response = await getStudentClasses(matchedTerm.id);
                    if (response.success) {
                        setClasses(response.data);
                    }
                } else {
                    // Nếu không có học kỳ nào khớp (ví dụ: Không có kỳ Fall trong năm 2024)
                    setClasses([]);
                }
            } catch (err) {
                setError(err.message || 'Lỗi tải danh sách lớp học.');
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, [selectedYear, selectedSemester, terms]);

        // Xử lý khi nhấn "Vào lớp" hoặc click Card lớp học
    const handleOpenClassDetail = async (cls) => {
        setSelectedClass(cls);
        setLoadingStudents(true);
        setStudentSearchTerm('');
        try {
            const response = await getClassStudents(cls.id);
            if (response.success) {
                setClassStudents(response.data);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách sinh viên cùng lớp:', err);
        } finally {
            setLoadingStudents(false);
        }
    };

    // 3. Logic tìm kiếm môn học (Lọc trực tiếp từ danh sách lớp đã tải về)
    const filteredClasses = classes.filter(cls => {
        const nameMatch = cls.courseName.toLowerCase().includes(searchTerm.toLowerCase());
        const codeMatch = cls.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
        const classIdMatch = cls.id.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || codeMatch || classIdMatch;

    }
);
// Hàm sinh lộ trình học tập chuẩn dựa vào mã môn học (Copy từ ClassesDashboard.jsx của Admin)
const generateRoadmap = (courseCode, courseName) => {
    const code = String(courseCode || '').toUpperCase();
    const name = String(courseName || '');
    const isCSharp = code.includes('PRN') || code.includes('CS') || name.toLowerCase().includes('c#') || name.toLowerCase().includes('lập trình');
    const isSWP = code.includes('SWP') || code.includes('PROJ') || name.toLowerCase().includes('dự án') || name.toLowerCase().includes('đồ án');

    if (isCSharp) {
        return [
            { week: 'Tuần 1', title: 'Cài đặt môi trường & Cú pháp cơ bản .NET C#', status: 'COMPLETED', lessons: ['Khởi tạo dự án Console App trong Visual Studio', 'Biến, toán tử và các kiểu dữ liệu cơ bản', 'Cấu trúc điều kiện rẽ nhánh và vòng lặp'] },
            { week: 'Tuần 2', title: 'Lập trình Hướng đối tượng (OOP) nâng cao', status: 'COMPLETED', lessons: ['Tính kế thừa, đóng gói, đa hình', 'Tính trừu tượng (Abstract class & Interface)'] },
            { week: 'Tuần 3', title: 'Làm việc với Collections, LINQ & Generics', status: 'ACTIVE', lessons: ['Generic class & Generic method', 'Truy vấn dữ liệu nâng cao với LINQ'] },
            { week: 'Tuần 4', title: 'Tương tác Database với Entity Framework Core', status: 'UPCOMING', lessons: ['Cài đặt EF Core Packages & DbContext', 'Thao tác CRUD với Database thực tế'] },
            { week: 'Tuần 5', title: 'Xây dựng RESTful API với ASP.NET Core Web API', status: 'UPCOMING', lessons: ['Kiến trúc Controllers & API Routing', 'Dependency Injection trong ASP.NET Core'] }
        ];
    }

    if (isSWP) {
        return [
            { week: 'Tuần 1', title: 'Thành lập nhóm & Định hình Ý tưởng Dự án', status: 'COMPLETED', lessons: ['Phân chia vai trò thành viên (WBS)', 'Lập tiến độ tổng quan (Gantt Chart)'] },
            { week: 'Tuần 2', title: 'Phân tích Yêu cầu & Thiết kế Hệ thống', status: 'COMPLETED', lessons: ['Phân tích yêu cầu chức năng', 'Thiết kế Mockup UI/UX ban đầu bằng Figma'] },
            { week: 'Tuần 3', title: 'Thiết kế Cấu trúc CSDL (ERD) & Khung dự án', status: 'ACTIVE', lessons: ['Vẽ sơ đồ ERD tối ưu hóa quan hệ', 'Cấu trúc Skeleton dự án FrontEnd và BackEnd'] },
            { week: 'Tuần 4', title: 'Sprint 1: Xây dựng các tính năng Core & Auth', status: 'UPCOMING', lessons: ['Code giao diện Đăng nhập, Đăng ký', 'Xây dựng API đăng nhập & lưu trữ Token'] },
            { week: 'Tuần 5', title: 'Sprint 2: Tính năng nghiệp vụ chính & Quản trị', status: 'UPCOMING', lessons: ['Phát triển giao diện Dashboard Admin', 'Code các luồng giao dịch nghiệp vụ cốt lõi'] }
        ];
    }

    return [
        { week: 'Chặng 1', title: 'Làm quen & Khái niệm nền tảng cốt lõi', status: 'COMPLETED', lessons: ['Giới thiệu đề cương học phần', 'Các công cụ làm việc cơ bản'] },
        { week: 'Chặng 2', title: 'Nghiên cứu chuyên sâu lý thuyết chuyên ngành', status: 'ACTIVE', lessons: ['Các mô hình kiến trúc cốt lõi', 'Slide chuyên đề 2'] },
        { week: 'Chặng 3', title: 'Thực hành ứng dụng & Giải quyết case-study', status: 'UPCOMING', lessons: ['Giải quyết bài toán thực tế (Case study)', 'Thực hành viết báo cáo phân tích'] }
    ];
};



    return (
        <>
        <div style={{ padding: '4px' }}>
            {/* Thanh giao diện Tìm kiếm & Bộ lọc */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '28px',
                flexWrap: 'wrap',
                gap: '16px',
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
                {/* 1. Ô tìm kiếm môn học */}
                <div style={{ flex: '1 1 300px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Tìm kiếm môn học
                    </label>
                    <input
                        type="text"
                        placeholder="Nhập tên môn học, mã môn học hoặc mã lớp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.875rem',
                            outline: 'none',
                            color: '#334155',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0D3E26'}
                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                </div>

                {/* 2. Bộ lọc Năm học & Kỳ học */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Thẻ chọn năm học */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Năm học
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#fff',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#334155',
                                outline: 'none',
                                cursor: 'pointer',
                                minWidth: '120px'
                            }}
                        >
                            {years.map(year => (
                                <option key={year} value={year}>
                                    Năm học {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Thẻ chọn kỳ học */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Kỳ học
                        </label>
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#fff',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#334155',
                                outline: 'none',
                                cursor: 'pointer',
                                minWidth: '120px'
                            }}
                        >
                            <option value="Spring">Kỳ Spring</option>
                            <option value="Summer">Kỳ Summer</option>
                            <option value="Fall">Kỳ Fall</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Thông báo lỗi */}
            {error && (
                <div style={{
                    padding: '16px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '12px',
                    color: '#b91c1c',
                    marginBottom: '24px',
                    fontSize: '0.875rem'
                }}>
                    {error}
                </div>
            )}

            {/* Thay thế phần render danh sách lớp cũ bằng biến filteredClasses mới lọc */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gap: '8px' }}>
                    <Loader2 className="animate-spin" style={{ color: '#0D3E26' }} />
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Đang tải danh sách lớp học...</span>
                </div>
            ) : filteredClasses.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    border: '1px dashed #cbd5e1'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎒</div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                        Không tìm thấy lớp học nào
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '6px', margin: 0 }}>
                        {searchTerm ? 'Không tìm thấy lớp học nào khớp với từ khóa tìm kiếm.' : 'Không có lớp học nào trong học kỳ được chọn.'}
                    </p>
                </div>
            ) : (
                /* Lưới hiển thị các lớp học đã lọc */
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {filteredClasses.map((cls) => (
                        <div
                            key={cls.id}
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                padding: '20px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                            }}
                        >
                            <div>
                                {/* Mã Lớp */}
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: '#e6f4ea',
                                    color: '#0d3e26',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '4px 10px',
                                    borderRadius: '9999px',
                                    marginBottom: '12px'
                                }}>
                                    <BookOpen size={12} />
                                    {cls.id}
                                </div>

                                {/* Tên môn học */}
                                <h4 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: 700,
                                    color: '#1e293b',
                                    margin: '0 0 12px 0',
                                    lineHeight: '1.4'
                                }}>
                                    {cls.courseName} ({cls.courseCode})
                                </h4>

                                {/* Giảng viên */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#475569' }}>
                                    <User size={16} style={{ color: '#94a3b8' }} />
                                    <span style={{ fontSize: '0.875rem' }}>GV: <strong>{cls.lecturerName}</strong></span>
                                </div>
                            </div>

                            {/* Hạn học kỳ / Action */}
                            <div style={{
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '1px solid #f1f5f9',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem' }}>
                                    <Calendar size={14} />
                                    <span>{cls.startDate || 'N/A'} - {cls.endDate || 'N/A'}</span>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenClassDetail(cls);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#0D3E26',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#072416'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0D3E26'}
                                >
                                    Vào lớp
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

            {/* ── Modal chi tiết lớp học ── */}
            {selectedClass && (
                <div
                    onClick={() => setSelectedClass(null)}
                    style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 9999, padding: '16px'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            backgroundColor: '#fff', borderRadius: '20px',
                            width: '100%', maxWidth: '600px', maxHeight: '88vh',
                            overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                            display: 'flex', flexDirection: 'column'
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#e6f4ea', color: '#0d3e26', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, marginBottom: 8 }}>
                                    <BookOpen size={11} /> {selectedClass.id}
                                </div>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>
                                    {selectedClass.courseName} ({selectedClass.courseCode})
                                </h2>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: '#64748b' }}>
                                        <User size={13} /> GV: <strong style={{ color: '#334155' }}>{selectedClass.lecturerName || '—'}</strong>
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: '#64748b' }}>
                                        <Calendar size={13} /> {selectedClass.startDate || 'N/A'} – {selectedClass.endDate || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedClass(null)}
                                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', color: '#64748b', flexShrink: 0 }}
                                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                            >✕</button>
                        </div>

                        {/* Student list section */}
                        <div style={{ padding: '16px 24px 24px', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Users size={16} color="#0D3E26" /> Danh sách học viên
                                    {!loadingStudents && (
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#e6f4ea', color: '#0d3e26', padding: '2px 8px', borderRadius: 999 }}>
                                            {classStudents.length} người
                                        </span>
                                    )}
                                </h3>
                            </div>

                            {/* Search students */}
                            <input
                                type="text"
                                placeholder="Tìm kiếm học viên..."
                                value={studentSearchTerm}
                                onChange={e => setStudentSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', marginBottom: 14, boxSizing: 'border-box', color: '#334155' }}
                                onFocus={e => e.target.style.borderColor = '#0D3E26'}
                                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                            />

                            {loadingStudents ? (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100, gap: 8 }}>
                                    <Loader2 size={18} style={{ color: '#0D3E26', animation: 'spin 1s linear infinite' }} />
                                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Đang tải danh sách...</span>
                                </div>
                            ) : classStudents.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.875rem' }}>
                                    Chưa có học viên nào trong lớp này.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {classStudents
                                        .filter(s => {
                                            const q = studentSearchTerm.toLowerCase();
                                            return !q || s.fullName?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
                                        })
                                        .map((s, idx) => (
                                            <div key={s.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #0D3E26, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                                                    {(s.fullName || s.id || '?')[0].toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {s.fullName || '—'}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.email || s.id}</div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
