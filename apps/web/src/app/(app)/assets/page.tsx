'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';
import { useAppStore } from '@/app/store';
import { toast } from 'sonner';

export default function AssetsPage() {
  const assets = useAppStore((s) => s.assets);
  const addAsset = useAppStore((s) => s.addAsset);
  const deleteAsset = useAppStore((s) => s.deleteAsset);
  const updateAsset = useAppStore((s) => s.updateAsset);

  const [filter, setFilter] = useState<'All' | 'Images' | 'Videos' | 'Reference'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const filteredAssets = assets.filter((a) => {
    if (filter === 'Images' && a.type !== 'image') return false;
    if (filter === 'Videos' && a.type !== 'video') return false;
    if (filter === 'Reference' && a.type !== 'reference') return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleUpload = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          const type = file.type.startsWith('video/') ? 'video' : 'image';
          addAsset({ name: file.name, type, url, size: file.size });
          toast.success(`Uploaded "${file.name}"`);
        };
        reader.readAsDataURL(file);
      });
    },
    [addAsset]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleUpload(e.dataTransfer.files);
    },
    [handleUpload]
  );

  const handleBulkDelete = () => {
    selected.forEach((id) => deleteAsset(id));
    toast.success(`Deleted ${selected.size} asset(s)`);
    setSelected(new Set());
  };

  const handleRename = (id: string) => {
    if (newName.trim()) {
      updateAsset(id, { name: newName.trim() });
      toast.success('Asset renamed');
    }
    setRenaming(null);
    setNewName('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-vv-secondary mt-1 text-sm">
            {assets.length} files · All uploaded and generated media
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="vv-btn-primary w-full cursor-pointer sm:w-auto">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Upload
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Images', 'Videos', 'Reference'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-accent/10 text-accent ring-accent/20 ring-1'
                  : 'text-vv-secondary hover:text-vv-primary hover:bg-white/[0.03]'
              }`}
            >
              {f}
            </button>
          ))}
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="rounded-lg bg-red-500/10 px-3.5 py-1.5 text-sm font-medium text-red-400 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20"
            >
              Delete ({selected.size})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="vv-input w-48 text-sm"
          />
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="text-vv-muted hover:text-vv-primary flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.03]"
          >
            {viewMode === 'grid' ? (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Drop zone (shown when no assets) */}
      {filteredAssets.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="vv-card border-vv-border hover:border-accent/40 relative flex cursor-pointer flex-col items-center overflow-hidden border-2 border-dashed py-20 transition-colors"
        >
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(82, 222, 255, 0.5) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative">
            <div className="from-accent/20 ring-accent/20 animate-float mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br to-amber-300/10 ring-1">
              <svg
                className="text-accent h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-center text-xl font-bold">
              {assets.length === 0 ? 'No assets yet' : 'No results'}
            </h3>
            <p className="text-vv-secondary mb-8 max-w-sm text-center text-sm leading-relaxed">
              {assets.length === 0
                ? 'Drop files here or click Upload to add reference images and video clips.'
                : 'Try adjusting your filters or search term.'}
            </p>
            <div className="text-center">
              <label className="vv-btn-primary cursor-pointer px-8 py-3">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                Upload Your First Asset
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files && handleUpload(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className={`vv-card-hover group relative overflow-hidden ${selected.has(asset.id) ? 'ring-accent ring-2' : ''}`}
            >
              {/* Checkbox */}
              <button
                onClick={() =>
                  setSelected((prev) => {
                    const next = new Set(prev);
                    next.has(asset.id) ? next.delete(asset.id) : next.add(asset.id);
                    return next;
                  })
                }
                className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                {selected.has(asset.id) ? '✓' : ''}
              </button>
              {/* Thumbnail */}
              <div className="bg-vv-base mb-3 aspect-video overflow-hidden rounded-lg">
                <Image
                  src={asset.url}
                  alt={asset.name}
                  width={640}
                  height={360}
                  unoptimized
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              {/* Info */}
              {renaming === asset.id ? (
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => handleRename(asset.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(asset.id)}
                  className="vv-input w-full text-xs"
                  autoFocus
                />
              ) : (
                <p className="truncate text-sm font-medium">{asset.name}</p>
              )}
              <div className="mt-1 flex items-center justify-between">
                <span className="text-vv-muted text-xs capitalize">
                  {asset.type} · {formatSize(asset.size)}
                </span>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => {
                      setRenaming(asset.id);
                      setNewName(asset.name);
                    }}
                    className="text-vv-muted hover:text-vv-primary flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-white/5"
                    title="Rename"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      deleteAsset(asset.id);
                      toast.success('Asset deleted');
                    }}
                    className="text-vv-muted flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title="Delete"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div
          className="vv-card divide-y divide-white/5"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/[0.02] ${selected.has(asset.id) ? 'bg-accent/5' : ''}`}
            >
              <button
                onClick={() =>
                  setSelected((prev) => {
                    const next = new Set(prev);
                    next.has(asset.id) ? next.delete(asset.id) : next.add(asset.id);
                    return next;
                  })
                }
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${selected.has(asset.id) ? 'bg-accent border-accent text-white' : 'border-vv-border hover:border-accent/50'}`}
              >
                {selected.has(asset.id) && '✓'}
              </button>
              <Image
                src={asset.url}
                alt={asset.name}
                width={56}
                height={40}
                unoptimized
                className="h-10 w-14 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{asset.name}</p>
                <p className="text-vv-muted text-xs capitalize">{asset.type}</p>
              </div>
              <span className="text-vv-muted shrink-0 text-xs">{formatSize(asset.size)}</span>
              <span className="text-vv-disabled shrink-0 text-xs">
                {new Date(asset.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => {
                  deleteAsset(asset.id);
                  toast.success('Deleted');
                }}
                className="text-vv-muted shrink-0 transition-colors hover:text-red-400"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
