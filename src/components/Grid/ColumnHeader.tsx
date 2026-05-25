import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Type, AlignLeft, Hash, Calendar, CheckSquare, Star, Mail, Phone, Link2, Key, List, Users, Clock, File as FileIcon, Edit, Table, Search, PlusSquare, ArrowUpRight, Calculator, Hash as HashIcon, Fingerprint, CalendarDays, Edit3, Trash2, ArrowLeft, ArrowRight, Type as TypeIcon, Pin, Copy, Bell } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { GridColumn } from '../../store/useStore';
import { EditFieldDialog } from './EditFieldDialog';
import { useState } from 'react';

interface ColumnHeaderProps {
  col: GridColumn;
  index: number;
}

const FIELD_TYPES = [
  { id: 'single_line_text', label: 'Single Line Text', icon: Type },
  { id: 'long_text', label: 'Long Text', icon: AlignLeft },
  { id: 'number', label: 'Number', icon: Hash },
  { id: 'date', label: 'Date', icon: Calendar },
  { id: 'boolean', label: 'Boolean', icon: CheckSquare },
  { id: 'rating', label: 'Rating', icon: Star },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone_number', label: 'Phone', icon: Phone },
  { id: 'url', label: 'URL', icon: Link2 },
  { id: 'single_select', label: 'Single Select', icon: List },
  { id: 'multiple_select', label: 'Multiple Select', icon: List },
  { id: 'duration', label: 'Duration', icon: Clock },
  { id: 'file', label: 'File', icon: FileIcon },
  { id: 'created_on', label: 'Created On', icon: CalendarDays }
];

export const ColumnHeader = React.memo(function ColumnHeader({ col }: ColumnHeaderProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const updateColumn = useStore(state => state.updateColumn);
  const addColumn = useStore(state => state.addColumn);
  const deleteColumn = useStore(state => state.deleteColumn);
  const duplicateColumn = useStore(state => state.duplicateColumn);
  const freezeColumn = useStore(state => state.freezeColumn);

  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  const unfreezeColumn = useStore(state => state.unfreezeColumn);
  
  const notifiedFieldKeys = useStore(state => state.notifiedFieldKeys);
  const toggleFieldNotification = useStore(state => state.toggleFieldNotification);
  const isNotified = notifiedFieldKeys.includes(col.key);

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);
  const isFrozen = currentView?.frozenField === col.key;

  const colTypeDetails = FIELD_TYPES.find(t => t.id === col.type) || FIELD_TYPES[0];
  const Icon = colTypeDetails.icon;

  const handleInsert = (direction: 'left' | 'right') => {
    const newCol: GridColumn = {
      key: `col_${Date.now()}`,
      label: `New Column`,
      type: 'single_line_text',
      width: 150
    };
    
    if (direction === 'right') {
      addColumn(newCol, { insertAfterKey: col.key });
    } else {
      addColumn(newCol, { insertBeforeKey: col.key });
    }
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="w-full h-full flex items-center justify-between px-3 text-sm font-semibold text-[13px] text-text-secondary focus:outline-none hover:bg-surface-sunken transition-colors group bg-surface cursor-pointer"
        >
          <div className="flex items-center gap-2 overflow-hidden w-[calc(100%-16px)]">
            <Icon size={14} className="opacity-70 shrink-0" />
            <span className="truncate">{col.label}</span>
          </div>
          <ChevronDown size={14} className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="w-48 border border-border shadow-2xl rounded-xl p-2 z-[100] mt-1 data-[state=open]:animate-dropdown-in data-[state=closed]:animate-dropdown-out"
          align="start"
          sideOffset={4}
          
        >
          <DropdownMenu.Item onSelect={() => setIsEditDialogOpen(true)} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl text-text-secondary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-sm">
            <Edit3 size={14} /> Edit Field
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-surface-sunken my-1" />

          <DropdownMenu.Item onSelect={() => {
            if (activeViewId) {
              isFrozen ? unfreezeColumn(activeViewId) : freezeColumn(activeViewId, col.key);
            }
          }} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl text-text-secondary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-sm">
            <Pin size={14} /> {isFrozen ? 'Unfreeze Field' : 'Freeze Field'}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-surface-sunken my-1" />

          <DropdownMenu.Item onSelect={() => handleInsert('left')} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl text-text-secondary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-sm">
            <ArrowLeft size={14} /> Insert Left
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => handleInsert('right')} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl text-text-secondary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-sm">
            <ArrowRight size={14} /> Insert Right
          </DropdownMenu.Item>
          
          <DropdownMenu.Item onSelect={() => duplicateColumn(col.key)} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl text-text-secondary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-sm">
            <Copy size={14} /> Duplicate Field
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-surface-sunken my-1" />

          <DropdownMenu.Item 
            onSelect={() => {
              useStore.getState().openConfirmModal(
                'Delete Field',
                `Are you sure you want to delete the "${col.label}" field? This action cannot be undone.`,
                () => deleteColumn(col.key)
              );
            }} 
            className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl text-red-600 data-[highlighted]:bg-red-600 data-[highlighted]:text-accent outline-none text-sm"
          >
            <Trash2 size={14} /> Delete Field
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-surface-sunken my-1" />

          <DropdownMenu.Item 
            onSelect={(e) => {
              e.preventDefault(); // Prevent closing dropdown
              if (!isNotified && 'Notification' in window && Notification.permission !== 'granted') {
                 Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                       toggleFieldNotification(col.key, true);
                    }
                 });
              } else {
                 toggleFieldNotification(col.key, !isNotified);
              }
            }} 
            className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-xl text-text-secondary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-sm"
          >
            <div className="flex items-center gap-2">
              <Bell size={14} /> Notify on field update
            </div>
            <input 
               type="checkbox" 
               checked={isNotified}
               readOnly
               className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer pointer-events-none" 
            />
          </DropdownMenu.Item>

        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>

      <div
        className="absolute right-0 top-0 bottom-0 cursor-col-resize z-50 hover:bg-accent"
        style={{ width: '6px' }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX;
          const startWidth = col.width || 150;
          
          const handlePointerMove = (moveEvent: PointerEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(50, startWidth + deltaX);
            if (activeDatabaseId) {
              updateColumn(col.key, { width: newWidth });
            }
          };
          
          const handlePointerUp = () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
          };
          
          document.addEventListener('pointermove', handlePointerMove);
          document.addEventListener('pointerup', handlePointerUp);
        }}
      />

      <EditFieldDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        column={col}
      />
    </>
  );
});
