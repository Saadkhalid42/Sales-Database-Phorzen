import { useVirtualizer, defaultRangeExtractor } from '@tanstack/react-virtual';
import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import type { GridRecord } from '../../store/useStore';
import { GridCell } from './GridCell';
import { ColumnHeader } from './ColumnHeader';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Trash2, Maximize2, Copy, X } from 'lucide-react';

// COLUMNS removed, read from store instead

export function DataGrid({ records }: { records: GridRecord[] }) {
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);
  
  const columns = activeDb?.columns || [];
  const hiddenFields = currentView?.hiddenFields || [];
  const columnOrder = currentView?.columnOrder || [];
  const showTimezones = currentView?.showTimezones || false;
  const frozenField = currentView?.frozenField || null;
  
  const visibleColumns = useMemo(() => {
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

    const cols = hiddenFields.length === 0 ? orderedCols : orderedCols.filter(c => !hiddenFields.includes(c.key));

    if (frozenField) {
      const frozenIndex = cols.findIndex(c => c.key === frozenField);
      if (frozenIndex > -1) {
        const [frozenCol] = cols.splice(frozenIndex, 1);
        cols.unshift(frozenCol);
      }
    }
    return cols;
  }, [columns, hiddenFields, columnOrder, frozenField]);

  const frozenColIndices = useMemo(() => {
    return frozenField && visibleColumns.length > 0 && visibleColumns[0].key === frozenField ? [0] : [];
  }, [visibleColumns, frozenField]);

  const rowHeightSetting = useStore(state => state.rowHeight);
  const altColoringEnabled = useStore(state => state.altColoringEnabled);
  const updateRecordCell = useStore(state => state.updateRecordCell);
  const updateRecordCells = useStore(state => state.updateRecordCells);
  const searchQuery = useStore(state => state.searchQuery);
  const selectionRange = useStore(state => state.selectionRange);
  const setSelectionRange = useStore(state => state.setSelectionRange);
  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);
  const selectedRowIds = useStore(state => state.selectedRowIds) || [];
  const toggleRowSelection = useStore(state => state.toggleRowSelection);
  const clearRowSelection = useStore(state => state.clearRowSelection);
  const deleteRecords = useStore(state => state.deleteRecords);

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      // Allow default behavior for normal typing, but intercept specific hotkeys
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
  
  const addRecord = useStore(state => state.addRecord);
  const deleteRecord = useStore(state => state.deleteRecord);
  const openExpandedRecord = useStore(state => state.openExpandedRecord);

  const parentRef = useRef<HTMLDivElement>(null);
  
  // Local drag state for 60fps performance
  const [dragCurrent, setDragCurrent] = useState<{ rowId: string, colKey: string } | null>(null);
  const isDragging = useRef(false);

  const handleAddRow = () => {
    const newRecordId = 'rec_' + Math.random().toString(36).substring(2, 9);
    addRecord({ id: newRecordId, cells: {} });
    
    if (visibleColumns.length > 0) {
      setTimeout(() => {
        setSelectionRange({
          startRowId: newRecordId,
          startColKey: visibleColumns[0].key,
          endRowId: newRecordId,
          endColKey: visibleColumns[0].key
        });
      }, 50);
    }
  };

  const dynamicRowHeightRef = useRef(
    rowHeightSetting === 'compact' ? 32 : rowHeightSetting === 'tall' ? 48 : 40
  );

  useEffect(() => {
    dynamicRowHeightRef.current = rowHeightSetting === 'compact' ? 32 : rowHeightSetting === 'tall' ? 48 : 40;
  }, [rowHeightSetting]);

  const viewRecords = records;

  const rowVirtualizer = useVirtualizer({
    count: viewRecords.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: () => dynamicRowHeightRef.current,
    overscan: 10,
  });

  // Task 3: Fix TanStack Virtualizer Desync
  useEffect(() => {
    rowVirtualizer.scrollToOffset(0);
    rowVirtualizer.measure();
  }, [viewRecords.length, rowVirtualizer]);

  useEffect(() => {
    const handleRowHeightDrag = (e: any) => {
      dynamicRowHeightRef.current = e.detail;
      rowVirtualizer.measure();
    };
    window.addEventListener('rowHeightChange', handleRowHeightDrag);
    return () => window.removeEventListener('rowHeightChange', handleRowHeightDrag);
  }, [rowVirtualizer]);

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: visibleColumns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => visibleColumns[i].width,
    overscan: 5,
    rangeExtractor: useCallback((range: any) => {
      const active = new Set([
        ...frozenColIndices,
        ...defaultRangeExtractor(range)
      ]);
      return Array.from(active).sort((a, b) => a - b);
    }, [frozenColIndices]),
  });

  const columnWidths = visibleColumns.map(c => c.width).join(',');
  useEffect(() => {
    if (columnVirtualizer.measure) {
      columnVirtualizer.measure();
    }
  }, [columnWidths, columnVirtualizer]);

  // Calculate selection box indices
  const getSelectedIndices = () => {
    if (!selectionRange) return null;
    const startRowIdx = viewRecords.findIndex(r => r.id === selectionRange.startRowId);
    const startColIdx = visibleColumns.findIndex(c => c.key === selectionRange.startColKey);
    
    // Use dragCurrent if dragging, otherwise end coords
    const endRowId = isDragging.current && dragCurrent ? dragCurrent.rowId : selectionRange.endRowId;
    const endColKey = isDragging.current && dragCurrent ? dragCurrent.colKey : selectionRange.endColKey;
    
    const endRowIdx = viewRecords.findIndex(r => r.id === endRowId);
    const endColIdx = visibleColumns.findIndex(c => c.key === endColKey);

    if (startRowIdx === -1 || startColIdx === -1 || endRowIdx === -1 || endColIdx === -1) return null;

    return {
      minRow: Math.min(startRowIdx, endRowIdx),
      maxRow: Math.max(startRowIdx, endRowIdx),
      minCol: Math.min(startColIdx, endColIdx),
      maxCol: Math.max(startColIdx, endColIdx),
    };
  };

  const selIndices = getSelectedIndices();

  const lastMultiSelectRef = useRef<{ time: number; minRow: number; maxRow: number; minCol: number; maxCol: number } | null>(null);
  useEffect(() => {
    if (selIndices && (selIndices.minRow !== selIndices.maxRow || selIndices.minCol !== selIndices.maxCol)) {
      lastMultiSelectRef.current = { time: Date.now(), ...selIndices };
    } else if (lastMultiSelectRef.current) {
      lastMultiSelectRef.current.time = Date.now();
    }
  }, [selIndices]);

  const checkIsMultiSelectLocked = useCallback((rowIndex: number, colIndex: number) => {
    if (selIndices && (selIndices.minRow !== selIndices.maxRow || selIndices.minCol !== selIndices.maxCol)) return true;
    if (lastMultiSelectRef.current && Date.now() - lastMultiSelectRef.current.time < 400) {
      // If we were recently in a multi-select, and this cell was part of it, lock it.
      const { minRow, maxRow, minCol, maxCol } = lastMultiSelectRef.current;
      if (rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol) return true;
    }
    return false;
  }, [selIndices]);

  // Mouse Handlers
  const handleMouseDown = (rowId: string, colKey: string) => {
    // Paralyze drag selection if actively editing a cell
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

    isDragging.current = true;
    setSelectionRange({ startRowId: rowId, startColKey: colKey, endRowId: rowId, endColKey: colKey });
    setDragCurrent({ rowId, colKey });
  };

  const handleMouseEnter = (rowId: string, colKey: string) => {
    if (isDragging.current) {
      setDragCurrent({ rowId, colKey });
    }
  };

  const handleMouseUp = () => {
    if (isDragging.current && selectionRange && dragCurrent) {
      isDragging.current = false;
      setSelectionRange({ ...selectionRange, endRowId: dragCurrent.rowId, endColKey: dragCurrent.colKey });
      setDragCurrent(null);
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [selectionRange, dragCurrent]);

  // Keyboard Navigation & Clipboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectionRange || !selIndices) return;

    // Check if an input is currently focused (i.e., we are editing a cell)
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      const updates: { recordId: string, colId: string, value: any }[] = [];
      const { minRow, maxRow, minCol, maxCol } = selIndices;
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          updates.push({ recordId: viewRecords[r].id, colId: visibleColumns[c].key, value: '' });
        }
      }
      if (updates.length > 0) {
        useStore.getState().updateRecordCells(updates);
      }
      return;
    }

    // Navigation, expand selection
    let activeRowIdx = viewRecords.findIndex(r => r.id === selectionRange.endRowId);
    let activeColIdx = visibleColumns.findIndex(c => c.key === selectionRange.endColKey);

    let moved = false;
    if (e.key === 'ArrowUp' && activeRowIdx > 0) {
      activeRowIdx--; moved = true;
    } else if (e.key === 'ArrowDown' && activeRowIdx < viewRecords.length - 1) {
      activeRowIdx++; moved = true;
    } else if (e.key === 'ArrowLeft' && activeColIdx > 0) {
      activeColIdx--; moved = true;
    } else if (e.key === 'ArrowRight' && activeColIdx < visibleColumns.length - 1) {
      activeColIdx++; moved = true;
    }

    if (moved) {
      e.preventDefault(); // Prevent page scroll
      const rowId = viewRecords[activeRowIdx].id;
      const colKey = visibleColumns[activeColIdx].key;
      
      if (e.shiftKey) {
        // Expand selection
        setSelectionRange({ ...selectionRange, endRowId: rowId, endColKey: colKey });
      } else {
        // Single selection
        setSelectionRange({ startRowId: rowId, startColKey: colKey, endRowId: rowId, endColKey: colKey });
      }

      // Auto-scroll
      rowVirtualizer.scrollToIndex(activeRowIdx);
      columnVirtualizer.scrollToIndex(activeColIdx);
    }
  }, [selectionRange, selIndices, viewRecords, rowVirtualizer, columnVirtualizer, visibleColumns]);

  const selectionStats = useMemo(() => {
    if (!selIndices) return null;
    const { minRow, maxRow, minCol, maxCol } = selIndices;
    if (minRow === maxRow && minCol === maxCol) return null;

    let count = 0;
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    let allNumbers = true;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const record = viewRecords[r];
        const colKey = visibleColumns[c].key;
        if (!record || !colKey) continue;
        
        const rawValue = record.cells[colKey];
        if (rawValue === null || rawValue === undefined || rawValue === '') continue;

        count++;
        
        const s = String(rawValue).replace(/[^\d.\-()]/g, '');
        const valStr = s.replace(/[()]/g, '');
        const isNegative = s.startsWith('(') && s.endsWith(')');
        const num = parseFloat(valStr);

        if (isNaN(num)) {
          allNumbers = false;
        } else {
          const finalNum = isNegative ? -num : num;
          sum += finalNum;
          if (finalNum < min) min = finalNum;
          if (finalNum > max) max = finalNum;
        }
      }
    }

    if (count === 0) return null;

    if (allNumbers) {
      return {
        count,
        sum: sum.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        avg: (sum / count).toLocaleString(undefined, { maximumFractionDigits: 2 }),
        min: min.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        max: max.toLocaleString(undefined, { maximumFractionDigits: 2 })
      };
    }
    return { count };
  }, [selIndices, viewRecords, visibleColumns]);

  // Global Paste Intercept
  const handlePaste = useCallback(async (e: React.ClipboardEvent | ClipboardEvent) => {
    // Don't intercept if an input is focused
    if (document.activeElement?.tagName === 'INPUT') return;
    
    if (!selectionRange) return;
    const text = 'clipboardData' in e ? e.clipboardData?.getData('text/plain') : null;
    if (!text) return;

    const startRowIdx = viewRecords.findIndex(r => r.id === selectionRange.startRowId);
    const startColIdx = visibleColumns.findIndex(c => c.key === selectionRange.startColKey);
    if (startRowIdx === -1 || startColIdx === -1) return;

    const lines = text.split(/\r?\n/).filter(line => line.length > 0);
    const updates: any[] = [];

    lines.forEach((line, rOffset) => {
      const targetRow = viewRecords[startRowIdx + rOffset];
      if (!targetRow) return;
      const vals = line.split('\t');
      vals.forEach((val, cOffset) => {
        const targetCol = visibleColumns[startColIdx + cOffset];
        if (!targetCol) return;
        updates.push({ recordId: targetRow.id, colId: targetCol.key, value: val });
      });
    });

    if (updates.length > 0) {
      updateRecordCells(updates);
    }
  }, [selectionRange, viewRecords, visibleColumns, updateRecordCells]);

  useEffect(() => {
    const onGlobalPaste = (e: ClipboardEvent) => handlePaste(e);
    window.addEventListener('paste', onGlobalPaste);
    return () => window.removeEventListener('paste', onGlobalPaste);
  }, [handlePaste]);

  if (!activeViewId || viewRecords.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface text-text-text-muted">
        No records found.
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col flex-1 h-full w-full overflow-hidden select-none outline-none relative"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onPaste={handlePaste}
    >
      <div 
        ref={parentRef}
        className="flex-1 overflow-auto custom-scrollbar relative"
        style={{ backgroundColor: 'var(--surface-raised)', color: 'rgb(var(--text-color))' }}
      >
        <div
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize() + 40 + 40}px`, width: `${columnVirtualizer.getTotalSize() + 40}px` }}
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-40 h-10 shadow-sm" style={{ backgroundColor: 'var(--surface-raised)', borderBottom: `1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)` }}>
            <div className="absolute top-0 left-0 w-full h-full flex flex-nowrap">
              {/* Sticky Row Index Header */}
              <div 
                className="absolute top-0 h-full w-10 flex items-center justify-center text-xs font-semibold text-[rgba(var(--text-color),0.5)] shrink-0"
                style={{
                  position: 'sticky',
                  top: 0,
                  left: 0,
                  backgroundColor: 'var(--surface-raised)',
                  borderRight: `1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)`,
                  zIndex: 50
                }}
              >
                #
              </div>
              {columnVirtualizer.getVirtualItems().map((virtualCol) => {
                const col = visibleColumns[virtualCol.index];
                const isFrozen = col.key === frozenField;
                const frozenOffset = 40;
                
                return (
                  <div
                    key={virtualCol.key}
                    ref={columnVirtualizer.measureElement}
                    data-index={virtualCol.index}
                    className={`absolute top-0 h-full shrink-0`}
                    style={{
                      left: 0,
                      top: 0,
                      width: `${col.width || 150}px`,
                      transform: isFrozen ? 'none' : `translateX(${virtualCol.start + 40}px)`,
                      position: isFrozen ? 'sticky' : 'absolute',
                      ...(isFrozen ? { left: `${frozenOffset}px`, zIndex: 50, backgroundColor: 'var(--surface-raised)', borderRight: `1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)` } : { zIndex: 40, borderRight: `1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)`, backgroundColor: 'var(--surface-raised)' }),
                    }}
                  >
                    <ColumnHeader col={col} index={virtualCol.index} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          <div style={{ transform: 'translateY(40px)', position: 'absolute', top: 0, left: 0, width: '100%' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const isSyntheticRow = virtualRow.index === viewRecords.length;

              if (isSyntheticRow) {
                return (
                  <div
                    key="synthetic-add-row"
                    className="absolute top-0 left-0 w-full flex flex-nowrap transition-snappy will-change-transform group"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      borderBottom: `1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)`
                    }}
                  >
                    {/* Empty index cell */}
                    <div
                      className="absolute top-0 h-full w-10 shrink-0 bg-surface row-index-cell"
                      style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 40,
                        borderRight: `1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)`,
                      }}
                    />
                    
                    {columnVirtualizer.getVirtualItems().map((virtualCol) => {
                      const col = visibleColumns[virtualCol.index];
                      const isFrozen = col.key === frozenField;
                      const baseZIndex = isFrozen ? 40 : 10;
                      const isPrimaryCell = virtualCol.index === 0;

                      return (
                        <div
                          key={virtualCol.key}
                          className={`absolute top-0 h-full shrink-0 ${isFrozen ? 'frozen-cell' : 'standard-cell'}`}
                          style={{
                            left: 0,
                            top: 0,
                            width: `${col.width || 150}px`,
                            transform: isFrozen ? 'none' : `translateX(${virtualCol.start + 40}px)`,
                            position: isFrozen ? 'sticky' : 'absolute',
                            ...(isFrozen ? { left: '40px', zIndex: baseZIndex, borderRight: `1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)` } : { zIndex: baseZIndex, borderRight: `1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)` }),
                            backgroundColor: 'transparent'
                          }}
                        >
                          {isPrimaryCell ? (
                            <button
                              onClick={handleAddRow}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddRow();
                                }
                              }}
                              className="w-full h-full flex items-center px-4 text-text-muted hover:text-accent hover:bg-accent-subtle/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent font-medium text-[13px] bg-surface"
                            >
                              + Add row
                            </button>
                          ) : (
                            <div className="w-full h-full bg-surface-raised/20 pointer-events-none" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              const record = viewRecords[virtualRow.index];
              const isAlt = altColoringEnabled && virtualRow.index % 2 !== 0;
              const isRowActive = selectionRange?.startRowId === record.id;
              const isCheckboxSelected = selectedRowIds?.includes(record.id);
            
              return (
                <div
                  key={virtualRow.key}
                  className={`absolute top-0 left-0 w-full group transition-snappy flex flex-nowrap grid-row will-change-transform ${isAlt ? 'is-alternate' : 'is-default'} ${isCheckboxSelected ? 'is-selected' : ''}`}
                  style={{
                    height: `${virtualRow.size}px`,
                    top: `${virtualRow.start}px`,
                    borderBottom: `1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)`
                  }}
                >
                  {/* Row Index Cell */}
                  <div
                    className={`absolute top-0 h-full w-10 flex items-center justify-center text-xs text-[rgba(var(--text-color),0.5)] transition-colors shrink-0 row-index-cell`}
                    style={{
                      position: 'sticky',
                      left: 0,
                      top: 0,
                      zIndex: 40,
                      borderRight: `1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)`,
                    }}
                  >
                    <div 
                      className="flex flex-col items-center justify-center w-full h-full relative group/checkbox cursor-pointer"
                      onClick={() => toggleRowSelection && toggleRowSelection(record.id)}
                    >
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${(selectedRowIds && selectedRowIds.length > 0) || selectedRowIds?.includes(record.id) ? 'opacity-100' : 'opacity-0 group-hover/checkbox:opacity-100'}`}>
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds?.includes(record.id) || false}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer pointer-events-none"
                        />
                      </div>
                      <span className={`flex flex-col items-center justify-center ${(selectedRowIds && selectedRowIds.length > 0) || selectedRowIds?.includes(record.id) ? 'opacity-0' : 'group-hover/checkbox:opacity-0'} transition-opacity`}>
                        <span className={showTimezones && record._timezone ? 'font-semibold text-[10px]' : ''}>
                          {showTimezones && record._timezone ? record._timezone : (virtualRow.index + 1)}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  {columnVirtualizer.getVirtualItems().map((virtualCol) => {
                    const col = visibleColumns[virtualCol.index];
                    const isFrozen = col.key === frozenField;
                    const frozenOffset = 40;
                    
                    const value = record.cells[col.key] as string | number;
                    let baseZIndex = isFrozen ? 40 : 1;
                    
                    const isMultiSelect = selIndices !== null && (selIndices.minRow !== selIndices.maxRow || selIndices.minCol !== selIndices.maxCol);
                    const isSelected = selIndices !== null &&
                                     virtualRow.index >= selIndices.minRow && virtualRow.index <= selIndices.maxRow &&
                                     virtualCol.index >= selIndices.minCol && virtualCol.index <= selIndices.maxCol;
                                     
                    const isActiveEditor = selectionRange?.startRowId === record.id && selectionRange?.startColKey === col.key;
                    
                    let selectionStyle = {};
                    if (isSelected) {
                      baseZIndex = isFrozen ? 40 : (isMultiSelect ? 5 : 10);
                      if (isMultiSelect) {
                        selectionStyle = {
                          backgroundColor: isFrozen ? 'color-mix(in srgb, var(--surface-raised) 90%, rgb(var(--primary-color)))' : 'rgba(var(--primary-color), 0.08)'
                        };
                      }
                    }
                    
                    
                    
                    return (
                      <div
                        key={virtualCol.key}
                        ref={columnVirtualizer.measureElement}
                        data-index={virtualCol.index}
                        className={`absolute top-0 h-full ${virtualCol.index === 0 ? 'group/first-cell' : ''} ${isActiveEditor ? 'overflow-visible' : 'overflow-hidden'} shrink-0 ${isFrozen ? 'frozen-cell' : 'standard-cell'}`}
                        style={{
                          left: 0,
                          top: 0,
                          width: `${col.width || 150}px`,
                          transform: isFrozen ? 'none' : `translateX(${virtualCol.start + 40}px)`,
                          position: isFrozen ? 'sticky' : 'absolute',
                          ...(isFrozen ? { left: `${frozenOffset}px`, zIndex: baseZIndex, borderRight: `1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)` } : { zIndex: baseZIndex, borderRight: `1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)` }),
                          ...selectionStyle
                        }}
                        onMouseDown={() => handleMouseDown(record.id, col.key)}
                        onMouseEnter={() => handleMouseEnter(record.id, col.key)}
                      >
                        {virtualCol.index === 0 && (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/first-cell:opacity-100 transition-opacity z-10">
                            <button 
                              onClick={(e) => { e.stopPropagation(); openExpandedRecord(record.id); }}
                              className="p-1 bg-surface-raised border border-border shadow-sm rounded hover:text-accent text-text-muted focus:outline-none"
                            >
                              <Maximize2 size={12} />
                            </button>
                          </div>
                        )}
                        <GridCell
                          recordId={record.id}
                          colKey={col.key}
                          columnType={col.type}
                          columnTypeOptions={col.typeOptions}
                          initialValue={value}
                          isSelected={isSelected}
                          isMultiSelect={isMultiSelect}
                          isDragging={isDragging.current}
                          isActiveEditor={isActiveEditor}
                          checkIsMultiSelectLocked={() => checkIsMultiSelectLocked(virtualRow.index, virtualCol.index)}
                          updateRecordCell={updateRecordCell}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {/* Floating Selection Box Overlay */}
            {selIndices && (selIndices.minCol !== selIndices.maxCol || selIndices.minRow !== selIndices.maxRow) && (
              <div className="absolute pointer-events-none ring-inset ring-2 ring-accent bg-accent/10 z-10"
                style={{
                  top: `${(rowVirtualizer.getVirtualItems().find(v => v.index === selIndices.minRow)?.start || 0)}px`,
                  left: `${(columnVirtualizer.getVirtualItems().find(v => v.index === selIndices.minCol)?.start || 0) + 40}px`,
                  width: `${
                    (columnVirtualizer.getVirtualItems().find(v => v.index === selIndices.maxCol)?.start || 0) +
                    (columnVirtualizer.getVirtualItems().find(v => v.index === selIndices.maxCol)?.size || 0) -
                    (columnVirtualizer.getVirtualItems().find(v => v.index === selIndices.minCol)?.start || 0)
                  }px`,
                  height: `${
                    (rowVirtualizer.getVirtualItems().find(v => v.index === selIndices.maxRow)?.start || 0) +
                    (rowVirtualizer.getVirtualItems().find(v => v.index === selIndices.maxRow)?.size || 0) -
                    (rowVirtualizer.getVirtualItems().find(v => v.index === selIndices.minRow)?.start || 0) - 1
                  }px`
                }}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Bulk Action Bar */}
      {selectedRowIds && selectedRowIds.length > 0 && (
        <div className="fixed bottom-6 left-6 z-50 text-text-primary rounded-xl flex items-center gap-4 p-2 border border-border animate-in slide-in-from-bottom-5" style={{ zIndex: 9999, backgroundColor: "var(--surface-raised)", boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2), 0 0 30px 5px color-mix(in srgb, var(--accent) 15%, transparent)' }}>
          <div className="px-3 py-1 bg-accent-subtle text-accent rounded-lg text-sm font-bold">
            {selectedRowIds.length} Selected
          </div>
          <div className="w-px h-6 bg-divider" />
          <button 
            onClick={() => {
              const rows = viewRecords.filter(r => selectedRowIds.includes(r.id));
              const tsv = rows.map(r => visibleColumns.map(c => r.cells[c.key] || '').join('\t')).join('\n');
              navigator.clipboard.writeText(tsv);
              clearRowSelection && clearRowSelection();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-surface-sunken transition-colors"
          >
            <Copy size={16} /> Copy
          </button>
          <button 
            onClick={() => {
              const rows = viewRecords.filter(r => selectedRowIds.includes(r.id));
              const headers = visibleColumns.map(c => c.label).join('\t');
              const tsv = rows.map(r => visibleColumns.map(c => r.cells[c.key] || '').join('\t')).join('\n');
              navigator.clipboard.writeText(headers + '\n' + tsv);
              clearRowSelection && clearRowSelection();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-surface-sunken transition-colors"
          >
            <Copy size={16} /> Copy with Headers
          </button>
          <div className="w-px h-6 bg-divider" />
          <button 
            onClick={() => {
              if (deleteRecords) {
                useStore.getState().openConfirmModal(
                  'Delete Records',
                  `Are you sure you want to delete ${selectedRowIds.length} record(s)? This action cannot be undone.`,
                  () => {
                    deleteRecords(selectedRowIds);
                    if (clearRowSelection) clearRowSelection();
                  }
                );
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-danger hover:bg-danger-subtle transition-colors"
          >
            <Trash2 size={16} /> Delete
          </button>
          <div className="w-px h-6 bg-divider" />
          <button onClick={() => clearRowSelection && clearRowSelection()} className="p-1.5 hover:bg-surface-sunken rounded-lg text-text-muted">
            <X size={16} />
          </button>
        </div>
      )}
      {selectionStats && (
        <div className="fixed bottom-6 right-6 z-50 text-text-primary rounded-lg flex items-center gap-4 px-4 py-2 text-sm font-medium border border-border animate-in slide-in-from-bottom-5" style={{ zIndex: 9999, backgroundColor: 'var(--surface-raised)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2), 0 0 30px 5px color-mix(in srgb, var(--accent) 15%, transparent)' }}>
          <div className="flex gap-4">
            <span>Count: {selectionStats.count}</span>
            {selectionStats.sum !== undefined && (
              <>
                <span className="opacity-50">|</span>
                <span>Sum: {selectionStats.sum}</span>
                <span className="opacity-50">|</span>
                <span>Avg: {selectionStats.avg}</span>
                <span className="opacity-50">|</span>
                <span>Min: {selectionStats.min}</span>
                <span className="opacity-50">|</span>
                <span>Max: {selectionStats.max}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
