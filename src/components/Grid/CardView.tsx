import React, { useMemo } from 'react';
import type { GridRecord } from '../../store/useStore';
import { useStore } from '../../store/useStore';
import { RecordCard } from './RecordCard';
import { FileQuestion, Plus } from 'lucide-react';

export function CardView({ records }: { records: GridRecord[] }) {
  const addRecord = useStore(state => state.addRecord);
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
            showTimezones={currentView?.showTimezones}
          />
        ))}

        {/* Synthetic Add Row Card */}
        <div 
          onClick={() => {
            const newRecordId = 'rec_' + Math.random().toString(36).substring(2, 9);
            addRecord({ id: newRecordId, cells: {} });
          }}
          className="flex flex-col min-h-[160px] border-2 border-dashed border-divider bg-surface-raised/50 hover:bg-surface-raised rounded-2xl cursor-pointer items-center justify-center text-text-muted hover:text-text-primary transition-all duration-200 group"
        >
          <div className="w-12 h-12 rounded-full bg-surface-sunken group-hover:bg-accent/10 flex items-center justify-center mb-3 group-hover:text-accent transition-colors">
            <Plus size={24} />
          </div>
          <span className="font-medium text-sm">Add Record</span>
        </div>
      </div>
    </div>
  );
}
