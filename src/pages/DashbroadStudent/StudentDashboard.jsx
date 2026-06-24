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

    // Filter States
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Selected Class Details
    const [selectedClass, setSelectedClass] = useState(null);
    const [classStudents, setClassStudents] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');

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

    // Handle Class Click
    const handleClassClick = async (cls) => {
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
        const nameMatch = (cls.courseName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const codeMatch = (cls.courseCode || '').toLowerCase().includes(searchTerm.toLowerCase());
        const idMatch = (cls.id || '').toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || codeMatch || idMatch;
    });

    const generateRoadmap = (courseCode, courseName) => {
        const code = String(courseCode || '').toUpperCase();
        const name = String(courseName || '').toLowerCase();
        const isCSharp = code.includes('PRN') || code.includes('CS') || name.includes('c#') || name.includes('lập trình');
        const isSWP = code.includes('SWP') || code.includes('PROJ') || name.includes('dự án') || name.includes('đồ án');

        if (isCSharp) {
            return [
                { week: 'Tuần 1', title: 'Cài đặt môi trường & Cú pháp cơ bản', status: 'COMPLETED', lessons: ['Khởi tạo dự án Console App', 'Biến, toán tử và các kiểu dữ liệu', 'Cấu trúc điều kiện rẽ nhánh'] },
                { week: 'Tuần 2', title: 'Lập trình Hướng đối tượng (OOP)', status: 'COMPLETED', lessons: ['Tính kế thừa, đóng gói, đa hình', 'Interface & Abstract Class'] },
                { week: 'Tuần 3', title: 'Collections & LINQ', status: 'ACTIVE', lessons: ['Generic class & Generic method', 'Truy vấn LINQ cơ bản'] },
                { week: 'Tuần 4', title: 'ADO.NET & Entity Framework', status: 'UPCOMING', lessons: ['Kết nối CSDL server', 'ORM với EF Core'] }
            ];
        }
        if (isSWP) {
            return [
                { week: 'Tuần 1', title: 'Thành lập nhóm & Ý tưởng', status: 'COMPLETED', lessons: ['Phân chia vai trò WBS', 'Lập tiến độ Gantt Chart'] },
                { week: 'Tuần 2', title: 'Phân tích & Thiết kế', status: 'ACTIVE', lessons: ['Phân tích yêu cầu chức năng', 'Figma UI/UX Mockup'] },
                { week: 'Tuần 3', title: 'Cấu trúc CSDL & ERD', status: 'UPCOMING', lessons: ['Vẽ sơ đồ ERD', 'Khởi tạo Skeleton dự án'] }
            ];
        }
        return [
            { week: 'Giai đoạn 1', title: 'Làm quen & Cơ bản', status: 'COMPLETED', lessons: ['Đề cương học phần', 'Công cụ làm việc'] },
            { week: 'Giai đoạn 2', title: 'Chuyên sâu lý thuyết', status: 'ACTIVE', lessons: ['Kiến trúc cốt lõi', 'Slide chuyên đề'] }
        ];
    };

    if (loading && terms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-slate-500 font-medium">Đang chuẩn bị dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
                {/* Search */}
                <div className="flex-1">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Tìm kiếm khóa học</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Nhập tên môn, mã môn hoặc mã lớp..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
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
                            onClick={() => handleClassClick(cls)}
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

            {/* Class Details Modal */}
            {selectedClass && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedClass(null)}>
                    <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-slide-left overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="p-8 bg-emerald-700 text-white relative">
                            <button onClick={() => setSelectedClass(null)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                            <div className="bg-emerald-500/30 text-white text-[10px] font-extrabold px-3 py-1 rounded-full w-fit mb-4 tracking-widest">{selectedClass.id}</div>
                            <h2 className="text-2xl font-black leading-tight mb-2">{selectedClass.courseName}</h2>
                            <p className="text-emerald-100 text-sm font-medium opacity-80">Mã môn: {selectedClass.courseCode} | {selectedClass.termCode}</p>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-10">
                            {/* Roadmap Section */}
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                    <Milestone className="w-4 h-4 text-emerald-500" /> Lộ trình học tập
                                </h3>
                                <div className="space-y-4">
                                    {generateRoadmap(selectedClass.courseCode, selectedClass.courseName).map((step, i) => (
                                        <div key={i} className={`p-5 rounded-2xl border-l-4 transition-all ${step.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-500' : step.status === 'ACTIVE' ? 'bg-amber-50 border-amber-500 shadow-md' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${step.status === 'COMPLETED' ? 'text-emerald-600' : step.status === 'ACTIVE' ? 'text-amber-600' : 'text-slate-400'}`}>{step.week}</span>
                                                {step.status === 'COMPLETED' && <Award size={16} className="text-emerald-500" />}
                                            </div>
                                            <h4 className="font-bold text-slate-800 mb-3">{step.title}</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {step.lessons.map((l, j) => <span key={j} className="text-[10px] bg-white/60 px-2 py-1 rounded-md text-slate-600 border border-slate-100 font-medium">{l}</span>)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Students List */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <Users className="w-4 h-4 text-emerald-500" /> Học viên cùng lớp
                                    </h3>
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg">{classStudents.length} HV</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Tìm tên học viên..."
                                    className="w-full px-4 py-2 border border-slate-100 rounded-xl text-sm mb-4 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    value={studentSearchTerm}
                                    onChange={e => setStudentSearchTerm(e.target.value)}
                                />
                                {loadingDetails ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-slate-200 animate-spin" /></div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {classStudents.filter(s => (s.fullName || '').toLowerCase().includes(studentSearchTerm.toLowerCase())).map((s, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-50 hover:bg-white hover:border-emerald-100 hover:shadow-sm transition-all group">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-700 font-bold shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                    {(s.fullName || '?')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{s.fullName}</p>
                                                    <p className="text-[10px] font-medium text-slate-400">{s.email || s.id}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg hover:shadow-emerald-900/20">
                                Vào lớp học ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-left {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-left {
                    animation: slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
}
