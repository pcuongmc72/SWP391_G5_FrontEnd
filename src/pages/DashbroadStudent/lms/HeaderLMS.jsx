import React, { useState } from "react";
import {
  Menu,
  Plus,
  BookOpen,
  LogOut,
  User,
  ChevronDown
} from "lucide-react";

export default function HeaderLMS({
  streak,
  points,
  completedCount,
  totalCount,
  resetProgress,
  studentName,
  studentCode,
  studentEmail,
  onLogout,
  onToggleSidebar,
  sidebarOpen
}) {
  const [showLauncher, setShowLauncher] = useState(false);
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // First letter of the last word in name for Google avatar
  const avatarLetter = studentName.trim().split(" ").pop()?.charAt(0).toUpperCase() || "N";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center justify-between select-none px-4">

      {/* Left side: Navigation button & Flipped LMS logo */}
      <div className="flex items-center gap-1.5 h-full">
        {/* Menu toggle button on the far left */}
        <button
          onClick={onToggleSidebar}
          className={`p-2 hover:bg-gray-100 rounded-full transition cursor-pointer ${
            sidebarOpen ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-800'
          }`}
          title={sidebarOpen ? 'Ẩn thanh điều hướng' : 'Hiện thanh điều hướng'}
        >
          <Menu size={20} className={`transition-transform duration-300 ${sidebarOpen ? 'rotate-0' : 'rotate-90'}`} />
        </button>

        {/* Brand Logo */}
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

      {/* Right side: Plus (+) and User Profile Pill with dropdown */}
      <div className="flex items-center gap-3">

        {/* Plus icon */}
        <button
          onClick={() => alert(`Chào ${studentName}! Hãy gửi mã ID môn học mới cho Ban Công nghệ để tham gia lớp tự học đảo ngược bổ sung.`)}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
          title="Tạo hoặc tham gia lớp học"
        >
          <Plus size={20} className="stroke-[2.2]" />
        </button>

        {/* User Profile Pill — click to open/close dropdown */}
        <div className="relative">
          <div
            onClick={() => setShowLauncher(!showLauncher)}
            className={`border transition-all px-3 py-1.5 rounded-full flex items-center gap-2.5 shadow-2xs cursor-pointer select-none ${
              showLauncher
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300'
            }`}
            title={`${studentName} (${studentCode})`}
          >
            <div className="w-8 h-8 rounded-full bg-[#0a4823] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
              {avatarLetter}
            </div>
            <div className="text-left font-sans leading-none pr-0.5">
              <span className="text-xs font-bold text-gray-800 block">
                {studentName}
              </span>
              <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">
                Student
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${showLauncher ? 'rotate-180' : 'rotate-0'}`}
            />
          </div>

          {/* Dropdown panel */}
          {showLauncher && (
            <div className="absolute right-0 mt-2.5 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 space-y-4 animate-fade-in text-left z-50 font-sans">

              {/* User profile details at the top */}
              <div className="flex flex-col items-center text-center pb-3 border-b border-gray-100">
                <div className="w-14 h-14 rounded-full bg-[#0a4823] text-white font-bold flex items-center justify-center text-xl shadow-xs mb-2">
                  {avatarLetter}
                </div>
                <h3 className="font-bold text-sm text-gray-800">{studentName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{studentEmail || "Chưa cập nhật email"}</p>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowLauncher(false)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition cursor-pointer"
                >
                  <User size={13} className="text-gray-500" />
                  <span>Thông tin cá nhân</span>
                </button>

                <button
                  onClick={() => {
                    setShowLauncher(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                >
                  <LogOut size={13} className="text-red-500" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
