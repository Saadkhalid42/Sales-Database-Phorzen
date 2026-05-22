import { get, set } from 'idb-keyval';
import type { Database } from '../store/useStore';

const DB_KEY = 'antigravity-grid-db';

export async function saveDatabases(databases: Database[]) {
  try {
    await set(DB_KEY, databases);
  } catch (err) {
    console.error('Failed to save to IndexedDB', err);
  }
}

export async function loadDatabases(): Promise<Database[] | null> {
  try {
    const data = await get<Database[]>(DB_KEY);
    return data || null;
  } catch (err) {
    console.error('Failed to load from IndexedDB', err);
    return null;
  }
}
