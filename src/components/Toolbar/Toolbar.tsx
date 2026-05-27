import React from 'react';
import { useStore } from '../../store/useStore';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Slider from '@radix-ui/react-slider';
import { Search, Undo2, Redo2, Settings, Check, Clock, ChevronRight, Palette, Palette as PaletteIcon, Sun, Moon, Menu, X, RefreshCw } from 'lucide-react';
import { DatabaseDropdown } from './DatabaseDropdown';
import { WorkspaceDropdown } from './WorkspaceDropdown';
import { ViewDropdown } from './ViewDropdown';
import { SortPopover } from './SortPopover';
import { SettingsMenu } from './SettingsMenu';
import { FilterPopover } from './FilterPopover';
import { HideFieldsPopover } from './HideFieldsPopover';
import { GlobalTimezoneClock } from './GlobalTimezoneClock';
import { AdminPanelModal } from '../Admin/AdminPanelModal';
import { ShieldAlert } from 'lucide-react';

const THEMES = [
  { id: 'clinical-light', name: 'Clinical Light', type: 'light' },
  { id: 'warm-light', name: 'Warm Light', type: 'light' },
  { id: 'midnight-blue', name: 'Midnight Blue', type: 'dark' },
  { id: 'oled-black', name: 'OLED Black', type: 'dark' },
];

export function Toolbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = React.useState(false);

  const theme = useStore(state => state.theme);
  const currentUser = useStore(state => state.currentUser);
  const setTheme = useStore(state => state.setTheme);
  
  const rowHeight = useStore(state => state.rowHeight);
  const setRowHeight = useStore(state => state.setRowHeight);
  
  const timeWidgetEnabled = useStore(state => state.timeWidgetEnabled);
  
  const searchQuery = useStore(state => state.searchQuery);
  const setSearchQuery = useStore(state => state.setSearchQuery);

  const pastStates = useStore(state => state.past);
  const futureStates = useStore(state => state.future);
  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);
  const stagedEvictions = useStore(state => state.stagedEvictions);
  const forceEvictAll = useStore(state => state.forceEvictAll);
  const syncFromCloud = useStore(state => state.syncFromCloud);
  const isSyncing = useStore(state => state.isSyncing);
  const updateView = useStore(state => state.updateView);

  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  const calculateMissingTimezones = useStore(state => state.calculateMissingTimezones);

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);

  const [localRowHeight, setLocalRowHeight] = React.useState(rowHeight === 'compact' ? 34 : rowHeight === 'tall' ? 48 : 40);

  React.useEffect(() => {
    setLocalRowHeight(rowHeight === 'compact' ? 34 : rowHeight === 'tall' ? 48 : 40);
  }, [rowHeight]);

  const handleRowHeightChange = (vals: number[]) => {
    const val = vals[0];
    setLocalRowHeight(val);
    document.documentElement.style.setProperty('--row-h', `${val}px`);
    window.dispatchEvent(new CustomEvent('rowHeightChange', { detail: val }));
  };

  const handleRowHeightCommit = (vals: number[]) => {
    const val = vals[0];
    if (val <= 34) setRowHeight('compact');
    else if (val >= 48) setRowHeight('tall');
    else setRowHeight('standard');
  };

  const handleBorderOpacityChange = (vals: number[]) => {
    document.documentElement.style.setProperty('--grid-line-opacity', `${vals[0]}%`);
  };

  const handleZebraOpacityChange = (vals: number[]) => {
    document.documentElement.style.setProperty('--zebra-opacity', `${vals[0]}%`);
  };




  return (
    <div className="flex items-center justify-between w-full h-[var(--header-h)] px-4 border-b border-divider bg-surface/95  sticky top-0 z-50 shrink-0 gap-2">
      
      {/* Mobile Hamburger Trigger */}
      <div className="flex md:hidden items-center">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-sunken transition-colors outline-none">
          <Menu size={20} />
        </button>
      </div>

      {/* Left Group (Desktop) */}
      <div className="hidden md:flex items-center gap-2">
        <DatabaseDropdown />
        <WorkspaceDropdown />
        <ViewDropdown />
        
        <div className="w-px h-6 bg-divider mx-1" />
        
        <FilterPopover />
        <SortPopover />
        <HideFieldsPopover />
        
        <SettingsMenu />
      </div>

      {timeWidgetEnabled && (
        <div className="flex-1 flex justify-center scale-75 md:scale-100 origin-center">
          <GlobalTimezoneClock />
        </div>
      )}

      {/* Right Group */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Global Search */}
        <div className="relative group w-40 md:w-64">
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-surface-sunken hover:bg-surface focus:bg-surface border border-transparent focus:outline-none focus:ring-[3px] focus:ring-focus-ring rounded-full h-8 px-4 text-[13px] transition-all placeholder:text-text-muted text-text-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="w-px h-6 bg-divider hidden md:block" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => undo()}
            disabled={pastStates?.length === 0}
            className="flex items-center justify-center p-2 rounded-full text-text-muted hover:text-text-secondary hover:bg-surface-sunken disabled:opacity-30 disabled:hover:bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-focus-ring"
            title="Undo (Cmd+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button 
            onClick={() => redo()}
            disabled={futureStates?.length === 0}
            className="flex items-center justify-center p-2 rounded-full text-text-muted hover:text-text-secondary hover:bg-surface-sunken disabled:opacity-30 disabled:hover:bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-focus-ring"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>
          <button 
            onClick={() => {
              forceEvictAll();
              syncFromCloud();
            }}
            className={`flex items-center justify-center p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-focus-ring ${Object.keys(stagedEvictions).length > 0 ? 'text-danger hover:bg-danger/10 bg-danger/5 animate-pulse' : 'text-text-muted hover:text-text-secondary hover:bg-surface-sunken'}`}
            title="Refresh Database & View"
          >
            <RefreshCw size={16} className={isSyncing || Object.keys(stagedEvictions).length > 0 ? "animate-spin" : ""} />
          </button>
          
          {currentUser?.role?.toLowerCase() === 'admin' && (
            <button 
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center justify-center p-2 rounded-full text-accent hover:bg-accent/10 transition-all focus:outline-none focus:ring-2 focus:ring-focus-ring ml-1 relative group"
              title="Admin Logs"
            >
              <ShieldAlert size={16} />
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-raised border border-border/50 text-text-primary text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                Admin Logs
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Slide-out Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] flex md:hidden animate-in fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-[85%] max-w-sm h-full bg-surface-raised shadow-2xl flex flex-col animate-in slide-in-from-left">
            <div className="p-4 border-b border-divider flex items-center justify-between bg-surface sticky top-0 z-10">
              <span className="font-bold text-text-primary text-lg">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-surface-sunken text-text-secondary outline-none">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5 bg-canvas">
              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider pl-1 mb-1">Navigation</h4>
                <DatabaseDropdown />
                <WorkspaceDropdown />
                <ViewDropdown />
              </div>

              <div className="w-full h-px bg-divider" />

              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider pl-1 mb-1">View Configuration</h4>
                <FilterPopover />
                <SortPopover />
                <HideFieldsPopover />
              </div>
              
              <div className="w-full h-px bg-divider" />
              
              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider pl-1 mb-1">Settings</h4>
                <SettingsMenu />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isAdminModalOpen && (
        <AdminPanelModal onClose={() => setIsAdminModalOpen(false)} />
      )}
    </div>
  );
}
