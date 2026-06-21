import React, { useState } from "react";
import { ChevronDown, ChevronUp, PlayCircle, Check, FileText } from "lucide-react";

export default function SidebarSyllabus({
  sections = [],
  activeLectureId,
  completedLectures = [],
  onLectureSelect,
  onToggleComplete
}) {
  // State tracking which weeks (sections) are expanded
  const [expandedSections, setExpandedSections] = useState(() => {
    // Expand the first section by default
    return { "section-1": true };
  });

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    sections.forEach((s) => {
      allExpanded[s.id] = true;
    });
    setExpandedSections(allExpanded);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const totalDurationStr = "3h 48m";

  return (
    <div className="bg-white border-l border-gray-200 h-full flex flex-col select-none text-left">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="font-bold text-gray-900 text-sm">Nội dung khóa học</h2>
          <button
            onClick={() => {
              const areSomeCollapsed = sections.some((s) => !expandedSections[s.id]);
              if (areSomeCollapsed) expandAll();
              else collapseAll();
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition focus:outline-none cursor-pointer"
          >
            {sections.some((s) => !expandedSections[s.id]) ? "Mở rộng tất cả" : "Thu gọn tất cả"}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {sections.length} phần • {sections.reduce((acc, s) => acc + (s.lectures?.length || 0), 0)} bài học • {totalDurationStr}
        </p>
      </div>

      {/* Accordion list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200 custom-scrollbar">
        {sections.map((section) => {
          const isExpanded = !!expandedSections[section.id];
          const completedInSection = (section.lectures || []).filter((l) =>
            completedLectures.includes(l.id)
          ).length;

          return (
            <div key={section.id} className="bg-gray-50/50">
              {/* Header Accordion Row */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3.5 flex items-start justify-between gap-3 text-left hover:bg-gray-100 transition focus:outline-none cursor-pointer"
              >
                <div className="flex-1 pr-2">
                  <span className="font-bold text-gray-900 text-xs block mb-0.5">
                    {section.weekName}: {section.title}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {completedInSection}/{(section.lectures || []).length} bài xong • {section.totalDuration || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap">
                  <span className="text-[10px] text-gray-500 font-mono">
                    {(section.lectures || []).length} bài • {section.totalDuration}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-500 shrink-0" />
                  )}
                </div>
              </button>

              {/* Lecture list items under expanded week */}
              {isExpanded && (
                <div className="bg-white border-b border-gray-100 divide-y divide-gray-100 transition-all duration-300">
                  {(section.lectures || []).map((lecture) => {
                    const isActive = activeLectureId === lecture.id;
                    const isCompleted = completedLectures.includes(lecture.id);

                    // Get lesson type badge color
                    const getBadgeStyle = () => {
                      switch (lecture.type) {
                        case "pre_class":
                          return "bg-amber-50 text-amber-800 border-amber-200";
                        case "in_class":
                          return "bg-emerald-50 text-emerald-800 border-emerald-250";
                        case "post_class":
                          return "bg-indigo-50 text-indigo-800 border-indigo-200";
                        default:
                          return "bg-gray-50 text-gray-800";
                      }
                    };

                    const getBadgeLabel = () => {
                      switch (lecture.type) {
                        case "pre_class":
                          return "Lý Thuyết Trước Lớp";
                        case "in_class":
                          return "Thực Hành Trên Lớp";
                        case "post_class":
                          return "Thử Thách Sau Lớp";
                        default:
                          return "Bài học";
                      }
                    };

                    return (
                      <div
                        key={lecture.id}
                        className={`group flex items-start gap-3 p-3 text-left transition transition-colors ${
                          isActive
                            ? "bg-emerald-50/50 border-l-4 border-emerald-700 pl-2"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Checkbox button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(lecture.id);
                          }}
                          className="mt-1 text-gray-400 hover:text-emerald-700 transition focus:outline-none shrink-0 cursor-pointer"
                          title={isCompleted ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
                        >
                          {isCompleted ? (
                            <div className="w-4 h-4 rounded-xs bg-emerald-700 text-white flex items-center justify-center">
                              <Check size={11} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-4 h-4 border border-gray-300 rounded-xs group-hover:border-emerald-700 transition" />
                          )}
                        </button>

                        {/* Text and Unit details clickable */}
                        <div
                          onClick={() => onLectureSelect(lecture, section.id)}
                          className="flex-1 cursor-pointer min-w-0"
                        >
                          <span
                            className={`text-xs font-semibold block leading-snug mb-1 ${
                              isActive ? "text-emerald-950 font-bold" : "text-gray-800"
                            }`}
                          >
                            {lecture.title}
                          </span>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm border ${getBadgeStyle()}`}>
                              {getBadgeLabel()}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                              {lecture.videoUrl ? <PlayCircle size={10} /> : <FileText size={10} />}
                              {lecture.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
