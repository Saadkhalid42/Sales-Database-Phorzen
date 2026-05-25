import React, { useRef, useState, useLayoutEffect } from 'react';
import { useStore } from '../../store/useStore';
import { LayoutGrid, Table } from 'lucide-react';

export function NavigationStrip() {
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWsId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  const setActiveViewId = useStore(state => state.setActiveViewId);

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWsId);
  const workspaceViews = activeWs?.views || [];

  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useLayoutEffect(() => {
    if (!containerRef.current || !activeViewId) return;
    
    // Find the active tab button
    const activeTab = containerRef.current.querySelector(`[data-view-id="${activeViewId}"]`) as HTMLElement;
    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
        opacity: 1
      });
    }
  }, [activeViewId, workspaceViews]);

  if (!activeWsId || workspaceViews.length === 0) {
    return (
      <div className="border-b border-divider flex items-center px-4 h-[var(--tabs-h)] bg-surface">
        <span className="text-[13px] text-text-muted italic">No views available</span>
      </div>
    );
  }

  return (
    <div className="border-b border-divider flex items-center px-4 h-[var(--tabs-h)] bg-surface shrink-0 overflow-x-auto no-scrollbar gap-1 relative" ref={containerRef}>
      
      {/* Sliding Background Indicator */}
      <div 
        className="absolute h-7 rounded-full bg-accent shadow-[0_0_12px_2px_color-mix(in_srgb,var(--accent)_50%,transparent)] transition-snappy will-change-transform pointer-events-none z-0"
        style={{
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity
        }}
      />

      {workspaceViews.map(view => {
        const isActive = view.id === activeViewId;
        const ViewIcon = view.viewType === 'card' ? LayoutGrid : Table;
        return (
          <button
            key={view.id}
            data-view-id={view.id}
            onClick={() => setActiveViewId(view.id)}
            className={`relative z-10 flex items-center gap-1.5 px-3 h-7 rounded-full text-[13px] font-medium transition-snappy focus:outline-none ${
              isActive 
                ? 'text-white' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ViewIcon 
              size={14} 
              style={{ color: view.iconColor || undefined }}
              className={!view.iconColor ? 'text-text-muted' : undefined} 
            />
            <span className="whitespace-nowrap">{view.name}</span>
          </button>
        );
      })}
    </div>
  );
}
