import React, { useState } from 'react';
import type { CellProps } from './CellText';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import 'react-day-picker/dist/style.css'; // Requires date-fns and react-day-picker

export const CellDate = React.memo(function CellDate(props: CellProps) {
  const { columnTypeOptions, initialValue, isActiveEditor, updateRecordCell, recordId, colKey, handleKeyDownWrapper, isModalMode } = props;

  const [isOpen, setIsOpen] = useState(false);

  // Helper to get Date object safely
  const getDate = () => {
    if (!initialValue) return undefined;
    const parsed = typeof initialValue === 'string' ? parseISO(initialValue) : new Date(initialValue);
    return isValid(parsed) ? parsed : undefined;
  };

  const selectedDate = getDate();

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      updateRecordCell(recordId, colKey, date.toISOString());
    } else {
      updateRecordCell(recordId, colKey, '');
    }
    setIsOpen(false);
  };

  const handleDoubleClick = () => {
    if (isActiveEditor) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isActiveEditor && e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(true);
      return;
    }
    handleKeyDownWrapper(e, initialValue, () => {});
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={(o) => {
      if (!o) setIsOpen(false);
    }}>
      <Popover.Anchor asChild>
        <div
          className={`w-full h-full flex items-center px-3 py-3 text-[13px] text-text-primary overflow-hidden select-none outline-none cursor-pointer transition-all ${
            isActiveEditor && !isModalMode ? 'ring-inset ring-2 ring-accent z-20 bg-surface/50' : ''
          } ${
            isModalMode ? 'bg-surface-sunken border border-border rounded-lg focus:ring-2 focus:ring-accent hover:border-slate-400' : ''
          }`}
          onDoubleClick={!isModalMode ? handleDoubleClick : undefined}
          onClick={isModalMode ? () => setIsOpen(true) : undefined}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          style={{ left: 0, width: '100%' }}
        >
          <span className="truncate w-full text-text-primary/90 flex items-center gap-2">
            {selectedDate ? format(selectedDate, columnTypeOptions?.dateFormat?.replace('YYYY', 'yyyy').replace('DD', 'dd') || 'MMM d, yyyy') : <span className="text-text-primary/30">Empty</span>}
          </span>
          <CalendarIcon size={14} className="opacity-50 absolute right-2" />
        </div>
      </Popover.Anchor>
      
      <Popover.Portal>
        <Popover.Content 
          className="w-auto p-0 border border-border shadow-2xl rounded-xl z-[100] bg-surface-raised overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          align="start"
          sideOffset={8}
        >
          <DayPicker 
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            className="text-[13px] m-0 p-3"
            style={{ 
              '--rdp-cell-size': '30px', 
              '--rdp-caption-font-size': '14px',
              '--rdp-accent-color': 'var(--accent)',
              '--rdp-background-color': 'transparent'
            } as React.CSSProperties}
            modifiersClassNames={{
              selected: 'bg-accent text-white rounded-full shadow-md hover:bg-accent-hover',
              today: 'font-bold text-accent'
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
});
