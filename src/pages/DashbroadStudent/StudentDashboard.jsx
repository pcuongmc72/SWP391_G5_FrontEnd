import React, { useState, useEffect } from 'react';
import { getAcademicTerms, getStudentClasses, getClassStudents } from '../../services/studentService';
import { BookOpen, User, Calendar, Loader2, X, Users } from 'lucide-react';
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
    });


    return (
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
                                    onClick={() => handleOpenClassDetail(cls)}
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

            {/* Modal Chi tiết lớp học & Tiến độ */}
            {selectedClass && (() => {

                // Lọc danh sách bạn học theo ô tìm kiếm trong modal
                const filteredStudents = classStudents.filter(std => 
                    std.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                    std.studentId.toLowerCase().includes(studentSearchTerm.toLowerCase())
                );

                return (
                    <div 
                        onClick={e => { if (e.target === e.currentTarget) setSelectedClass(null); }} 
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9000,
                            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(6px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
                        }}
                    >
                        <div style={{
                            backgroundColor: '#fff', borderRadius: '24px', padding: '32px',
                            width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', gap: '24px'
                        }}>
                            {/* Modal Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <BookOpen size={22} color="#0d3e26" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 850, color: '#0d3e26' }}>
                                            Chi tiết lớp học: {selectedClass.id}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                                            Môn học: <strong>{selectedClass.courseName} ({selectedClass.courseCode})</strong>
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedClass(null)} 
                                    style={{ border: 'none', background: '#f1f5f9', color: '#64748b', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body: Chia làm 2 cột */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', alignItems: 'start' }}>
                                
                                {/* Cột Trái: Thông tin giảng viên & Tiến độ */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    
                                    {/* Giảng viên phụ trách */}
                                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0d3e26', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <User size={16} /> Giảng viên phụ trách
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0d3e26', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {selectedClass.lecturerName?.[0]?.toUpperCase() || 'L'}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                                                    {selectedClass.lecturerName}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    Giảng viên quản lý môn học
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                </div>

                                {/* Cột Phải: Danh sách bạn học cùng lớp */}
                                <div style={{ 
                                    backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px',
                                    display: 'flex', flexDirection: 'column', gap: '12px'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0d3e26', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Users size={16} /> Bạn học cùng lớp ({classStudents.length})
                                    </h4>

                                    {/* Ô tìm kiếm bạn học nhanh */}
                                    <input 
                                        type="text" 
                                        placeholder="Tìm bạn học theo Tên hoặc Mã số..."
                                        value={studentSearchTerm}
                                        onChange={e => setStudentSearchTerm(e.target.value)}
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.78rem', outline: 'none' }}
                                    />

                                    {/* Danh sách học sinh */}
                                    <div style={{ overflowY: 'auto', maxHeight: '180px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                        {loadingStudents ? (
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', gap: '6px' }}>
                                                <Loader2 className="animate-spin" size={14} />
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Đang tải danh sách...</span>
                                            </div>
                                        ) : filteredStudents.length === 0 ? (
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', padding: '16px' }}>
                                                Không có bạn học nào khớp.
                                            </div>
                                        ) : (
                                            filteredStudents.map(std => (
                                                <div 
                                                    key={std.studentId}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}
                                                >
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#cbd5e1', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                        {std.fullName?.[0]?.toUpperCase() || 'S'}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {std.fullName} <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>[{std.studentId}]</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {std.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
