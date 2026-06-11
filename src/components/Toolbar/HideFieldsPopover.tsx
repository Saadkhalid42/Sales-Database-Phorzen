import React, { useState, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as Switch from '@radix-ui/react-switch';
import { EyeOff, GripVertical, Search, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableFieldItemProps {
  col: { key: string, label: string };
  isHidden: boolean;
  toggleVisibility: (key: string, isHidden: boolean) => void;
}

function SortableFieldItem({ col, isHidden, toggleVisibility }: SortableFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center justify-between gap-2 p-2 rounded-lg bg-surface hover:bg-[rgba(var(--text-color),0.02)] transition-colors ${isDragging ? 'relative border border-border' : ''}`}>
      <div className="flex items-center gap-2">
        <button 
          type="button" 
          {...attributes} 
          {...listeners} 
          className="text-text-muted hover:text-slate-600 cursor-grab active:cursor-grabbing focus:outline-none p-1"
        >
          <GripVertical size={14} />
        </button>
        <span className="text-[13px] text-text-primary truncate max-w-[140px]">{col.label}</span>
      </div>
      <input 
        type="checkbox" 
        checked={!isHidden}
        onChange={(e) => toggleVisibility(col.key, !e.target.checked)}
        className="w-4 h-4 rounded border-border text-accent  cursor-pointer transition-colors"
      />
    </div>
  );
}

export function HideFieldsPopover({ asInlineMobile }: { asInlineMobile?: boolean }) {
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  const updateView = useStore(state => state.updateView);

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const columns = activeDb?.columns || [];
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);
  const hiddenFields = currentView?.hiddenFields || [];
  const columnOrder = currentView?.columnOrder || [];

  const [searchQuery, setSearchQuery] = useState('');

  // Derived sorted columns for the list
  const orderedCols = useMemo(() => {
    const ordered = [...columns];
    if (columnOrder.length > 0) {
      ordered.sort((a, b) => {
        const idxA = columnOrder.indexOf(a.key);
        const idxB = columnOrder.indexOf(b.key);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }
    return ordered;
  }, [columns, columnOrder]);

  const filteredCols = useMemo(() => {
    if (!searchQuery.trim()) return orderedCols;
    const q = searchQuery.toLowerCase();
    return orderedCols.filter(c => c.label.toLowerCase().includes(q));
  }, [orderedCols, searchQuery]);

  const toggleVisibility = (key: string, hide: boolean) => {
    if (!activeViewId) return;
    const newHidden = hide 
      ? [...hiddenFields, key]
      : hiddenFields.filter(k => k !== key);
    updateView(activeViewId, { hiddenFields: newHidden });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!activeViewId) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedCols.findIndex(c => c.key === active.id);
      const newIndex = orderedCols.findIndex(c => c.key === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedCols.map(c => c.key), oldIndex, newIndex);
        updateView(activeViewId, { columnOrder: newOrder });
      }
    }
  };

  const isActive = hiddenFields.length > 0;

  const renderContent = () => (
    <div className="flex flex-col gap-2 max-h-[400px]">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border bg-surface mb-2">
        <Search size={14} className="text-text-muted shrink-0" />
        <input 
          type="text" 
          placeholder="Find a field..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0 w-full bg-transparent text-xs text-text-primary focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => {
            if (activeViewId) updateView(activeViewId, { hiddenFields: columns.map(c => c.key) });
          }}
          className="flex-1 px-2 py-1.5 bg-surface-sunken hover:bg-surface-sunken text-text-secondary hover:text-primary rounded text-[10px] font-semibold uppercase tracking-wider transition-colors"
        >
          Hide All
        </button>
        <button 
          onClick={() => {
            if (activeViewId) updateView(activeViewId, { hiddenFields: [] });
          }}
          className="flex-1 px-2 py-1.5 bg-surface-sunken hover:bg-surface-sunken text-text-secondary hover:text-primary rounded text-[10px] font-semibold uppercase tracking-wider transition-colors"
        >
          Show All
        </button>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 -mx-1 px-1 flex flex-col gap-1">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredCols.map(c => c.key)} strategy={verticalListSortingStrategy}>
            {filteredCols.map((col) => (
              <SortableFieldItem 
                key={col.key} 
                col={col} 
                isHidden={hiddenFields.includes(col.key)}
                toggleVisibility={toggleVisibility}
              />
            ))}
          </SortableContext>
        </DndContext>
        {filteredCols.length === 0 && (
          <div className="text-xs text-text-primary opacity-50 py-4 text-center">No fields found.</div>
        )}
      </div>
    </div>
  );

  if (asInlineMobile) {
    return renderContent();
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button 
          className={`flex items-center gap-1.5 transition-all focus:outline-none px-2 py-1 rounded-md ${
            isActive 
              ? 'text-accent font-semibold' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <EyeOff size={14} />
          Hide {isActive && <span className="ml-1 bg-accent text-white text-[10px] px-1.5 rounded-full">{hiddenFields.length}</span>}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          className="w-72 border border-border shadow-xl rounded-lg overflow-hidden p-3 z-[60] mt-1 bg-surface-raised data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 flex flex-col gap-2 max-h-[400px]"
          
          align="start"
          sideOffset={4}
        >
          {renderContent()}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
