const DIFF_MULT = { easy: 0.8, normal: 1.0, hard: 1.5 };
const DAY_CAP = 400;

const LEVELS = [
  { level: 1, name: '수습 공부러',   min: 0,    next: 500  },
  { level: 2, name: '성실한 학습자', min: 500,  next: 1500 },
  { level: 3, name: '시험의 지배자', min: 1500, next: null },
];

// Date 객체 → 'YYYY-MM-DD' (로컬 시간 기준)
function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 완료 기록이 있는 날짜 Set → 현재 연속 일수
function calcStreak(dateSet) {
  if (dateSet.size === 0) return 0;

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // 오늘 기록이 없으면 어제부터 체크
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

export function computeStats(studies) {
  const completed = studies.filter(s => s.completed);

  // 날짜별 날 XP 합산 (난이도 배수 적용, 연속 보너스 전)
  const rawByDate = {};
  for (const s of completed) {
    const raw = s.minutes * (DIFF_MULT[s.difficulty] ?? 1.0);
    rawByDate[s.date] = (rawByDate[s.date] ?? 0) + raw;
  }

  const streak = calcStreak(new Set(Object.keys(rawByDate)));
  const streakMult = streak >= 7 ? 1.2 : streak >= 3 ? 1.1 : 1.0;

  // 날짜별 XP = 날 XP × 연속 보너스, 하루 400 상한
  let totalXP = 0;
  for (const raw of Object.values(rawByDate)) {
    totalXP += Math.min(DAY_CAP, raw * streakMult);
  }
  totalXP = Math.round(totalXP);

  // 오늘 XP
  const todayRaw = rawByDate[localDateStr()] ?? 0;
  const todayXP = Math.round(Math.min(DAY_CAP, todayRaw * streakMult));

  // 레벨
  const levelData = [...LEVELS].reverse().find(l => totalXP >= l.min) ?? LEVELS[0];
  let progress, remaining;
  if (levelData.next === null) {
    progress = 100;
    remaining = 0;
  } else {
    const span = levelData.next - levelData.min;
    progress = Math.min(100, Math.round(((totalXP - levelData.min) / span) * 100));
    remaining = Math.max(0, levelData.next - totalXP);
  }

  // 뱃지
  const badges = {
    firstRecord:   completed.length >= 1,
    streak3:       streak >= 3,
    hardChallenge: completed.filter(s => s.difficulty === 'hard').length >= 5,
    levelMaster:   totalXP >= 1500,
  };

  return { totalXP, todayXP, streak, streakMult, level: levelData.level, levelName: levelData.name, progress, remaining, badges };
}
