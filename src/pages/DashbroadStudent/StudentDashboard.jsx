import React, { useState, useEffect, useMemo } from 'react';
import { fetchAcademicTerms } from '../../services/academicTermService';
import { getUserClasses, getClassStudents } from '../../services/classService';
import { getUser } from '../../services/authService';
import { BookOpen, User, Calendar, Loader2, X, Users, Milestone, Award, Search, Filter } from 'lucide-react';
import styles from './DashbroadStudent.module.css';

export default function StudentDashboard() {
    const currentUser = useMemo(() => getUser(), []);
    const [terms, setTerms] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State bộ lọc năm học & kỳ học
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Các state phục vụ Modal chi tiết lớp học
    const [selectedClass, setSelectedClass] = useState(null); // Lớp đang được mở chi tiết
    const [classStudents, setClassStudents] = useState([]);   // Danh sách bạn học trong lớp đó
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentSearchTerm, setStudentSearchTerm] = useState(''); // Tìm kiếm bạn học


    // 1. Initial Data Fetch
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                const termsResponse = await fetchAcademicTerms();
                const fetchedTerms = Array.isArray(termsResponse) ? termsResponse : (termsResponse?.data || []);
                setTerms(fetchedTerms);

                if (fetchedTerms.length > 0) {
                    // Extract unique years
                    const uniqueYears = [...new Set(fetchedTerms.map(t => new Date(t.startDate).getFullYear().toString()))].sort((a, b) => b - a);
                    setYears(uniqueYears);

                    // Find active term or default to newest
                    const now = new Date();
                    const currentTerm = fetchedTerms.find(t => {
                        const start = new Date(t.startDate);
                        const end = new Date(t.endDate);
                        return now >= start && now <= end;
                    }) || fetchedTerms[0];

                    if (currentTerm) {
                        setSelectedYear(new Date(currentTerm.startDate).getFullYear().toString());
                    }
                }
            } catch (err) {
                console.error('Error loading dashboard data:', err);
                setError('Không thể tải danh sách học kỳ.');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // 2. Fetch Classes when filters change
    useEffect(() => {
        if (!currentUser || terms.length === 0 || !selectedYear) return;

        const fetchClasses = async () => {
            setLoading(true);
            try {
                // Find term matching year and semester
                const matchedTerm = terms.find(t => {
                    const tYear = new Date(t.startDate).getFullYear().toString();
                    const nameLower = t.name.toLowerCase();
                    const codeLower = (t.termCode || '').toLowerCase();

                    const matchesYear = tYear === selectedYear;
                    let matchesSemester = true;
                    if (selectedSemester !== 'all') {
                        if (selectedSemester === 'Spring') matchesSemester = nameLower.includes('spring') || codeLower.includes('sp');
                        else if (selectedSemester === 'Summer') matchesSemester = nameLower.includes('summer') || codeLower.includes('su');
                        else if (selectedSemester === 'Fall') matchesSemester = nameLower.includes('fall') || codeLower.includes('fa');
                    }
                    return matchesYear && matchesSemester;
                });

                if (matchedTerm) {
                    const res = await getUserClasses(currentUser.id, matchedTerm.id, currentUser.role);
                    const list = Array.isArray(res) ? res : (res?.data || []);
                    setClasses(list);
                } else {
                    setClasses([]);
                }
            } catch (err) {
                console.error('Error fetching classes:', err);
                setError('Lỗi khi tải danh sách lớp học.');
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, [selectedYear, selectedSemester, terms, currentUser]);

    // Xử lý khi nhấn "Vào lớp" hoặc click Card lớp học
    const handleOpenClassDetail = async (cls) => {
        setSelectedClass(cls);
        setLoadingDetails(true);
        setStudentSearchTerm('');
        try {
            const res = await getClassStudents(cls.id);
            const students = Array.isArray(res) ? res : (res?.data || []);
            setClassStudents(students);
        } catch (err) {
            console.error('Error fetching class students:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Filtering logic (Search)
    const filteredClasses = classes.filter(cls => {
        const nameMatch = cls.courseName.toLowerCase().includes(searchTerm.toLowerCase());
        const codeMatch = cls.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
        const classIdMatch = cls.id.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || codeMatch || classIdMatch;
    });


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

                {/* Year Filter */}
                <div className="w-full md:w-48">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Năm học</label>
                    <select
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 outline-none"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
                    </select>
                </div>

                {/* Semester Filter */}
                <div className="w-full md:w-48">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Kỳ học</label>
                    <select
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 outline-none"
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                    >
                        <option value="all">Tất cả kỳ</option>
                        <option value="Spring">Kỳ Spring</option>
                        <option value="Summer">Kỳ Summer</option>
                        <option value="Fall">Kỳ Fall</option>
                    </select>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Content List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            ) : filteredClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.map(cls => (
                        <div
                            key={cls.id}
                            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                            onClick={() => handleOpenClassDetail(cls)}
                        >
                            <div className="h-2 bg-emerald-500 group-hover:h-3 transition-all" />
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">{cls.courseCode || 'CODE'}</span>
                                    <span className="flex items-center text-slate-400 text-[10px] gap-1 font-medium"><Calendar size={12}/> {cls.termCode || 'Kỳ học'}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 group-hover:text-emerald-700 transition-colors line-clamp-2">{cls.courseName || cls.name}</h3>
                                <div className="space-y-3 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold">
                                            {cls.lecturerName ? cls.lecturerName[0].toUpperCase() : 'G'}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Giảng viên</p>
                                            <p className="text-sm font-bold text-slate-700">{cls.lecturerName || 'Chưa phân công'}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        <span>Sĩ số: {cls.totalStudents || 0} HV</span>
                                        <button className="px-3 py-1 bg-slate-900 text-white rounded-lg hover:bg-emerald-700 transition-colors">Vào lớp</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-200 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Không tìm thấy lớp học nào</h3>
                    <p className="text-slate-500 mt-2">Hãy thử thay đổi năm học hoặc kỳ học để xem các lớp khác.</p>
                </div>
            )}

            {/* ── Modal chi tiết lớp học ── */ }
    {
        selectedClass && (
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
        )
    }
        </div>
        </>
    );
}
