import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export function useStudies() {
  return useLiveQuery(() => db.studies.toArray(), []);
}

export function useSubjects() {
  return useLiveQuery(() => db.subjects.toArray(), []);
}
