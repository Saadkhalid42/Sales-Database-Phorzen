import React from 'react';
import type { CellProps } from './CellText';

export const CellRating = React.memo(function CellRating(props: CellProps) {
  const { columnTypeOptions, initialValue, isActiveEditor, updateRecordCell, recordId, colKey, handleKeyDownWrapper, isModalMode } = props;
  const maxRating = columnTypeOptions?.maxStars || 5;

  const rating = Number(initialValue) || 0;

  const setRating = (val: number) => {
    if (isActiveEditor) {
      updateRecordCell(recordId, colKey, val === rating ? 0 : val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isActiveEditor) {
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 5) {
        e.preventDefault();
        setRating(num);
        return;
      }
    }
    handleKeyDownWrapper(e, initialValue, () => {});
  };

  if (isModalMode) {
    return (
      <div className="flex gap-2 items-center ml-1 mt-1 outline-none" tabIndex={0} onKeyDown={handleKeyDown}>
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className={`w-[14px] h-[14px] rounded-full cursor-pointer transition-all hover:scale-110 ${
              idx <= rating 
                ? 'bg-accent border-[1.5px] border-accent shadow-sm' 
                : 'bg-transparent border-[1.5px] border-text-primary/30 hover:border-accent'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setRating(idx);
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center px-3 py-2 text-[13px] text-text-primary overflow-hidden select-none outline-none ${
        isActiveEditor ? 'ring-inset ring-2 ring-accent z-20 bg-surface/50' : ''
      }`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ left: 0, width: '100%' }}
    >
      <div className="flex gap-1.5 items-center">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className={`w-[12px] h-[12px] rounded-full cursor-pointer transition-all hover:scale-110 ${
              idx <= rating 
                ? 'bg-accent border-[1.5px] border-accent shadow-sm' 
                : 'bg-transparent border-[1.5px] border-text-primary/30 hover:border-accent'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setRating(idx);
            }}
          />
        ))}
      </div>
    </div>
  );
});
