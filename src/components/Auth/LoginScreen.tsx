import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database, ShieldAlert, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const setCurrentUser = useStore(state => state.setCurrentUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Fetch user_management and user_permissions
        const [profileRes, permsRes] = await Promise.all([
          supabase.from('user_management').select('*').eq('id', data.user.id).single(),
          supabase.from('user_permissions').select('*').eq('user_id', data.user.id).single()
        ]);

        if (profileRes.error) throw profileRes.error;
        if (permsRes.error) throw permsRes.error;

        setCurrentUser({
          id: data.user.id,
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
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-screen flex items-center justify-center bg-canvas text-text-primary">
      <div className="w-full max-w-md p-8 bg-surface-raised rounded-2xl shadow-2xl border border-border/50">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-accent blur-xl opacity-20 animate-pulse rounded-full" />
            <Database size={48} className="text-accent relative z-10" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Platform Access</h2>
          <p className="text-text-secondary text-sm text-center">
            Sign in to access the synchronized data environment.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2 text-red-500 text-sm">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus-visible:border-accent   transition-all"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus-visible:border-accent   transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 px-4 py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
}
