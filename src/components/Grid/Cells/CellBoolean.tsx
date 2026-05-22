import React from 'react';
import type { CellProps } from './CellText';
import { Check } from 'lucide-react';

export const CellBoolean = React.memo(function CellBoolean(props: CellProps) {
  const { initialValue, isActiveEditor, updateRecordCell, recordId, colKey, handleKeyDownWrapper, isModalMode } = props;

  const isChecked = Boolean(initialValue);

  const toggle = () => {
    updateRecordCell(recordId, colKey, !isChecked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isActiveEditor && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggle();
      return;
    }
    // We pass down to wrapper for arrows but we don't use local edit mode
    handleKeyDownWrapper(e, isChecked, () => {});
  };

  if (isModalMode) {
    return (
      <div 
        onClick={toggle}
        className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-colors cursor-pointer ml-1 mt-1 ${isChecked ? 'bg-accent border-accent border text-white' : 'bg-surface border-[1.5px] border-border hover:border-slate-400'}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        {isChecked && <Check size={14} strokeWidth={3.5} />}
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center justify-center px-3 py-2 text-[13px] text-text-primary overflow-hidden select-none outline-none ${
        isActiveEditor ? 'ring-inset ring-2 ring-accent z-20 bg-surface/50' : ''
      }`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ left: 0, width: '100%' }}
    >
      <div 
        onClick={toggle}
        className={`w-4 h-4 rounded-sm flex items-center justify-center transition-colors cursor-pointer ${isChecked ? 'bg-accent border-accent border text-white' : 'bg-white border-2 border-slate-400'}`}
      >
        {isChecked && <Check size={12} strokeWidth={3} />}
      </div>
    </div>
  );
});
