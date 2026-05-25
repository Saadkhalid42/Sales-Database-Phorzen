import React, { useState, useEffect, useRef } from 'react';
import type { CellProps } from './CellText';

export const CellNumber = React.memo(function CellNumber(props: CellProps) {
  const { recordId, colKey, updateRecordCell, columnType, columnTypeOptions, initialValue, isActiveEditor, isEditing, commitEdit, handleDoubleClick, handleKeyDownWrapper, isModalMode } = props;
  
  const [localValue, setLocalValue] = useState(String(initialValue || ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setLocalValue(String(initialValue || ''));
    }
  }, [initialValue, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const onBlur = () => {
    if (columnType === 'duration') {
      commitEdit(localValue);
      return;
    }
    // Basic number validation
    const num = parseFloat(localValue);
    if (!isNaN(num)) {
      if (columnTypeOptions?.allowDecimals) {
        commitEdit(num);
      } else {
        commitEdit(Math.round(num));
      }
    } else {
      commitEdit(initialValue); // revert if invalid
    }
  };

  const formatValue = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    if (columnType === 'duration') {
      // Just return as string for now
      return String(val);
    }
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (columnTypeOptions?.allowDecimals) {
      return num.toLocaleString(undefined, { minimumFractionDigits: columnTypeOptions.decimalPlaces || 2, maximumFractionDigits: columnTypeOptions.decimalPlaces || 2 });
    }
    return num.toLocaleString();
  };

  if (isModalMode) {
    return (
      <input
        type={columnType === 'duration' ? 'text' : 'number'}
        className="w-full bg-surface-sunken outline-none border border-border focus:ring-2 focus:ring-accent rounded-lg text-[13px] text-text-primary px-3 py-3 min-h-[44px] transition-all text-right tabular-nums"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={onBlur}
        placeholder="Enter number..."
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center px-3 py-2 text-[13px] text-text-primary overflow-hidden select-none outline-none justify-end ${
        isActiveEditor && !isEditing ? 'ring-inset ring-2 ring-accent z-20 bg-surface/50' : ''
      }`}
      onDoubleClick={handleDoubleClick}
      onKeyDown={(e) => handleKeyDownWrapper(e, localValue, setLocalValue)}
      tabIndex={isEditing ? -1 : 0}
      style={{ left: 0, width: '100%' }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type={columnType === 'duration' ? 'text' : 'number'}
          className="w-full h-full bg-surface outline-none focus:ring-2 focus:ring-accent rounded-sm px-1 -ml-1 text-text-primary text-right"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={onBlur}
        />
      ) : (
        <span className="truncate w-full text-right text-text-primary/90 font-mono">
          {formatValue(initialValue)}
        </span>
      )}
    </div>
  );
});
