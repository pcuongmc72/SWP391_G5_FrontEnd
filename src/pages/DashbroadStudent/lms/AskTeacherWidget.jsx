import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle, Send } from 'lucide-react';
import { createStudentFeedback } from '../../../services/studentService';

export default function AskTeacherWidget({ classId, activeLecture }) {
  const [askInput, setAskInput] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askSent, setAskSent] = useState(false);
  const [askError, setAskError] = useState('');

  // Bug #2 fix: reset form khi chuyển bài học
  useEffect(() => {
    setAskInput('');
    setAskSent(false);
    setAskError('');
  }, [activeLecture?.id]);

  const handleAskTeacher = async () => {
    // Bug #3 fix: kiểm tra classId trước, riêng biệt
    if (!classId) {
      setAskError('Lỗi: Không xác định được lớp học. Vui lòng tải lại trang.');
      return;
    }
    if (!askInput.trim()) return;
    setAskLoading(true);
    setAskError('');
    try {
      const payload = {
        title: `Hỏi về: ${activeLecture?.title || 'Bài học'}`,
        message: askInput.trim(),
        materialId: activeLecture?.id || null,
      };
      await createStudentFeedback(classId, payload);
      setAskSent(true);
      setAskInput('');
    } catch (e) {
      setAskError(e.message || 'Không thể gửi câu hỏi. Vui lòng thử lại.');
    } finally {
      setAskLoading(false);
    }
  };

  if (!activeLecture) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm mt-6">
      <div className="border-b border-zinc-800 pb-3 mb-4">
        <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <HelpCircle size={18} /> Hỏi Giảng viên
        </h4>
        <p className="text-xs text-slate-400 mt-1.5 leading-snug">
          Gửi thắc mắc của bạn về <strong className="text-white">{activeLecture?.title}</strong>. Giảng viên sẽ phản hồi sớm nhất có thể!
        </p>
      </div>

      {askSent ? (
        <div className="bg-emerald-900/40 border border-emerald-700 rounded-xl p-5 flex flex-col items-center gap-2 text-center">
          <CheckCircle size={36} className="text-emerald-400 mb-1" />
          <p className="text-sm font-bold text-emerald-300">Câu hỏi đã được gửi thành công!</p>
          <p className="text-[11px] text-slate-400">Bạn có thể xem phản hồi trong mục <strong>Hỏi đáp & Hỗ trợ</strong> của lớp học.</p>
          <button
            onClick={() => setAskSent(false)}
            className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 hover:underline font-medium cursor-pointer"
          >
            Gửi câu hỏi khác
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={askInput}
            onChange={e => setAskInput(e.target.value)}
            placeholder="Nhập nội dung thắc mắc của bạn về bài học này..."
            rows={5}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500 transition"
          />
          {askError && <p className="text-xs text-red-400">{askError}</p>}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAskTeacher}
              disabled={askLoading || !askInput.trim()}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={14} />
              {askLoading ? 'Đang gửi...' : 'Gửi câu hỏi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
