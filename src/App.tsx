import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useProjectedData } from './hooks/useProjectedData';
import { Toolbar } from './components/Toolbar/Toolbar';
import { NavigationStrip } from './components/Navigation/NavigationStrip';
import { DataGrid } from './components/Grid/DataGrid';
import { CardView } from './components/Grid/CardView';

import { ExpandedRecordModal } from './components/Grid/ExpandedRecordModal';
import { DateFormatInterceptModal } from './components/Shared/DateFormatInterceptModal';
import { ConfirmModal } from './components/Shared/ConfirmModal';
import { Database } from 'lucide-react';
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications';
import { useMediaQuery } from './hooks/useMediaQuery';
import { LoginScreen } from './components/Auth/LoginScreen';

function App() {
  // Bind global keyboard shortcuts (Undo/Redo, Navigation, Selection Actions)
  useKeyboardShortcuts();
  
  // Bind realtime field notifications
  useRealtimeNotifications();

  const theme = useStore((state) => state.theme);
  const isHydrated = useStore((state) => state.isHydrated);
  const hydrateStore = useStore((state) => state.hydrateStore);
  const toastMessage = useStore((state) => state.toastMessage);

  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  const initRealtime = useStore(state => state.initRealtime);
  
  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);
  
  const currentUser = useStore(state => state.currentUser);
  const setCurrentUser = useStore(state => state.setCurrentUser);
  const [authChecking, setAuthChecking] = useState(true);

  const projectedData = useProjectedData();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const viewType = isMobile ? 'card' : (currentView?.viewType || 'grid');

  useEffect(() => {
    // Apply theme data attribute to document root
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (activeWorkspaceId) {
      initRealtime(activeWorkspaceId);
    }
  }, [activeWorkspaceId, initRealtime]);

  // Ensure active workspace and view are valid and accessible to the current user
  useEffect(() => {
    if (!currentUser || !activeDb) return;

    let needsUpdate = false;
    let nextWsId = activeWorkspaceId;
    let nextViewId = activeViewId;

    const validWorkspaces = activeDb.workspaces.filter(ws => !ws.ownerId || ws.ownerId === currentUser.id);
    const isValidWs = validWorkspaces.some(ws => ws.id === nextWsId);
    
    if (!isValidWs && validWorkspaces.length > 0) {
      nextWsId = validWorkspaces[0].id;
      needsUpdate = true;
    }

    const activeWsObj = validWorkspaces.find(ws => ws.id === nextWsId);
    if (activeWsObj) {
      const validViews = activeWsObj.views.filter(v => !v.ownerId || v.ownerId === currentUser.id);
      const isValidView = validViews.some(v => v.id === nextViewId);
      
      if (!isValidView && validViews.length > 0) {
        nextViewId = validViews[0].id;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      if (nextWsId !== activeWorkspaceId) useStore.getState().setActiveWorkspaceId(nextWsId);
      if (nextViewId !== activeViewId) useStore.getState().setActiveViewId(nextViewId);
    }
  }, [activeDatabaseId, activeWorkspaceId, activeViewId, databases, currentUser]);

  useEffect(() => {
    hydrateStore();
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !currentUser) {
        fetchProfile(session.user.id);
      } else if (!session) {
        setAuthChecking(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && !currentUser) {
        fetchProfile(session.user.id);
      } else if (!session) {
        setCurrentUser(null);
        setAuthChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const [profileRes, permsRes] = await Promise.all([
        supabase.from('user_management').select('*').eq('id', userId).single(),
        supabase.from('user_permissions').select('*').eq('user_id', userId).single()
      ]);

      if (profileRes.data && permsRes.data) {
        setCurrentUser({
          id: userId,
          name: profileRes.data.name,
          email: profileRes.data.email,
          role: profileRes.data.role,
          permissions: {
            can_edit_cells: permsRes.data.can_edit_cells,
            can_delete_rows: permsRes.data.can_delete_rows,
            can_create_views: permsRes.data.can_create_views,
            can_change_field_types: permsRes.data.can_change_field_types,
            can_create_workspaces: permsRes.data.can_create_workspaces,
            can_filter: permsRes.data.can_filter,
            can_sort: permsRes.data.can_sort,
          }
        });
      }
    } finally {
      setAuthChecking(false);
    }
  };

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

  if (authChecking) {
    return (
      <div className="min-h-screen h-screen flex items-center justify-center bg-surface text-text-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen h-screen flex flex-col transition-colors duration-300 overflow-hidden">
        <LoginScreen />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-4 z-[999]">
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex flex-col bg-surface text-text-primary transition-colors duration-300 overflow-hidden">
      <Toolbar projectedData={projectedData} />
      <NavigationStrip />
      
      <main className="flex-1 overflow-hidden relative flex flex-col bg-canvas">
        {viewType === 'grid' && <DataGrid records={projectedData} />}
        {viewType === 'card' && <CardView records={projectedData} />}

      </main>

      <ExpandedRecordModal />
      <ConfirmModal />
      <DateFormatInterceptModal />

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
