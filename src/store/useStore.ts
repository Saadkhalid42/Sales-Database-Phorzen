import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { analyzeDateColumn, extractSelectOptions, convertValue } from '../utils/DataEngine';
import { temporal } from 'zundo';
import Papa from 'papaparse';
import { loadDatabases, saveDatabases } from '../lib/storage';
import { getTimezoneFromPhone } from '../lib/timezones';

export interface GridColumn {
  key: string;
  label: string;
  type: string;
  width: number;
  typeOptions?: Record<string, any>;
}

export interface SortConfig {
  colKey: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  colKey: string;
  operator: string;
  value: any;
}

export interface ChangelogEntry {
  id: string;
  timestamp: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
}

export interface GridRecord {
  id: string;
  cells: Record<string, any>;
  _flagged?: Record<string, boolean>;
  changelog?: ChangelogEntry[];
  _timezone?: string | null;
  _isSoftEvicted?: boolean;
  _evictionMode?: 'click-away' | 'timer' | 'evicting';
}


export interface View {
  filterJoinOperator?: 'and' | 'or';
  id: string;
  name: string;
  iconName?: string;
  iconColor?: string;
  filters: FilterConfig[];
  sorts: SortConfig[];
  hiddenFields: string[];
  columnOrder: string[];
  isFilterDisabled?: boolean;
  viewType?: 'grid' | 'card';
  showTimezones?: boolean;
  frozenField?: string | null;
  ownerId?: string;
}

export interface Workspace {
  id: string;
  name: string;
  iconName?: string;
  iconColor?: string;
  views: View[];
  ownerId?: string;
}

export interface Database {
  id: string;
  name: string;
  columns: GridColumn[];
  records: GridRecord[];
  workspaces: Workspace[];
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  permissions: {
    can_edit_cells: boolean;
    can_delete_rows: boolean;
    can_create_views: boolean;
    can_change_field_types: boolean;
    can_create_workspaces?: boolean;
    can_filter?: boolean;
    can_sort?: boolean;
  };
}

export interface AppState {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;

  selectedRowIds: string[];
  toggleRowSelection: (recordId: string) => void;
  selectAllRows: (recordIds: string[]) => void;
  clearRowSelection: () => void;
  deleteRecords: (recordIds: string[]) => void;
  isHydrated: boolean;
  hydrateStore: () => Promise<void>;

  theme: string;
  setTheme: (theme: string) => void;
  
  altColoringEnabled: boolean;
  setAltColoringEnabled: (enabled: boolean) => void;
  timeWidgetEnabled?: boolean;
  setTimeWidgetEnabled?: (enabled: boolean) => void;
  rowHeight: 'compact' | 'standard' | 'tall';
  setRowHeight: (height: 'compact' | 'standard' | 'tall') => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  expandedRecordId: string | null;
  openExpandedRecord: (id: string) => void;
  closeExpandedRecord: () => void;
  selectionRange: { startRowId: string, startColKey: string, endRowId: string, endColKey: string } | null;
  setSelectionRange: (range: { startRowId: string, startColKey: string, endRowId: string, endColKey: string } | null) => void;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;

  dateInterceptModal: {
    isOpen: boolean;
    sampleDate: string;
    resolve: ((result: { sourceFormat: string, displayFormat: string } | null) => void) | null;
  };
  openDateIntercept: (sampleDate: string) => Promise<{ sourceFormat: string, displayFormat: string } | null>;
  closeDateIntercept: () => void;

  notifiedFieldKeys: string[];
  toggleFieldNotification: (colKey: string, enabled: boolean) => void;

  confirmModal: {
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: (() => void) | null;
  };
  openConfirmModal: (title: string, description: string, onConfirm: () => void) => void;
  closeConfirmModal: () => void;
  
  past: Array<{ databases: Database[] }>;
  future: Array<{ databases: Database[] }>;
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;

  stagedEvictions: Record<string, { mode: 'locked' | 'countdown' | 'evicting', addedAt: number }>;
  stageEviction: (recordId: string, mode: 'locked' | 'countdown' | 'evicting') => void;
  clearEviction: (recordId: string) => void;
  commitEviction: (recordId: string) => void;
  forceEvictAll: () => void;

  remoteMutations: Record<string, number>;
  activeRealtimeChannel: any;
  initRealtime: (workspaceId: string | null) => void;
  syncFromCloud: () => Promise<void>;
  isSyncing: boolean;

  // 3-Tier Data
  databases: Database[];
  activeDatabaseId: string | null;
  activeWorkspaceId: string | null;
  activeViewId: string | null;

  setActiveDatabaseId: (id: string | null) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  setActiveViewId: (id: string | null) => void;

  // Database CRUD
  addDatabase: (db: Omit<Database, 'columns' | 'records' | 'workspaces'>) => void;
  importDatabase: (db: Database) => void;
  renameDatabase: (id: string, name: string) => void;
  deleteDatabase: (id: string) => void;

  // Column CRUD (applies to active database)
  addColumn: (col: GridColumn, options?: { insertAfterKey?: string; insertBeforeKey?: string }) => void;
  updateColumn: (key: string, updates: Partial<GridColumn>) => void;
  changeColumnType: (colKey: string, newType: string, newTypeOptions?: any, providedDateContext?: string) => void;
  deleteColumn: (key: string) => void;
  duplicateColumn: (colKey: string) => void;

  // Record CRUD (applies to active database)
  addRecord: (record: GridRecord) => void;
  updateRecord: (id: string, newValues: Record<string, any>) => void;
  updateRecordCell: (id: string, colKey: string, value: any) => void;
  deleteRecord: (id: string) => void;
  updateRecordCells: (updates: { recordId: string, colId: string, value: any }[]) => void;
  calculateMissingTimezones: () => void;

  // Workspace CRUD (applies to active database)
  addWorkspace: (ws: Omit<Workspace, 'views'>) => void;
  updateWorkspace: (id: string, name: string, iconName?: string, iconColor?: string) => void;
  deleteWorkspace: (id: string) => void;

  // View CRUD (applies to active workspace)
  addView: (view: Omit<View, 'filters' | 'sorts' | 'hiddenFields' | 'frozenFields' | 'columnOrder'>) => void;
  updateView: (id: string, updates: Partial<Omit<View, 'id'>>) => void;
  deleteView: (id: string) => void;
  duplicateView: (viewId: string) => void;
  reorderViews: (activeId: string, overId: string) => void;
  freezeColumn: (viewId: string, colKey: string) => void;
  unfreezeColumn: (viewId: string) => void;
  toggleFilters: (viewId: string, disabled: boolean) => void;
}

const initialColumns: GridColumn[] = [];

const initialRecords: GridRecord[] = [];

const initialDatabases: Database[] = [
  { 
    id: 'db1', 
    name: 'Main Database',
    columns: initialColumns,
    records: initialRecords,
    workspaces: [
      {
        id: 'ws1',
        name: 'Sales Leads',
        iconName: 'Monitor',
        iconColor: '#3b82f6',
        views: [
          { id: 'v1', name: 'Pipeline', iconName: 'Layout', iconColor: '#10b981', filters: [], sorts: [], hiddenFields: [], columnOrder: [], isFilterDisabled: false, viewType: 'grid' }
        ]
      },
      {
        id: 'ws2',
        name: 'Contracts',
        iconName: 'FileText',
        iconColor: '#ec4899',
        views: [
          { id: 'v2', name: 'All Contracts', iconName: 'Layout', iconColor: '#3b82f6', filters: [], sorts: [], hiddenFields: [], columnOrder: [], isFilterDisabled: false, viewType: 'grid' }
        ]
      }
    ]
  }
];

const CLIENT_ID = Math.random().toString(36).substring(2, 15);

export const useStore = create<AppState>()(
  temporal(
    (set, get) => ({
      isSyncing: false,
      syncFromCloud: async () => {
        set({ isSyncing: true });
        const data = await loadDatabases();
        if (data && data.length > 0) {
          set({ databases: data });
        }
        set({ isSyncing: false });
      },
      remoteMutations: {},
      activeRealtimeChannel: null,
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      selectedRowIds: [],
      toggleRowSelection: (recordId) => set((state) => {
        const isSelected = state.selectedRowIds.includes(recordId);
        return {
          selectedRowIds: isSelected 
            ? state.selectedRowIds.filter(id => id !== recordId)
            : [...state.selectedRowIds, recordId]
        };
      }),
      selectAllRows: (recordIds) => set({ selectedRowIds: recordIds }),
      clearRowSelection: () => set({ selectedRowIds: [] }),
      deleteRecords: (recordIds) => {
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role?.toLowerCase() !== 'admin' && !currentUser.permissions?.can_delete_rows) {
          get().setToastMessage("Permission denied: You cannot delete rows.");
          return;
        }
        get().takeSnapshot();
        
        supabase.from('activity_logs').insert({
          user_name: currentUser?.name || 'Unknown',
          action_description: `Deleted ${recordIds.length} rows`,
          table_id: get().activeDatabaseId
        }).then(({ error }) => { if (error) console.error(error); });

        set((state) => {
          const dbIndex = state.databases.findIndex(db => db.id === state.activeDatabaseId);
          if (dbIndex === -1) return state;
          
          const newDatabases = [...state.databases];
          const newDb = { ...newDatabases[dbIndex] };
          
          newDb.records = newDb.records.filter(r => !recordIds.includes(r.id));
          newDatabases[dbIndex] = newDb;
          
          return { databases: newDatabases, selectedRowIds: [] };
        });
      },
      stagedEvictions: {},
      stageEviction: (recordId, mode) => set((state) => ({
        stagedEvictions: { ...state.stagedEvictions, [recordId]: { mode, addedAt: Date.now() } }
      })),
      clearEviction: (recordId) => set((state) => {
        const newEvictions = { ...state.stagedEvictions };
        delete newEvictions[recordId];
        return { stagedEvictions: newEvictions };
      }),
      forceEvictAll: () => set((state) => ({ stagedEvictions: {} })),
      commitEviction: (recordId) => {
        set((state) => {
          if (!state.stagedEvictions[recordId]) return state;
          return {
            stagedEvictions: { 
              ...state.stagedEvictions, 
              [recordId]: { ...state.stagedEvictions[recordId], mode: 'evicting' } 
            }
          };
        });
        
        // After 200ms of animation, finalize and completely unmount
        setTimeout(() => {
          set((state) => {
            const newEvictions = { ...state.stagedEvictions };
            delete newEvictions[recordId];
            return { stagedEvictions: newEvictions };
          });
        }, 200);
      },
      isHydrated: false,
      hydrateStore: async () => {
        // Attempt to fetch LocalStorage device state FIRST
        let deviceState: any = null;
        try {
          const snapshot = localStorage.getItem('antigravity_device_state_snapshot');
          if (snapshot) {
            deviceState = JSON.parse(snapshot);
          }
        } catch (e) {
          console.error("Failed to parse device state snapshot", e);
        }

        const storedDatabases = await loadDatabases();
        const dbs = (storedDatabases && storedDatabases.length > 0) ? storedDatabases : initialDatabases;
        
        // Deep merge device state configurations over the databases
        if (deviceState && deviceState.databaseConfigs) {
          deviceState.databaseConfigs.forEach((configDb: any) => {
            const realDb = dbs.find((d: any) => d.id === configDb.id);
            if (realDb) {
              // Merge columns
              if (configDb.columns) {
                configDb.columns.forEach((configCol: any) => {
                  const realCol = realDb.columns.find((c: any) => c.key === configCol.key);
                  if (realCol) {
                    realCol.width = configCol.width;
                    if (configCol.typeOptions) realCol.typeOptions = configCol.typeOptions;
                  }
                });
              }
              // Merge workspaces and views
              if (configDb.workspaces) {
                configDb.workspaces.forEach((configWs: any) => {
                  const realWs = realDb.workspaces.find((w: any) => w.id === configWs.id);
                  if (realWs && configWs.views) {
                    configWs.views.forEach((configView: any) => {
                      const realView = realWs.views.find((v: any) => v.id === configView.id);
                      if (realView) {
                        Object.assign(realView, configView);
                      }
                    });
                  }
                });
              }
            }
          });
        }

        let targetDb = dbs.find(db => db.id === deviceState?.activeDatabaseId);
        if (!targetDb) targetDb = dbs.find(db => db.name === 'Sales Database');
        if (!targetDb && dbs.length > 0) targetDb = dbs[0];

        const activeDbId = targetDb ? targetDb.id : 'db1';
        let activeWsId = targetDb?.workspaces.find(ws => ws.id === deviceState?.activeWorkspaceId)?.id;
        if (!activeWsId) activeWsId = targetDb?.workspaces[0]?.id || 'ws1';
        
        const activeWs = targetDb?.workspaces.find(ws => ws.id === activeWsId);
        let activeVId = activeWs?.views.find(v => v.id === deviceState?.activeViewId)?.id;
        if (!activeVId) activeVId = activeWs?.views[0]?.id || 'v1';

        set({ 
          databases: dbs, 
          isHydrated: true,
          activeDatabaseId: activeDbId,
          activeWorkspaceId: activeWsId,
          activeViewId: activeVId,
          ...(deviceState?.theme && { theme: deviceState.theme }),
          ...(deviceState?.altColoringEnabled !== undefined && { altColoringEnabled: deviceState.altColoringEnabled }),
          ...(deviceState?.timeWidgetEnabled !== undefined && { timeWidgetEnabled: deviceState.timeWidgetEnabled }),
          ...(deviceState?.rowHeight && { rowHeight: deviceState.rowHeight }),
          ...(deviceState?.notifiedFieldKeys && { notifiedFieldKeys: deviceState.notifiedFieldKeys }),
        });
      },
      theme: 'theme-default-light',
      setTheme: (theme) => set({ theme }),

      altColoringEnabled: false,
      setAltColoringEnabled: (enabled) => set({ altColoringEnabled: enabled }),
      timeWidgetEnabled: true,
      setTimeWidgetEnabled: (enabled) => set({ timeWidgetEnabled: enabled }),
      
      rowHeight: 'standard',
      setRowHeight: (height) => set({ rowHeight: height }),

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      expandedRecordId: null,
      openExpandedRecord: (id) => set({ expandedRecordId: id }),
      closeExpandedRecord: () => set({ expandedRecordId: null }),

      selectionRange: null,
      setSelectionRange: (range) => set({ selectionRange: range }),

      toastMessage: null,
      setToastMessage: (msg) => set({ toastMessage: msg }),

      dateInterceptModal: { isOpen: false, sampleDate: '', resolve: null },
      openDateIntercept: (sampleDate: string) => {
        return new Promise((resolve) => {
          set({
            dateInterceptModal: {
              isOpen: true,
              sampleDate,
              resolve
            }
          });
        });
      },
      closeDateIntercept: () => set((state) => {
        if (state.dateInterceptModal.resolve) {
          state.dateInterceptModal.resolve(null);
        }
        return { dateInterceptModal: { isOpen: false, sampleDate: '', resolve: null } };
      }),

      notifiedFieldKeys: [],
      toggleFieldNotification: (colKey, enabled) => set((state) => {
        const keys = new Set(state.notifiedFieldKeys);
        if (enabled) {
          keys.add(colKey);
        } else {
          keys.delete(colKey);
        }
        return { notifiedFieldKeys: Array.from(keys) };
      }),

      confirmModal: {
        isOpen: false,
        title: '',
        description: '',
        onConfirm: null
      },
      openConfirmModal: (title, description, onConfirm) => set({
        confirmModal: { isOpen: true, title, description, onConfirm }
      }),
      closeConfirmModal: () => set((state) => ({
        confirmModal: { ...state.confirmModal, isOpen: false }
      })),


      past: [],
      future: [],
      takeSnapshot: () => {
        const state = get();
        try {
          const snapshot = {
            databases: JSON.parse(JSON.stringify(state.databases))
          };
          set({ past: [...state.past.slice(-49), snapshot], future: [] });
        } catch (e) {
          console.error("Snapshot failed", e);
        }
      },
      undo: () => set((state) => {
        if (state.past.length === 0) return state;
        const lastPast = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);
        const clone = JSON.parse(JSON.stringify(state.databases));
        const newFuture = [...state.future, { databases: clone }];
        return { past: newPast, future: newFuture, databases: lastPast.databases };
      }),
      redo: () => set((state) => {
        if (state.future.length === 0) return state;
        const lastFuture = state.future[state.future.length - 1];
        const newFuture = state.future.slice(0, state.future.length - 1);
        const clone = JSON.parse(JSON.stringify(state.databases));
        const newPast = [...state.past, { databases: clone }];
        return { past: newPast, future: newFuture, databases: lastFuture.databases };
      }),
      databases: initialDatabases,
      activeDatabaseId: 'db1',
      activeWorkspaceId: 'ws1',
      activeViewId: 'v1',

      setActiveDatabaseId: (id) => set({ activeDatabaseId: id }),
      setActiveWorkspaceId: (id) => {
        set({ activeWorkspaceId: id });
        get().initRealtime(id);
      },
      setActiveViewId: (id) => set({ activeViewId: id }),

      initRealtime: (workspaceId) => {
        const state = get();
        if (state.activeRealtimeChannel) {
          state.activeRealtimeChannel.unsubscribe();
        }

        if (!workspaceId) {
          set({ activeRealtimeChannel: null });
          return;
        }

        const channel = supabase.channel(`workspace:${workspaceId}`);
        channel.on('broadcast', { event: 'cell_mutation' }, (payload) => {
          const { row_id, field_id, new_value, client_id } = payload.payload;
          
          if (client_id === CLIENT_ID) return; // Skip our own broadcast

          set((s) => {
            if (!s.activeDatabaseId) return s;
            const dbIndex = s.databases.findIndex(d => d.id === s.activeDatabaseId);
            if (dbIndex === -1) return s;

            const newDatabases = [...s.databases];
            const newDb = { ...newDatabases[dbIndex] };
            const rIndex = newDb.records.findIndex(r => r.id === row_id);
            
            if (rIndex > -1) {
              const newRecords = [...newDb.records];
              const record = { ...newRecords[rIndex], cells: { ...newRecords[rIndex].cells } };
              record.cells[field_id] = new_value;
              newRecords[rIndex] = record;
              newDb.records = newRecords;
              newDatabases[dbIndex] = newDb;

              const mutationKey = `${row_id}_${field_id}`;
              
              // Clean up the pulse effect after 1s
              setTimeout(() => {
                set((innerState) => {
                  const newMutations = { ...innerState.remoteMutations };
                  delete newMutations[mutationKey];
                  return { remoteMutations: newMutations };
                });
              }, 1000);

              return { 
                databases: newDatabases,
                remoteMutations: { ...s.remoteMutations, [mutationKey]: Date.now() }
              };
            }
            return s;
          });
        });

        channel.subscribe();
        set({ activeRealtimeChannel: channel });
      },

      // DATABASE MUTATIONS
      addDatabase: (db) => set((state) => ({ 
        databases: [...state.databases, { ...db, columns: [], records: [], workspaces: [] }], 
        activeDatabaseId: db.id 
      })),
      importDatabase: (db) => set((state) => ({
        databases: [...state.databases, db],
        activeDatabaseId: db.id
      })),
      renameDatabase: (id, name) => set((state) => ({
        databases: state.databases.map(db => db.id === id ? { ...db, name } : db)
      })),
      deleteDatabase: (id) => set((state) => ({
        databases: state.databases.filter(db => db.id !== id),
        activeDatabaseId: state.activeDatabaseId === id ? null : state.activeDatabaseId
      })),

      // COLUMN MUTATIONS
      addColumn: (col, options) => set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            const newCols = [...db.columns];
            if (options?.insertAfterKey) {
              const idx = newCols.findIndex(c => c.key === options.insertAfterKey);
              if (idx === -1) newCols.push(col);
              else newCols.splice(idx + 1, 0, col);
            } else if (options?.insertBeforeKey) {
              const idx = newCols.findIndex(c => c.key === options.insertBeforeKey);
              if (idx === -1) newCols.unshift(col);
              else newCols.splice(idx, 0, col);
            } else {
              newCols.push(col);
            }

            const newWorkspaces = db.workspaces.map(ws => {
              if (ws.id !== state.activeWorkspaceId) return ws;
              return {
                ...ws,
                views: ws.views.map(v => {
                  if (v.id !== state.activeViewId) return v;
                  const newOrder = v.columnOrder?.length ? [...v.columnOrder] : db.columns.map(c => c.key);
                  if (options?.insertAfterKey) {
                    const idx = newOrder.indexOf(options.insertAfterKey);
                    if (idx === -1) newOrder.push(col.key);
                    else newOrder.splice(idx + 1, 0, col.key);
                  } else if (options?.insertBeforeKey) {
                    const idx = newOrder.indexOf(options.insertBeforeKey);
                    if (idx === -1) newOrder.unshift(col.key);
                    else newOrder.splice(idx, 0, col.key);
                  } else {
                    newOrder.push(col.key);
                  }
                  return { ...v, columnOrder: newOrder };
                })
              };
            });

            return { ...db, columns: newCols, workspaces: newWorkspaces };
          })
        };
      }),
      duplicateColumn: (colKey) => set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            const originalIdx = db.columns.findIndex(c => c.key === colKey);
            if (originalIdx === -1) return db;
            const original = db.columns[originalIdx];
            const newKey = `${original.key}_copy_${Math.random().toString(36).substring(2, 6)}`;
            
            const newCol = {
              ...original,
              key: newKey,
              label: `${original.label} (Copy)`
            };
            
            const newCols = [...db.columns];
            newCols.splice(originalIdx + 1, 0, newCol);
            
            // Map over ALL records to clone the value
            const newRecords = db.records.map(r => {
              const cells = { ...r.cells };
              cells[newKey] = cells[original.key];
              return { ...r, cells };
            });

            const newWorkspaces = db.workspaces.map(ws => {
              if (ws.id !== state.activeWorkspaceId) return ws;
              return {
                ...ws,
                views: ws.views.map(v => {
                  if (v.id !== state.activeViewId) return v;
                  const newOrder = v.columnOrder?.length ? [...v.columnOrder] : db.columns.map(c => c.key);
                  const idx = newOrder.indexOf(colKey);
                  if (idx === -1) newOrder.push(newKey);
                  else newOrder.splice(idx + 1, 0, newKey);
                  return { ...v, columnOrder: newOrder };
                })
              };
            });
            
            return { ...db, columns: newCols, records: newRecords, workspaces: newWorkspaces };
          })
        };
      }),
      
  
      changeColumnType: (colKey, newType, newTypeOptions, providedDateContext) => {
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role?.toLowerCase() !== 'admin' && !currentUser.permissions?.can_change_field_types) {
          get().setToastMessage("Permission denied: You cannot change field types.");
          return;
        }
        get().takeSnapshot();
        
        supabase.from('activity_logs').insert({
          user_name: currentUser?.name || 'Unknown',
          action_description: `Changed column type for ${colKey} to ${newType}`,
          table_id: get().activeDatabaseId
        }).then(({ error }) => { if (error) console.error(error); });
        set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            
            const colIndex = db.columns.findIndex(c => c.key === colKey);
            if (colIndex === -1) return db;
            
            const oldCol = db.columns[colIndex];
            if (oldCol.type === newType) {
                if (newTypeOptions) {
                    const newCols = [...db.columns];
                    newCols[colIndex] = { ...oldCol, typeOptions: newTypeOptions };
                    return { ...db, columns: newCols };
                }
                return db;
            }

            const finalTypeOptions = newTypeOptions || {};
            
            // Extract options for selects
            if ((newType === 'single_select' || newType === 'multiple_select') && (!finalTypeOptions.options || finalTypeOptions.options.length === 0)) {
                const allValues = db.records.map(r => r.cells[colKey]);
                finalTypeOptions.options = extractSelectOptions(allValues);
            }
            
            // Clear options if reverting
            if (newType === 'single_line_text' || newType === 'long_text') {
                delete finalTypeOptions.options;
            }

            const newCols = [...db.columns];
            newCols[colIndex] = { ...oldCol, type: newType, typeOptions: finalTypeOptions };
            
            // Pre-calculate date context if we are parsing dates
            let dateContext = providedDateContext || 'MDY';
            if ((newType === 'date' || newType === 'created_on') && !providedDateContext) {
                dateContext = analyzeDateColumn(db.records.map(r => r.cells[colKey]));
            }
            
            const newRecords = db.records.map(r => {
                const cells = { ...r.cells };
                const rawValue = cells[colKey];
                
                // Use Data Engine
                const { value, isFlagged } = convertValue(rawValue, newType, dateContext as any);
                cells[colKey] = value;
                
                // Track flagged state
                const newFlagged = { ...(r._flagged || {}) };
                if (isFlagged) {
                    newFlagged[colKey] = true;
                    // Retain the raw unparseable value under a special key so it's not destroyed
                    cells[`_raw_${colKey}`] = rawValue;
                } else {
                    delete newFlagged[colKey];
                    delete cells[`_raw_${colKey}`];
                }

                return { ...r, cells, _flagged: newFlagged };
            });

            return { ...db, columns: newCols, records: newRecords };
          })
        };
      }); },
      updateColumn: (key, updates) => {
        get().takeSnapshot();
        set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            return { ...db, columns: db.columns.map(c => c.key === key ? { ...c, ...updates } : c) };
          })
        };
      }); },
      deleteColumn: (key) => set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            return { ...db, columns: db.columns.filter(c => c.key !== key) };
          })
        };
      }),

      // RECORD MUTATIONS
      
  updateRecord: (recordId, newValues) => {
    get().takeSnapshot();
    set((state) => {
      // We already have updateRecordCell and updateRecordCells, but some components call updateRecord directly
      // This is a stub for now if it's missing, let's implement properly:
      const dbIndex = state.databases.findIndex(db => db.id === state.activeDatabaseId);
      if (dbIndex === -1) return state;
      
      const newDatabases = [...state.databases];
      const newDb = { ...newDatabases[dbIndex] };
      const newRecords = [...newDb.records];
      
      const recordIndex = newRecords.findIndex(r => r.id === recordId);
      if (recordIndex === -1) return state;
      
      newRecords[recordIndex] = {
        ...newRecords[recordIndex],
        cells: { ...newRecords[recordIndex].cells, ...newValues }
      };
      
      newDb.records = newRecords;
      newDatabases[dbIndex] = newDb;
      
      return { databases: newDatabases };
    });
  },

  addRecord: (record) => set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            
            let _timezone = record._timezone;
            if (!_timezone) {
              const phoneColKeys = db.columns
                .filter(c => c.label.toLowerCase() === 'lead number' || c.label.toLowerCase() === 'personal number')
                .map(c => c.key);
                
              for (const key of phoneColKeys) {
                if (record.cells[key]) {
                  const tz = getTimezoneFromPhone(String(record.cells[key]));
                  if (tz) {
                    _timezone = tz;
                    break;
                  }
                }
              }
            }

            // Auto-fill created_on fields
            const newRecord = { ...record, cells: { ...record.cells } };
            const createdOnCols = db.columns.filter(c => c.type === 'created_on');
            if (createdOnCols.length > 0) {
              const now = new Date().toISOString();
              createdOnCols.forEach(col => {
                if (!newRecord.cells[col.key]) {
                  newRecord.cells[col.key] = now;
                }
              });
            }

            return { ...db, records: [...db.records, { ...newRecord, _timezone }] };
          })
        };
      }),
      deleteRecord: (id) => {
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role?.toLowerCase() !== 'admin' && !currentUser.permissions?.can_delete_rows) {
          get().setToastMessage("Permission denied: You cannot delete rows.");
          return;
        }
        get().takeSnapshot();
        
        supabase.from('activity_logs').insert({
          user_name: currentUser?.name || 'Unknown',
          action_description: `Deleted row ${id}`,
          table_id: get().activeDatabaseId
        }).then(({ error }) => { if (error) console.error(error); });
        set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            return { ...db, records: db.records.filter(r => r.id !== id) };
          })
        };
      }); },
      updateRecordCell: (recordId, colKey, value) => {
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role?.toLowerCase() !== 'admin' && !currentUser.permissions?.can_edit_cells) {
          get().setToastMessage("Permission denied: You cannot edit cells.");
          return;
        }

        const state = get();
        const db = state.databases.find(d => d.id === state.activeDatabaseId);
        if (db) {
          const currentRecord = db.records.find(r => r.id === recordId);
          if (currentRecord && currentRecord.cells[colKey] === value) {
            return; // Do nothing if unchanged
          }
        }
        
        get().takeSnapshot(); // Re-enabled safely
        
        supabase.from('activity_logs').insert({
          user_name: currentUser?.name || 'Unknown',
          action_description: `${currentUser?.name || 'Unknown'} changed cell in row ${recordId}, column ${colKey} from '${db?.records.find(r => r.id === recordId)?.cells[colKey]}' to '${value}'`,
          table_id: get().activeDatabaseId
        }).then(({ error }) => { if (error) console.error(error); });
        set((state) => {
        if (!state.activeDatabaseId) return state;
        const dbIndex = state.databases.findIndex(d => d.id === state.activeDatabaseId);
        if (dbIndex === -1) return state;

        const newDatabases = [...state.databases];
        const newDb = { ...newDatabases[dbIndex] };
        
        const rIndex = newDb.records.findIndex(r => r.id === recordId);
        if (rIndex > -1) {
          const newRecords = [...newDb.records];
          const record = { ...newRecords[rIndex], cells: { ...newRecords[rIndex].cells } };
          
          const col = newDb.columns.find(c => c.key === colKey);
          const colName = col ? col.label : colKey;
          const oldVal = record.cells[colKey];
          
          let parsedValue = value;
          let isFlagged = false;
          if (col) {
              const dateContext = col.type === 'date' || col.type === 'created_on' 
                  ? analyzeDateColumn(newDb.records.map(r => r.cells[colKey]))
                  : 'MDY';
              const result = convertValue(value, col.type, dateContext as any);
              parsedValue = result.value;
              isFlagged = result.isFlagged;
          }

          record.cells[colKey] = parsedValue;
          
          // Handle flagged invalid data
          if (isFlagged) {
              record._flagged = { ...(record._flagged || {}), [colKey]: true };
              record.cells[`_raw_${colKey}`] = value;
          } else {
              if (record._flagged) {
                  const newFlagged = { ...record._flagged };
                  delete newFlagged[colKey];
                  record._flagged = newFlagged;
              }
              delete record.cells[`_raw_${colKey}`];
          }
          
          if (col && (col.type === 'phone_number' || col.label.toLowerCase() === 'lead number' || col.label.toLowerCase() === 'personal number' || col.label.toLowerCase() === 'phone')) {
             record._timezone = getTimezoneFromPhone(String(parsedValue || '')) || null;
          }
          
          const newLog: ChangelogEntry = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            fieldName: colName,
            oldValue: String(oldVal || ''),
            newValue: String(parsedValue || '')
          };
          
          record.changelog = record.changelog ? [newLog, ...record.changelog] : [newLog];
          
          newRecords[rIndex] = record;
          newDb.records = newRecords;
          newDatabases[dbIndex] = newDb;

          // Broadcast mutation to active realtime channel
          const currentChannel = get().activeRealtimeChannel;
          if (currentChannel) {
             currentChannel.send({
               type: 'broadcast',
               event: 'cell_mutation',
               payload: {
                 row_id: recordId,
                 field_id: colKey,
                 new_value: parsedValue,
                 client_id: CLIENT_ID
               }
             });
          }
        }
        return { databases: newDatabases };
      }); },
      updateRecordCells: (updates) => {
        get().takeSnapshot();
        set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            const recordsMap = new Map(db.records.map(r => [r.id, { ...r, cells: { ...r.cells } }]));
            for (const update of updates) {
              const rec = recordsMap.get(update.recordId);
              if (rec) {
                const col = db.columns.find(c => c.key === update.colId);
                let parsedValue = update.value;
                let isFlagged = false;
                if (col) {
                  const res = convertValue(update.value, col.type, 'MDY');
                  parsedValue = res.value;
                  isFlagged = res.isFlagged;
                }
                
                rec.cells[update.colId] = parsedValue;
                
                // Handle flagged invalid data
                if (isFlagged) {
                    rec._flagged = { ...(rec._flagged || {}), [update.colId]: true };
                    rec.cells[`_raw_${update.colId}`] = update.value;
                } else {
                    if (rec._flagged) {
                        delete rec._flagged[update.colId];
                    }
                    delete rec.cells[`_raw_${update.colId}`];
                }
                
                if (col && (col.type === 'phone_number' || col.label.toLowerCase() === 'lead number' || col.label.toLowerCase() === 'personal number' || col.label.toLowerCase() === 'phone')) {
                   rec._timezone = getTimezoneFromPhone(String(parsedValue || '')) || null;
                }
              }
            }
            return { ...db, records: Array.from(recordsMap.values()) };
          })
        };
      }); },
      calculateMissingTimezones: () => set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            
            const phoneColKeys = db.columns
              .filter(c => c.label.toLowerCase() === 'lead number' || c.label.toLowerCase() === 'personal number' || c.label.toLowerCase() === 'phone')
              .map(c => c.key);
              
            if (phoneColKeys.length === 0) return db;
            
            let hasChanges = false;
            const newRecords = db.records.map(record => {
              if (record._timezone) return record;

              let newTz = null;
              for (const key of phoneColKeys) {
                if (record.cells[key]) {
                  const valStr = String(record.cells[key]);
                  const tz = getTimezoneFromPhone(valStr);
                  if (tz) {
                    newTz = tz;
                    console.log("Found Phone:", valStr, "Calculated Zone:", tz);
                    break;
                  }
                }
              }

              if (newTz) {
                hasChanges = true;
                return { ...record, _timezone: newTz };
              }
              
              return record;
            });
            
            if (!hasChanges) return db;
            return { ...db, records: newRecords };
          })
        };
      }),

      // WORKSPACE MUTATIONS
      addWorkspace: (ws) => {
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role?.toLowerCase() !== 'admin' && !currentUser.permissions?.can_create_workspaces) {
          get().setToastMessage("Permission denied: You cannot create workspaces.");
          return;
        }

        set((state) => {
          if (!state.activeDatabaseId) return state;
          return {
            databases: state.databases.map(db => {
              if (db.id !== state.activeDatabaseId) return db;
              return { ...db, workspaces: [...db.workspaces, { ...ws, views: [], ownerId: currentUser?.id }] };
            }),
            activeWorkspaceId: ws.id
          };
        });
      },
      updateWorkspace: (id, name, iconName, iconColor) => set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            return { ...db, workspaces: db.workspaces.map(ws => ws.id === id ? { ...ws, name, ...(iconName && { iconName }), ...(iconColor && { iconColor }) } : ws) };
          })
        };
      }),
      deleteWorkspace: (id) => set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            return { ...db, workspaces: db.workspaces.filter(ws => ws.id !== id) };
          }),
          activeWorkspaceId: state.activeWorkspaceId === id ? null : state.activeWorkspaceId
        };
      }),

      // VIEW MUTATIONS
      addView: (view) => {
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role?.toLowerCase() !== 'admin' && !currentUser.permissions?.can_create_views) {
          get().setToastMessage("Permission denied: You cannot create views.");
          return;
        }

        supabase.from('activity_logs').insert({
          user_name: currentUser?.name || 'Unknown',
          action_description: `Created view ${view.name}`,
          table_id: get().activeDatabaseId
        }).then(({ error }) => { if (error) console.error(error); });

        set((state) => {
        if (!state.activeDatabaseId || !state.activeWorkspaceId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            return {
              ...db,
              workspaces: db.workspaces.map(ws => {
                if (ws.id !== state.activeWorkspaceId) return ws;
                return { ...ws, views: [...ws.views, { ...view, filters: [], sorts: [], hiddenFields: [], columnOrder: [], viewType: view.viewType || 'grid', frozenField: null, ownerId: currentUser?.id }] };
              })
            };
          }),
          activeViewId: view.id
        };
      });
      },
      updateView: (id, updates) => {
        get().takeSnapshot();
        set((state) => {
        if (!state.activeDatabaseId || !state.activeWorkspaceId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            return {
              ...db,
              workspaces: db.workspaces.map(ws => {
                if (ws.id !== state.activeWorkspaceId) return ws;
                return { ...ws, views: ws.views.map(v => v.id === id ? { ...v, ...updates } : v) };
              })
            };
          })
        };
      }); },
      deleteView: (id) => set((state) => {
        if (!state.activeDatabaseId || !state.activeWorkspaceId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            return {
              ...db,
              workspaces: db.workspaces.map(ws => {
                if (ws.id !== state.activeWorkspaceId) return ws;
                return { ...ws, views: ws.views.filter(v => v.id !== id) };
              })
            };
          }),
          activeViewId: state.activeViewId === id ? null : state.activeViewId
        };
      }),
      duplicateView: (viewId) => {
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role?.toLowerCase() !== 'admin' && !currentUser.permissions?.can_create_views) {
          get().setToastMessage("Permission denied: You cannot create views.");
          return;
        }

        set((state) => {
          if (!state.activeDatabaseId || !state.activeWorkspaceId) return state;
          
          let newViewId: string | null = null;
          
          const newState = {
            databases: state.databases.map(db => {
              if (db.id !== state.activeDatabaseId) return db;
              return {
                ...db,
                workspaces: db.workspaces.map(ws => {
                  if (ws.id !== state.activeWorkspaceId) return ws;
                  const originalView = ws.views.find(v => v.id === viewId);
                  if (!originalView) return ws;
                  
                  newViewId = `view_${Math.random().toString(36).substring(2, 9)}`;
                  const newView = {
                    ...JSON.parse(JSON.stringify(originalView)),
                    id: newViewId,
                    name: `${originalView.name} Copy`,
                    ownerId: currentUser?.id
                  };
                  
                  return { ...ws, views: [...ws.views, newView] };
                })
              };
            })
          };
          
          return newViewId ? { ...newState, activeViewId: newViewId } : newState;
        });
      },
      reorderViews: (activeId, overId) => set((state) => {
        if (!state.activeDatabaseId || !state.activeWorkspaceId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            return {
              ...db,
              workspaces: db.workspaces.map(ws => {
                if (ws.id !== state.activeWorkspaceId) return ws;
                
                const oldIndex = ws.views.findIndex(v => v.id === activeId);
                const newIndex = ws.views.findIndex(v => v.id === overId);
                
                if (oldIndex === -1 || newIndex === -1) return ws;
                
                const newViews = [...ws.views];
                const [moved] = newViews.splice(oldIndex, 1);
                newViews.splice(newIndex, 0, moved);
                
                return { ...ws, views: newViews };
              })
            };
          })
        };
      }),
      freezeColumn: (viewId, colKey) => set((state) => {
        if (!state.activeDatabaseId || !state.activeWorkspaceId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            return {
              ...db,
              workspaces: db.workspaces.map(ws => {
                if (ws.id !== state.activeWorkspaceId) return ws;
                return {
                  ...ws,
                  views: ws.views.map(v => {
                    if (v.id !== viewId) return v;
                    return { ...v, frozenField: colKey };
                  })
                };
              })
            };
          })
        };
      }),
      unfreezeColumn: (viewId) => set((state) => {
        if (!state.activeDatabaseId || !state.activeWorkspaceId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            return {
              ...db,
              workspaces: db.workspaces.map(ws => {
                if (ws.id !== state.activeWorkspaceId) return ws;
                return {
                  ...ws,
                  views: ws.views.map(v => {
                    if (v.id !== viewId) return v;
                    return { ...v, frozenField: null };
                  })
                };
              })
            };
          })
        };
      }),
      toggleFilters: (viewId, disabled) => set((state) => {
        if (!state.activeDatabaseId || !state.activeWorkspaceId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            return {
              ...db,
              workspaces: db.workspaces.map(ws => {
                if (ws.id !== state.activeWorkspaceId) return ws;
                return {
                  ...ws,
                  views: ws.views.map(v => {
                    if (v.id !== viewId) return v;
                    return { ...v, isFilterDisabled: disabled };
                  })
                };
              })
            };
          })
        };
      }),
    }),
    {
      partialize: (state) => ({
        databases: state.databases,
      }),
    }
  )
);

let saveTimeout: NodeJS.Timeout;
useStore.subscribe((state, prevState) => {
  if (!state.isHydrated) return;

  // 1. Debounced IndexedDB Save for records
  if (state.databases !== prevState.databases) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveDatabases(state.databases);
    }, 500);
  }
});

let configSaveTimeout: NodeJS.Timeout;
useStore.subscribe((state) => {
  if (!state.isHydrated) return;

  clearTimeout(configSaveTimeout);
  configSaveTimeout = setTimeout(() => {
    try {
      const {
        theme,
        altColoringEnabled,
        timeWidgetEnabled,
        rowHeight,
        activeDatabaseId,
        activeWorkspaceId,
        activeViewId,
        notifiedFieldKeys,
        databases
      } = state;

      // Deep clone structural definitions without records
      const databaseConfigs = databases.map(db => ({
        id: db.id,
        name: db.name,
        columns: db.columns.map(c => ({
          key: c.key,
          width: c.width,
          typeOptions: c.typeOptions
        })),
        workspaces: db.workspaces.map(ws => ({
          id: ws.id,
          name: ws.name,
          iconName: ws.iconName,
          iconColor: ws.iconColor,
          views: ws.views // Views hold all the filters, sorts, hiddenFields configs
        }))
      }));

      const snapshot = {
        theme,
        altColoringEnabled,
        timeWidgetEnabled,
        rowHeight,
        activeDatabaseId,
        activeWorkspaceId,
        activeViewId,
        notifiedFieldKeys,
        databaseConfigs
      };

      localStorage.setItem('antigravity_device_state_snapshot', JSON.stringify(snapshot));
    } catch (e) {
      console.error("State Serialization Engine Error:", e);
    }
  }, 500);
});