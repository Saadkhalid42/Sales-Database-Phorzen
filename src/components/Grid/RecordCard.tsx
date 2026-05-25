import React from 'react';
import { useStore } from '../../store/useStore';
import type { GridRecord, GridColumn } from '../../store/useStore';

interface RecordCardProps {
  record: GridRecord;
  visibleColumns: GridColumn[];
}

export function RecordCard({ record, visibleColumns }: RecordCardProps) {
  const openExpandedRecord = useStore(state => state.openExpandedRecord);

  if (visibleColumns.length === 0) return null;

  const [primaryColumn, ...secondaryColumns] = visibleColumns;
  const primaryValue = record.cells[primaryColumn.key];

  // Helper to format values safely
  const formatValue = (val: any) => {
    if (val === null || val === undefined || val === '') return '-';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  };

  const statusColumns = secondaryColumns.filter(c => c.type === 'singleSelect' || c.type === 'multiSelect');
  const previewColumns = secondaryColumns.filter(c => c.type !== 'singleSelect' && c.type !== 'multiSelect').slice(0, 4);

  return (
    <div 
      onClick={() => openExpandedRecord(record.id)}
      className="bg-surface-raised border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden group p-4 hover:-translate-y-0.5 w-full"
    >
      <div className="absolute inset-0 bg-accent-subtle opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col w-full">
        {/* Header Row */}
        <div className="flex justify-between items-start mb-3 gap-3">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-0.5 truncate">
              {primaryColumn.label}
            </span>
            <h3 className="text-base font-semibold text-text-primary leading-snug break-words">
              {formatValue(primaryValue)}
            </h3>
          </div>
          
          {/* Status Pills */}
          {statusColumns.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1 shrink-0 max-w-[40%]">
              {statusColumns.map(col => {
                const val = record.cells[col.key];
                if (!val || val === '') return null;
                const vals = Array.isArray(val) ? val : [val];
                return vals.map((v: string) => {
                  const opt = col.typeOptions?.options?.find((o: any) => o.value === v);
                  const colorClass = opt?.color || 'bg-accent/10 text-accent';
                  return (
                    <span key={`${col.key}-${v}`} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium truncate max-w-[80px] ${colorClass}`}>
                      {opt?.label || v}
                    </span>
                  );
                });
              })}
            </div>
          )}
        </div>

        {/* Body Preview */}
        {previewColumns.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-divider pt-3">
            {previewColumns.map(col => (
              <div key={col.key} className="flex justify-between items-center gap-3">
                <span className="text-[11px] font-medium text-text-muted truncate min-w-[30%]">
                  {col.label}
                </span>
                <span className="text-sm font-medium text-text-primary truncate text-right">
                  {formatValue(record.cells[col.key])}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
