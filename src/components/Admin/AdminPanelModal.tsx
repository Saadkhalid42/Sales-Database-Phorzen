import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { X, Shield, ScrollText, UserPlus, CheckSquare, Square, Loader2, Edit2, Trash2, AlertTriangle, Webhook } from 'lucide-react';
import { MetaIntegrationSettings } from './MetaIntegrationSettings';

interface AdminPanelModalProps {
  onClose: () => void;
}

type Tab = 'users' | 'logs' | 'integrations';

export function AdminPanelModal({ onClose }: AdminPanelModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const [originalPermissions, setOriginalPermissions] = useState<Record<string, any>>({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Audit Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsHasMore, setLogsHasMore] = useState(true);
  const [logsPage, setLogsPage] = useState(0);
  const observerTarget = useRef(null);

  const fetchUsersAndPermissions = async () => {
    setLoadingUsers(true);
    try {
      const [uRes, pRes] = await Promise.all([
        supabase.from('user_management').select('*').order('created_at', { ascending: false }),
        supabase.from('user_permissions').select('*')
      ]);
      if (uRes.data) {
        // Sort admin to the top always
        const sorted = [...uRes.data].sort((a, b) => {
          if (a.role?.toLowerCase() === 'admin' && b.role?.toLowerCase() !== 'admin') return -1;
          if (b.role?.toLowerCase() === 'admin' && a.role?.toLowerCase() !== 'admin') return 1;
          return 0;
        });
        setUsers(sorted);
      }
      if (pRes.data) {
          const pMap: Record<string, any> = {};
          pRes.data.forEach(p => pMap[p.user_id] = p);
          setPermissions(pMap);
          setOriginalPermissions(JSON.parse(JSON.stringify(pMap)));
          setHasUnsavedChanges(false);
        }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLogs = async (page: number) => {
    if (!logsHasMore) return;
    setLoadingLogs(true);
    try {
      const limit = 50;
      const start = page * limit;
      const end = start + limit - 1;
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(start, end);
        
      if (error) throw error;
      
      if (data) {
        if (data.length < limit) setLogsHasMore(false);
        setLogs(prev => page === 0 ? data : [...prev, ...data]);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsersAndPermissions();
    } else if (activeTab === 'logs' && logs.length === 0) {
      fetchLogs(0);
    }
  }, [activeTab]);

  const handleObserver = useCallback(
    (entries: any) => {
      const target = entries[0];
      if (target.isIntersecting && !loadingLogs && logsHasMore && activeTab === 'logs') {
        const nextPage = logsPage + 1;
        setLogsPage(nextPage);
        fetchLogs(nextPage);
      }
    },
    [loadingLogs, logsHasMore, activeTab, logsPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      // Use a temporary client to prevent it from overwriting the Admin's local session!
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );

      const { error } = await tempClient.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: { full_name: newName }
        }
      });
      if (error) throw error;
      
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      // Small delay to allow Postgres trigger to finish creating the row
      setTimeout(async () => {
        await fetchUsersAndPermissions();
        setCreatingUser(false);
      }, 500);
    } catch (err: any) {
      alert("Error creating user: " + err.message);
      setCreatingUser(false);
    }
  };

  const togglePermission = (userId: string, permKey: string) => {
    const current = permissions[userId]?.[permKey] || false;
    const newVal = !current;
    
    setPermissions(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [permKey]: newVal }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    try {
      for (const userId of Object.keys(permissions)) {
        const current = permissions[userId];
        const original = originalPermissions[userId] || {};
        
        let changed = false;
        for (const key of ['can_edit_cells', 'can_delete_rows', 'can_create_views', 'can_change_field_types', 'can_create_workspaces', 'can_filter', 'can_sort']) {
          if (!!current[key] !== !!original[key]) changed = true;
        }
        
        if (changed) {
          const { error } = await supabase.rpc('admin_update_permissions', {
            target_user_id: userId,
            edit_cells: !!current.can_edit_cells,
            delete_rows: !!current.can_delete_rows,
            create_views: !!current.can_create_views,
            change_field_types: !!current.can_change_field_types,
            create_workspaces: !!current.can_create_workspaces,
            allow_filter: !!current.can_filter,
            allow_sort: !!current.can_sort
          });
            
          if (error) throw error;
        }
      }
      
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      setHasUnsavedChanges(false);
      setSaveStatus({ type: 'success', message: 'Permissions saved successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error("Failed to save permissions", err);
      setSaveStatus({ type: 'error', message: err.message });
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase.rpc('admin_update_user', {
        target_user_id: editingUser.id,
        new_email: editEmail,
        new_password: editPassword,
        new_name: editName
      });
      if (error) throw error;
      
      setEditingUser(null);
      await fetchUsersAndPermissions();
    } catch (err: any) {
      alert("Error updating user: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: deletingUserId
      });
      if (error) throw error;
      
      setDeletingUserId(null);
      await fetchUsersAndPermissions();
    } catch (err: any) {
      alert("Error deleting user: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-5xl h-[85vh] flex flex-col bg-surface-raised border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-surface/50">
          <div className="flex items-center gap-2 text-text-primary">
            <Shield className="text-accent" size={24} />
            <h2 className="text-xl font-semibold">Security & Admin Proxy</h2>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 px-4 pt-4 border-b border-border/50 bg-surface/30">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === 'users' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            <UserPlus size={18} /> User Management
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === 'logs' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            <ScrollText size={18} /> Audit Logs
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === 'integrations' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            <Webhook size={18} /> Integrations
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          
          {activeTab === 'users' && (
            <div className="absolute inset-0 flex flex-col p-4 gap-6 overflow-y-auto">
              
              {/* Create User Form */}
              <div className="p-4 rounded-xl bg-surface border border-border/50 shadow-sm">
                <h3 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2"><UserPlus size={16}/> Provision New User</h3>
                <form onSubmit={handleCreateUser} className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-text-secondary mb-1">Name</label>
                    <input required value={newName} onChange={e => setNewName(e.target.value)} type="text" className="w-full px-3 py-1.5 bg-surface-raised border border-border rounded-lg text-sm" placeholder="Alice" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-text-secondary mb-1">Email</label>
                    <input required value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" className="w-full px-3 py-1.5 bg-surface-raised border border-border rounded-lg text-sm" placeholder="alice@example.com" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-text-secondary mb-1">Password</label>
                    <input required value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" className="w-full px-3 py-1.5 bg-surface-raised border border-border rounded-lg text-sm" placeholder="••••••••" />
                  </div>
                  <button disabled={creatingUser} type="submit" className="px-4 py-1.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 min-w-[120px] flex justify-center items-center h-[34px]">
                    {creatingUser ? <Loader2 size={16} className="animate-spin" /> : 'Create User'}
                  </button>
                </form>
              </div>

              {/* Save Changes Header */}
              <div className="flex items-center justify-between bg-surface p-3 rounded-xl border border-border/50 shadow-sm">
                <div>
                  {saveStatus && (
                    <span className={`text-sm font-medium ${saveStatus.type === 'error' ? 'text-danger' : 'text-accent'}`}>
                      {saveStatus.message}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {hasUnsavedChanges && <span className="text-sm text-accent font-medium animate-pulse">Unsaved permission changes...</span>}
                  <button 
                    onClick={handleSavePermissions}
                    disabled={!hasUnsavedChanges || savingPermissions}
                    className="px-6 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:hover:bg-accent transition-all flex items-center gap-2"
                  >
                    {savingPermissions ? <Loader2 size={16} className="animate-spin" /> : <><CheckSquare size={16}/> Save Permissions</>}
                  </button>
                </div>
              </div>

              {/* Users Matrix */}
              <div className="flex-1 rounded-xl border border-border/50 overflow-hidden bg-surface flex flex-col">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-surface-raised sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-medium text-text-secondary border-b border-border/50">User</th>
                        <th className="px-4 py-3 font-medium text-text-secondary border-b border-border/50">Role</th>
                        <th className="px-4 py-3 font-medium text-text-secondary border-b border-border/50 text-center">Edit Cells</th>
                        <th className="px-4 py-3 font-medium text-text-secondary border-b border-border/50 text-center">Delete Rows</th>
                        <th className="px-4 py-3 font-medium text-text-secondary border-b border-border/50 text-center">Create Views</th>
                        <th className="px-4 py-3 font-medium text-text-secondary border-b border-border/50 text-center">Change Types</th>
                        <th className="px-4 py-3 font-medium text-text-secondary border-b border-border/50 text-center">Create Workspaces</th>
                        <th className="px-4 py-3 font-medium text-text-secondary border-b border-border/50 text-center">Filter</th>
                        <th className="px-4 py-3 font-medium text-text-secondary border-b border-border/50 text-center">Sort</th>
                        <th className="px-4 py-3 font-medium text-text-secondary border-b border-border/50 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        <tr><td colSpan={7} className="p-8 text-center text-text-secondary"><Loader2 className="animate-spin mx-auto" /></td></tr>
                      ) : users.map(u => (
                        <tr key={u.id} className="border-b border-border/20 hover:bg-surface-raised/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-text-primary">{u.name}</div>
                            <div className="text-xs text-text-secondary">{u.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role?.toLowerCase() === 'admin' ? 'bg-accent/20 text-accent' : 'bg-surface-raised text-text-secondary border border-border/50'}`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          {['can_edit_cells', 'can_delete_rows', 'can_create_views', 'can_change_field_types', 'can_create_workspaces', 'can_filter', 'can_sort'].map(perm => (
                            <td key={perm} className="px-4 py-3 text-center">
                              <button 
                                onClick={() => togglePermission(u.id, perm)}
                                className={`p-1 rounded transition-colors ${permissions[u.id]?.[perm] ? 'text-accent' : 'text-text-secondary/50 hover:text-text-primary'}`}
                              >
                                {permissions[u.id]?.[perm] ? <CheckSquare size={20} /> : <Square size={20} />}
                              </button>
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditName(u.name);
                                  setEditEmail(u.email);
                                  setEditPassword('');
                                }}
                                className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded transition-colors"
                                title="Edit User"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => setDeletingUserId(u.id)}
                                disabled={u.role?.toLowerCase() === 'admin'}
                                className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors focus:outline-none disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                                title={u.role?.toLowerCase() === 'admin' ? "Cannot delete admin" : "Delete User"}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="absolute inset-0 flex flex-col p-4 bg-surface">
              <div className="flex-1 rounded-xl border border-border/50 overflow-hidden flex flex-col bg-surface-raised/30">
                <div className="overflow-y-auto flex-1 p-2">
                  <table className="w-full text-left text-sm table-fixed">
                    <thead className="bg-surface sticky top-0 z-10 shadow-sm rounded-t-lg">
                      <tr>
                        <th className="px-4 py-3 font-medium text-text-secondary w-48">Time</th>
                        <th className="px-4 py-3 font-medium text-text-secondary w-48">User</th>
                        <th className="px-4 py-3 font-medium text-text-secondary">Action Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {logs.map((log, i) => (
                        <tr key={log.id || i} className="hover:bg-surface-raised/50 transition-colors">
                          <td className="px-4 py-3 text-xs text-text-secondary tabular-nums">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-medium text-text-primary">
                            {log.user_name}
                          </td>
                          <td className="px-4 py-3 text-text-primary font-mono text-xs">
                            {log.action_description}
                          </td>
                        </tr>
                      ))}
                      {loadingLogs && (
                        <tr><td colSpan={3} className="p-4 text-center"><Loader2 className="animate-spin mx-auto text-text-secondary" size={20}/></td></tr>
                      )}
                      <tr ref={observerTarget} className="h-4"></tr>
                    </tbody>
                  </table>
                  {!logsHasMore && logs.length > 0 && (
                     <div className="text-center py-4 text-xs text-text-secondary">End of logs</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="absolute inset-0 flex flex-col p-4 bg-surface overflow-y-auto">
               <div className="max-w-2xl mx-auto w-full p-6 rounded-xl border border-border/50 bg-surface-raised/30 shadow-sm">
                 <MetaIntegrationSettings />
               </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-raised border border-border/50 rounded-xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2"><Edit2 size={20}/> Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="text-text-secondary hover:text-text-primary"><X size={20}/></button>
            </div>
            <form onSubmit={handleEditUserSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} type="text" className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary   outline-none" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Email</label>
                <input value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email" className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary   outline-none" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">New Password (Optional)</label>
                <input value={editPassword} onChange={e => setEditPassword(e.target.value)} type="password" placeholder="Leave blank to keep current" className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary   outline-none" />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface transition-colors">Cancel</button>
                <button disabled={savingEdit} type="submit" className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2">
                  {savingEdit ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUserId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-raised border border-border/50 rounded-xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-danger mb-4">
              <div className="p-3 bg-danger/10 rounded-full"><AlertTriangle size={24} /></div>
              <h3 className="text-lg font-semibold">Delete User</h3>
            </div>
            <p className="text-text-secondary text-sm mb-6">
              Are you sure you want to completely delete this user? This will instantly remove their account and wipe their access permissions. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeletingUserId(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface transition-colors">Cancel</button>
              <button disabled={isDeleting} onClick={handleDeleteUser} className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger/90 disabled:opacity-50 flex items-center gap-2">
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16}/> Delete Forever</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
