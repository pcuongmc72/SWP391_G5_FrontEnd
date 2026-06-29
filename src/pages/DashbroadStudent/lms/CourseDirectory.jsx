import React from "react";
import { 
  Calendar, 
  BookOpen, 
  Search, 
  Folder, 
  MoreVertical, 
  Layers,
  ClipboardList
} from "lucide-react";

export default function CourseDirectory({
  classes,
  onSelectCourse,
  years,
  selectedYear,
  setSelectedYear,
  selectedSemester,
  setSelectedSemester,
  searchTerm,
  setSearchTerm
}) {
  
  // Custom helper to get a nice gradient or color for cards
  const getBannerColor = (code) => {
    if (!code) return "linear-gradient(135deg, #064e3b 0%, #065f46 100%)";
    const c = code.toLowerCase();
    if (c.includes("prj")) return "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)"; // Deep Blue
    if (c.includes("se") || c.includes("oop")) return "linear-gradient(135deg, #78350f 0%, #92400e 100%)"; // Rich Amber
    if (c.includes("mad") || c.includes("csd")) return "linear-gradient(135deg, #312e81 0%, #3730a3 100%)"; // Deep Indigo
    return "linear-gradient(135deg, #064e3b 0%, #065f46 100%)"; // Emerald theme (default)
  };

  return (
    <div id="course-directory-root" className="space-y-6 select-text animate-fade-in text-left">
      
      {/* Search & Selector Filter Bar */}
      <div id="filter-bar" className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4 select-none">
        
        {/* Left side: Search Bar */}
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm mã lớp, môn học, mã môn học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 focus:bg-white rounded-lg text-xs focus:outline-none focus:border-emerald-600 transition"
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={13} />
        </div>

        {/* Right side: Select dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Year selector */}
          <div className="relative flex-1 md:flex-initial min-w-[140px]">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg pl-3 pr-9 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer transition appearance-none"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  Năm học {year}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <Calendar size={13} />
            </div>
          </div>

          {/* Semester selector */}
          <div className="relative flex-1 md:flex-initial min-w-[140px]">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg pl-3 pr-9 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer transition appearance-none"
            >
              <option value="Spring">Kỳ Xuân (Spring)</option>
              <option value="Summer">Kỳ Hè (Summer)</option>
              <option value="Fall">Kỳ Thu (Fall)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <Layers size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Google Classroom Styled Cards */}
      {classes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-14 px-6 text-center space-y-3">
          <BookOpen className="text-gray-300 mx-auto" size={44} />
          <p className="text-sm font-bold text-gray-500">
            Không tìm thấy lớp học nào cho kỳ học này.
          </p>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Vui lòng chọn học kỳ khác hoặc thử tìm kiếm với từ khóa khác để hiển thị tài liệu học tập của bạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {classes.map((cls) => {
            const bannerColor = getBannerColor(cls.courseCode);
            const initial = cls.lecturerName?.[0]?.toUpperCase() || "G";
            
            return (
              <div
                key={cls.id}
                onClick={() => onSelectCourse(cls)}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer group relative"
              >
                {/* Card Banner Header */}
                <div
                  style={{ background: bannerColor }}
                  className="p-5 text-white h-[115px] relative flex flex-col justify-between shrink-0"
                >
                  {/* Notebook overlay background pattern */}
                  <div className="absolute right-[-10px] top-[-10px] opacity-[0.08] pointer-events-none group-hover:scale-110 group-hover:rotate-3 transition duration-500">
                    <LayoutBookSimulated />
                  </div>

                  {/* Course Code Link & Semester Badge */}
                  <div className="z-10 flex justify-between items-start min-w-0">
                    <div className="space-y-0 min-w-0 pr-2">
                      <h3 className="font-black text-base sm:text-lg hover:underline tracking-tight block truncate drop-shadow-sm" title={cls.courseCode || cls.id}>
                        {cls.courseCode || cls.id}
                      </h3>
                      <p className="text-[11px] text-white/80 font-bold tracking-wide truncate mt-0.5">
                        Lớp {cls.id}
                      </p>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest font-black bg-black/20 backdrop-blur-xs px-2 py-0.5 rounded border border-white/10 shrink-0">
                      {selectedSemester}
                    </span>
                  </div>

                  {/* Subtitle with Lecturer details */}
                  <div className="z-10 mt-auto flex items-center justify-between min-w-0">
                    <span className="text-[10.5px] text-white font-bold truncate max-w-[90%] drop-shadow-sm">
                      GV: {cls.lecturerName || "Chưa phân công"}
                    </span>
                  </div>

                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4 min-h-[110px] bg-white">
                  <div className="min-h-[48px] text-left">
                    <h4 className="text-[13px] font-bold text-slate-800 leading-snug group-hover:text-emerald-700 transition-colors duration-200">
                      {cls.courseName}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      <Calendar size={12} className="text-slate-300" />
                      {cls.startDate || "N/A"} - {cls.endDate || "N/A"}
                    </div>
                  </div>

                  {/* Bottom action section - Clean and aligned */}
                  <div className="flex items-center justify-between border-t border-slate-50 pt-3 shrink-0">
                    <div className="flex items-center gap-1">
                      <div className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-emerald-600 transition-all duration-200" title="Bài tập được giao">
                        <ClipboardList size={16} className="stroke-[2.2]" />
                      </div>
                      <div className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-emerald-600 transition-all duration-200" title="Thư mục khóa học">
                        <Folder size={16} className="stroke-[2.2]" />
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-300 hover:text-slate-600 transition-all duration-200" title="Tùy chọn khác">
                      <MoreVertical size={16} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Generate colors
function getAvatarColor(initial) {
  const code = initial.charCodeAt(0);
  const colors = [
    "#2563eb", // blue-600
    "#7c2d12", // amber-900 / brown
    "#4f46e5", // indigo-600
    "#059669", // emerald-600
    "#db2777", // pink-600
    "#d97706", // amber-600
    "#0D3E26"  // FPT Green
  ];
  return colors[code % colors.length];
}

function LayoutBookSimulated() {
  return (
    <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="30" width="50" height="60" rx="3" fill="white" fillOpacity="0.3" />
      <rect x="25" y="35" width="40" height="4" fill="white" fillOpacity="0.4" />
      <rect x="25" y="45" width="40" height="2" fill="white" fillOpacity="0.4" />
      <rect x="25" y="52" width="25" height="2" fill="white" fillOpacity="0.4" />
      <circle cx="80" cy="40" r="12" fill="white" fillOpacity="0.2" />
    </svg>
  );
}
