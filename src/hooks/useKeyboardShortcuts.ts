import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Allow Escape to work regardless of inputs/modals (Radix handles its own, we handle grid unselect)
      if (e.key === 'Escape') {
        useStore.getState().setSelectionRange(null);
        return;
      }

      // Safety Check: Abort if typing in an input/textarea
      const activeEl = document.activeElement;
      if (activeEl) {
        const tag = activeEl.tagName.toLowerCase();
        const isEditable = activeEl.getAttribute('contenteditable') === 'true';
        if (tag === 'input' || tag === 'textarea' || isEditable) {
          return;
        }
      }

      // Safety Check: Abort if a Radix Modal/Dialog/Popover is open
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const state = useStore.getState();
      const sel = state.selectionRange;
      
      // Global Undo/Redo
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useStore.temporal.getState().redo();
        } else {
          useStore.temporal.getState().undo();
        }
        return;
      }

      // Cell-Level & Row-Level Shortcuts require an active selection
      if (!sel) return;

      const recordId = sel.startRowId;
      const colKey = sel.startColKey;

      // Expand Row (Spacebar)
      if (e.key === ' ') {
        e.preventDefault();
        state.openExpandedRecord(recordId);
        return;
      }

      // Delete Row (Cmd + Backspace)
      if (isCmdOrCtrl && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        state.deleteRecord(recordId);
        state.setSelectionRange(null);
        return;
      }

      // Clear Cell (Backspace / Delete without Cmd)
      if (!isCmdOrCtrl && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        state.updateRecordCell(recordId, colKey, '');
        return;
      }

      // Copy (Cmd + C)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        // e.preventDefault(); // allow native copy to proceed just in case, but we explicitly write to clipboard
        
        // Find the value
        const activeDb = state.databases.find(db => db.id === state.activeDatabaseId);
        if (!activeDb) return;
        const record = activeDb.records.find(r => r.id === recordId);
        if (!record) return;
        
        const val = record.cells[colKey];
        const textToCopy = Array.isArray(val) ? val.join(', ') : String(val || '');
        
        try {
          await navigator.clipboard.writeText(textToCopy);
          state.setToastMessage('Copied');
          setTimeout(() => {
            if (useStore.getState().toastMessage === 'Copied') {
              useStore.getState().setToastMessage(null);
            }
          }, 2000);
        } catch (err) {
          console.error('Failed to copy', err);
        }
        return;
      }

      // Paste (Cmd + V)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        try {
          const text = await navigator.clipboard.readText();
          if (!text) return;

          const activeDb = state.databases.find(db => db.id === state.activeDatabaseId);
          if (!activeDb) return;
          const col = activeDb.columns.find(c => c.key === colKey);
          if (!col) return;

          let finalVal: any = text;

          // Validation
          if (col.type === 'number') {
            const num = Number(text);
            if (isNaN(num)) return; // Reject invalid number
            finalVal = num;
          } else if (col.type === 'date') {
            const date = new Date(text);
            if (isNaN(date.getTime())) return; // Reject invalid date
            finalVal = date.toISOString();
          }

          state.updateRecordCell(recordId, colKey, finalVal);
        } catch (err) {
          console.error('Failed to read clipboard', err);
        }
        return;
      }

    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
