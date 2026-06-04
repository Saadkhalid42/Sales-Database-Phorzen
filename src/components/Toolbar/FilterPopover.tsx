import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as Select from '@radix-ui/react-select';
import * as Switch from '@radix-ui/react-switch';
import { Filter, ChevronDown, Check, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { SearchableColumnSelector } from './SearchableColumnSelector';

const OPERATORS: Record<string, string[]> = {
  text: ['is', 'is not', 'contains', 'doesnt contain', 'contains word', 'doesnt contain word', 'is empty', 'is not empty'],
  number: ['=', '>', '<', 'is empty', 'is not empty'],
  select: ['contains', "doesn't contain", 'contains word', "doesn't contain word", 'is', 'is not', 'is any of', 'is none of', 'is empty', 'is not empty'],
  date: ['is', 'is not', 'is before', 'is on or before', 'is after', 'is on or after', 'is within', 'day of month is', 'contains', "doesn't contain", 'is empty', 'is not empty'],
  boolean: ['is true', 'is false'],
  default: ['is', 'is not', 'contains', 'doesnt contain', 'contains word', 'doesnt contain word', 'is empty', 'is not empty']
};

const getOperatorsForType = (type: string) => {
  if (['single_line_text', 'long_text', 'email', 'url', 'phone_number'].includes(type)) return OPERATORS.text;
  if (['number', 'rating', 'duration'].includes(type)) return OPERATORS.number;
  if (['single_select', 'multiple_select'].includes(type)) return OPERATORS.select;
  if (['date', 'created_on'].includes(type)) return OPERATORS.date;
  if (type === 'boolean') return OPERATORS.boolean;
  return OPERATORS.default;
};

export function FilterPopover({ asInlineMobile }: { asInlineMobile?: boolean }) {
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  const updateView = useStore(state => state.updateView);
  const toggleFilters = useStore(state => state.toggleFilters);
  const currentUser = useStore(state => state.currentUser);
  
  const canFilter = currentUser?.role?.toLowerCase() === 'admin' || !!currentUser?.permissions?.can_filter;

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const columns = activeDb?.columns || [];
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);
  const activeFilters = currentView?.filters || [];

  const addFilter = () => {
    if (columns.length === 0 || !activeViewId) return;
    const col = columns[0];
    const ops = getOperatorsForType(col.type);
    updateView(activeViewId, { filters: [...activeFilters, { colKey: col.key, operator: ops[0], value: '' }] });
  };

  const updateFilter = (idx: number, key: 'colKey' | 'operator' | 'value', val: any) => {
    if (!activeViewId) return;
    const newFilters = [...activeFilters];
    newFilters[idx] = { ...newFilters[idx], [key]: val };
    
    if (key === 'colKey') {
      const col = columns.find(c => c.key === val);
      if (col) {
        const ops = getOperatorsForType(col.type);
        if (!ops.includes(newFilters[idx].operator)) {
          newFilters[idx].operator = ops[0];
        }
        newFilters[idx].value = ''; 
      }
    }
    
    updateView(activeViewId, { filters: newFilters });
  };

  const removeFilter = (idx: number) => {
    if (!activeViewId) return;
    const newFilters = [...activeFilters];
    newFilters.splice(idx, 1);
    updateView(activeViewId, { filters: newFilters });
  };

  const isActive = activeFilters.length > 0;

  const renderContent = () => (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-text-primary opacity-70 uppercase tracking-wider">Active Filters</h4>
            
            {activeFilters.length === 0 ? (
              <div className="text-sm text-text-primary opacity-50 py-2">No filters applied</div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeFilters.map((filter, idx) => {
                  const col = columns.find(c => c.key === filter.colKey);
                  const ops = col ? getOperatorsForType(col.type) : OPERATORS.default;
                  const noValueNeeded = ['is empty', 'is not empty', 'is true', 'is false'].includes(filter.operator);

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      {idx === 0 && <span className="text-xs font-semibold w-12 shrink-0 text-text-secondary">Where</span>}
                      {idx === 1 && (
                        <Select.Root 
                          value={currentView?.filterJoinOperator || 'and'} 
                          onValueChange={(v) => updateView(activeViewId!, { filterJoinOperator: v as 'and' | 'or' })}
                          disabled={!canFilter}
                        >
                          <Select.Trigger className="w-16 flex items-center justify-between px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-xs font-semibold focus:outline-none shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Select.Value />
                            <Select.Icon><ChevronDown size={14} className="opacity-50" /></Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content position="popper" sideOffset={4} className="z-[60] overflow-hidden bg-surface rounded-lg border border-border shadow-xl w-24">
                              <Select.Viewport className="p-1">
                                <Select.Item value="and" className="relative flex items-center justify-between gap-2 pl-3 pr-8 py-1.5 text-xs text-text-primary rounded-lg cursor-pointer select-none data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none">
                                  <Select.ItemText>And</Select.ItemText>
                                  <Select.ItemIndicator className="absolute right-3"><Check size={12} /></Select.ItemIndicator>
                                </Select.Item>
                                <Select.Item value="or" className="relative flex items-center justify-between gap-2 pl-3 pr-8 py-1.5 text-xs text-text-primary rounded-lg cursor-pointer select-none data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none">
                                  <Select.ItemText>Or</Select.ItemText>
                                  <Select.ItemIndicator className="absolute right-3"><Check size={12} /></Select.ItemIndicator>
                                </Select.Item>
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      )}
                      {idx > 1 && (
                        <span className="text-xs font-semibold w-12 shrink-0 capitalize text-text-secondary">
                          {currentView?.filterJoinOperator || 'and'}
                        </span>
                      )}
                      <SearchableColumnSelector
                        value={filter.colKey}
                        onValueChange={(v) => updateFilter(idx, 'colKey', v)}
                        columns={columns}
                      />

                      <Select.Root value={filter.operator} onValueChange={(v) => updateFilter(idx, 'operator', v)} disabled={!canFilter}>
                        <Select.Trigger className="w-40 flex items-center justify-between px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-xs focus:outline-none focus-visible:border-primary disabled:opacity-50 disabled:cursor-not-allowed">
                          <Select.Value />
                          <Select.Icon><ChevronDown size={14} className="opacity-50" /></Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content position="popper" sideOffset={4} className="z-[60] overflow-hidden bg-surface rounded-lg border border-border shadow-xl min-w-[var(--radix-select-trigger-width)]">
                            <Select.Viewport className="p-1">
                              {ops.map(op => (
                                <Select.Item key={op} value={op} className="relative flex items-center justify-between gap-2 pl-3 pr-8 py-1.5 text-xs text-text-primary rounded-lg cursor-pointer select-none data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none whitespace-nowrap">
                                  <Select.ItemText>{op}</Select.ItemText>
                                  <Select.ItemIndicator className="absolute right-3"><Check size={12} /></Select.ItemIndicator>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>

                      <div className="flex-1">
                        {!noValueNeeded && (
                          (col?.type === 'single_select' || col?.type === 'multiple_select') && ['is', 'is not'].includes(filter.operator) ? (
                            <Select.Root value={filter.value} onValueChange={(v) => updateFilter(idx, 'value', v)} disabled={!canFilter}>
                              <Select.Trigger className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-xs focus:outline-none focus-visible:border-primary disabled:opacity-50 disabled:cursor-not-allowed">
                                <Select.Value placeholder="Select option..." />
                                <Select.Icon><ChevronDown size={14} className="opacity-50" /></Select.Icon>
                              </Select.Trigger>
                              <Select.Portal>
                                <Select.Content position="popper" sideOffset={4} className="z-[60] overflow-hidden bg-surface rounded-lg border border-border shadow-xl w-[var(--radix-select-trigger-width)]">
                                  <Select.Viewport className="p-1 max-h-48 custom-scrollbar">
                                    {(col.typeOptions?.options || []).map((o: any) => (
                                      <Select.Item key={o.label} value={o.label} className="relative flex items-center justify-between gap-2 pl-3 pr-8 py-1.5 text-xs text-text-primary rounded-lg cursor-pointer select-none data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: o.color }} />
                                          <Select.ItemText>{o.label}</Select.ItemText>
                                        </div>
                                        <Select.ItemIndicator className="absolute right-3"><Check size={12} /></Select.ItemIndicator>
                                      </Select.Item>
                                    ))}
                                  </Select.Viewport>
                                </Select.Content>
                              </Select.Portal>
                            </Select.Root>
                          ) : col?.type === 'boolean' ? null : (
                            <input
                              type={['number', 'rating', 'duration'].includes(col?.type || '') ? 'number' : 'text'}
                              value={filter.value}
                              onChange={(e) => updateFilter(idx, 'value', e.target.value)}
                              placeholder="Value..."
                              disabled={!canFilter}
                              className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-xs focus:outline-none focus-visible:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          )
                        )}
                      </div>

                      {canFilter && (
                        <button 
                          onClick={() => removeFilter(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors focus:outline-none"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {canFilter && (
              <button 
                onClick={addFilter}
                className="flex items-center gap-1.5 text-xs font-medium text-text-primary hover:bg-[rgba(var(--text-color),0.05)] px-2 py-1.5 rounded-lg self-start transition-colors mt-1"
              >
                <Plus size={14} /> Add Filter
              </button>
            )}
            
            {activeFilters.length > 0 && (
              <>
                <div className="h-px bg-divider my-2" />
                <div className="flex items-center px-2">
                  <label className="text-xs font-medium text-text-primary opacity-80 cursor-pointer flex items-center gap-2">
                    Disable all filters
                    <input 
                      type="checkbox"
                      checked={currentView?.isFilterDisabled || false}
                      disabled={!canFilter}
                      onChange={(e) => {
                        if (activeViewId) toggleFilters(activeViewId, e.target.checked);
                      }}
                      className="w-3.5 h-3.5 rounded-sm border-border text-accent  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>
                </div>
              </>
            )}
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
          <Filter size={14} />
          Filter {isActive && <span className="ml-1 bg-accent text-white text-[10px] px-1.5 rounded-full">{activeFilters.length}</span>}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          className="w-[600px] border border-border shadow-xl rounded-[24px] p-3 z-50 mt-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          align="start"
          sideOffset={4}
        >
          {renderContent()}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
