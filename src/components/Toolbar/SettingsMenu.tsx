import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Slider from '@radix-ui/react-slider';
import { Settings, Clock, Check, Palette as PaletteIcon, ChevronRight, Palette, Sun, Moon, LogOut, Download, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import Papa from 'papaparse';
const THEMES = [
  { id: 'clinical-light', name: 'Clinical Light', type: 'light' },
  { id: 'warm-light', name: 'Warm Light', type: 'light' },
  { id: 'midnight-blue', name: 'Midnight Blue', type: 'dark' },
  { id: 'oled-black', name: 'OLED Black', type: 'dark' },
];

export function SettingsMenu({ asInlineMobile, projectedData, triggerNode, onOpenAdmin }: { asInlineMobile?: boolean, projectedData?: any[], triggerNode?: React.ReactNode, onOpenAdmin?: () => void }) {
  const currentViewId = useStore(state => state.activeViewId);
  const currentUser = useStore(state => state.currentUser);
  const currentView = useStore(state => state.databases.find(d => d.id === state.activeDatabaseId)?.workspaces.find(w => w.id === state.activeWorkspaceId)?.views.find(v => v.id === currentViewId));
  const updateView = useStore(state => state.updateView);
  const calculateMissingTimezones = useStore(state => state.calculateMissingTimezones);
  
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const columns = useStore(state => state.databases.find(d => d.id === state.activeDatabaseId)?.columns || []);
  


  
  const timeWidgetEnabled = useStore(state => state.timeWidgetEnabled);
  const setTimeWidgetEnabled = useStore(state => state.setTimeWidgetEnabled);
  
  const rowHeight = useStore(state => state.rowHeight);
  const setRowHeight = useStore(state => state.setRowHeight);
  
  const theme = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);

  const [open, setOpen] = React.useState(false);

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

  const handleCSVExport = () => {
    const activeDb = useStore.getState().databases.find(d => d.id === activeDatabaseId);
    if (!activeDb) return;

    const exportRecords = projectedData && projectedData.length > 0 ? projectedData : activeDb.records;
    if (exportRecords.length === 0) return;

    const hiddenFields = currentView?.hiddenFields || [];
    const orderedCols = [...columns];
    const columnOrder = currentView?.columnOrder || [];
    
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

    const visibleCols = orderedCols.filter(c => !hiddenFields.includes(c.key));

    const data = exportRecords.flatMap(record => {
      const tabs = record.tabs_history && record.tabs_history.length > 0 
        ? record.tabs_history 
        : [{ name: 'Master', data: record.cells }];

      return tabs.map(tab => {
        const row: Record<string, any> = {};
        row['Tab Name'] = tab.name || 'Original';
        
        visibleCols.forEach(col => {
          let val = tab.data[col.key];
          if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          row[col.label] = val !== undefined && val !== null ? val : '';
        });
        return row;
      });
    });

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeDb.name || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setOpen(false);
  };

  const renderInlineContent = () => (
    <div className="flex flex-col gap-2 w-full p-2">
      <label className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg text-text-primary hover:bg-accent-subtle hover:text-accent transition-colors">
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span className="text-sm">Time Zone Badge</span>
        </div>
        <input 
          type="checkbox"
          checked={currentView?.showTimezones || false}
          onChange={(e) => {
            const v = e.target.checked;
            if (currentView) {
              updateView(currentView.id, { showTimezones: v });
              if (v) calculateMissingTimezones();
            }
          }}
          className="w-4 h-4 rounded border-border text-accent "
        />
      </label>



      <label className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg text-text-primary hover:bg-accent-subtle hover:text-accent transition-colors">
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span className="text-sm">Time Widget</span>
        </div>
        <input 
          type="checkbox"
          checked={timeWidgetEnabled}
          onChange={(e) => setTimeWidgetEnabled?.(e.target.checked)}
          className="w-4 h-4 rounded border-border text-accent "
        />
      </label>

      <div className="h-px bg-divider my-2 mx-2" />

      <div className="px-3">
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-3">
            <label className="slider-label text-xs font-semibold text-text-muted uppercase tracking-wider">Row Height</label>
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
            <label className="slider-label text-xs font-semibold text-text-muted uppercase tracking-wider">Grid Line Opacity</label>
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
            <label className="slider-label text-xs font-semibold text-text-muted uppercase tracking-wider">Zebra Opacity</label>
            <Slider.Root 
              className="relative flex items-center w-full h-5 touch-none" 
              onValueChange={handleZebraOpacityChange}
              max={30} min={0} step={1}
            >
              <Slider.Track className="bg-surface-sunken relative grow rounded-full h-2">
                <Slider.Range className="absolute bg-accent rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-surface-raised border border-border shadow-sm rounded-full hover:scale-110 focus:outline-none transition-transform cursor-grab active:cursor-grabbing" />
            </Slider.Root>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Theme</label>
            {THEMES.map(t => (
              <div 
                key={t.id}
                onClick={() => setTheme(t.id)} 
                className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg transition-colors text-sm ${theme === t.id ? 'bg-accent-subtle text-accent' : 'text-text-primary hover:bg-accent-subtle hover:text-accent'}`}
              >
                <div className="flex items-center gap-2">
                  {t.type === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                  {t.name}
                </div>
                {theme === t.id && <Check size={16} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-divider my-2 mx-2" />

      {currentUser?.role?.toLowerCase() === 'admin' && onOpenAdmin && (
        <button 
          onClick={() => {
            onOpenAdmin();
            setOpen(false);
          }}
          className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-text-primary hover:bg-surface-raised transition-colors w-full text-left"
        >
          <ShieldAlert size={16} />
          <span className="text-sm font-medium">Security & Proxy</span>
        </button>
      )}

      <button 
        onClick={handleCSVExport}
        className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-text-primary hover:bg-surface-raised transition-colors w-full text-left"
      >
        <Download size={16} />
        <span className="text-sm font-medium">Export CSV</span>
      </button>

      <button 
        onClick={async () => {
          await supabase.auth.signOut();
        }}
        className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-danger hover:bg-danger/10 transition-colors w-full text-left"
      >
        <LogOut size={16} />
        <span className="text-sm font-medium">Log Out</span>
      </button>
    </div>
  );

  if (asInlineMobile) {
    return renderInlineContent();
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        {triggerNode || (
          <button className="flex items-center justify-center px-2 py-1 rounded-md text-text-secondary hover:text-text-primary transition-all focus:outline-none">
            <Settings size={14} /> <span className="md:hidden ml-2 font-medium">Settings</span>
          </button>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="w-56 border border-border shadow-md rounded-lg p-2 z-[200] mt-1 bg-surface-raised data-[state=open]:animate-dropdown-in data-[state=closed]:animate-dropdown-out max-md:!fixed max-md:!top-1/2 max-md:!left-1/2 max-md:!-translate-x-1/2 max-md:!-translate-y-1/2 max-md:!w-64 max-md:!max-w-[90vw] max-md:!max-h-[85vh] max-md:!overflow-y-auto">
          
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
            <DropdownMenu.ItemIndicator className="animate-scale-in will-change-transform">
              <Check size={14} />
            </DropdownMenu.ItemIndicator>
          </DropdownMenu.CheckboxItem>



          <DropdownMenu.CheckboxItem 
            checked={timeWidgetEnabled}
            onCheckedChange={(v) => setTimeWidgetEnabled?.(v)} 
            className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-full text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-[13px]"
          >
            <div className="flex items-center gap-2 flex-1">
              <Clock size={14} />
              <span>Time Widget</span>
            </div>
            <DropdownMenu.ItemIndicator className="animate-scale-in will-change-transform">
              <Check size={14} />
            </DropdownMenu.ItemIndicator>
          </DropdownMenu.CheckboxItem>

          <DropdownMenu.Separator className="h-px bg-divider my-1" />

          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-full text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-[13px] data-[state=open]:bg-accent-subtle data-[state=open]:text-accent">
              <div className="flex items-center gap-2">
                <Palette size={14} />
                <span>Appearance</span>
              </div>
              <ChevronRight size={14} />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent className="w-64 border border-border shadow-md rounded-lg p-4 z-[210] flex flex-col gap-6 bg-surface-raised data-[state=open]:animate-dropdown-in data-[state=closed]:animate-dropdown-out max-md:!fixed max-md:!top-1/2 max-md:!left-1/2 max-md:!-translate-x-1/2 max-md:!-translate-y-1/2 max-md:!w-64 max-md:!max-w-[90vw] max-md:!max-h-[85vh] max-md:!overflow-y-auto" sideOffset={8}>
                
                <div className="flex flex-col gap-3">
                  <label className="slider-label text-[11px] font-semibold text-text-muted uppercase tracking-wider">Row Height</label>
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
                  <label className="slider-label text-[11px] font-semibold text-text-muted uppercase tracking-wider">Grid Line Opacity</label>
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
                  <label className="slider-label text-[11px] font-semibold text-text-muted uppercase tracking-wider">Zebra Opacity</label>
                  <Slider.Root 
                    className="relative flex items-center w-full h-5 touch-none" 
                    onValueChange={handleZebraOpacityChange}
                    max={30} min={0} step={1}
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

          <DropdownMenu.Separator className="h-px bg-divider my-1" />

          {currentUser?.role?.toLowerCase() === 'admin' && onOpenAdmin && (
            <DropdownMenu.Item 
              onSelect={() => {
                onOpenAdmin();
              }}
              className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-full text-text-primary data-[highlighted]:bg-surface-sunken outline-none text-[13px] font-medium"
            >
              <div className="flex items-center gap-2 flex-1">
                <ShieldAlert size={14} />
                <span>Security & Proxy</span>
              </div>
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Item 
            onSelect={handleCSVExport}
            className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-full text-text-primary data-[highlighted]:bg-surface-sunken outline-none text-[13px] font-medium"
          >
            <div className="flex items-center gap-2 flex-1">
              <Download size={14} />
              <span>Export CSV</span>
            </div>
          </DropdownMenu.Item>

          <DropdownMenu.Item 
            onSelect={async () => {
              await supabase.auth.signOut();
            }}
            className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-full text-danger data-[highlighted]:bg-danger/10 outline-none text-[13px] font-medium"
          >
            <div className="flex items-center gap-2 flex-1">
              <LogOut size={14} />
              <span>Log Out</span>
            </div>
          </DropdownMenu.Item>

        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
