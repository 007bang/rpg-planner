import { useState, useRef, useEffect } from 'react';
import { useStudies, useQuests, useCharacter } from '../hooks/useStudies';
import { computeStats } from '../utils/xp';

const GRADE_ORDER = { D: 0, C: 1, B: 2, A: 3, S: 4 };

function grade(value, [c, b, a, s]) {
  if (value >= s) return 'S';
  if (value >= a) return 'A';
  if (value >= b) return 'B';
  if (value >= c) return 'C';
  return 'D';
}

const GRADE_CLS = {
  S: 'bg-yellow-100 text-yellow-700',
  A: 'bg-purple-100 text-purple-700',
  B: 'bg-blue-100   text-blue-700',
  C: 'bg-green-100  text-green-700',
  D: 'bg-gray-100   text-gray-500',
};

const GRADE_BADGE = {
  S: 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40',
  A: 'bg-purple-400/20 text-purple-300 border border-purple-400/40',
  B: 'bg-blue-400/20   text-blue-300   border border-blue-400/40',
  C: 'bg-green-400/20  text-green-300  border border-green-400/40',
  D: 'bg-gray-400/20   text-gray-400   border border-gray-400/40',
};

export default function CharacterStatPanel() {
  const studies    = useStudies();
  const quests     = useQuests();
  const characters = useCharacter();

  // ── 모든 훅은 early return 전에 선언 ──────────────
  const [popupQueue,    setPopupQueue]    = useState([]);
  const [currentPopup, setCurrentPopup]  = useState(null);
  const prevGradesRef = useRef(null);
  const timerRef      = useRef(null);

  // 데이터가 없을 때도 안전하게 계산
  const character   = characters?.[0] ?? null;
  const safeStudies = studies  ?? [];
  const safeQuests  = quests   ?? [];

  const { totalXP, streak } = computeStats(safeStudies, safeQuests, character?.job ?? null);

  const completed = safeStudies.filter(s => s.status === 'completed');
  const minutesByDate = {};
  for (const s of completed) {
    minutesByDate[s.date] = (minutesByDate[s.date] ?? 0) + s.minutes;
  }
  const studyDays   = Object.keys(minutesByDate).length;
  const totalMins   = Object.values(minutesByDate).reduce((a, b) => a + b, 0);
  const avgMinutes  = studyDays > 0 ? Math.round(totalMins / studyDays) : 0;
  const hardCount   = completed.filter(s => s.difficulty === 'hard').length;

  const totalQuests     = safeQuests.length;
  const completedQuests = safeQuests.filter(q => q.status === 'completed').length;
  const diligencePct    = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

  const STATS = [
    { icon: '💪', name: '체력',   grade: grade(avgMinutes,   [31, 61, 121, 181]),    display: `${avgMinutes}분/일`              },
    { icon: '🧠', name: '지능',   grade: grade(totalXP,      [300, 700, 1100, 1500]), display: `${totalXP.toLocaleString()} XP` },
    { icon: '🎯', name: '집중력', grade: grade(streak,       [1, 3, 7, 14]),          display: `${streak}일`                    },
    { icon: '⚡', name: '도전력', grade: grade(hardCount,    [1, 5, 10, 20]),         display: `${hardCount}개`                  },
    { icon: '🍀', name: '성실함', grade: grade(diligencePct, [20, 50, 75, 90]),       display: `${diligencePct}%`                },
  ];

  // 데이터 로드 전엔 빈 문자열 → useEffect 내에서 무시
  const dataReady = studies !== undefined && quests !== undefined && characters !== undefined;
  const gradeKey  = dataReady ? STATS.map(s => `${s.name}:${s.grade}`).join(',') : '';

  useEffect(() => {
    if (!gradeKey) return;

    const currentGrades = Object.fromEntries(STATS.map(s => [s.name, s.grade]));

    if (prevGradesRef.current !== null) {
      const upgrades = STATS
        .filter(s => {
          const prev = prevGradesRef.current[s.name];
          return prev !== undefined && GRADE_ORDER[s.grade] > GRADE_ORDER[prev];
        })
        .map(s => ({ icon: s.icon, name: s.name, prevGrade: prevGradesRef.current[s.name], newGrade: s.grade }));

      if (upgrades.length > 0) {
        setPopupQueue(prev => [...prev, ...upgrades]);
      }
    }

    prevGradesRef.current = currentGrades;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeKey]);

  useEffect(() => {
    if (currentPopup !== null || popupQueue.length === 0) return;
    const [next, ...rest] = popupQueue;
    setCurrentPopup(next);
    setPopupQueue(rest);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCurrentPopup(null), 3000);
  }, [currentPopup, popupQueue]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // ── early return은 훅 선언 이후 ──────────────────
  if (!dataReady) return null;

  function closePopup() {
    clearTimeout(timerRef.current);
    setCurrentPopup(null);
  }

  return (
    <>
      {currentPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl p-6 w-full max-w-xs mx-4 shadow-2xl text-center"
            style={{ animation: 'levelup-popup 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}
          >
            <div className="text-5xl mb-2">{currentPopup.icon}</div>
            <h2 className="text-xl font-bold mb-1">{currentPopup.name} 등급 상승!</h2>
            <p className="text-indigo-200 text-sm mb-4">스탯이 강화되었습니다</p>

            <div className="flex items-center justify-center gap-3 mb-4">
              <span className={`text-lg font-bold px-3 py-1 rounded-xl ${GRADE_BADGE[currentPopup.prevGrade]}`}>
                {currentPopup.prevGrade}등급
              </span>
              <span className="text-indigo-300 font-bold text-xl">→</span>
              <span className={`text-lg font-bold px-3 py-1 rounded-xl ${GRADE_BADGE[currentPopup.newGrade]}`}>
                {currentPopup.newGrade}등급
              </span>
            </div>

            {popupQueue.length > 0 && (
              <p className="text-xs text-indigo-300 mb-3">+{popupQueue.length}개 추가 상승 대기 중</p>
            )}

            <div className="h-1 bg-white/20 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-white/50 rounded-full"
                style={{ animation: 'countdown 3s linear forwards' }}
              />
            </div>

            <button
              onClick={closePopup}
              className="w-full py-2.5 rounded-xl bg-white/20 hover:bg-white/30 font-medium transition-colors text-sm"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <div className="mx-4 mb-4">
        <div className="bg-rpg-card rounded-2xl border border-rpg-border shadow-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-rpg-border">
            <h3 className="text-sm font-bold text-rpg-text">캐릭터 스탯</h3>
          </div>
          <div className="divide-y divide-rpg-border/40">
            {STATS.map(stat => (
              <div key={stat.name} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xl w-7 text-center">{stat.icon}</span>
                <span className="text-sm font-medium text-rpg-text w-14">{stat.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${GRADE_CLS[stat.grade]}`}>
                  {stat.grade}
                </span>
                <span className="text-sm text-rpg-muted ml-auto">{stat.display}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
