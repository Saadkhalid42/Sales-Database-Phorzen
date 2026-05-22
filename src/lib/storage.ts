import { get, set } from 'idb-keyval';
import type { Database } from '../store/useStore';
import { supabase } from './supabase';

const DB_KEY = 'antigravity-grid-db';
const STATE_ID = 'main_state';

export async function saveDatabases(databases: Database[]) {
  try {
    // 1. Save to local IndexedDB for immediate offline caching
    await set(DB_KEY, databases);

    // 2. Push to Supabase Cloud
    const { error } = await supabase
      .from('app_state')
      .upsert({ id: STATE_ID, state_data: databases }, { onConflict: 'id' });
      
    if (error) {
      console.error('Failed to sync to Supabase (offline?):', error);
    }
  } catch (err) {
    console.error('Failed to save state', err);
  }
}

export async function loadDatabases(): Promise<Database[] | null> {
  try {
    // 1. Try to fetch the latest truth from Supabase
    const { data, error } = await supabase
      .from('app_state')
      .select('state_data')
      .eq('id', STATE_ID)
      .single();

    if (!error && data && data.state_data) {
      // Sync the cloud truth down to local IndexedDB
      await set(DB_KEY, data.state_data);
      return data.state_data as Database[];
    }
    
    // 2. If Supabase fails (offline or table not created), load from IndexedDB fallback
    console.warn('Falling back to local IndexedDB cache');
    const localData = await get<Database[]>(DB_KEY);
    return localData || null;
  } catch (err) {
    console.error('Failed to load state', err);
    const localData = await get<Database[]>(DB_KEY);
    return localData || null;
  }
}
