import { useState } from 'react';

export default function AddExamModal({ open, date, subjects, onSave, onClose, initialValues }) {
  const [subject, setSubject]   = useState(initialValues?.subject ?? '');
  const [examDate, setExamDate] = useState(initialValues?.date ?? date ?? '');
  const [range, setRange]       = useState(initialValues?.range ?? '');

  if (!open) return null;

  const isEdit = !!initialValues;

  function handleSubmit(e) {
    e.preventDefault();
    if (!subject || !examDate) return;
    onSave({ subject, date: examDate, range });
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4 text-gray-800">
          {isEdit ? '📝 시험 일정 수정' : '📝 시험 일정 추가'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            과목
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="">선택하세요</option>
              {subjects.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            날짜
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              required
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            시험 범위
            <textarea
              value={range}
              onChange={e => setRange(e.target.value)}
              rows={3}
              placeholder="선택 입력"
              className="border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </label>

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-700 transition-colors"
            >
              {isEdit ? '저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
