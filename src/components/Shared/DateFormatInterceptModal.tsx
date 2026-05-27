import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useStore } from '../../store/useStore';
import { format, parse } from 'date-fns';

const sourceOptions = [
  { label: 'MM/DD/YYYY (e.g. 12/31/2026)', value: 'MM/dd/yyyy' },
  { label: 'DD/MM/YYYY (e.g. 31/12/2026)', value: 'dd/MM/yyyy' },
  { label: 'YYYY-MM-DD (e.g. 2026-12-31)', value: 'yyyy-MM-dd' },
  { label: 'YYYY/MM/DD (e.g. 2026/12/31)', value: 'yyyy/MM/dd' },
  { label: 'DD.MM.YYYY (e.g. 31.12.2026)', value: 'dd.MM.yyyy' },
  { label: 'MM/DD/YYYY HH:MM AM/PM (e.g. 12/31/2026 10:30 PM)', value: 'MM/dd/yyyy h:mm a' },
  { label: 'DD/MM/YYYY HH:MM AM/PM (e.g. 31/12/2026 10:30 PM)', value: 'dd/MM/yyyy h:mm a' },
  { label: 'YYYY-MM-DD HH:MM (e.g. 2026-12-31 22:30)', value: 'yyyy-MM-dd HH:mm' },
  { label: 'YYYY/MM/DD HH:MM (e.g. 2026/12/31 22:30)', value: 'yyyy/MM/dd HH:mm' },
];

const displayOptions = [
  { label: 'Standard (Jan 1, 2026)', value: 'MMM d, yyyy' },
  { label: 'Numeric (01/01/2026)', value: 'MM/dd/yyyy' },
  { label: 'ISO (2026-01-01)', value: 'yyyy-MM-dd' },
  { label: 'European (01.01.2026)', value: 'dd.MM.yyyy' },
  { label: 'Standard + Time (Jan 1, 2026 10:30 PM)', value: 'MMM d, yyyy h:mm a' },
  { label: 'Numeric + Time (01/01/2026 10:30 PM)', value: 'MM/dd/yyyy h:mm a' },
  { label: 'ISO + Time (2026-01-01 22:30)', value: 'yyyy-MM-dd HH:mm' },
];

export const DateFormatInterceptModal = () => {
  const { dateInterceptModal, closeDateIntercept } = useStore();
  const [sourceFormat, setSourceFormat] = useState(sourceOptions[0].value);
  const [displayFormat, setDisplayFormat] = useState(displayOptions[0].value);

  if (!dateInterceptModal.isOpen) return null;

  const handleConfirm = () => {
    if (dateInterceptModal.resolve) {
      dateInterceptModal.resolve({ sourceFormat, displayFormat });
    }
    // We don't call closeDateIntercept here because the resolver might trigger state updates
    // The action that awaited the promise should close the modal if needed, or we close it here.
    // Actually, calling resolve doesn't close it, so we should close it.
    // Wait, closeDateIntercept resolves with null. We should bypass the null resolve.
    useStore.setState({ dateInterceptModal: { isOpen: false, sampleDate: '', resolve: null } });
  };

  const handleCancel = () => {
    closeDateIntercept();
  };

  // Live preview
  let previewStr = 'Invalid Format';
  try {
    const parsed = parse(dateInterceptModal.sampleDate, sourceFormat, new Date());
    if (!isNaN(parsed.getTime())) {
      previewStr = format(parsed, displayFormat);
    }
  } catch (e) {
    // Ignore parse errors for preview
  }

  return (
    <Dialog.Root open={dateInterceptModal.isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-[200] w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-surface-raised border border-border shadow-2xl rounded-2xl p-6 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex flex-col gap-5">
            <div>
              <Dialog.Title className="text-xl font-semibold text-text-primary mb-1">
                Ambiguous Dates Detected
              </Dialog.Title>
              <Dialog.Description className="text-sm text-text-secondary">
                We found dates in your data that could be parsed in multiple ways. Please confirm the format so we can safely convert them.
              </Dialog.Description>
            </div>

            <div className="bg-surface-sunken border border-border/50 rounded-lg p-4 flex flex-col gap-1 items-center justify-center">
              <span className="text-xs text-text-secondary font-medium tracking-wider uppercase">Sample Data</span>
              <span className="text-lg font-bold text-accent font-mono">{dateInterceptModal.sampleDate || 'N/A'}</span>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  1. Current Format (Source)
                </label>
                <select 
                  className="w-full bg-surface outline-none border border-border focus:ring-2 focus:ring-accent rounded-lg px-3 py-2.5 text-[13px] text-text-primary transition-all cursor-pointer"
                  value={sourceFormat}
                  onChange={(e) => setSourceFormat(e.target.value)}
                >
                  {sourceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  2. Display Format
                </label>
                <select 
                  className="w-full bg-surface outline-none border border-border focus:ring-2 focus:ring-accent rounded-lg px-3 py-2.5 text-[13px] text-text-primary transition-all cursor-pointer"
                  value={displayFormat}
                  onChange={(e) => setDisplayFormat(e.target.value)}
                >
                  {displayOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 flex items-center justify-between">
               <span className="text-xs font-medium text-accent">Result Preview:</span>
               <span className="text-[13px] font-bold text-text-primary">{previewStr}</span>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-lg text-[13px] font-medium bg-accent text-white hover:bg-accent-hover transition-colors shadow-sm"
              >
                Confirm Conversion
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
