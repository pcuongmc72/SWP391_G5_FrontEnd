import React, { useState, useEffect } from 'react';
import { fetchAcademicTerms } from '../../services/academicTermService';
import { getUserClasses, getClassStudents } from '../../services/classService';
import { getUser } from '../../services/authService';
import { BookOpen, User, Calendar, Loader2, X, Users, Milestone, Award } from 'lucide-react';
import styles from './DashbroadStudent.module.css';

export default function StudentDashboard() {
    const currentUser = getUser();
    const [terms, setTerms] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('all');

    // Selected Class Details
    const [selectedClass, setSelectedClass] = useState(null);
    const [classStudents, setClassStudents] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                const termsResponse = await fetchAcademicTerms();

                // Extract terms from different possible response structures
                let fetchedTerms = [];
                if (Array.isArray(termsResponse)) {
                    fetchedTerms = termsResponse;
                } else if (termsResponse && Array.isArray(termsResponse.data)) {
                    fetchedTerms = termsResponse.data;
                }

                setTerms(fetchedTerms);

                if (fetchedTerms.length > 0 && currentUser) {
                    // Find active term or current term
                    const now = new Date();
                    const matchedTerm = fetchedTerms.find(t => {
                        const start = new Date(t.startDate);
                        const end = new Date(t.endDate);
                        return now >= start && now <= end;
                    }) || fetchedTerms[0];

                    const classesResponse = await getUserClasses(currentUser.id, matchedTerm.id, currentUser.role);

                    let fetchedClasses = [];
                    if (Array.isArray(classesResponse)) {
                        fetchedClasses = classesResponse;
                    } else if (classesResponse && Array.isArray(classesResponse.data)) {
                        fetchedClasses = classesResponse.data;
                    }

                    setClasses(fetchedClasses);
                }
            } catch (err) {
                console.error('Error loading dashboard data:', err);
                setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    // Handle Term Change
    const handleTermChange = async (termId) => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const response = await getUserClasses(currentUser.id, termId, currentUser.role);
            let fetchedClasses = [];
            if (Array.isArray(response)) {
                fetchedClasses = response;
            } else if (response && Array.isArray(response.data)) {
                fetchedClasses = response.data;
            }
            setClasses(fetchedClasses);
        } catch (err) {
            setError('Lỗi khi tải danh sách lớp học.');
        } finally {
            setLoading(false);
        }
    };

    // Handle Class Click
    const handleClassClick = async (cls) => {
        setSelectedClass(cls);
        setLoadingDetails(true);
        try {
            const response = await getClassStudents(cls.id);
            let students = [];
            if (Array.isArray(response)) {
                students = response;
            } else if (response && Array.isArray(response.data)) {
                students = response.data;
            }
            setClassStudents(students);
        } catch (err) {
            console.error('Error fetching class students:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Filtering logic
    const filteredClasses = classes.filter(cls => {
        const name = cls.courseName || cls.name || '';
        const code = cls.courseCode || cls.id || '';
        const nameMatch = name.toLowerCase().includes(searchTerm.toLowerCase());
        const codeMatch = code.toLowerCase().includes(searchTerm.toLowerCase());
        const courseMatch = selectedCourse === 'all' || cls.courseId === selectedCourse;
        return (nameMatch || codeMatch) && courseMatch;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-slate-500 font-medium">Đang tải danh sách lớp học...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Term Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Lớp học của tôi</h1>
                    <p className="text-slate-500 text-sm">Xem và quản lý các lớp học bạn đang tham gia</p>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <select
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 outline-none transition-all"
                        onChange={(e) => handleTermChange(e.target.value)}
                    >
                        {terms.map(term => (
                            <option key={term.id} value={term.id}>{term.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Tổng số lớp', value: classes.length, icon: BookOpen, color: 'emerald' },
                    { label: 'Đang diễn ra', value: classes.filter(c => !c.endDate || new Date(c.endDate) >= new Date()).length, icon: Milestone, color: 'blue' },
                    { label: 'Hoàn thành', value: classes.filter(c => c.endDate && new Date(c.endDate) < new Date()).length, icon: Award, color: 'purple' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-slate-100 rounded-2xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-sm transition-all"
                        placeholder="Tìm kiếm theo tên khóa học hoặc mã lớp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Classes Grid */}
            {filteredClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.map(cls => (
                        <div
                            key={cls.id}
                            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                            onClick={() => handleClassClick(cls)}
                        >
                            <div className="h-3 bg-emerald-500 group-hover:h-4 transition-all" />
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                                        {cls.courseCode || cls.id}
                                    </div>
                                    <div className="flex items-center text-slate-400 text-xs gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {cls.academicTermName || 'Học kỳ hiện tại'}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">
                                    {cls.courseName || cls.name || 'Chưa có tên'}
                                </h3>
                                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                            <User size={14} />
                                        </div>
                                        <span className="text-sm font-medium">GV: {cls.lecturerName || 'Chưa phân công'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                                        <Calendar size={12} />
                                        <span>{cls.startDate || 'N/A'} - {cls.endDate || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center">
                    <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">Không tìm thấy lớp học nào</h3>
                    <p className="text-slate-500 text-sm mt-1">Vui lòng kiểm tra lại bộ lọc hoặc liên lạc với Admin.</p>
                </div>
            )}

            {/* Selected Class Sidebar / Modal Mini */}
            {selectedClass && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm transition-all" onClick={() => setSelectedClass(null)}>
                    <div
                        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-left"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-bottom flex items-center justify-between bg-emerald-600 text-white">
                            <div>
                                <h2 className="text-xl font-bold">{selectedClass.courseName || selectedClass.name}</h2>
                                <p className="text-emerald-100 text-xs mt-1">Mã lớp: {selectedClass.id}</p>
                            </div>
                            <button onClick={() => setSelectedClass(null)} className="p-2 hover:bg-white/10 rounded-xl">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Class Actions */}
                            <div className="grid grid-cols-2 gap-4">
                                <button className="flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-colors group">
                                    <BookOpen className="w-6 h-6 text-emerald-600 mb-2" />
                                    <span className="text-sm font-bold text-emerald-800">Học liệu</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors">
                                    <Milestone className="w-6 h-6 text-blue-600 mb-2" />
                                    <span className="text-sm font-bold text-blue-800">Tiến độ</span>
                                </button>
                            </div>

                            {/* Students List */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Học viên cùng lớp ({classStudents.length})
                                </h3>
                                {loadingDetails ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {classStudents.map(student => (
                                            <div key={student.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                    {student.fullName ? student.fullName[0].toUpperCase() : 'S'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{student.fullName}</p>
                                                    <p className="text-xs text-slate-500">{student.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100">
                            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">
                                Vào lớp học
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
