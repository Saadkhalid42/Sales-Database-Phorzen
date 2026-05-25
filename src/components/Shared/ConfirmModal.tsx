import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function ConfirmModal() {
  const { isOpen, title, description, onConfirm } = useStore(state => state.confirmModal);
  const closeConfirmModal = useStore(state => state.closeConfirmModal);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeConfirmModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-[200] animate-in fade-in" />
        <Dialog.Content 
          className="bg-surface-raised fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface rounded-xl shadow-2xl border border-border z-[200] overflow-hidden"
        >
          <div className="flex items-center gap-3 px-6 py-5 border-b border-primary/10">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <Dialog.Title className="text-lg font-semibold text-text-primary">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-text-secondary mt-1">
                {description}
              </Dialog.Description>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 bg-surface-sunken">
            <button
              type="button"
              onClick={closeConfirmModal}
              className="px-4 py-2 rounded-lg font-medium text-text-primary hover:bg-surface border border-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (onConfirm) onConfirm();
                closeConfirmModal();
              }}
              className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Confirm Delete
            </button>
          </div>
          
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-surface-sunken text-text-secondary transition-colors">
              <X size={18} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
