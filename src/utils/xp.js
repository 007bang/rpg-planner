const JOB_MULT = {
  warrior: { hard: 1.8, normal: 1.0, easy: 0.7 },
  mage:    { hard: 1.3, normal: 1.2, easy: 1.0 },
  archer:  { hard: 1.5, normal: 1.1, easy: 0.9 },
};
const DEFAULT_MULT = { hard: 1.5, normal: 1.0, easy: 0.8 };

const DAY_CAP = 400;

const LEVELS = [
  { level: 1, name: '수습 공부러',   min: 0,    next: 500  },
  { level: 2, name: '성실한 학습자', min: 500,  next: 1500 },
  { level: 3, name: '시험의 지배자', min: 1500, next: null },
];

function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calcStreak(dateSet) {
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

export function computeStats(studies, job = null) {
  const DIFF_MULT = (job && JOB_MULT[job]) ? JOB_MULT[job] : DEFAULT_MULT;

  const completed = studies.filter(s => s.status === 'completed');

  const rawByDate = {};
  for (const s of completed) {
    const raw = s.minutes * (DIFF_MULT[s.difficulty] ?? 1.0);
    rawByDate[s.date] = (rawByDate[s.date] ?? 0) + raw;
  }

  const streak = calcStreak(new Set(Object.keys(rawByDate)));
  const streakMult = streak >= 7 ? 1.2 : streak >= 3 ? 1.1 : 1.0;

  let totalXP = 0;
  for (const raw of Object.values(rawByDate)) {
    totalXP += Math.min(DAY_CAP, raw * streakMult);
  }
  totalXP = Math.round(totalXP);

  const todayRaw = rawByDate[localDateStr()] ?? 0;
  const todayXP = Math.round(Math.min(DAY_CAP, todayRaw * streakMult));

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

  const badges = {
    firstRecord:   completed.length >= 1,
    streak3:       streak >= 3,
    hardChallenge: completed.filter(s => s.difficulty === 'hard').length >= 5,
    levelMaster:   totalXP >= 1500,
  };

  return { totalXP, todayXP, streak, streakMult, level: levelData.level, levelName: levelData.name, progress, remaining, badges };
}
