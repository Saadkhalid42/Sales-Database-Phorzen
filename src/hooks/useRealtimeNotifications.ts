import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import type { Database } from '../store/useStore';

export function useRealtimeNotifications() {
  useEffect(() => {
    // Only subscribe if we have notification tracking enabled locally
    const channel = supabase.channel('public:app_state');

    channel
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_state' },
        (payload) => {
          const state = useStore.getState();
          const notifiedKeys = state.notifiedFieldKeys;
          const notificationsEnabled = state.notificationsEnabled;

          if (!notificationsEnabled || notifiedKeys.length === 0) return;

          // Parse incoming state
          const newDatabases = payload.new.state_data as Database[];
          if (!newDatabases) return;

          const activeDbId = state.activeDatabaseId;
          const oldDb = state.databases.find(d => d.id === activeDbId);
          const newDb = newDatabases.find(d => d.id === activeDbId);

          if (!oldDb || !newDb) return;

          // Perform fast diff
          for (const newRecord of newDb.records) {
            const oldRecord = oldDb.records.find(r => r.id === newRecord.id);
            if (!oldRecord) continue;

            for (const colKey of notifiedKeys) {
              const oldVal = oldRecord.cells[colKey];
              const newVal = newRecord.cells[colKey];

              if (oldVal !== newVal) {
                const colName = newDb.columns.find(c => c.key === colKey)?.label || 'Field';

                // Find the newest changelog entry to get the exact user and values
                const logEntry = newRecord.changelog?.find(log => log.fieldName === colName);
                const username = logEntry?.userName || 'Someone';
                const firstCell = logEntry?.firstCellValue || 'Record';
                const oldText = String(oldVal || '').trim();
                const newText = String(newVal || '').trim();
                
                const formatText = (t: string) => t === '' ? 'empty' : t;

                // We only notify if permission is granted
                if ('Notification' in window && Notification.permission === 'granted') {
                  const title = `${username} changed the ${colName} from ${formatText(oldText)} to ${formatText(newText)} of ${firstCell}`;
                  new Notification(title);
                }
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
