import React from 'react';
import { useStore } from '../../store/useStore';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Slider from '@radix-ui/react-slider';
import { Search, Undo2, Redo2, Settings, Check, Clock, ChevronRight, Palette, Palette as PaletteIcon, Sun, Moon, Menu, X } from 'lucide-react';
import { DatabaseDropdown } from './DatabaseDropdown';
import { WorkspaceDropdown } from './WorkspaceDropdown';
import { ViewDropdown } from './ViewDropdown';
import { SortPopover } from './SortPopover';
import { FilterPopover } from './FilterPopover';
import { HideFieldsPopover } from './HideFieldsPopover';
import { GlobalTimezoneClock } from './GlobalTimezoneClock';

const THEMES = [
  { id: 'clinical-light', name: 'Clinical Light', type: 'light' },
  { id: 'warm-light', name: 'Warm Light', type: 'light' },
  { id: 'midnight-blue', name: 'Midnight Blue', type: 'dark' },
  { id: 'oled-black', name: 'OLED Black', type: 'dark' },
];

export function Toolbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const theme = useStore(state => state.theme);
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


  const SettingsMenu = () => (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center md:justify-center p-2 px-3 md:px-2 rounded-xl md:rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-sunken data-[state=open]:text-text-primary data-[state=open]:bg-surface-sunken transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring w-full md:w-auto">
              <><Settings size={18} /> <span className="md:hidden ml-2 font-medium">Settings</span></>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="w-56 border border-border shadow-md rounded-2xl p-2 z-[200] mt-1 bg-surface-raised data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 max-md:!fixed max-md:!top-1/2 max-md:!left-1/2 max-md:!-translate-x-1/2 max-md:!-translate-y-1/2 max-md:!w-64 max-md:!max-w-[90vw] max-md:!max-h-[85vh] max-md:!overflow-y-auto">
              
              {/* Show Time Zone Toggle */}
              <DropdownMenu.CheckboxItem 
                checked={currentView?.showTimezones || false} 
                onCheckedChange={(v) => {
                  if (currentView) {
                    updateView(currentView.id, { showTimezones: v });
                    if (v) calculateMissingTimezones();
                  }
                }} 
                className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-full text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-[13px]"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Clock size={14} />
                  <span>Time Zone Badge</span>
                </div>
                <DropdownMenu.ItemIndicator>
                  <Check size={14} />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.CheckboxItem>

              {/* Alternative Coloring Toggle */}
              <DropdownMenu.CheckboxItem 
                checked={useStore(state => state.altColoringEnabled)} 
                onCheckedChange={(v) => useStore.getState().setAltColoringEnabled(v)} 
                className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-full text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-[13px]"
              >
                <div className="flex items-center gap-2 flex-1">
                  <PaletteIcon size={14} />
                  <span>Alternate Coloring</span>
                </div>
                <DropdownMenu.ItemIndicator>
                  <Check size={14} />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.CheckboxItem>

              {/* Time Widget Toggle */}
              <DropdownMenu.CheckboxItem 
                checked={timeWidgetEnabled}
                onCheckedChange={(v) => useStore.getState().setTimeWidgetEnabled?.(v)} 
                className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-full text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-[13px]"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Clock size={14} />
                  <span>Time Widget</span>
                </div>
                <DropdownMenu.ItemIndicator>
                  <Check size={14} />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.CheckboxItem>

              <DropdownMenu.Separator className="h-px bg-divider my-1" />

              {/* Appearance Sub-menu */}
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-full text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-[13px] data-[state=open]:bg-accent-subtle data-[state=open]:text-accent">
                  <div className="flex items-center gap-2">
                    <Palette size={14} />
                    <span>Appearance</span>
                  </div>
                  <ChevronRight size={14} />
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent className="w-64 border border-border shadow-md rounded-2xl p-4 z-[210] flex flex-col gap-6 bg-surface-raised data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=right]:slide-in-from-left-2 max-md:!fixed max-md:!top-1/2 max-md:!left-1/2 max-md:!-translate-x-1/2 max-md:!-translate-y-1/2 max-md:!w-64 max-md:!max-w-[90vw] max-md:!max-h-[85vh] max-md:!overflow-y-auto" sideOffset={8}>
                    
                    <div className="flex flex-col gap-3">
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Row Height</label>
                      <Slider.Root 
                        className="relative flex items-center w-full h-5 touch-none" 
                        value={[localRowHeight]} 
                        onValueChange={handleRowHeightChange}
                        onValueCommit={handleRowHeightCommit}
                        max={60} min={24} step={1}
                      >
                        <Slider.Track className="bg-surface-sunken relative grow rounded-full h-2">
                          <Slider.Range className="absolute bg-accent rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb className="block w-4 h-4 bg-surface-raised border border-border shadow-sm rounded-full hover:scale-110 focus:outline-none transition-transform cursor-grab active:cursor-grabbing" />
                      </Slider.Root>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Grid Line Opacity</label>
                      <Slider.Root 
                        className="relative flex items-center w-full h-5 touch-none" 
                        defaultValue={[10]} 
                        onValueChange={handleBorderOpacityChange}
                        max={100} min={0} step={1}
                      >
                        <Slider.Track className="bg-surface-sunken relative grow rounded-full h-2">
                          <Slider.Range className="absolute bg-accent rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb className="block w-4 h-4 bg-surface-raised border border-border shadow-sm rounded-full hover:scale-110 focus:outline-none transition-transform cursor-grab active:cursor-grabbing" />
                      </Slider.Root>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Zebra Opacity</label>
                      <Slider.Root 
                        className="relative flex items-center w-full h-5 touch-none" 
                        defaultValue={[2]} 
                        onValueChange={handleZebraOpacityChange}
                        max={20} min={0} step={1}
                      >
                        <Slider.Track className="bg-surface-sunken relative grow rounded-full h-2">
                          <Slider.Range className="absolute bg-accent rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb className="block w-4 h-4 bg-surface-raised border border-border shadow-sm rounded-full hover:scale-110 focus:outline-none transition-transform cursor-grab active:cursor-grabbing" />
                      </Slider.Root>
                    </div>

                    <div className="h-px bg-divider w-full" />
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Theme</label>
                      {THEMES.map(t => (
                        <div 
                          key={t.id}
                          onClick={() => setTheme(t.id)} 
                          className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded-full transition-colors text-[13px] ${theme === t.id ? 'bg-accent-subtle text-accent' : 'text-text-primary hover:bg-accent-subtle hover:text-accent'}`}
                        >
                          <div className="flex items-center gap-2">
                            {t.type === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                            {t.name}
                          </div>
                          {theme === t.id && <Check size={14} />}
                        </div>
                      ))}
                    </div>

                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>

            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
  );

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
        
        {SettingsMenu()}
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
        <div className="hidden md:flex items-center gap-1">
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
                {SettingsMenu()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
