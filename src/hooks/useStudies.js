import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export function useStudies() {
  return useLiveQuery(() => db.studies.toArray(), []);
}

export function useSubjects() {
  return useLiveQuery(() => db.subjects.toArray(), []);
}

export function useExams() {
  return useLiveQuery(() => db.exams.toArray(), []);
}

export function useCharacter() {
  return useLiveQuery(() => db.characters.toArray(), []);
}

export function useQuests() {
  return useLiveQuery(() => db.quests.toArray(), []);
}

export function useCoin() {
  return useLiveQuery(async () => {
    const completed = await db.quests.where('status').equals('completed').toArray();
    return completed.reduce((sum, q) => sum + (q.coin ?? 0), 0);
  }, []);
}
