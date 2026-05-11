import { useState } from 'react';

const DIFFICULTIES = [
  { value: 'easy', label: '쉬움' },
  { value: 'normal', label: '보통' },
  { value: 'hard', label: '어려움' },
];

export default function AddStudyModal({ open, date, subjects, onSave, onClose, initialValues }) {
  const isEdit = !!initialValues?.id;
  const initMins = initialValues?.minutes ?? 60;
  const [subject, setSubject] = useState(initialValues?.subject ?? '');
  const [difficulty, setDifficulty] = useState(initialValues?.difficulty ?? 'normal');
  const [hours, setHours] = useState(Math.floor(initMins / 60));
  const [mins, setMins] = useState(initMins % 60);
  const [memo, setMemo] = useState(initialValues?.memo ?? '');

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!subject) return;
    const totalMinutes = Number(hours) * 60 + Number(mins);
    if (totalMinutes < 1) return;
    onSave({ subject, difficulty, minutes: totalMinutes, memo });
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-rpg-card rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-rpg-border"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4 text-rpg-text">
          {date} 공부 {isEdit ? '수정' : '추가'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-rpg-muted">
            과목
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              className="border border-rpg-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rpg-purple"
            >
              <option value="">선택하세요</option>
              {subjects.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-rpg-muted">
            난이도
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="border border-rpg-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rpg-purple"
            >
              {DIFFICULTIES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-rpg-muted">공부 시간</span>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="number"
                  value={hours}
                  onChange={e => setHours(Math.max(0, Math.min(23, Number(e.target.value))))}
                  min={0}
                  max={23}
                  className="w-full border border-rpg-border rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-rpg-purple"
                />
                <span className="text-sm text-rpg-muted flex-shrink-0">시간</span>
              </div>
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="number"
                  value={mins}
                  onChange={e => setMins(Math.max(0, Math.min(59, Number(e.target.value))))}
                  min={0}
                  max={59}
                  className="w-full border border-rpg-border rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-rpg-purple"
                />
                <span className="text-sm text-rpg-muted flex-shrink-0">분</span>
              </div>
            </div>
            {Number(hours) * 60 + Number(mins) < 1 && (
              <p className="text-xs text-rpg-red">최소 1분 이상 입력하세요</p>
            )}
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-rpg-muted">
            메모
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={3}
              placeholder="선택 입력"
              className="border border-rpg-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-rpg-purple"
            />
          </label>

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl border border-rpg-border text-rpg-text font-medium hover:bg-rpg-border transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] rounded-xl bg-rpg-purple text-white font-medium hover:bg-purple-700 transition-colors"
            >
              {isEdit ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
