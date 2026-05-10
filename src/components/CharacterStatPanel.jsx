import { useStudies, useQuests, useCharacter } from '../hooks/useStudies';
import { computeStats } from '../utils/xp';

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

export default function CharacterStatPanel() {
  const studies    = useStudies()    ?? [];
  const quests     = useQuests()     ?? [];
  const characters = useCharacter()  ?? [];

  if (studies === undefined || quests === undefined || characters === undefined) return null;

  const character = characters[0] ?? null;
  const { totalXP, streak } = computeStats(studies, character?.job ?? null);

  // 체력: 완료된 공부 기록의 하루 평균 공부시간(분)
  const completed = studies.filter(s => s.status === 'completed');
  const minutesByDate = {};
  for (const s of completed) {
    minutesByDate[s.date] = (minutesByDate[s.date] ?? 0) + s.minutes;
  }
  const studyDays   = Object.keys(minutesByDate).length;
  const totalMins   = Object.values(minutesByDate).reduce((a, b) => a + b, 0);
  const avgMinutes  = studyDays > 0 ? Math.round(totalMins / studyDays) : 0;

  // 도전력: difficulty='hard' 완료 개수
  const hardCount = completed.filter(s => s.difficulty === 'hard').length;

  // 성실함: 완료된 퀘스트 비율
  const totalQuests     = quests.length;
  const completedQuests = quests.filter(q => q.status === 'completed').length;
  const diligencePct    = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

  const STATS = [
    {
      icon:    '💪',
      name:    '체력',
      value:   avgMinutes,
      grade:   grade(avgMinutes, [31, 61, 121, 181]),
      display: `${avgMinutes}분/일`,
    },
    {
      icon:    '🧠',
      name:    '지능',
      value:   totalXP,
      grade:   grade(totalXP, [300, 700, 1100, 1500]),
      display: `${totalXP.toLocaleString()} XP`,
    },
    {
      icon:    '🎯',
      name:    '집중력',
      value:   streak,
      grade:   grade(streak, [1, 3, 7, 14]),
      display: `${streak}일`,
    },
    {
      icon:    '⚡',
      name:    '도전력',
      value:   hardCount,
      grade:   grade(hardCount, [1, 5, 10, 20]),
      display: `${hardCount}개`,
    },
    {
      icon:    '🍀',
      name:    '성실함',
      value:   diligencePct,
      grade:   grade(diligencePct, [20, 50, 75, 90]),
      display: `${diligencePct}%`,
    },
  ];

  return (
    <div className="mx-4 mb-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-700">캐릭터 스탯</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {STATS.map(stat => (
            <div key={stat.name} className="flex items-center gap-3 px-5 py-3">
              <span className="text-xl w-7 text-center">{stat.icon}</span>
              <span className="text-sm font-medium text-gray-700 w-14">{stat.name}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${GRADE_CLS[stat.grade]}`}>
                {stat.grade}
              </span>
              <span className="text-sm text-gray-500 ml-auto">{stat.display}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
