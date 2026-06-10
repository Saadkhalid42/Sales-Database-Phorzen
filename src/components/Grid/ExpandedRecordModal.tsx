import React, { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { X, Clock, Activity, ChevronRight, ChevronDown, Search, Plus, Copy, FileText, Trash2, MoreVertical } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { GridCell } from './GridCell';
import { format } from 'date-fns';

export function ExpandedRecordModal() {
  const [showHiddenFields, setShowHiddenFields] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState('master');
  const [showChangedOnly, setShowChangedOnly] = useState(false);
  const [tabToRename, setTabToRename] = useState<{ id: string, name: string } | null>(null);
  const [newTabName, setNewTabName] = useState('');
  const [tabToDelete, setTabToDelete] = useState<string | null>(null);
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const expandedRecordId = useStore(state => state.expandedRecordId);
  const closeExpandedRecord = useStore(state => state.closeExpandedRecord);
  const updateRecordCell = useStore(state => state.updateRecordCell);
  const updateRecordSnapshotCell = useStore(state => state.updateRecordSnapshotCell);
  const addRecordSnapshot = useStore(state => state.addRecordSnapshot);
  const deleteRecordSnapshot = useStore(state => state.deleteRecordSnapshot);
  const renameRecordSnapshot = useStore(state => state.renameRecordSnapshot);
  
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);

  const record = activeDb?.records.find(r => r.id === expandedRecordId);

  useEffect(() => {
    if (expandedRecordId && record) {
      if (!record.tabs_history || record.tabs_history.length === 0) {
        // Auto-provision missing tab for legacy records
        addRecordSnapshot(record.id, 'manual', { ...record.cells });
      } else {
        const isValidTab = activeTabId === 'master' || record.tabs_history.some(t => t.id === activeTabId);
        // If we're defaulting to master, or carrying over an invalid tab ID from a previously opened record, snap to the first tab
        if (!isValidTab || activeTabId === 'master') {
          setActiveTabId(record.tabs_history[0].id);
        }
      }
    }
  }, [expandedRecordId, record?.id, record?.tabs_history?.length]);

  const columns = activeDb?.columns || [];
  
  const columnOrder = currentView?.columnOrder || [];
  const orderedCols = [...columns];
  if (columnOrder.length > 0) {
    orderedCols.sort((a, b) => {
      const idxA = columnOrder.indexOf(a.key);
      const idxB = columnOrder.indexOf(b.key);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }

  const hiddenFieldKeys = currentView?.hiddenFields || [];
  const visibleCols = orderedCols.filter(col => !hiddenFieldKeys.includes(col.key));
  const hiddenCols = orderedCols.filter(col => hiddenFieldKeys.includes(col.key));

  if (!expandedRecordId || !record || !activeDb) {
    return null;
  }

  const primaryField = columns[0];
  const primaryValue = primaryField ? record.cells[primaryField.key] : null;
  const headerTitle = primaryValue ? String(primaryValue) : 'Unnamed Record';

  const scrollToField = (key: string, isHidden: boolean) => {
    setHighlightedField(key);
    setTimeout(() => setHighlightedField(null), 1500);

    if (isHidden && !showHiddenFields) {
      setShowHiddenFields(true);
      setTimeout(() => {
        const el = fieldRefs.current.get(key);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      const el = fieldRefs.current.get(key);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleUpdateCell = (recId: string, colKey: string, val: any) => {
    if (activeTabId === 'master') {
      updateRecordCell(recId, colKey, val);
    } else {
      updateRecordSnapshotCell(recId, activeTabId, colKey, val);
    }
  };

  const getActiveData = () => {
    if (activeTabId === 'master') return record.cells;
    const snap = record.tabs_history?.find(t => t.id === activeTabId);
    return snap ? snap.data : record.cells;
  };
  const activeData = getActiveData();

  const getPrevData = () => {
    if (!record.tabs_history || activeTabId === 'master') return null;
    const snapIndex = record.tabs_history.findIndex(t => t.id === activeTabId);
    if (snapIndex > 0) return record.tabs_history[snapIndex - 1].data;
    return null;
  };
  const prevData = getPrevData();

  const isEmpty = (val: any) => {
    if (val === undefined || val === null || val === '') return true;
    if (Array.isArray(val) && val.length === 0) return true;
    if (typeof val === 'object' && val !== null && !Array.isArray(val) && Object.keys(val).length === 0) return true;
    return false;
  };

  const deepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (isEmpty(a) && isEmpty(b)) return true;
    if (a === null || a === undefined || b === null || b === undefined) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return String(a) === String(b);
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  };

  const hasFieldChanged = (colKey: string) => {
    if (!prevData) return false; // If there is no previous tab, hide everything as there are no changes relative to a previous state
    const currentVal = activeData[colKey];
    const prevVal = prevData[colKey];
    
    if (isEmpty(currentVal) && isEmpty(prevVal)) return false;
    return !deepEqual(currentVal, prevVal);
  };

  const getMasterMultiValues = (colKey: string) => {
    if (!record.tabs_history || record.tabs_history.length === 0) {
       const val = record.cells[colKey];
       if (val !== undefined && val !== null && val !== '') return [val];
       return [];
    }
    const values = new Set<string>();
    record.tabs_history.forEach(tab => {
       const v = tab.data[colKey];
       if (v !== undefined && v !== null && v !== '') {
          if (Array.isArray(v)) {
             v.forEach(item => values.add(typeof item === 'object' ? JSON.stringify(item) : String(item)));
          } else {
             values.add(typeof v === 'object' ? JSON.stringify(v) : String(v));
          }
       }
    });
    return Array.from(values);
  };

  const getVisibleCols = () => {
    return orderedCols.filter(col => {
      if (activeTabId !== 'master' && showChangedOnly && !hasFieldChanged(col.key)) {
        return false;
      }
      return true;
    });
  };

  const getColCopyValue = (colKey: string) => {
    if (activeTabId === 'master') {
      const vals = getMasterMultiValues(colKey);
      if (vals.length === 0) return '';
      return vals.join(', ').replace(/\n/g, ' ');
    } else {
      const val = activeData[colKey];
      if (val === undefined || val === null) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val).replace(/\n/g, ' ');
    }
  };

  const handleCopyValues = () => {
    const visibleCols = getVisibleCols();
    const values = visibleCols.map(col => getColCopyValue(col.key));
    navigator.clipboard.writeText(values.join('\t'));
  };

  const handleCopyWithHeaders = () => {
    const visibleCols = getVisibleCols();
    const headers = visibleCols.map(col => col.label.replace(/\n/g, ' '));
    const values = visibleCols.map(col => getColCopyValue(col.key));
    const tsv = `${headers.join('\t')}\n${values.join('\t')}`;
    navigator.clipboard.writeText(tsv);
  };

  const handleDeleteTab = () => {
    if (activeTabId === 'master') return;
    const isConfirmed = window.confirm("Are you sure you want to delete this historical tab? This cannot be undone.");
    if (!isConfirmed) return;
    deleteRecordSnapshot(record.id, activeTabId);
    setActiveTabId('master');
  };

  return (
    <Dialog.Root open={!!expandedRecordId} onOpenChange={(open) => !open && closeExpandedRecord()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40  z-50 animate-in fade-in" />
        <Dialog.Content 
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full h-full md:max-w-5xl md:max-h-[85vh] md:h-[85vh] bg-surface-raised md:rounded-[24px] shadow-lg flex flex-col z-[100] overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          {/* Rename Dialog Overlay */}
          {tabToRename && (
            <div className="absolute inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
              <div className="bg-surface-raised w-full max-w-sm rounded-xl border border-divider shadow-2xl p-6 animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-text-primary mb-4">Rename Tab</h3>
                <input 
                  autoFocus
                  type="text" 
                  value={newTabName}
                  onChange={e => setNewTabName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg   outline-none text-text-primary mb-6"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      renameRecordSnapshot(record.id, tabToRename.id, newTabName);
                      setTabToRename(null);
                    } else if (e.key === 'Escape') {
                      setTabToRename(null);
                    }
                  }}
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setTabToRename(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface transition-colors">Cancel</button>
                  <button onClick={() => { renameRecordSnapshot(record.id, tabToRename.id, newTabName); setTabToRename(null); }} className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors">Save</button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Dialog Overlay */}
          {tabToDelete && (
            <div className="absolute inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
              <div className="bg-surface-raised w-full max-w-sm rounded-xl border border-divider shadow-2xl p-6 animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-text-primary mb-2">Delete Tab</h3>
                <p className="text-sm text-text-muted mb-6">Are you sure you want to delete this historical tab? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setTabToDelete(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface transition-colors">Cancel</button>
                  <button onClick={() => { deleteRecordSnapshot(record.id, tabToDelete); if (activeTabId === tabToDelete) setActiveTabId('master'); setTabToDelete(null); }} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col px-4 md:px-10 py-4 md:py-6 shrink-0 border-b border-divider bg-surface-raised sticky top-0 z-20 shadow-sm gap-3 md:gap-4">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-2xl md:text-4xl font-bold text-text-primary truncate pr-4 tracking-tight">
                {headerTitle}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Expanded record details and changelog
              </Dialog.Description>
              <div className="flex items-center gap-3">
                {record._timezone && (
                  <div className="px-2.5 py-1 bg-surface border border-border rounded-lg shadow-sm flex flex-col items-center justify-center">
                     <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{record._timezone}</span>
                  </div>
                )}
                <Dialog.Close asChild>
                  <button className="p-2 rounded-lg hover:bg-surface-sunken text-text-primary opacity-70 hover:opacity-100 transition-colors shrink-0 outline-none  ">
                    <X size={24} />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-divider pb-2 md:pb-3 px-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTabId('master')}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all shrink-0 flex items-center gap-2 border ${activeTabId === 'master' ? 'bg-accent/10 border-accent/20 text-accent shadow-sm' : 'bg-transparent border-transparent text-text-muted hover:bg-surface-sunken hover:text-text-primary'}`}
              >
                {activeTabId === 'master' && <Activity size={14} />}
                Master
              </button>
              {(record.tabs_history || []).map(tab => (
                <div key={tab.id} className={`group flex items-center pl-1 pr-0.5 py-0.5 rounded-xl transition-all shrink-0 whitespace-nowrap border ${activeTabId === tab.id ? 'bg-accent/10 border-accent/20 text-accent shadow-sm' : 'bg-transparent border-transparent hover:bg-surface-sunken text-text-muted hover:text-text-primary'}`}>
                  <button
                    onClick={() => setActiveTabId(tab.id)}
                    className="pl-2 pr-1.5 py-1 text-sm font-semibold bg-transparent transition-colors shrink-0 outline-none flex items-center gap-1.5"
                  >
                    {activeTabId === tab.id && <Clock size={14} />}
                    {tab.name}
                  </button>

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className={`p-1 mr-0.5 rounded-md outline-none bg-transparent transition-all ${activeTabId === tab.id ? 'hover:bg-accent/20 text-accent' : 'opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary hover:bg-border'}`}>
                        <MoreVertical size={14} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content align="start" className="bg-surface-raised border border-border shadow-lg rounded-xl p-1 z-[120] min-w-[150px] animate-in fade-in zoom-in-95">
                        <DropdownMenu.Item 
                          onSelect={() => { setTabToRename({ id: tab.id, name: tab.name }); setNewTabName(tab.name); }}
                          className="px-3 py-2 text-sm text-text-primary hover:bg-surface cursor-pointer rounded-lg transition-colors outline-none font-medium flex items-center gap-2"
                        >
                          Rename Tab
                        </DropdownMenu.Item>
                        <DropdownMenu.Item 
                          onSelect={() => setTabToDelete(tab.id)}
                          className="px-3 py-2 text-sm text-red-600 hover:bg-red-500/10 cursor-pointer rounded-lg transition-colors outline-none font-medium flex items-center gap-2 mt-1"
                        >
                          Delete Tab
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              ))}
              
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="ml-2 p-1.5 rounded-full hover:bg-surface-sunken text-text-muted hover:text-text-primary transition-colors shrink-0 outline-none">
                    <Plus size={16} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="start" className="bg-surface-raised border border-border shadow-lg rounded-xl p-2 z-[120] min-w-[220px] flex flex-col gap-1 animate-in fade-in zoom-in-95">
                    <DropdownMenu.Item 
                      onSelect={() => addRecordSnapshot(record.id, 'manual', {})}
                      className="px-3 py-2 text-sm text-text-primary hover:bg-surface cursor-pointer rounded-lg transition-colors outline-none font-medium"
                    >
                      Create New Empty Tab
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      onSelect={() => {
                        const prevData = record.tabs_history?.length ? record.tabs_history[record.tabs_history.length - 1].data : record.cells;
                        addRecordSnapshot(record.id, 'manual', { ...prevData });
                      }}
                      className="px-3 py-2 text-sm text-text-primary hover:bg-surface cursor-pointer rounded-lg transition-colors outline-none font-medium"
                    >
                      Duplicate Previous Tab
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>



            {/* Search, Actions, and Navigation Pills */}
            <div className="flex flex-col gap-2 md:gap-3">
              <div className="flex flex-row items-center gap-2 md:gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search fields..."
                    className="w-full bg-surface-sunken border border-border rounded-lg pr-4 py-2 text-sm text-text-primary   outline-none transition-all"
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap pb-1 sm:pb-0 px-1 py-1 -m-1">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="shrink-0 p-2 md:p-2.5 rounded-lg bg-surface border border-border shadow-sm text-text-primary hover:bg-surface-raised hover:border-accent/50 transition-all focus:outline-none flex items-center justify-center">
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content align="end" className="bg-surface-raised border border-border shadow-lg rounded-xl p-1 z-[120] min-w-[240px] flex flex-col gap-1 animate-in fade-in zoom-in-95">
                        {activeTabId !== 'master' && (
                          <>
                            <DropdownMenu.Item 
                              onSelect={(e) => {
                                e.preventDefault();
                                setShowChangedOnly(!showChangedOnly);
                              }}
                              className="px-3 py-2 text-sm text-text-primary hover:bg-surface cursor-pointer rounded-lg transition-colors outline-none font-medium flex items-center gap-3 justify-between"
                            >
                              <span className="whitespace-nowrap">Show Changed Fields Only</span>
                              <input 
                                type="checkbox" 
                                checked={showChangedOnly} 
                                readOnly
                                className="w-4 h-4 shrink-0 rounded border-border text-accent accent-accent pointer-events-none"
                              />
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="h-px bg-divider my-0.5 mx-1" />
                          </>
                        )}
                        <DropdownMenu.Item 
                          onSelect={handleCopyValues}
                          className="px-3 py-2 text-sm text-text-primary hover:bg-surface cursor-pointer rounded-lg transition-colors outline-none font-medium flex items-center gap-2"
                        >
                          <Copy size={16} className="text-text-muted" />
                          Copy Values
                        </DropdownMenu.Item>
                        <DropdownMenu.Item 
                          onSelect={handleCopyWithHeaders}
                          className="px-3 py-2 text-sm text-text-primary hover:bg-surface cursor-pointer rounded-lg transition-colors outline-none font-medium flex items-center gap-2"
                        >
                          <FileText size={16} className="text-text-muted" />
                          Copy with Headers
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>
              <div className="flex gap-1.5 md:gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-2 px-1 pt-1 -mx-1">
                {orderedCols
                  .filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(col => {
                    const isHidden = hiddenFieldKeys.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        onClick={() => scrollToField(col.key, isHidden)}
                        className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full bg-surface border border-border shadow-sm text-xs font-medium text-text-secondary hover:text-text-primary hover:border-accent/50 hover:shadow transition-all focus:outline-none  "
                      >
                        {col.label}
                      </button>
                    );
                })}
              </div>
            </div>
          </div>

          {/* Body: Split Layout */}
          <div className="flex-1 overflow-y-auto md:overflow-hidden md:grid md:grid-cols-3 h-full">
            {/* Left Side (Form) */}
            <div className="md:col-span-2 md:overflow-y-auto no-scrollbar p-6 md:p-8 space-y-6 md:space-y-5 relative">
              {visibleCols.map(col => {
                if (showChangedOnly && activeTabId !== 'master' && !hasFieldChanged(col.key)) {
                  return null;
                }
                const value = activeData[col.key];

                return (
                  <div 
                    key={col.key} 
                    className={`flex flex-col gap-2 scroll-mt-[200px] p-2 -mx-2 rounded-xl transition-all duration-700 ${highlightedField === col.key ? 'bg-accent/10 ring-2 ring-accent shadow-sm' : ''}`} 
                    ref={(el) => { if (el) fieldRefs.current.set(col.key, el); }}
                  >
                    <label className="text-xs uppercase font-bold text-text-muted tracking-widest pl-1">
                      {col.label}
                    </label>
                    {activeTabId === 'master' ? (
                      <div className="flex flex-wrap gap-2 p-3 bg-surface-sunken border border-border rounded-lg min-h-[42px] items-center">
                        {(() => {
                           const multiValues = getMasterMultiValues(col.key);
                           if (multiValues.length === 0) {
                              return <span className="text-sm text-text-muted italic">No data</span>;
                           }
                           return multiValues.map((v, i) => (
                              <span key={i} className="px-2.5 py-1 bg-surface border border-border rounded-md text-sm font-medium text-text-primary shadow-sm break-all">
                                {String(v)}
                              </span>
                           ));
                        })()}
                      </div>
                    ) : (
                      <GridCell
                        recordId={record.id}
                        colKey={col.key}
                        columnType={col.type}
                        columnTypeOptions={col.typeOptions}
                        initialValue={value}
                        isSelected={false}
                        isActiveEditor={true}
                        updateRecordCell={handleUpdateCell}
                        isModalMode={true}
                      />
                    )}
                  </div>
                );
              })}

              {hiddenCols.length > 0 && (
                <div className="pt-6 border-t border-border mt-10">
                  <button 
                    onClick={() => setShowHiddenFields(!showHiddenFields)}
                    className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors outline-none"
                  >
                    {showHiddenFields ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    Show hidden fields
                  </button>

                  {showHiddenFields && (
                    <div className="mt-6 space-y-5">
                      {hiddenCols.map(col => {
                        if (showChangedOnly && activeTabId !== 'master' && !hasFieldChanged(col.key)) {
                          return null;
                        }
                        const value = activeData[col.key];

                        return (
                          <div 
                            key={col.key} 
                            className={`flex flex-col gap-2 scroll-mt-[200px] p-2 -mx-2 rounded-xl transition-all duration-700 ${highlightedField === col.key ? 'opacity-100 bg-accent/10 ring-2 ring-accent shadow-sm' : 'opacity-80'}`} 
                            ref={(el) => { if (el) fieldRefs.current.set(col.key, el); }}
                          >
                            <label className="text-xs uppercase font-bold text-text-muted tracking-widest pl-1">
                              {col.label}
                            </label>
                            {activeTabId === 'master' ? (
                              <div className="flex flex-wrap gap-2 p-3 bg-surface-sunken border border-border rounded-lg min-h-[42px] items-center">
                                {(() => {
                                   const multiValues = getMasterMultiValues(col.key);
                                   if (multiValues.length === 0) {
                                      return <span className="text-sm text-text-muted italic">No data</span>;
                                   }
                                   return multiValues.map((v, i) => (
                                      <span key={i} className="px-2.5 py-1 bg-surface border border-border rounded-md text-sm font-medium text-text-primary shadow-sm break-all">
                                        {String(v)}
                                      </span>
                                   ));
                                })()}
                              </div>
                            ) : (
                              <GridCell
                                recordId={record.id}
                                colKey={col.key}
                                columnType={col.type}
                                columnTypeOptions={col.typeOptions}
                                initialValue={value}
                                isSelected={false}
                                isActiveEditor={true}
                                updateRecordCell={handleUpdateCell}
                                isModalMode={true}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side (Changelog) */}
            <div className="md:col-span-1 bg-surface-sunken md:border-l border-t md:border-t-0 border-divider md:overflow-y-auto no-scrollbar p-6 flex flex-col">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
                <Activity size={16} className="text-accent" />
                Activity Log
              </h3>
              
              <div className="flex-1 space-y-6">
                {!record.changelog || record.changelog.length === 0 ? (
                  <div className="text-sm text-text-muted italic text-center mt-10">
                    No recent activity.
                  </div>
                ) : (
                  record.changelog.map((log, index) => {
                    const renderLogValue = (val: string) => {
                      if (!val) return <span className="italic opacity-50 text-[11px]">empty</span>;
                      if (val.includes(',')) {
                        return (
                          <span className="inline-flex flex-wrap gap-1 items-center">
                            {val.split(',').map((v, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-semibold tracking-wide border border-accent/20 uppercase">
                                {v.trim()}
                              </span>
                            ))}
                          </span>
                        );
                      }
                      return <span className="font-semibold text-text-primary px-1.5 py-0.5 rounded-md bg-surface-raised border border-border inline-block text-[11px]">{val}</span>;
                    };

                    return (
                      <div key={log.id} className="relative pl-8 pb-8">
                        {/* Timeline Line */}
                        {index !== record.changelog!.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-px bg-divider" />
                        )}
                        
                        {/* Timeline Dot */}
                        <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-surface border-[1.5px] border-border shadow-sm flex items-center justify-center z-10">
                          <Clock size={10} className="text-accent" />
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                            {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                          </span>
                          <div className="text-[13px] text-text-secondary leading-relaxed flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-text-primary">{log.userName || 'Unknown User'}</span>
                            <span>changed the</span>
                            <span className="font-bold text-text-primary text-[11px] uppercase tracking-wider px-1">{log.fieldName}</span>
                            <span>of</span>
                            <span className="font-bold text-text-primary">{log.firstCellValue || (orderedCols.length > 0 ? String(record.cells[orderedCols[0].key] || '') : 'Unknown Row')}</span>
                            <span>from</span>
                            {renderLogValue(log.oldValue)}
                            <span className="text-text-muted font-bold">to</span>
                            {renderLogValue(log.newValue)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
