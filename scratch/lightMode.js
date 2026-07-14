import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/pages/DashbroadStudent/lms/LessonPlayer.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = {
  'bg-slate-950': 'bg-gray-50',
  'bg-slate-900': 'bg-white',
  'border-slate-800': 'border-gray-200',
  'text-slate-300': 'text-gray-600',
  'text-slate-400': 'text-gray-500',
  'text-slate-500': 'text-gray-400',
  'text-white': 'text-gray-900',
  'text-slate-200': 'text-gray-800',
  'text-slate-100': 'text-gray-800',
  'bg-slate-800': 'bg-gray-100',
  'hover:bg-slate-800': 'hover:bg-gray-100',
  'from-slate-900': 'from-white',
  'to-slate-950': 'to-gray-50'
};

for (const [oldClass, newClass] of Object.entries(replacements)) {
  const regex = new RegExp(oldClass, 'g');
  content = content.replace(regex, newClass);
}

// Keep the VideoPlayer loading overlay and actual video frame black/dark
// Restore some specific text-white that should remain white (e.g., buttons, tags, video player texts)
content = content.replace(/text-gray-900(.*?)Toàn màn hình/g, 'text-white$1Toàn màn hình');
content = content.replace(/text-gray-900 font-bold px-4/g, 'text-white font-bold px-4');
content = content.replace(/text-gray-900 font-bold px-6 py-2.5/g, 'text-white font-bold px-6 py-2.5');
content = content.replace(/text-gray-900 text-sm font-bold px-5 py-2/g, 'text-white text-sm font-bold px-5 py-2');
content = content.replace(/text-gray-900 p-1.5 rounded/g, 'text-white p-1.5 rounded');
content = content.replace(/text-gray-900 text-\[9px\] text-white\/30/g, 'text-white text-[9px] text-white/30');
content = content.replace(/text-gray-[0-9]+ font-bold text-xs px-5 py-2.5/g, 'text-white font-bold text-xs px-5 py-2.5');

// For video error state
content = content.replace(/text-gray-900 font-bold">Không thể tải video/g, 'text-white font-bold">Không thể tải video');

fs.writeFileSync(filePath, content);
console.log('Theme changed to light mode!');
