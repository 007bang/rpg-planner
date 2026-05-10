import { useMemo } from 'react';
import { useExams } from '../hooks/useStudies';

function getDday(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(dateStr);
  return Math.round((examDate - today) / (1000 * 60 * 60 * 24));
}

export default function DdayBanner() {
  const exams = useExams() ?? [];

  const upcoming = useMemo(() =>
    exams
      .map(e => ({ ...e, dday: getDday(e.date) }))
      .filter(e => e.dday >= 0)
      .sort((a, b) => a.dday - b.dday),
    [exams],
  );

  if (upcoming.length === 0) return null;

  return (
    <div className="mx-4 mb-1 flex gap-2 flex-wrap">
      {upcoming.map(exam => {
        const urgent = exam.dday <= 3;
        return (
          <div
            key={exam.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
              urgent ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
            }`}
          >
            <span>📝 {exam.subject}</span>
            <span className={`font-bold ${urgent ? 'text-yellow-300' : 'text-yellow-400'}`}>
              {exam.dday === 0 ? 'D-Day' : `D-${exam.dday}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
