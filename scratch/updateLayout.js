import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/pages/DashbroadStudent/DashbroadStudent.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add rightTab state
content = content.replace(
  'const [sidebarOpen, setSidebarOpen] = useState(false);',
  'const [sidebarOpen, setSidebarOpen] = useState(false);\n  const [rightTab, setRightTab] = useState("qa");'
);

// 2. Import StudentFeedback if not exists, remove AskTeacherWidget
if (!content.includes('import StudentFeedback from "./StudentFeedback";')) {
  content = content.replace(
    'import SidebarSyllabus from "./lms/SidebarSyllabus";',
    'import SidebarSyllabus from "./lms/SidebarSyllabus";\nimport StudentFeedback from "./StudentFeedback";'
  );
}
content = content.replace(/import AskTeacherWidget from ".*?";\n?/g, '');

// 3. Update the layout
const oldLayoutRegex = /<div className="flex flex-col gap-6 lg:h-auto">[\s\S]*?<\/div>\s*<\/div>\s*\)\s*\)\}/;
const newLayout = `<div className="flex flex-col gap-4 lg:h-[calc(100vh-140px)]">
                  {/* Tabs */}
                  <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm shrink-0">
                    <button
                      onClick={() => setRightTab("qa")}
                      className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer \${rightTab === "qa" ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:bg-gray-50"}\`}
                    >
                      💬 Thảo luận
                    </button>
                    <button
                      onClick={() => setRightTab("syllabus")}
                      className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer \${rightTab === "syllabus" ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:bg-gray-50"}\`}
                    >
                      📑 Nội dung bài học
                    </button>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                      {rightTab === "syllabus" ? (
                        syllabus && syllabus.length > 0 && activeLecture ? (
                          <SidebarSyllabus
                            sections={syllabus}
                            activeLectureId={activeLecture.id}
                            completedLectures={progress.completedLectures}
                            onLectureSelect={(lecture, sectionId) => {
                              setActiveLecture(lecture);
                              setActiveSectionId(sectionId);
                            }}
                            onToggleComplete={handleToggleComplete}
                          />
                        ) : null
                      ) : (
                        <div className="h-full bg-gray-50/30">
                          <StudentFeedback cls={selectedCourse} activeLecture={activeLecture} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}`;

content = content.replace(oldLayoutRegex, newLayout);

// 4. Update the layout grids (but carefully, using exact strings)
content = content.replace(/className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full min-h-\[500px\]"/g, 'className="flex-1 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-stretch w-full min-h-[500px]"');
content = content.replace(/className="lg:col-span-2 flex flex-col h-full gap-4"/g, 'className="flex flex-col h-full gap-4"');

fs.writeFileSync(filePath, content);
console.log("Updated layout successfully!");
