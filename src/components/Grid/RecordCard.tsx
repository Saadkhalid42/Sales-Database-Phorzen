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

  return (
    <div 
      onClick={() => openExpandedRecord(record.id)}
      className="bg-surface-raised border border-border rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col gap-5 relative overflow-hidden group p-6 hover:-translate-y-0.5"
    >
      {/* Subtle hover overlay for interactability cue */}
      <div className="absolute inset-0 bg-accent-subtle opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col gap-5 w-full">
        {/* Title / Primary Field */}
        <div className="flex flex-col mb-1">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-1">
            {primaryColumn.label}
          </span>
          <h3 className="text-lg font-semibold text-text-primary leading-tight truncate">
            {formatValue(primaryValue)}
          </h3>
        </div>

        {/* Secondary Fields */}
        {secondaryColumns.length > 0 && (
          <div className="flex flex-col gap-3">
            {secondaryColumns.map(col => (
              <div key={col.key} className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-0.5 truncate">
                  {col.label}
                </span>
                <span className="text-sm font-medium text-text-primary truncate">
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
