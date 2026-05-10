import { useState } from 'react';

const DIFFICULTIES = [
  { value: 'easy', label: '쉬움' },
  { value: 'normal', label: '보통' },
  { value: 'hard', label: '어려움' },
];

export default function AddStudyModal({ open, date, subjects, onSave, onClose, initialValues }) {
  const isEdit = !!initialValues;
  const [subject, setSubject] = useState(initialValues?.subject ?? '');
  const [difficulty, setDifficulty] = useState(initialValues?.difficulty ?? 'normal');
  const [minutes, setMinutes] = useState(initialValues?.minutes ?? 60);
  const [memo, setMemo] = useState(initialValues?.memo ?? '');

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!subject) return;
    onSave({ subject, difficulty, minutes: Number(minutes), memo });
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
          {date} 공부 {isEdit ? '수정' : '추가'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            과목
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">선택하세요</option>
              {subjects.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            난이도
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {DIFFICULTIES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            공부 시간 (분)
            <input
              type="number"
              value={minutes}
              onChange={e => setMinutes(e.target.value)}
              min={1}
              max={720}
              required
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            메모
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={3}
              placeholder="선택 입력"
              className="border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              className="flex-1 min-h-[44px] rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
            >
              {isEdit ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
