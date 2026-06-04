import React from 'react';
import { useStore } from '../../store/useStore';
import { LayoutGrid, Table } from 'lucide-react';
import { ICONS } from '../Shared/IconColorPicker';

export function NavigationStrip() {
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWsId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  const setActiveViewId = useStore(state => state.setActiveViewId);

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWsId);
  const workspaceViews = activeWs?.views || [];



  if (!activeWsId || workspaceViews.length === 0) {
    return (
      <div className="border-b border-divider flex items-center px-4 h-[var(--tabs-h)] bg-surface">
        <span className="text-[13px] text-text-muted italic">No views available</span>
      </div>
    );
  }

  return (
    <div className="border-b border-divider flex items-center px-4 h-[var(--tabs-h)] py-2 md:py-0 bg-surface shrink-0 overflow-x-auto no-scrollbar gap-2 relative">
      
      

      {workspaceViews.map(view => {
        const isActive = view.id === activeViewId;
        console.log(`Rendering view: ${view.id}, name: ${view.name}, isActive: ${isActive}, activeViewId: ${activeViewId}`);
        const DefaultIcon = view.viewType === 'card' ? LayoutGrid : Table;
        const ViewIcon = view.iconName && ICONS[view.iconName] ? ICONS[view.iconName] : DefaultIcon;
        return (
          <button
            key={view.id}
            data-view-id={view.id}
            onClick={() => {
              if (React.startTransition) {
                React.startTransition(() => setActiveViewId(view.id));
              } else {
                setActiveViewId(view.id);
              }
            }}
            className={`relative flex items-center justify-center gap-2 px-5 h-8 rounded-full text-[14px] font-medium ${
              isActive 
                ? 'nav-pill-active' 
                : 'nav-pill-inactive hover:bg-[rgba(var(--text-color),0.05)]'
            }`}
          >
            {/* Active Pill Background */}
            {isActive && (
              <div 
                className="absolute inset-0 rounded-full shadow-sm"
                style={{ zIndex: 0 }}
              />
            )}
            <div className="relative flex items-center gap-2 z-10">
              <ViewIcon 
                size={16} 
                style={{ color: !isActive && view.iconColor ? view.iconColor : undefined }}
                className={!view.iconColor || isActive ? 'text-current' : undefined} 
              />
              <span className="whitespace-nowrap">{view.name}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
