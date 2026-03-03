'use client';

import { useEffect, useState } from 'react';
import { ProviderId } from '@videoviber/types';
import { useAppStore } from '@/app/store';
import { providerCatalog } from '@/lib/providers';
import { toast } from 'sonner';

export default function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const deleteAllProjects = useAppStore((s) => s.deleteAllProjects);

  const [displayName, setDisplayName] = useState(settings.displayName);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const selectableProviders = providerCatalog.filter(
    (provider) => provider.id === ProviderId.GEMINI || provider.id === ProviderId.VEO
  );

  useEffect(() => {
    if (!selectableProviders.some((provider) => provider.id === settings.defaultProvider)) {
      updateSettings({ defaultProvider: ProviderId.GEMINI });
    }
  }, [selectableProviders, settings.defaultProvider, updateSettings]);

  const handleSave = () => {
    updateSettings({ displayName: displayName.trim() });
    toast.success('Settings saved');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in-up">
      <div>
        <div className="vv-badge bg-accent/10 text-accent mb-3">Account</div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-vv-secondary">Manage your account and application preferences</p>
      </div>

      {/* Profile */}
      <div className="vv-card-hover space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold">Profile</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="vv-label">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="vv-input w-full" />
          </div>
          <div className="space-y-2">
            <label className="vv-label">Email</label>
            <input type="email" placeholder="you@example.com" className="vv-input w-full opacity-60" disabled />
            <p className="text-xs text-vv-muted">Managed by your auth provider</p>
          </div>
          <button onClick={handleSave} className="vv-btn-primary">Save Changes</button>
        </div>
      </div>

      {/* Preferences */}
      <div className="vv-card-hover space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <h2 className="text-lg font-bold">Preferences</h2>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Default Provider</p>
              <p className="text-xs text-vv-muted">Used for new shot generations</p>
            </div>
            <select value={settings.defaultProvider} onChange={(e) => { updateSettings({ defaultProvider: e.target.value }); toast.success('Provider updated'); }} className="vv-input w-full sm:w-40">
              {selectableProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.shortName}
                </option>
              ))}
            </select>
          </div>
          <div className="border-t border-white/5" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Default Resolution</p>
              <p className="text-xs text-vv-muted">For exports</p>
            </div>
            <select value={settings.defaultResolution} onChange={(e) => { updateSettings({ defaultResolution: e.target.value }); toast.success('Resolution updated'); }} className="vv-input w-full sm:w-40">
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="4K">4K</option>
            </select>
          </div>
          <div className="border-t border-white/5" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Auto-save</p>
              <p className="text-xs text-vv-muted">Save project changes automatically</p>
            </div>
            <button
              onClick={() => { updateSettings({ autoSave: !settings.autoSave }); toast.success(`Auto-save ${!settings.autoSave ? 'enabled' : 'disabled'}`); }}
              className={`vv-btn-secondary w-full sm:w-auto ${settings.autoSave ? 'border-success/30 text-success' : ''}`}
            >{settings.autoSave ? 'Enabled' : 'Disabled'}</button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-400">Danger Zone</h2>
            <p className="text-sm text-vv-secondary">These actions are irreversible.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {showDeleteConfirm === 'projects' ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-400">Are you sure?</span>
              <button onClick={() => { deleteAllProjects(); setShowDeleteConfirm(null); toast.success('All projects deleted'); }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
                Yes, Delete All
              </button>
              <button onClick={() => setShowDeleteConfirm(null)} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-vv-secondary hover:bg-white/5 transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setShowDeleteConfirm('projects')}
              className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:border-red-500/50">
              Delete All Projects
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
