import React from 'react';
import { useStore } from '../../store/useStore';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Slider from '@radix-ui/react-slider';
import { Search, Undo2, Redo2, Settings, Check, Clock, ChevronRight, Palette, Palette as PaletteIcon, Sun, Moon, Menu, X, RefreshCw, User, ChevronDown } from 'lucide-react';

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

export function Toolbar({ projectedData }: { projectedData?: any[] }) {
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
    <div className="flex items-center justify-between w-full h-[var(--header-h)] px-4 border-b border-divider bg-surface shrink-0 gap-2 z-50 overflow-x-auto no-scrollbar">
        
        {/* Mobile Hamburger Trigger */}
        <div className="flex lg:hidden items-center shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-sunken transition-colors outline-none">
            <Menu size={20} />
          </button>
        </div>

        {/* Left Group (Desktop) */}
        <div className="hidden lg:flex items-center gap-1 shrink-0">
          {currentUser && currentUser.name ? (
            <div className="flex items-center pr-3 border-r border-divider mr-1">
              <SettingsMenu 
                projectedData={projectedData}
                onOpenAdmin={() => setIsAdminModalOpen(true)}
                triggerNode={
                  <button className="flex items-center hover:bg-surface-sunken hover:opacity-80 transition-all rounded outline-none cursor-pointer py-1 px-1.5">
                    <User size={14} className="text-text-secondary mr-1" />
                    <span className="text-[13px] font-bold text-text-primary px-1 whitespace-nowrap">
                      {currentUser.name}
                    </span>
                    <ChevronDown size={14} className="text-text-secondary ml-1" />
                  </button>
                }
              />
            </div>
          ) : (
            <SettingsMenu projectedData={projectedData} onOpenAdmin={() => setIsAdminModalOpen(true)} />
          )}

          <WorkspaceDropdown />
          <ViewDropdown />
          
          <div className="w-px h-6 bg-divider mx-2" />
          
          <FilterPopover />
          <SortPopover />
          <HideFieldsPopover />
        </div>

        {timeWidgetEnabled && (
          <div className="hidden xl:flex flex-1 justify-center origin-center">
            <GlobalTimezoneClock />
          </div>
        )}

        {/* Right Group */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Global Search */}
          <div className="relative group w-40 md:w-64">
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-surface-sunken hover:bg-surface-sunken focus:bg-surface border border-transparent focus:outline-none   rounded-full h-[34px] pl-4 pr-4 text-[13px] transition-all placeholder:text-text-muted text-text-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-px h-6 bg-divider hidden md:block mx-1" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-2">
          <button 
            onClick={() => undo()}
            disabled={pastStates?.length === 0}
            className="flex items-center justify-center px-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors focus:outline-none"
            title="Undo (Cmd+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button 
            onClick={() => redo()}
            disabled={futureStates?.length === 0}
            className="flex items-center justify-center px-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors focus:outline-none"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>
          <button 
            onClick={() => {
              forceEvictAll();
              syncFromCloud();
            }}
            className={`flex items-center justify-center px-1 transition-colors focus:outline-none ${Object.keys(stagedEvictions).length > 0 ? 'text-danger hover:text-danger animate-pulse' : 'text-text-muted hover:text-text-primary'}`}
            title="Refresh Database & View"
          >
            <RefreshCw size={16} className={isSyncing || Object.keys(stagedEvictions).length > 0 ? "animate-spin" : ""} />
          </button>
        </div>
        </div>

      {/* Mobile Slide-out Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] flex lg:hidden animate-in fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-[85%] max-w-sm h-full bg-surface-raised shadow-2xl flex flex-col animate-in slide-in-from-left">
            <div className="p-4 border-b border-divider flex items-center justify-between bg-surface sticky top-0 z-10">
              <span className="font-bold text-text-primary text-lg">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-surface-sunken text-text-secondary outline-none">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3 bg-canvas">

              <MobileAccordionSection title="Workspace">
                <WorkspaceDropdown asInlineMobile={true} />
              </MobileAccordionSection>

              <MobileAccordionSection title="Views">
                <ViewDropdown asInlineMobile={true} />
              </MobileAccordionSection>

              <MobileAccordionSection title="Filter">
                <FilterPopover asInlineMobile={true} />
              </MobileAccordionSection>
              
              <MobileAccordionSection title="Sort">
                <SortPopover asInlineMobile={true} />
              </MobileAccordionSection>

              <MobileAccordionSection title="Hide">
                <HideFieldsPopover asInlineMobile={true} />
              </MobileAccordionSection>
              
              <MobileAccordionSection title="Settings">
                <SettingsMenu asInlineMobile={true} projectedData={projectedData} />
              </MobileAccordionSection>
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

function MobileAccordionSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  return (
    <div className="flex flex-col">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left py-2 px-1 outline-none group rounded hover:bg-surface-sunken transition-colors"
      >
        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider group-hover:text-text-primary transition-colors">{title}</h4>
        <ChevronRight size={14} className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <div className="flex flex-col gap-2 pt-2 animate-in slide-in-from-top-1 fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
