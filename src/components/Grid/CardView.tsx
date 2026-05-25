import React, { useMemo } from 'react';
import type { GridRecord } from '../../store/useStore';
import { useStore } from '../../store/useStore';
import { RecordCard } from './RecordCard';
import { FileQuestion } from 'lucide-react';

export function CardView({ records }: { records: GridRecord[] }) {
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  
  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);
  
  const columns = activeDb?.columns || [];
  const hiddenFields = currentView?.hiddenFields || [];
  const columnOrder = currentView?.columnOrder || [];
  
  const visibleColumns = useMemo(() => {
    const orderedCols = [...columns];
    if (columnOrder.length > 0) {
      orderedCols.sort((a, b) => {
        const idxA = columnOrder.indexOf(a.key);
        const idxB = columnOrder.indexOf(b.key);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }

    if (hiddenFields.length === 0) return orderedCols;
    return orderedCols.filter(c => !hiddenFields.includes(c.key));
  }, [columns, hiddenFields, columnOrder]);

  if (records.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface text-text-muted h-full">
        <FileQuestion size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">No records match your filters</p>
        <p className="text-sm mt-1">Try adjusting your active filters or adding new data.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-4 md:p-6 bg-canvas w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto w-full">
        {records.map(record => (
          <RecordCard 
            key={record.id} 
            record={record} 
            visibleColumns={visibleColumns} 
          />
        ))}
      </div>
    </div>
  );
}
