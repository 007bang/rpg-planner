export const JOB_MULT = {
  warrior: { hard: 1.8, normal: 1.0, easy: 0.7 },
  mage:    { hard: 1.3, normal: 1.2, easy: 1.0 },
  archer:  { hard: 1.5, normal: 1.1, easy: 0.9 },
};
export const DEFAULT_MULT = { hard: 1.5, normal: 1.0, easy: 0.8 };

const DAY_CAP = 400;

const LEVELS = [
  { level: 1,  name: '견습 모험가',   min: 0,     next: 200   },
  { level: 2,  name: '초보 학습자',   min: 200,   next: 500   },
  { level: 3,  name: '성실한 학습자', min: 500,   next: 1000  },
  { level: 4,  name: '숙련된 탐구자', min: 1000,  next: 1500  },
  { level: 5,  name: '지식의 수호자', min: 1500,  next: 2500  },
  { level: 6,  name: '현명한 전략가', min: 2500,  next: 4000  },
  { level: 7,  name: '전설의 학자',   min: 4000,  next: 6000  },
  { level: 8,  name: '마스터',        min: 6000,  next: 9000  },
  { level: 9,  name: '그랜드마스터',  min: 9000,  next: 12000 },
  { level: 10, name: '시험의 전설',   min: 12000, next: null  },
];

export const ACHIEVEMENTS = [
  // 학습
  { id: 'firstRecord',   category: '학습',   icon: '🗡️', name: '첫 발걸음',      desc: '첫 공부 기록 완료',        xp: 50   },
  { id: 'hardChallenge', category: '학습',   icon: '⚔️', name: '불굴의 의지',     desc: '어려움 난이도 5회 완료',   xp: 100  },
  { id: 'studyAddict',   category: '학습',   icon: '📚', name: '학습 중독',        desc: '총 공부시간 100시간 이상', xp: 500  },
  { id: 'allNighter',    category: '학습',   icon: '🌙', name: '밤샘 공부',        desc: '하루 5시간 이상 공부',     xp: 200  },
  // 연속
  { id: 'streak3',       category: '연속',   icon: '🔥', name: '3일 연속',         desc: '3일 연속 학습',            xp: 100  },
  { id: 'streak7',       category: '연속',   icon: '🌟', name: '7일 연속',         desc: '7일 연속 학습',            xp: 300  },
  { id: 'streak30',      category: '연속',   icon: '🏅', name: '한 달 전사',       desc: '30일 연속 학습',           xp: 1000 },
  // 퀘스트
  { id: 'questBeginner', category: '퀘스트', icon: '📜', name: '퀘스트 입문',     desc: '퀘스트 1개 완료',          xp: 50   },
  { id: 'questMaster',   category: '퀘스트', icon: '🎯', name: '퀘스트 마스터',   desc: '퀘스트 10개 완료',         xp: 200  },
  { id: 'questLegend',   category: '퀘스트', icon: '👑', name: '퀘스트 전설',     desc: '퀘스트 50개 완료',         xp: 500  },
  // 레벨
  { id: 'level5',        category: '레벨',   icon: '🌱', name: '성장하는 모험가', desc: 'Lv.5 달성',                xp: 300  },
  { id: 'level10',       category: '레벨',   icon: '🏆', name: '전설의 시작',     desc: 'Lv.10 달성',               xp: 1000 },
];

function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 현재 연속 streak (UI 표시용)
function calcStreak(dateSet) {
  if (dateSet.size === 0) return 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!dateSet.has(localDateStr(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (dateSet.has(localDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// 특정 날짜 기준 그 날까지의 연속 streak
function calcStreakOnDate(dateSet, targetDateStr) {
  const [y, m, d] = targetDateStr.split('-').map(Number);
  const cursor = new Date(y, m - 1, d);
  cursor.setHours(0, 0, 0, 0);
  let streak = 0;
  while (dateSet.has(localDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function multFromStreak(streak) {
  return streak >= 7 ? 1.2 : streak >= 3 ? 1.1 : 1.0;
}

function levelFromXP(xp) {
  return ([...LEVELS].reverse().find(l => xp >= l.min) ?? LEVELS[0]);
}

// savedAchievementIds: DB에 저장된 업적 ID 배열 — 이미 달성된 업적 XP를 보존하기 위해 사용
export function computeStats(studies, quests = [], job = null, savedAchievementIds = []) {
  const DIFF_MULT = (job && JOB_MULT[job]) ? JOB_MULT[job] : DEFAULT_MULT;

  const completed = studies.filter(s => s.status === 'completed');

  const rawByDate  = {};
  const minsByDate = {};
  for (const s of completed) {
    const raw = s.minutes * (DIFF_MULT[s.difficulty] ?? 1.0);
    rawByDate[s.date]  = (rawByDate[s.date]  ?? 0) + raw;
    minsByDate[s.date] = (minsByDate[s.date] ?? 0) + s.minutes;
  }

  const dateSet = new Set(Object.keys(rawByDate));
  const streak  = calcStreak(dateSet);

  // 각 날짜에 그 날의 streak을 적용 → streak이 끊겨도 과거 XP 불변
  let studyXP = 0;
  for (const [date, raw] of Object.entries(rawByDate)) {
    const dayStreak = calcStreakOnDate(dateSet, date);
    studyXP += Math.min(DAY_CAP, raw * multFromStreak(dayStreak));
  }
  studyXP = Math.round(studyXP);

  const todayStr    = localDateStr();
  const todayRaw    = rawByDate[todayStr] ?? 0;
  const todayStreak = calcStreakOnDate(dateSet, todayStr);
  const todayXP     = Math.round(Math.min(DAY_CAP, todayRaw * multFromStreak(todayStreak)));

  // 업적 달성 여부: 현재 조건 충족 OR DB에 이미 저장됨 (저장된 업적 XP는 취소되지 않음)
  const savedSet        = new Set(savedAchievementIds);
  const completedQuests = quests.filter(q => q.status === 'completed');
  const totalMins       = Object.values(minsByDate).reduce((a, b) => a + b, 0);
  const maxDayMins      = Object.values(minsByDate).reduce((a, b) => Math.max(a, b), 0);
  const hardCount       = completed.filter(s => s.difficulty === 'hard').length;

  const achieved = {
    firstRecord:   completed.length >= 1        || savedSet.has('firstRecord'),
    hardChallenge: hardCount >= 5               || savedSet.has('hardChallenge'),
    studyAddict:   totalMins >= 6000            || savedSet.has('studyAddict'),
    allNighter:    maxDayMins >= 300            || savedSet.has('allNighter'),
    streak3:       streak >= 3                  || savedSet.has('streak3'),
    streak7:       streak >= 7                  || savedSet.has('streak7'),
    streak30:      streak >= 30                 || savedSet.has('streak30'),
    questBeginner: completedQuests.length >= 1  || savedSet.has('questBeginner'),
    questMaster:   completedQuests.length >= 10 || savedSet.has('questMaster'),
    questLegend:   completedQuests.length >= 50 || savedSet.has('questLegend'),
    level5:  false,
    level10: false,
  };

  const nonLevelIds = ACHIEVEMENTS.filter(a => a.id !== 'level5' && a.id !== 'level10').map(a => a.id);
  let achXP = nonLevelIds.reduce(
    (sum, id) => sum + (achieved[id] ? (ACHIEVEMENTS.find(a => a.id === id)?.xp ?? 0) : 0),
    0,
  );

  const intermLevel = levelFromXP(studyXP + achXP).level;
  achieved.level5  = intermLevel >= 5  || savedSet.has('level5');
  achieved.level10 = intermLevel >= 10 || savedSet.has('level10');
  if (achieved.level5)  achXP += ACHIEVEMENTS.find(a => a.id === 'level5').xp;
  if (achieved.level10) achXP += ACHIEVEMENTS.find(a => a.id === 'level10').xp;

  const totalXP   = studyXP + achXP;
  const levelData = levelFromXP(totalXP);

  let progress, remaining;
  if (levelData.next === null) {
    progress  = 100;
    remaining = 0;
  } else {
    const span = levelData.next - levelData.min;
    progress  = Math.min(100, Math.round(((totalXP - levelData.min) / span) * 100));
    remaining = Math.max(0, levelData.next - totalXP);
  }

  return { totalXP, todayXP, streak, level: levelData.level, levelName: levelData.name, progress, remaining, achievements: achieved };
}
