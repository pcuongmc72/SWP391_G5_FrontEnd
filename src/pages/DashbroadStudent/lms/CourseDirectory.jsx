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
    if (!code) return "linear-gradient(135deg, #0D3E26 0%, #1c5e3d 100%)";
    const c = code.toLowerCase();
    if (c.includes("prj")) return "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)"; // Blue
    if (c.includes("se") || c.includes("oop")) return "linear-gradient(135deg, #78350f 0%, #f59e0b 100%)"; // Orange/Brown
    if (c.includes("mad") || c.includes("csd")) return "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)"; // Indigo
    return "linear-gradient(135deg, #0D3E26 0%, #1c5e3d 100%)"; // Green theme (default)
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
                  className="p-4 text-white h-[98px] relative flex flex-col justify-between shrink-0 overflow-hidden"
                >
                  {/* Notebook overlay */}
                  <div className="absolute right-[-8px] top-[-8px] opacity-10 pointer-events-none group-hover:scale-105 transition duration-300">
                    <LayoutBookSimulated />
                  </div>

                  {/* Course Code Link */}
                  <div className="space-y-0.5 z-10 min-w-0 pr-6">
                    <h3 className="font-extrabold text-sm sm:text-[15px] hover:underline tracking-tight block truncate" title={cls.courseCode || cls.id}>
                      {cls.courseCode || cls.id}
                    </h3>
                    <p className="text-[10px] text-zinc-100 font-normal truncate opacity-90">
                      Lớp {cls.id}
                    </p>
                  </div>

                  {/* Subtitle with Lecturer details */}
                  <div className="z-10 mt-auto flex items-center justify-between min-w-0">
                    <span className="text-[10px] text-zinc-100 font-medium truncate max-w-[75%]">
                      GV: {cls.lecturerName || "Chưa phân công"}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded-sm">
                      {selectedSemester}
                    </span>
                  </div>

                  {/* Floating teacher avatar */}
                  <div 
                    className="absolute right-4 -bottom-5 w-11 h-11 rounded-full text-white font-bold flex items-center justify-center border-2 border-white shadow-xs text-sm z-20 hover:scale-105 transition"
                    style={{ backgroundColor: getAvatarColor(initial) }}
                  >
                    {initial}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4 pt-6 min-h-[100px] bg-white">
                  <div className="min-h-[44px]">
                    <h4 className="text-xs font-bold text-gray-800 leading-snug group-hover:text-emerald-700 transition truncate-2-lines">
                      {cls.courseName}
                    </h4>
                    <p className="text-[9px] text-gray-400 mt-1">
                      {cls.startDate || "N/A"} - {cls.endDate || "N/A"}
                    </p>
                  </div>

                  {/* Bottom action section */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-2 shrink-0">
                    <div className="flex items-center gap-1 text-gray-500">
                      <div className="p-1 rounded-full hover:bg-gray-100 hover:text-gray-800 transition text-gray-600" title="Bài tập được giao">
                        <ClipboardList size={14} className="stroke-[2.2]" />
                      </div>
                      <div className="p-1 rounded-full hover:bg-gray-100 hover:text-gray-800 transition text-gray-600" title="Thư mục khóa học">
                        <Folder size={14} className="stroke-[2.2]" />
                      </div>
                    </div>

                    <div className="text-gray-400 hover:text-gray-700 p-1 rounded-full transition" title="Tùy chọn khác">
                      <MoreVertical size={14} />
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
