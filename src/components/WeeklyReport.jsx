import { useMemo } from 'react';
import { useStudies } from '../hooks/useStudies';

function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMondayStr() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return localDateStr(d);
}

function calcStreak(completedStudies) {
  const dateSet = new Set(completedStudies.map(s => s.date));
  if (dateSet.size === 0) return 0;

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!dateSet.has(localDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (dateSet.has(localDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function StatCard({ value, label, sub, valueClass = 'text-indigo-600' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-0.5">
      <p className={`text-3xl font-bold truncate ${valueClass}`}>{value}</p>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

export default function WeeklyReport() {
  const studies = useStudies();

  const stats = useMemo(() => {
    if (!studies) return null;

    const monday = getMondayStr();
    const today  = localDateStr();

    const weekAll  = studies.filter(s => s.date >= monday && s.date <= today);
    const weekDone = weekAll.filter(s => s.status === 'completed');

    if (weekAll.length === 0) return { empty: true };

    const rate = Math.round((weekDone.length / weekAll.length) * 100);
    const streak = calcStreak(studies.filter(s => s.status === 'completed'));

    const minsBySubject = {};
    for (const s of weekDone) {
      minsBySubject[s.subject] = (minsBySubject[s.subject] ?? 0) + s.minutes;
    }
    const entries = Object.entries(minsBySubject);
    const weakestEntry = entries.length > 0
      ? entries.reduce((a, b) => (a[1] <= b[1] ? a : b))
      : null;
    const weakest = weakestEntry
      ? { name: weakestEntry[0], minutes: weakestEntry[1] }
      : null;

    return {
      empty: false,
      completedCount: weekDone.length,
      totalCount:     weekAll.length,
      rate,
      streak,
      weakest,
    };
  }, [studies]);

  if (!stats) return null;

  if (stats.empty) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-sm text-gray-400">
        이번 주 기록이 없습니다
      </div>
    );
  }

  const streakSub =
    stats.streak >= 7 ? '🔥 7일 이상 연속!' :
    stats.streak >= 3 ? `🔥 ${stats.streak}일 연속` :
    stats.streak  > 0 ? `${stats.streak}일 연속` :
                        '연속 기록 없음';

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
        이번 주 리포트
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          value={`${stats.rate}%`}
          label="완료율"
          sub={`${stats.completedCount}/${stats.totalCount}건 완료`}
          valueClass="text-indigo-600"
        />
        <StatCard
          value={stats.streak > 0 ? `${stats.streak}일` : '-'}
          label="연속 학습일"
          sub={streakSub}
          valueClass="text-orange-500"
        />
        <StatCard
          value={stats.weakest ? stats.weakest.name : '-'}
          label="약한 과목"
          sub={stats.weakest ? `⚠️ ${stats.weakest.minutes}분` : '완료 기록 없음'}
          valueClass="text-amber-500"
        />
      </div>
    </div>
  );
}
