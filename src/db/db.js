import Dexie from 'dexie';

export const db = new Dexie('rpg-planner');

db.version(1).stores({
  studies: '++id, eventId, date, subject, difficulty, minutes, completed',
  subjects: '++id, name, color',
});

db.version(2).stores({
  studies: '++id, eventId, date, subject, difficulty, minutes, status',
  subjects: '++id, name, color',
}).upgrade(tx =>
  tx.table('studies').toCollection().modify(study => {
    study.status = study.completed ? 'completed' : 'pending';
    delete study.completed;
  })
);

db.version(3).stores({
  studies: '++id, eventId, date, subject, difficulty, minutes, status',
  subjects: '++id, name, color',
  exams: '++id, date, subject, range',
});

db.version(4).stores({
  studies:    '++id, eventId, date, subject, difficulty, minutes, status',
  subjects:   '++id, name, color',
  exams:      '++id, date, subject, range',
  characters: '++id, nickname, job, coin',
});

const DEFAULT_SUBJECTS = [
  { name: '수학', color: '#3B82F6' },
  { name: '영어', color: '#10B981' },
  { name: '국어', color: '#8B5CF6' },
  { name: '과학', color: '#F97316' },
];

export async function initDB() {
  const count = await db.subjects.count();
  if (count === 0) {
    await db.subjects.bulkAdd(DEFAULT_SUBJECTS);
  }
}
