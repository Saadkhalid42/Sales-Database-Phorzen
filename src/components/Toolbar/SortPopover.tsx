import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as Select from '@radix-ui/react-select';
import { ArrowUpDown, ChevronDown, Check, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { SearchableColumnSelector } from './SearchableColumnSelector';

export function SortPopover() {
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  const updateView = useStore(state => state.updateView);

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const columns = activeDb?.columns || [];
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);
  const activeSorts = currentView?.sorts || [];

  const addSort = () => {
    if (columns.length === 0 || !activeViewId) return;
    updateView(activeViewId, { sorts: [...activeSorts, { colKey: columns[0].key, direction: 'asc' }] });
  };

  const updateSort = (idx: number, key: 'colKey' | 'direction', val: string) => {
    if (!activeViewId) return;
    const newSorts = [...activeSorts];
    newSorts[idx] = { ...newSorts[idx], [key]: val } as any;
    updateView(activeViewId, { sorts: newSorts });
  };

  const removeSort = (idx: number) => {
    if (!activeViewId) return;
    const newSorts = [...activeSorts];
    newSorts.splice(idx, 1);
    updateView(activeViewId, { sorts: newSorts });
  };

  const isActive = activeSorts.length > 0;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button 
          className={`px-3 py-1.5 rounded-2xl border text-sm flex items-center gap-1.5 transition-colors ${
            isActive 
              ? 'bg-accent/10 text-accent border-accent/30 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30' 
              : 'hover:bg-[rgba(var(--text-color),0.08)] border-transparent hover:border-[rgba(var(--text-color),0.15)] text-text-primary'
          }`}
        >
          <ArrowUpDown size={14} />
          Sort {isActive && <span className="ml-1 bg-accent text-white text-[10px] px-1.5 rounded-full">{activeSorts.length}</span>}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          className="w-80 border border-border shadow-xl rounded-[24px] p-3 z-50 mt-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          
          align="start"
          sideOffset={4}
        >
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-text-primary opacity-70 uppercase tracking-wider">Active Sorts</h4>
            
            {activeSorts.length === 0 ? (
              <div className="text-sm text-text-primary opacity-50 py-2">No sorts applied</div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeSorts.map((sort, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <SearchableColumnSelector
                      value={sort.colKey}
                      onValueChange={(v) => updateSort(idx, 'colKey', v)}
                      columns={columns}
                      className="flex-1 flex items-center justify-between px-2 py-1.5 rounded-2xl border border-border bg-surface text-text-primary text-xs focus:outline-none focus:border-primary transition-colors"
                    />

                    <Select.Root value={sort.direction} onValueChange={(v) => updateSort(idx, 'direction', v)}>
                      <Select.Trigger className="w-28 flex items-center justify-between px-2 py-1.5 rounded-2xl border border-border bg-surface text-text-primary text-xs focus:outline-none focus:border-primary">
                        <Select.Value />
                        <Select.Icon><ChevronDown size={14} className="opacity-50" /></Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content position="popper" sideOffset={4} className="z-[60] overflow-hidden bg-surface rounded-lg border border-border shadow-xl w-[var(--radix-select-trigger-width)]">
                          <Select.Viewport className="p-1">
                            <Select.Item value="asc" className="relative flex items-center gap-2 px-6 py-1.5 text-xs text-text-primary rounded-2xl cursor-pointer select-none data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none">
                              <Select.ItemIndicator className="absolute left-1"><Check size={12} /></Select.ItemIndicator>
                              <Select.ItemText>Ascending</Select.ItemText>
                            </Select.Item>
                            <Select.Item value="desc" className="relative flex items-center gap-2 px-6 py-1.5 text-xs text-text-primary rounded-2xl cursor-pointer select-none data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none">
                              <Select.ItemIndicator className="absolute left-1"><Check size={12} /></Select.ItemIndicator>
                              <Select.ItemText>Descending</Select.ItemText>
                            </Select.Item>
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>

                    <button 
                      onClick={() => removeSort(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-2xl transition-colors focus:outline-none"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={addSort}
              className="flex items-center gap-1.5 text-xs font-medium text-text-primary hover:bg-[rgba(var(--text-color),0.05)] px-2 py-1.5 rounded-2xl self-start transition-colors mt-1"
            >
              <Plus size={14} /> Add Sort
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
