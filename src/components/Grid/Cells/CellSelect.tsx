import React, { useState } from 'react';
import type { CellProps } from './CellText';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, Check } from 'lucide-react';


export const CellSelect = React.memo(function CellSelect(props: CellProps) {
  const { columnType, columnTypeOptions, initialValue, isActiveEditor, updateRecordCell, recordId, colKey, handleKeyDownWrapper, isModalMode } = props;
  
  const options = columnTypeOptions?.options || [];

  const isMulti = columnType === 'multiple_select';
  const [isOpen, setIsOpen] = useState(false);

  const selectedValues: string[] = isMulti 
    ? (Array.isArray(initialValue) ? initialValue : []) 
    : (initialValue ? [String(initialValue)] : []);

  const handleSelect = (val: string) => {
    if (isMulti) {
      if (selectedValues.includes(val)) {
        updateRecordCell(recordId, colKey, selectedValues.filter(v => v !== val));
      } else {
        updateRecordCell(recordId, colKey, [...selectedValues, val]);
      }
    } else {
      updateRecordCell(recordId, colKey, val);
      setIsOpen(false);
    }
  };

  const handleDoubleClick = () => {
    if (isActiveEditor) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isActiveEditor && e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(true);
      return;
    }
    handleKeyDownWrapper(e, initialValue, () => {});
  };

  const renderPill = (val: string) => {
    const opt = options.find((o: any) => o.label === val);
    const bgColor = opt && opt.color ? opt.color : 'rgba(var(--primary-color), 0.2)';
    return (
      <span key={val} className="px-2.5 py-0.5 rounded-full text-xs font-medium truncate text-slate-800" style={{ backgroundColor: bgColor }}>
        {val}
      </span>
    );
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={(o) => (isActiveEditor || isModalMode) && setIsOpen(o)}>
      <Popover.Trigger asChild>
        <div
          className={`w-full h-full flex items-center px-3 py-3 text-[13px] text-text-primary overflow-hidden select-none outline-none cursor-pointer transition-all ${
            isActiveEditor && !isModalMode ? 'ring-inset ring-2 ring-accent z-20 bg-surface/50' : ''
          } ${
            isModalMode ? 'bg-surface-sunken border border-border rounded-lg focus:ring-2 focus:ring-accent hover:border-slate-400 min-h-[44px]' : ''
          }`}
          onDoubleClick={!isModalMode ? handleDoubleClick : undefined}
          onClick={isModalMode ? () => setIsOpen(true) : undefined}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          style={{ left: 0, width: '100%' }}
        >
          <div className="flex gap-1 overflow-hidden w-[calc(100%-20px)]">
            {selectedValues.length > 0 ? selectedValues.map(renderPill) : <span className="text-text-primary/30">Empty</span>}
          </div>
          <ChevronDown size={14} className="opacity-50 absolute right-2" />
        </div>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content 
          className="w-48 p-1 border border-border shadow-2xl rounded-xl z-[100] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          align="start"
          sideOffset={8}
          
        >
          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-1">
            {options.map((opt: any) => {
              const val = opt.label;
              const selected = selectedValues.includes(val);
              return (
                <button
                  key={val}
                  type="button"
                  className="w-full text-left cursor-pointer px-3 py-2 rounded-md text-text-primary hover:bg-accent hover:text-white flex items-center justify-between group transition-colors outline-none"
                  onClick={() => handleSelect(val)}
                >
                  {renderPill(val)}
                  {selected && <Check size={14} className="text-accent" />}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
});
