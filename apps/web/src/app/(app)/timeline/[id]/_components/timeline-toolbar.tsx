'use client';

import {
  ArrowLeft,
  ArrowRight,
  Copy,
  ClipboardPaste,
  ClipboardX,
  Download,
  Flag,
  Magnet,
  MousePointer2,
  Music2,
  Pause,
  Play,
  Redo2,
  RefreshCw,
  Repeat,
  ScanLine,
  Scissors,
  Slash,
  Trash2,
  Type,
  Undo2,
  Upload,
} from 'lucide-react';
import type { ToolMode } from './timeline-editor-types';

interface TimelineToolbarProps {
  /* Playback */
  isPlaying: boolean;
  onTogglePlayback: () => void;
  currentTime: number;
  totalDuration: number;
  loopPlayback: boolean;
  onToggleLoop: () => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  formatTimecode: (seconds: number) => string;
  playbackRange: { start: number; end: number } | null;

  /* Tool mode */
  toolMode: ToolMode;
  onToolModeChange: (mode: ToolMode) => void;

  /* History */
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  /* Zoom */
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitTimeline: () => void;

  /* Snap */
  snapEnabled: boolean;
  onToggleSnap: () => void;

  /* Edit actions */
  hasSelection: boolean;
  hasClipboard: boolean;
  videoTrackLocked: boolean;
  onSplitClip: () => void;
  onCopyClip: () => void;
  onCutClip: () => void;
  onPasteClip: () => void;
  onDeleteSelection: () => void;

  /* Add items */
  onAddMarker: () => void;
  onAddMusic: () => void;
  onAddTitle: () => void;
  musicTrackLocked: boolean;
  titleTrackLocked: boolean;
  hasDuration: boolean;

  /* In/Out */
  onSetIn: () => void;
  onSetOut: () => void;
  onClearRange: () => void;

  /* Import / Export */
  importingMedia: boolean;
  onImportFiles: (files: FileList) => void;
  onRefreshClips: () => void;
  onExport: () => void;
  importInputRef: React.RefObject<HTMLInputElement>;
}

export function TimelineToolbar({
  isPlaying,
  onTogglePlayback,
  currentTime,
  totalDuration,
  loopPlayback,
  onToggleLoop,
  onJumpStart,
  onJumpEnd,
  formatTimecode,
  playbackRange,
  toolMode,
  onToolModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitTimeline,
  snapEnabled,
  onToggleSnap,
  hasSelection,
  hasClipboard,
  videoTrackLocked,
  onSplitClip,
  onCopyClip,
  onCutClip,
  onPasteClip,
  onDeleteSelection,
  onAddMarker,
  onAddMusic,
  onAddTitle,
  musicTrackLocked,
  titleTrackLocked,
  hasDuration,
  onSetIn,
  onSetOut,
  onClearRange,
  importingMedia,
  onImportFiles,
  onRefreshClips,
  onExport,
  importInputRef,
}: TimelineToolbarProps) {
  const btnBase =
    'inline-flex items-center justify-center h-7 rounded transition-colors text-[11px] font-medium';
  const btnIcon = `${btnBase} w-7 text-vv-secondary hover:text-white hover:bg-white/[0.08]`;
  const btnIconActive = `${btnBase} w-7 text-cyan-300 bg-cyan-400/15 hover:bg-cyan-400/25 ring-1 ring-cyan-400/30`;
  const btnText = `${btnBase} gap-1 px-2 text-vv-secondary hover:text-white hover:bg-white/[0.08]`;
  const sep = 'w-px h-5 bg-white/10 mx-0.5 shrink-0';

  return (
    <div
      className="flex items-center gap-0.5 border-y border-white/5 bg-transparent px-2 py-1.5"
      role="toolbar"
      aria-label="Timeline editing toolbar"
    >
      {/* ── Left: History + Tools ── */}
      <button onClick={onUndo} disabled={!canUndo} className={btnIcon} title="Undo (⌘Z)">
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button onClick={onRedo} disabled={!canRedo} className={btnIcon} title="Redo (⇧⌘Z)">
        <Redo2 className="h-3.5 w-3.5" />
      </button>

      <div className={sep} />

      <button
        onClick={() => onToolModeChange('select')}
        className={toolMode === 'select' ? btnIconActive : btnIcon}
        title="Select tool (A)"
      >
        <MousePointer2 className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onToolModeChange('blade')}
        className={toolMode === 'blade' ? btnIconActive : btnIcon}
        title="Blade tool (B)"
      >
        <Slash className="h-3.5 w-3.5 rotate-[-45deg]" />
      </button>

      <div className={sep} />

      {/* ── Edit actions ── */}
      <button
        onClick={onSplitClip}
        disabled={!hasSelection || videoTrackLocked}
        className={btnIcon}
        title="Split clip (⇧⌘S)"
      >
        <Scissors className="h-3.5 w-3.5" />
      </button>
      <button onClick={onCopyClip} disabled={!hasSelection} className={btnIcon} title="Copy (⌘C)">
        <Copy className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onCutClip}
        disabled={!hasSelection || videoTrackLocked}
        className={btnIcon}
        title="Cut (⌘X)"
      >
        <ClipboardX className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onPasteClip}
        disabled={!hasClipboard || videoTrackLocked}
        className={btnIcon}
        title="Paste (⌘V)"
      >
        <ClipboardPaste className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onDeleteSelection}
        disabled={!hasSelection}
        className={btnIcon}
        title="Delete selection"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className={sep} />

      {/* ── Add items ── */}
      <button
        onClick={onAddMarker}
        disabled={!hasDuration}
        className={btnIcon}
        title="Add marker (M)"
      >
        <Flag className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onAddMusic}
        disabled={musicTrackLocked}
        className={btnIcon}
        title="Add music bed"
      >
        <Music2 className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onAddTitle}
        disabled={titleTrackLocked}
        className={btnIcon}
        title="Add title (T)"
      >
        <Type className="h-3.5 w-3.5" />
      </button>

      <div className={sep} />

      {/* ── In/Out ── */}
      <button onClick={onSetIn} className={btnText} title="Set In point (I)">
        <ArrowRight className="h-3 w-3" />I
      </button>
      <button onClick={onSetOut} className={btnText} title="Set Out point (O)">
        O<ArrowLeft className="h-3 w-3" />
      </button>
      <button
        onClick={onClearRange}
        disabled={!playbackRange}
        className={btnText}
        title="Clear range (X)"
      >
        X
      </button>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Center: Transport ── */}
      <button onClick={onJumpStart} className={btnIcon} title="Jump to start">
        <ArrowLeft className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onTogglePlayback}
        className={`${btnBase} h-8 w-8 rounded-full text-white shadow-lg ${
          isPlaying
            ? 'bg-rose-500/20 hover:bg-rose-500/30 ring-1 ring-rose-500/40 text-rose-300'
            : 'bg-cyan-500/15 hover:bg-cyan-500/25 ring-1 ring-cyan-500/30 text-cyan-300'
        }`}
        title="Play / Pause (Space)"
        aria-label="Play or pause timeline"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5 shadow-cyan-500/50" />}
      </button>
      <button onClick={onJumpEnd} className={btnIcon} title="Jump to end">
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onToggleLoop}
        className={loopPlayback ? btnIconActive : btnIcon}
        title="Loop playback (L)"
      >
        <Repeat className="h-3.5 w-3.5" />
      </button>

      {/* Timecode */}
      <div className="mx-2 flex items-center gap-1 rounded bg-black/60 ring-1 ring-white/10 px-2.5 py-1">
        <span className="font-mono text-[12px] font-semibold tracking-widest text-white">
          {formatTimecode(currentTime)}
        </span>
        <span className="text-[10px] text-vv-muted">/</span>
        <span className="font-mono text-[10px] text-vv-secondary tracking-widest">
          {formatTimecode(totalDuration)}
        </span>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Right: Snap, Zoom, Import, Export ── */}
      <button
        onClick={onToggleSnap}
        className={snapEnabled ? btnIconActive : btnIcon}
        title="Snap"
      >
        <Magnet className="h-3.5 w-3.5" />
      </button>

      <div className={sep} />

      <button onClick={onFitTimeline} className={btnIcon} title="Fit timeline to viewport">
        <ScanLine className="h-3.5 w-3.5" />
      </button>
      <input
        type="range"
        min="0.25"
        max="8"
        step="0.1"
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        className="mx-1 h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.5)]"
        aria-label="Timeline zoom"
      />
      <span className="min-w-[32px] text-center font-mono text-[10px] text-vv-secondary">
        {zoom.toFixed(1)}x
      </span>

      <div className={sep} />

      <label className={`${btnText} cursor-pointer`}>
        <Upload className="h-3.5 w-3.5" />
        {importingMedia ? '...' : 'Import'}
        <input
          ref={importInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          disabled={importingMedia}
          onChange={(e) => {
            if (e.target.files) onImportFiles(e.target.files);
            if (importInputRef.current) importInputRef.current.value = '';
          }}
        />
      </label>
      <button onClick={onRefreshClips} className={btnIcon} title="Refresh from project clips">
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onExport}
        className={`${btnBase} gap-1 px-3 bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30 hover:bg-cyan-500/25 hover:text-white font-semibold transition-all duration-200`}
        title="Export Edit Decision List"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>
    </div>
  );
}
