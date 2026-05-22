import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useProjectedData } from './hooks/useProjectedData';
import { Toolbar } from './components/Toolbar/Toolbar';
import { NavigationStrip } from './components/Navigation/NavigationStrip';
import { DataGrid } from './components/Grid/DataGrid';
import { CardView } from './components/Grid/CardView';

import { ExpandedRecordModal } from './components/Grid/ExpandedRecordModal';
import { Database } from 'lucide-react';

function App() {
  // Bind global keyboard shortcuts (Undo/Redo, Navigation, Selection Actions)
  useKeyboardShortcuts();

  const theme = useStore((state) => state.theme);
  const isHydrated = useStore((state) => state.isHydrated);
  const hydrateStore = useStore((state) => state.hydrateStore);
  const toastMessage = useStore((state) => state.toastMessage);

  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  
  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);
  
  const projectedData = useProjectedData();
  const viewType = currentView?.viewType || 'grid';

  useEffect(() => {
    // Apply theme data attribute to document root
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    hydrateStore();
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen h-screen flex items-center justify-center bg-surface text-text-primary transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-accent blur-xl opacity-20 animate-pulse rounded-full" />
            <Database size={48} className="text-accent animate-bounce relative z-10" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">Loading Workspace...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex flex-col bg-surface text-text-primary transition-colors duration-300 overflow-hidden">
      <Toolbar />
      <NavigationStrip />
      
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {viewType === 'grid' && <DataGrid records={projectedData} />}
        {viewType === 'card' && <CardView records={projectedData} />}

      </main>

      <ExpandedRecordModal />

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-4 z-[999]">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
