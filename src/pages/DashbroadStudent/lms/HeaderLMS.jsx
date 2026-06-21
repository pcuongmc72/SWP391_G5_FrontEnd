import React, { useState } from "react";
import { 
  Menu, 
  Plus, 
  Grid, 
  RefreshCw, 
  Flame, 
  Award, 
  BookOpen, 
  LogOut
} from "lucide-react";

export default function HeaderLMS({ 
  streak, 
  points, 
  completedCount, 
  totalCount, 
  resetProgress, 
  studentName, 
  studentCode,
  onLogout 
}) {
  const [showLauncher, setShowLauncher] = useState(false);
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // First letter of the last word in name for Google avatar
  const avatarLetter = studentName.trim().split(" ").pop()?.charAt(0).toUpperCase() || "N";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center justify-between select-none px-4">
      
      {/* Left side: Navigation button & Flipped LMS logo on transparent/white background */}
      <div className="flex items-center gap-1.5 h-full">
        {/* Menu toggle button on the far left */}
        <button 
          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition cursor-pointer"
          title="Thanh điều hướng"
        >
          <Menu size={20} />
        </button>

        {/* Brand Logo with transparent bg */}
        <div className="flex items-center gap-2.5 ml-1">
          <div className="text-emerald-600 bg-emerald-50 p-2 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
            <BookOpen size={18} className="stroke-[2.5]" />
          </div>
          <div className="flex flex-col text-left justify-center">
            <span className="font-black text-[15px] text-emerald-900 tracking-wider font-sans leading-none">
              FLIPPED LMS
            </span>
            <span className="text-[9.5px] font-extrabold text-emerald-600 mt-1 tracking-widest leading-none">
              HỌC VIÊN
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Plus (+), Launcher 9-dot grid, and the circular User profile avatar */}
      <div className="flex items-center gap-3">
        
        {/* Plus icon to show quick class features */}
        <button 
          onClick={() => alert(`Chào ${studentName}! Hãy gửi mã ID môn học mới cho Ban Công nghệ để tham gia lớp tự học đảo ngược bổ sung.`)}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
          title="Tạo hoặc tham gia lớp học"
        >
          <Plus size={20} className="stroke-[2.2]" />
        </button>

        {/* 9-dot grid Google app launcher holding dynamic student stats & resetting controls */}
        <div className="relative">
          <button 
            onClick={() => setShowLauncher(!showLauncher)}
            className={`p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer ${showLauncher ? "bg-gray-100 text-gray-700" : ""}`}
            title="Các công cụ học tập của bạn"
          >
            <Grid size={18} />
          </button>

          {/* Dynamic dropdown panel simulating google services menu */}
          {showLauncher && (
            <div className="absolute right-0 mt-2.5 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 space-y-4 animate-fade-in text-left z-50 font-sans">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400">
                  Dịch vụ & Thành tích của bạn
                </span>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-amber-50 rounded-xl p-2.5 text-center flex flex-col items-center">
                    <Flame className="text-amber-500 fill-amber-500 animate-pulse" size={18} />
                    <span className="text-xs font-bold text-amber-900 mt-1">{streak} Ngày</span>
                    <span className="text-[8px] text-gray-400">Streak</span>
                  </div>

                  <div className="bg-indigo-50 rounded-xl p-2.5 text-center flex flex-col items-center">
                    <Award className="text-indigo-600" size={18} />
                    <span className="text-xs font-bold text-indigo-950 mt-1">{points} XP</span>
                    <span className="text-[8px] text-gray-400">Học lực</span>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-2.5 text-center flex flex-col items-center">
                    <BookOpen className="text-emerald-600" size={18} />
                    <span className="text-xs font-bold text-emerald-950 mt-1">{percentComplete}%</span>
                    <span className="text-[8px] text-gray-400">Tiến độ</span>
                  </div>
                </div>
              </div>

              {/* Reset controls placed politely as Google shortcuts options */}
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400 block mb-1">
                  Hệ thống Flipped LMS
                </span>
                
                <button
                  onClick={() => {
                    setShowLauncher(false);
                    if (confirm("Xác nhận Reset: Bạn có chắc chắn muốn xóa tất cả tiến trình học tập, ghi chú cá nhân và câu trả lời bài trắc nghiệm để bắt đầu lại?")) {
                      resetProgress();
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <RefreshCw size={13} />
                  <span>Đặt lại tiến trình học tập</span>
                </button>

                <button
                  onClick={() => {
                    setShowLauncher(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition"
                >
                  <LogOut size={13} />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>

              <div className="text-[9px] text-gray-400 text-center border-t border-gray-100 pt-2 font-mono">
                Lớp học đảo ngược v2.6.0
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill matching exactly user's screenshot */}
        <div 
          onClick={() => setShowLauncher(!showLauncher)}
          className="border border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300 transition-all px-3 py-1.5 rounded-full flex items-center gap-2.5 shadow-2xs cursor-pointer select-none"
          title={`${studentName} (${studentCode})`}
        >
          <div className="w-8 h-8 rounded-full bg-[#0a4823] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
            {avatarLetter}
          </div>
          <div className="text-left font-sans leading-none pr-1">
            <span className="text-xs font-bold text-gray-800 block">
              {studentName}
            </span>
            <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">
              Student
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
