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
  { id: 'firstRecord',   category: '학습',   icon: '🗡️', name: '첫 발걸음',       desc: '첫 공부 기록 완료',        xp: 50   },
  { id: 'hardChallenge', category: '학습',   icon: '⚔️', name: '불굴의 의지',      desc: '어려움 난이도 5회 완료',   xp: 100  },
  { id: 'studyAddict',   category: '학습',   icon: '📚', name: '학습 중독',         desc: '총 공부시간 100시간 이상', xp: 500  },
  { id: 'allNighter',    category: '학습',   icon: '🌙', name: '밤샘 공부',         desc: '하루 5시간 이상 공부',     xp: 200  },
  // 연속
  { id: 'streak3',       category: '연속',   icon: '🔥', name: '3일 연속',          desc: '3일 연속 학습',            xp: 100  },
  { id: 'streak7',       category: '연속',   icon: '🌟', name: '7일 연속',          desc: '7일 연속 학습',            xp: 300  },
  { id: 'streak30',      category: '연속',   icon: '🏅', name: '한 달 전사',        desc: '30일 연속 학습',           xp: 1000 },
  // 퀘스트
  { id: 'questBeginner', category: '퀘스트', icon: '📜', name: '퀘스트 입문',      desc: '퀘스트 1개 완료',          xp: 50   },
  { id: 'questMaster',   category: '퀘스트', icon: '🎯', name: '퀘스트 마스터',    desc: '퀘스트 10개 완료',         xp: 200  },
  { id: 'questLegend',   category: '퀘스트', icon: '👑', name: '퀘스트 전설',      desc: '퀘스트 50개 완료',         xp: 500  },
  // 레벨
  { id: 'level5',        category: '레벨',   icon: '🌱', name: '성장하는 모험가',  desc: 'Lv.5 달성',                xp: 300  },
  { id: 'level10',       category: '레벨',   icon: '🏆', name: '전설의 시작',      desc: 'Lv.10 달성',               xp: 1000 },
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

function levelFromXP(xp) {
  return ([...LEVELS].reverse().find(l => xp >= l.min) ?? LEVELS[0]);
}

export function computeStats(studies, quests = [], job = null) {
  const DIFF_MULT = (job && JOB_MULT[job]) ? JOB_MULT[job] : DEFAULT_MULT;

  const completed = studies.filter(s => s.status === 'completed');

  const rawByDate  = {};
  const minsByDate = {};
  for (const s of completed) {
    const raw = s.minutes * (DIFF_MULT[s.difficulty] ?? 1.0);
    rawByDate[s.date]  = (rawByDate[s.date]  ?? 0) + raw;
    minsByDate[s.date] = (minsByDate[s.date] ?? 0) + s.minutes;
  }

  const streak     = calcStreak(new Set(Object.keys(rawByDate)));
  const streakMult = streak >= 7 ? 1.2 : streak >= 3 ? 1.1 : 1.0;

  let studyXP = 0;
  for (const raw of Object.values(rawByDate)) {
    studyXP += Math.min(DAY_CAP, raw * streakMult);
  }
  studyXP = Math.round(studyXP);

  const todayRaw = rawByDate[localDateStr()] ?? 0;
  const todayXP  = Math.round(Math.min(DAY_CAP, todayRaw * streakMult));

  // Non-level achievement checks
  const completedQuests = quests.filter(q => q.status === 'completed');
  const totalMins       = Object.values(minsByDate).reduce((a, b) => a + b, 0);
  const maxDayMins      = Object.values(minsByDate).reduce((a, b) => Math.max(a, b), 0);
  const hardCount       = completed.filter(s => s.difficulty === 'hard').length;

  const achieved = {
    firstRecord:   completed.length >= 1,
    hardChallenge: hardCount >= 5,
    studyAddict:   totalMins >= 6000,
    allNighter:    maxDayMins >= 300,
    streak3:       streak >= 3,
    streak7:       streak >= 7,
    streak30:      streak >= 30,
    questBeginner: completedQuests.length >= 1,
    questMaster:   completedQuests.length >= 10,
    questLegend:   completedQuests.length >= 50,
    level5:        false,
    level10:       false,
  };

  // Non-level achievement XP → intermediate total → level check
  const nonLevelIds = ACHIEVEMENTS.filter(a => a.id !== 'level5' && a.id !== 'level10').map(a => a.id);
  let achXP = nonLevelIds.reduce((sum, id) => sum + (achieved[id] ? (ACHIEVEMENTS.find(a => a.id === id)?.xp ?? 0) : 0), 0);

  const intermLevel = levelFromXP(studyXP + achXP).level;
  achieved.level5  = intermLevel >= 5;
  achieved.level10 = intermLevel >= 10;
  if (achieved.level5)  achXP += ACHIEVEMENTS.find(a => a.id === 'level5').xp;
  if (achieved.level10) achXP += ACHIEVEMENTS.find(a => a.id === 'level10').xp;

  const totalXP = studyXP + achXP;

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

  return { totalXP, todayXP, streak, streakMult, level: levelData.level, levelName: levelData.name, progress, remaining, achievements: achieved };
}
