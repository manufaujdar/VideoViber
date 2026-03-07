'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import type { UploadedAsset } from '@/features/wizard/wizard-types';

const FILE_TYPE_MAP: Record<string, UploadedAsset['fileType']> = {
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'application/pdf': 'document',
};

const FILE_TYPE_ICONS: Record<UploadedAsset['fileType'], string> = {
  image: '🖼',
  video: '🎬',
  audio: '🎵',
  document: '📄',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssetIntakePage() {
  const assetIntake = useWizardStore((s) => s.assetIntake);
  const setAssetIntake = useWizardStore((s) => s.setAssetIntake);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    setCurrentPage(8);
  }, [setCurrentPage]);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const newAssets: UploadedAsset[] = Array.from(files).map((file, idx) => ({
        id: `asset-${Date.now()}-${idx}`,
        fileName: file.name,
        fileType: FILE_TYPE_MAP[file.type] || 'document',
        url: URL.createObjectURL(file),
        storagePath: '', // Will be set on actual upload to Supabase
        sizeBytes: file.size,
        description: '',
      }));
      setAssetIntake({
        uploadedAssets: [...assetIntake.uploadedAssets, ...newAssets],
      });
    },
    [assetIntake.uploadedAssets, setAssetIntake]
  );

  const removeAsset = useCallback(
    (id: string) => {
      setAssetIntake({
        uploadedAssets: assetIntake.uploadedAssets.filter((a) => a.id !== id),
      });
    },
    [assetIntake.uploadedAssets, setAssetIntake]
  );

  const updateAssetDescription = useCallback(
    (id: string, description: string) => {
      setAssetIntake({
        uploadedAssets: assetIntake.uploadedAssets.map((a) =>
          a.id === id ? { ...a, description } : a
        ),
      });
    },
    [assetIntake.uploadedAssets, setAssetIntake]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Asset <span className="gradient-text">Intake</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          Upload reference images, brand assets, mood boards, and inspiration files.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all duration-300 ${
          dragActive
            ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/10'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
        }`}
      >
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all ${
            dragActive ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/5 text-vv-muted group-hover:bg-white/10'
          }`}
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-vv-primary">
            {dragActive ? 'Drop files here' : 'Click or drag files to upload'}
          </p>
          <p className="mt-1 text-xs text-vv-muted">
            Images, videos, audio, PDFs — up to 50MB each
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Uploaded assets list */}
      {assetIntake.uploadedAssets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-vv-primary">
            Uploaded Assets ({assetIntake.uploadedAssets.length})
          </h3>
          <div className="space-y-2">
            {assetIntake.uploadedAssets.map((asset) => (
              <div
                key={asset.id}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04]"
              >
                {/* Preview / icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 overflow-hidden">
                  {asset.fileType === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.url} alt={asset.fileName} className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-xl">{FILE_TYPE_ICONS[asset.fileType]}</span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-vv-primary">{asset.fileName}</p>
                  <p className="text-xs text-vv-muted">
                    {FILE_TYPE_ICONS[asset.fileType]} {asset.fileType} · {formatBytes(asset.sizeBytes)}
                  </p>
                  <input
                    type="text"
                    value={asset.description}
                    onChange={(e) => updateAssetDescription(asset.id, e.target.value)}
                    placeholder="Describe this asset (e.g., 'Logo on dark bg', 'Product hero shot')..."
                    className="mt-1 w-full border-0 bg-transparent p-0 text-xs text-vv-secondary placeholder:text-vv-muted/50 focus:outline-none focus:ring-0"
                  />
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeAsset(asset.id)}
                  className="shrink-0 rounded-lg p-2 text-vv-muted opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reference notes */}
      <div className="space-y-2">
        <label className="vv-label flex items-center gap-2">
          <svg className="h-4 w-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Reference Notes (optional)
        </label>
        <textarea
          value={assetIntake.referenceNotes}
          onChange={(e) => setAssetIntake({ referenceNotes: e.target.value })}
          rows={3}
          placeholder="Describe your brand guidelines, mood board direction, or any notes about how assets should be used..."
          className="vv-input w-full resize-none text-sm"
        />
      </div>

      {/* Tip card */}
      <div className="vv-card border-cyan-500/10 bg-cyan-500/[0.03]">
        <div className="flex items-start gap-3">
          <span className="text-cyan-300 text-lg">💡</span>
          <div>
            <h4 className="text-sm font-semibold text-cyan-200">Asset Tips</h4>
            <p className="mt-1 text-xs text-vv-secondary leading-relaxed">
              Upload brand logos, color palettes, product photos, or reference videos.
              The AI concept generator will use these as creative context to generate
              more accurate and on-brand concept directions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
