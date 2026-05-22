import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Clock, Activity, ChevronRight, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { GridCell } from './GridCell';
import { format } from 'date-fns';

export function ExpandedRecordModal() {
  const [showHiddenFields, setShowHiddenFields] = useState(false);
  const expandedRecordId = useStore(state => state.expandedRecordId);
  const closeExpandedRecord = useStore(state => state.closeExpandedRecord);
  const updateRecordCell = useStore(state => state.updateRecordCell);
  
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);

  const record = activeDb?.records.find(r => r.id === expandedRecordId);
  
  const columns = activeDb?.columns || [];
  
  const columnOrder = currentView?.columnOrder || [];
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

  const hiddenFieldKeys = currentView?.hiddenFields || [];
  const visibleCols = orderedCols.filter(col => !hiddenFieldKeys.includes(col.key));
  const hiddenCols = orderedCols.filter(col => hiddenFieldKeys.includes(col.key));

  if (!expandedRecordId || !record || !activeDb) {
    return null;
  }

  // Task 2: Dynamic Modal Header (first column's value)
  const primaryField = columns[0];
  const primaryValue = primaryField ? record.cells[primaryField.key] : null;
  const headerTitle = primaryValue ? String(primaryValue) : 'Unnamed Record';

  return (
    <Dialog.Root open={!!expandedRecordId} onOpenChange={(open) => !open && closeExpandedRecord()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40  z-50 animate-in fade-in" />
        <Dialog.Content 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl max-h-[85vh] h-[85vh] bg-surface-raised rounded-[24px] shadow-lg flex flex-col z-[100] overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-10 py-8 shrink-0 pb-6 border-b border-divider">
            <Dialog.Title className="text-4xl font-bold text-text-primary truncate pr-4 tracking-tight">
              {headerTitle}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Expanded record details and changelog
            </Dialog.Description>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-surface-sunken text-text-primary opacity-70 hover:opacity-100 transition-colors shrink-0 outline-none focus:ring-2 focus:ring-accent">
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body: Split Layout */}
          <div className="flex-1 grid grid-cols-3 h-full overflow-hidden">
            {/* Left Side (Form) */}
            <div className="col-span-2 overflow-y-auto custom-scrollbar p-8 space-y-5 relative">
              {visibleCols.map(col => {
                const value = record.cells[col.key];

                return (
                  <div key={col.key} className="flex flex-col gap-2">
                    <label className="text-xs uppercase font-bold text-text-muted tracking-widest pl-1">
                      {col.label}
                    </label>
                    <GridCell
                      recordId={record.id}
                      colKey={col.key}
                      columnType={col.type}
                      columnTypeOptions={col.typeOptions}
                      initialValue={value}
                      isSelected={false}
                      isActiveEditor={true}
                      updateRecordCell={updateRecordCell}
                      isModalMode={true}
                    />
                  </div>
                );
              })}

              {hiddenCols.length > 0 && (
                <div className="pt-6 border-t border-border mt-10">
                  <button 
                    onClick={() => setShowHiddenFields(!showHiddenFields)}
                    className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors outline-none"
                  >
                    {showHiddenFields ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    Show hidden fields
                  </button>

                  {showHiddenFields && (
                    <div className="mt-6 space-y-5">
                      {hiddenCols.map(col => {
                        const value = record.cells[col.key];

                        return (
                          <div key={col.key} className="flex flex-col gap-2 opacity-80">
                            <label className="text-xs uppercase font-bold text-text-muted tracking-widest pl-1">
                              {col.label}
                            </label>
                            <GridCell
                              recordId={record.id}
                              colKey={col.key}
                              columnType={col.type}
                              columnTypeOptions={col.typeOptions}
                              initialValue={value}
                              isSelected={false}
                              isActiveEditor={true}
                              updateRecordCell={updateRecordCell}
                              isModalMode={true}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side (Changelog) */}
            <div className="col-span-1 bg-surface-sunken border-l border-divider overflow-y-auto custom-scrollbar p-6 flex flex-col">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
                <Activity size={16} className="text-accent" />
                Activity Log
              </h3>
              
              <div className="flex-1 space-y-6">
                {!record.changelog || record.changelog.length === 0 ? (
                  <div className="text-sm text-text-muted italic text-center mt-10">
                    No recent activity.
                  </div>
                ) : (
                  record.changelog.map((log, index) => {
                    const renderLogValue = (val: string) => {
                      if (!val) return <span className="italic opacity-50 text-[11px]">empty</span>;
                      if (val.includes(',')) {
                        return (
                          <span className="inline-flex flex-wrap gap-1 items-center">
                            {val.split(',').map((v, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-semibold tracking-wide border border-accent/20 uppercase">
                                {v.trim()}
                              </span>
                            ))}
                          </span>
                        );
                      }
                      return <span className="font-semibold text-text-primary px-1.5 py-0.5 rounded-md bg-surface-raised border border-border inline-block text-[11px]">{val}</span>;
                    };

                    return (
                      <div key={log.id} className="relative pl-8 pb-8">
                        {/* Timeline Line */}
                        {index !== record.changelog!.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-px bg-divider" />
                        )}
                        
                        {/* Timeline Dot */}
                        <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-surface border-[1.5px] border-border shadow-sm flex items-center justify-center z-10">
                          <Clock size={10} className="text-accent" />
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                            {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                          </span>
                          <div className="text-[13px] text-text-secondary leading-relaxed flex flex-wrap items-center gap-1.5">
                            <span>Changed</span>
                            <span className="font-bold text-text-primary text-[11px] uppercase tracking-wider px-1">{log.fieldName}</span>
                            <span>from</span>
                            {renderLogValue(log.oldValue)}
                            <span className="text-text-muted font-bold">→</span>
                            {renderLogValue(log.newValue)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
