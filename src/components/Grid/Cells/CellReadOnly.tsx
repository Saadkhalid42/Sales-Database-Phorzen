import type { CellProps } from './CellText';
import { Lock } from 'lucide-react';

import React from 'react';

export const CellReadOnly = React.memo(function CellReadOnly(props: CellProps) {
  const { columnType, initialValue, isActiveEditor, handleKeyDownWrapper } = props;

  // We intentionally ignore double clicks and edits here
  
  const renderValue = () => {
    if (Array.isArray(initialValue)) {
      return (
        <div className="flex gap-1 overflow-hidden">
          {initialValue.map((v, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-surface-sunken text-xs font-medium truncate">
              {v}
            </span>
          ))}
        </div>
      );
    }
    
    if (columnType === 'edit_row_link') {
      return (
        <a href={String(initialValue)} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-accent/10 text-accent hover:bg-accent/20 rounded-md text-xs font-medium cursor-pointer transition-colors block text-center w-full">
          Open Row
        </a>
      );
    }

    if (columnType === 'created_on' || columnType === 'last_modified') {
      try {
        if (!initialValue) return '';
        const d = new Date(initialValue);
        return props.columnTypeOptions?.showTime 
          ? d.toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })
          : d.toLocaleDateString();
      } catch {
        return String(initialValue);
      }
    }
    
    return <span className="truncate w-full text-text-secondary">{String(initialValue || '')}</span>;
  };

  return (
    <div
      className={`w-full h-full flex items-center px-3 py-2 text-[13px] text-text-primary overflow-hidden select-none outline-none ${
        isActiveEditor ? 'ring-inset ring-2 ring-accent z-20 bg-surface/50' : ''
      }`}
      onKeyDown={(e) => handleKeyDownWrapper(e, initialValue, () => {})}
      tabIndex={0}
      style={{ left: 0, width: '100%' }}
      title="Read Only Field"
    >
      {renderValue()}
      {isActiveEditor && <Lock size={12} className="absolute right-2 text-primary/30" />}
    </div>
  );
});
