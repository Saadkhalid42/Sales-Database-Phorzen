import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Slider from '@radix-ui/react-slider';
import { Settings, Clock, Check, Palette as PaletteIcon, ChevronRight, Palette, Sun, Moon } from 'lucide-react';
import { useStore } from '../../store/useStore';
const THEMES = [
  { id: 'clinical-light', name: 'Clinical Light', type: 'light' },
  { id: 'warm-light', name: 'Warm Light', type: 'light' },
  { id: 'midnight-blue', name: 'Midnight Blue', type: 'dark' },
  { id: 'oled-black', name: 'OLED Black', type: 'dark' },
];

export function SettingsMenu() {
  const currentViewId = useStore(state => state.activeViewId);
  const currentView = useStore(state => state.databases.find(d => d.id === state.activeDatabaseId)?.workspaces.find(w => w.id === state.activeWorkspaceId)?.views.find(v => v.id === currentViewId));
  const updateView = useStore(state => state.updateView);
  const calculateMissingTimezones = useStore(state => state.calculateMissingTimezones);
  
  const altColoringEnabled = useStore(state => state.altColoringEnabled);
  const setAltColoringEnabled = useStore(state => state.setAltColoringEnabled);
  
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

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button onPointerDown={(e) => e.preventDefault()} onClick={() => setOpen(true)} className="flex items-center md:justify-center p-2 px-3 md:px-2 rounded-xl md:rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-sunken data-[state=open]:text-text-primary data-[state=open]:bg-surface-sunken transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring w-full md:w-auto">
          <Settings size={18} /> <span className="md:hidden ml-2 font-medium">Settings</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="w-56 border border-border shadow-md rounded-2xl p-2 z-[200] mt-1 bg-surface-raised data-[state=open]:animate-dropdown-in data-[state=closed]:animate-dropdown-out max-md:!fixed max-md:!top-1/2 max-md:!left-1/2 max-md:!-translate-x-1/2 max-md:!-translate-y-1/2 max-md:!w-64 max-md:!max-w-[90vw] max-md:!max-h-[85vh] max-md:!overflow-y-auto">
          
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
            checked={altColoringEnabled} 
            onCheckedChange={(v) => setAltColoringEnabled(v)} 
            className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-full text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-[13px]"
          >
            <div className="flex items-center gap-2 flex-1">
              <PaletteIcon size={14} />
              <span>Alternate Coloring</span>
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
              <DropdownMenu.SubContent className="w-64 border border-border shadow-md rounded-2xl p-4 z-[210] flex flex-col gap-6 bg-surface-raised data-[state=open]:animate-dropdown-in data-[state=closed]:animate-dropdown-out max-md:!fixed max-md:!top-1/2 max-md:!left-1/2 max-md:!-translate-x-1/2 max-md:!-translate-y-1/2 max-md:!w-64 max-md:!max-w-[90vw] max-md:!max-h-[85vh] max-md:!overflow-y-auto" sideOffset={8}>
                
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
}
