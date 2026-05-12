import { useMemo, useState } from 'react';
import { useExams, useSubjects } from '../hooks/useStudies';
import { db } from '../db/db';

function getDday(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(dateStr);
  return Math.round((examDate - today) / (1000 * 60 * 60 * 24));
}

const MODAL_CLOSED = { open: false, examId: null, subject: '', range: '' };

export default function DdayBanner() {
  const exams    = useExams()    ?? [];
  const subjects = useSubjects() ?? [];

  const [modal, setModal] = useState(MODAL_CLOSED);

  const upcoming = useMemo(() =>
    exams
      .map(e => ({ ...e, dday: getDday(e.date) }))
      .filter(e => e.dday >= 0)
      .sort((a, b) => a.dday - b.dday),
    [exams],
  );

  if (upcoming.length === 0) return null;

  async function handleRangeSave() {
    await db.exams.update(modal.examId, { range: modal.range });
    setModal(MODAL_CLOSED);
  }

  return (
    <>
      <div className="mx-4 mt-4 mb-1 flex gap-2 flex-wrap">
        {upcoming.map(exam => {
          const color = subjects.find(s => s.name === exam.subject)?.color ?? '#6B7280';
          return (
            <div
              key={exam.id}
              style={{ backgroundColor: color }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white border-2 border-rpg-border cursor-pointer active:opacity-80"
              onClick={() => setModal({ open: true, examId: exam.id, subject: exam.subject, range: exam.range ?? '' })}
            >
              <span>📝 {exam.subject}</span>
              <span className="font-bold text-yellow-300">
                {exam.dday === 0 ? 'D-Day' : `D-${exam.dday}`}
              </span>
            </div>
          );
        })}
      </div>

      {modal.open && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setModal(MODAL_CLOSED)}
        >
          <div
            className="bg-rpg-card rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-rpg-border"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4 text-rpg-text">📝 {modal.subject} 시험 범위</h2>
            <textarea
              value={modal.range}
              onChange={e => setModal(prev => ({ ...prev, range: e.target.value }))}
              rows={5}
              placeholder="시험 범위를 입력하세요"
              className="w-full border border-rpg-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-rpg-purple text-sm"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setModal(MODAL_CLOSED)}
                className="flex-1 min-h-[44px] rounded-xl border border-rpg-border text-rpg-text font-medium hover:bg-rpg-border transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleRangeSave}
                className="flex-1 min-h-[44px] rounded-xl bg-rpg-gold text-gray-900 font-medium hover:opacity-90 transition-opacity"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
