'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CircleDot,
  Copy,
  Lock,
  Repeat,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  ClipColor,
  ClipColorClasses,
  MusicBed,
  TimelineClip,
  TimelineSegment,
  TimelineState,
  TimelineTrack,
  TimelineTrackRow,
  TimelineTrackStatus,
  TitleOverlay,
  TitleStyle,
  TrackKind,
  TransitionType,
} from './timeline-editor-domain';

interface TimelineInspectorPanelProps {
  containerSpanClass: string;
  visibleInspector: boolean;
  visibleTrackMixer: boolean;
  visibleAudioPanel: boolean;
  selectedClip: TimelineClip | null;
  selectedSegment: TimelineSegment | null;
  selectedMusicBed: MusicBed | null;
  selectedTitle: TitleOverlay | null;
  totalDuration: number;
  minClipSpanSeconds: number;
  minItemDurationSeconds: number;
  speedOptions: readonly number[];
  clipColorClasses: ClipColorClasses;
  trackRows: TimelineTrackRow[];
  trackStatus: TimelineTrackStatus;
  timeline: TimelineState | null;
  formatTime: (seconds: number) => string;
  getClipDuration: (clip: TimelineClip) => number;
  toFixedNumber: (value: number, decimals?: number) => number;
  clamp: (value: number, min: number, max: number) => number;
  clampTrimStart: (clip: TimelineClip, nextStart: number) => number;
  clampTrimEnd: (clip: TimelineClip, nextEnd: number) => number;
  updateSelectedClip: (updater: (clip: TimelineClip) => TimelineClip) => void;
  updateSelectedMusicBed: (updater: (item: MusicBed) => MusicBed) => void;
  updateSelectedTitle: (updater: (item: TitleOverlay) => TitleOverlay) => void;
  moveSelectedClip: (direction: -1 | 1) => void;
  duplicateSelectedClip: () => void;
  deleteSelectedClip: () => void;
  removeSelectedMusicBed: () => void;
  removeSelectedTitle: () => void;
  updateTrack: (kind: TrackKind, updater: (track: TimelineTrack) => TimelineTrack) => void;
  commitTimeline: (updater: (state: TimelineState) => TimelineState) => void;
  playbackRange: { start: number; end: number } | null;
  onSetRangeFromSelectedClip: () => void;
  onClearPlaybackRange: () => void;
}

export function TimelineInspectorPanel({
  containerSpanClass,
  visibleInspector,
  visibleTrackMixer,
  visibleAudioPanel,
  selectedClip,
  selectedSegment,
  selectedMusicBed,
  selectedTitle,
  totalDuration,
  minClipSpanSeconds,
  minItemDurationSeconds,
  speedOptions,
  clipColorClasses,
  trackRows,
  trackStatus,
  timeline,
  formatTime,
  getClipDuration,
  toFixedNumber,
  clamp,
  clampTrimStart,
  clampTrimEnd,
  updateSelectedClip,
  updateSelectedMusicBed,
  updateSelectedTitle,
  moveSelectedClip,
  duplicateSelectedClip,
  deleteSelectedClip,
  removeSelectedMusicBed,
  removeSelectedTitle,
  updateTrack,
  commitTimeline,
  playbackRange,
  onSetRangeFromSelectedClip,
  onClearPlaybackRange,
}: TimelineInspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<'selection' | 'mix' | 'audio'>('selection');

  const canShowSelectionTab = visibleInspector;
  const canShowMixTab = visibleTrackMixer;
  const canShowAudioTab = visibleAudioPanel;

  const trackDiagnostics = useMemo(() => {
    const muted = trackStatus.tracks.filter((track) => track.muted).length;
    const locked = trackStatus.tracks.filter((track) => track.locked).length;
    const solo = trackStatus.tracks.filter((track) => track.solo).length;
    return { muted, locked, solo };
  }, [trackStatus.tracks]);

  return (
    <div className={`vv-card min-h-0 overflow-y-auto ${containerSpanClass}`}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="text-vv-secondary text-sm font-bold">Inspector</h3>
        <div className="ml-auto inline-flex rounded-lg border border-white/10 bg-white/[0.02] p-1 text-[11px]">
          <button
            onClick={() => setActiveTab('selection')}
            disabled={!canShowSelectionTab}
            className={`rounded px-2 py-1 ${
              activeTab === 'selection'
                ? 'bg-cyan-400/20 text-cyan-100'
                : 'text-vv-muted hover:text-vv-primary'
            } disabled:cursor-not-allowed disabled:opacity-35`}
          >
            Selection
          </button>
          <button
            onClick={() => setActiveTab('mix')}
            disabled={!canShowMixTab}
            className={`rounded px-2 py-1 ${
              activeTab === 'mix'
                ? 'bg-cyan-400/20 text-cyan-100'
                : 'text-vv-muted hover:text-vv-primary'
            } disabled:cursor-not-allowed disabled:opacity-35`}
          >
            Track Mix
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            disabled={!canShowAudioTab}
            className={`rounded px-2 py-1 ${
              activeTab === 'audio'
                ? 'bg-cyan-400/20 text-cyan-100'
                : 'text-vv-muted hover:text-vv-primary'
            } disabled:cursor-not-allowed disabled:opacity-35`}
          >
            Master
          </button>
        </div>
      </div>

      {visibleInspector && activeTab === 'selection' && (
        <>
          {selectedClip ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold">Clip Details</h4>
                <p className="text-vv-muted mt-1 text-xs">{selectedClip.prompt}</p>
              </div>

              <label className="block space-y-1">
                <span className="text-vv-muted text-xs">Clip Title</span>
                <input
                  value={selectedClip.title}
                  onChange={(event) =>
                    updateSelectedClip((clip) => ({
                      ...clip,
                      title: event.target.value,
                    }))
                  }
                  className="vv-input h-9 w-full py-2 text-xs"
                />
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                  <p className="text-vv-muted">Source</p>
                  <p className="font-mono">{formatTime(selectedClip.sourceDuration)}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                  <p className="text-vv-muted">Timeline</p>
                  <p className="font-mono">{formatTime(getClipDuration(selectedClip))}</p>
                </div>
              </div>

              {selectedSegment && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                    <p className="text-vv-muted">Timeline In</p>
                    <p className="font-mono">{formatTime(selectedSegment.start)}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                    <p className="text-vv-muted">Timeline Out</p>
                    <p className="font-mono">{formatTime(selectedSegment.end)}</p>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
                <p className="text-vv-muted">
                  Range:{' '}
                  {playbackRange
                    ? `${formatTime(playbackRange.start)} -> ${formatTime(playbackRange.end)}`
                    : 'Not set'}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={onSetRangeFromSelectedClip}
                    className="rounded border border-white/20 px-2 py-1 text-[11px]"
                  >
                    Range = Clip
                  </button>
                  <button
                    onClick={onClearPlaybackRange}
                    className="rounded border border-white/20 px-2 py-1 text-[11px]"
                  >
                    Clear Range
                  </button>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <p className="text-vv-secondary text-xs font-semibold uppercase tracking-wider">Timing</p>

                <label className="block space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vv-muted">Trim Start</span>
                    <span className="font-mono">{formatTime(selectedClip.trimStart)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, selectedClip.trimEnd - minClipSpanSeconds)}
                    step={0.05}
                    value={selectedClip.trimStart}
                    onChange={(event) =>
                      updateSelectedClip((clip) => ({
                        ...clip,
                        trimStart: toFixedNumber(
                          clampTrimStart(clip, Number(event.target.value)),
                          3
                        ),
                      }))
                    }
                    className="accent-accent w-full"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateSelectedClip((clip) => ({
                          ...clip,
                          trimStart: toFixedNumber(clampTrimStart(clip, clip.trimStart - 0.1), 3),
                        }))
                      }
                      className="rounded border border-white/20 px-2 py-1 text-[11px]"
                    >
                      -0.1s
                    </button>
                    <button
                      onClick={() =>
                        updateSelectedClip((clip) => ({
                          ...clip,
                          trimStart: toFixedNumber(clampTrimStart(clip, clip.trimStart + 0.1), 3),
                        }))
                      }
                      className="rounded border border-white/20 px-2 py-1 text-[11px]"
                    >
                      +0.1s
                    </button>
                  </div>
                </label>

                <label className="block space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vv-muted">Trim End</span>
                    <span className="font-mono">{formatTime(selectedClip.trimEnd)}</span>
                  </div>
                  <input
                    type="range"
                    min={Math.min(selectedClip.sourceDuration, selectedClip.trimStart + minClipSpanSeconds)}
                    max={selectedClip.sourceDuration}
                    step={0.05}
                    value={selectedClip.trimEnd}
                    onChange={(event) =>
                      updateSelectedClip((clip) => ({
                        ...clip,
                        trimEnd: toFixedNumber(clampTrimEnd(clip, Number(event.target.value)), 3),
                      }))
                    }
                    className="accent-accent w-full"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateSelectedClip((clip) => ({
                          ...clip,
                          trimEnd: toFixedNumber(clampTrimEnd(clip, clip.trimEnd - 0.1), 3),
                        }))
                      }
                      className="rounded border border-white/20 px-2 py-1 text-[11px]"
                    >
                      -0.1s
                    </button>
                    <button
                      onClick={() =>
                        updateSelectedClip((clip) => ({
                          ...clip,
                          trimEnd: toFixedNumber(clampTrimEnd(clip, clip.trimEnd + 0.1), 3),
                        }))
                      }
                      className="rounded border border-white/20 px-2 py-1 text-[11px]"
                    >
                      +0.1s
                    </button>
                  </div>
                </label>

                <label className="block space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vv-muted">Speed</span>
                    <span className="font-mono">{selectedClip.playbackRate.toFixed(2)}x</span>
                  </div>
                  <select
                    value={selectedClip.playbackRate}
                    onChange={(event) =>
                      updateSelectedClip((clip) => ({
                        ...clip,
                        playbackRate: Number(event.target.value),
                      }))
                    }
                    className="vv-input h-9 w-full py-2 text-xs"
                  >
                    {speedOptions.map((speed) => (
                      <option key={speed} value={speed}>
                        {speed.toFixed(2)}x
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-1">
                    {speedOptions.map((speed) => (
                      <button
                        key={`preset-${speed}`}
                        onClick={() =>
                          updateSelectedClip((clip) => ({
                            ...clip,
                            playbackRate: speed,
                          }))
                        }
                        className={`rounded border px-2 py-1 text-[11px] ${
                          selectedClip.playbackRate === speed
                            ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100'
                            : 'border-white/20 text-vv-muted'
                        }`}
                      >
                        {speed.toFixed(2)}x
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <p className="text-vv-secondary text-xs font-semibold uppercase tracking-wider">
                  Transition and Audio
                </p>

                <div className="flex flex-wrap gap-1">
                  {(['cut', 'dissolve', 'fade', 'wipe'] as TransitionType[]).map((transition) => (
                    <button
                      key={transition}
                      onClick={() =>
                        updateSelectedClip((clip) => ({
                          ...clip,
                          transitionType: transition,
                          transitionDuration:
                            transition === 'cut' ? 0 : Math.max(clip.transitionDuration, 0.2),
                        }))
                      }
                      className={`rounded border px-2 py-1 text-[11px] uppercase ${
                        selectedClip.transitionType === transition
                          ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100'
                          : 'border-white/20 text-vv-muted'
                      }`}
                    >
                      {transition}
                    </button>
                  ))}
                </div>

                <label className="block space-y-1">
                  <span className="text-vv-muted text-xs">Transition</span>
                  <select
                    value={selectedClip.transitionType}
                    onChange={(event) =>
                      updateSelectedClip((clip) => ({
                        ...clip,
                        transitionType: event.target.value as TransitionType,
                        transitionDuration:
                          event.target.value === 'cut' ? 0 : Math.max(clip.transitionDuration, 0.2),
                      }))
                    }
                    className="vv-input h-9 w-full py-2 text-xs"
                  >
                    <option value="cut">Cut</option>
                    <option value="dissolve">Dissolve</option>
                    <option value="fade">Fade</option>
                    <option value="wipe">Wipe</option>
                  </select>
                </label>

                {selectedClip.transitionType !== 'cut' && (
                  <label className="block space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-vv-muted">Transition Duration</span>
                      <span className="font-mono">{selectedClip.transitionDuration.toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={1.5}
                      step={0.1}
                      value={selectedClip.transitionDuration}
                      onChange={(event) =>
                        updateSelectedClip((clip) => ({
                          ...clip,
                          transitionDuration: Number(event.target.value),
                        }))
                      }
                      className="accent-accent w-full"
                    />
                  </label>
                )}

                <label className="block space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vv-muted">Clip Volume</span>
                    <span className="font-mono">{Math.round(selectedClip.audioVolume)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={150}
                    step={1}
                    value={selectedClip.audioVolume}
                    onChange={(event) =>
                      updateSelectedClip((clip) => ({
                        ...clip,
                        audioVolume: Number(event.target.value),
                      }))
                    }
                    className="accent-accent w-full"
                  />
                </label>

                <button
                  onClick={() =>
                    updateSelectedClip((clip) => ({
                      ...clip,
                      muted: !clip.muted,
                    }))
                  }
                  className={`vv-btn-ghost inline-flex w-full items-center justify-center gap-1.5 py-2 text-xs ${
                    selectedClip.muted ? 'text-accent' : ''
                  }`}
                >
                  {selectedClip.muted ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  {selectedClip.muted ? 'Unmute Clip' : 'Mute Clip'}
                </button>

                <button
                  onClick={() =>
                    updateSelectedClip((clip) => ({
                      ...clip,
                      enabled: !clip.enabled,
                    }))
                  }
                  className={`vv-btn-ghost w-full justify-center py-2 text-xs ${
                    selectedClip.enabled ? 'text-accent' : ''
                  }`}
                >
                  {selectedClip.enabled ? 'Clip Enabled' : 'Clip Disabled'}
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-vv-muted text-xs">Clip Color</span>
                  <div className="ml-auto flex gap-1">
                    {(Object.keys(clipColorClasses) as ClipColor[]).map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          updateSelectedClip((clip) => ({
                            ...clip,
                            color,
                          }))
                        }
                        className={`h-5 w-5 rounded-full border transition-all ${
                          selectedClip.color === color
                            ? 'scale-110 border-white/80'
                            : 'border-white/20 hover:border-white/50'
                        } ${clipColorClasses[color].accent}`}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => moveSelectedClip(-1)}
                  className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Move Left
                </button>
                <button
                  onClick={() => moveSelectedClip(1)}
                  className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Move Right
                </button>
                <button
                  onClick={duplicateSelectedClip}
                  className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </button>
                <button
                  onClick={deleteSelectedClip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition-all hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Clip
                </button>
              </div>
            </div>
          ) : selectedMusicBed ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold">Music Bed: {selectedMusicBed.title}</h4>
                <p className="text-vv-muted mt-1 text-xs">
                  Metadata track for future music renders and mix handoff.
                </p>
              </div>

              <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <label className="block space-y-1">
                  <span className="text-vv-muted text-xs">Name</span>
                  <input
                    value={selectedMusicBed.title}
                    onChange={(event) =>
                      updateSelectedMusicBed((item) => ({ ...item, title: event.target.value }))
                    }
                    className="vv-input h-9 w-full py-2 text-xs"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vv-muted">Start</span>
                    <span className="font-mono">{formatTime(selectedMusicBed.start)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, totalDuration)}
                    step={0.1}
                    value={selectedMusicBed.start}
                    onChange={(event) =>
                      updateSelectedMusicBed((item) => ({
                        ...item,
                        start: toFixedNumber(Number(event.target.value), 3),
                      }))
                    }
                    className="accent-accent w-full"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vv-muted">Duration</span>
                    <span className="font-mono">{formatTime(selectedMusicBed.duration)}</span>
                  </div>
                  <input
                    type="range"
                    min={minItemDurationSeconds}
                    max={Math.max(minItemDurationSeconds, Math.max(totalDuration, 10))}
                    step={0.1}
                    value={selectedMusicBed.duration}
                    onChange={(event) =>
                      updateSelectedMusicBed((item) => ({
                        ...item,
                        duration: clamp(
                          Number(event.target.value),
                          minItemDurationSeconds,
                          Math.max(totalDuration, 10)
                        ),
                      }))
                    }
                    className="accent-accent w-full"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vv-muted">Volume</span>
                    <span className="font-mono">{Math.round(selectedMusicBed.volume)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={150}
                    step={1}
                    value={selectedMusicBed.volume}
                    onChange={(event) =>
                      updateSelectedMusicBed((item) => ({
                        ...item,
                        volume: Number(event.target.value),
                      }))
                    }
                    className="accent-accent w-full"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      updateSelectedMusicBed((item) => ({
                        ...item,
                        muted: !item.muted,
                      }))
                    }
                    className={`vv-btn-ghost inline-flex items-center justify-center gap-1.5 py-2 text-xs ${
                      selectedMusicBed.muted ? 'text-accent' : ''
                    }`}
                  >
                    {selectedMusicBed.muted ? (
                      <Volume2 className="h-3.5 w-3.5" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5" />
                    )}
                    {selectedMusicBed.muted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    onClick={() =>
                      updateSelectedMusicBed((item) => ({
                        ...item,
                        loop: !item.loop,
                      }))
                    }
                    className={`vv-btn-ghost inline-flex items-center justify-center gap-1.5 py-2 text-xs ${
                      selectedMusicBed.loop ? 'text-accent' : ''
                    }`}
                  >
                    <Repeat className="h-3.5 w-3.5" />
                    {selectedMusicBed.loop ? 'Loop On' : 'Loop Off'}
                  </button>
                </div>

                <button
                  onClick={removeSelectedMusicBed}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition-all hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Music Bed
                </button>
              </div>
            </div>
          ) : selectedTitle ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold">Title Overlay</h4>
                <p className="text-vv-muted mt-1 text-xs">Appears in the preview and export EDL.</p>
              </div>

              <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <label className="block space-y-1">
                  <span className="text-vv-muted text-xs">Text</span>
                  <input
                    value={selectedTitle.text}
                    onChange={(event) =>
                      updateSelectedTitle((item) => ({ ...item, text: event.target.value }))
                    }
                    className="vv-input h-9 w-full py-2 text-xs"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-vv-muted text-xs">Style</span>
                  <select
                    value={selectedTitle.style}
                    onChange={(event) =>
                      updateSelectedTitle((item) => ({
                        ...item,
                        style: event.target.value as TitleStyle,
                      }))
                    }
                    className="vv-input h-9 w-full py-2 text-xs"
                  >
                    <option value="title">Title Card</option>
                    <option value="lower-third">Lower Third</option>
                    <option value="caption">Caption</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vv-muted">Start</span>
                    <span className="font-mono">{formatTime(selectedTitle.start)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, totalDuration)}
                    step={0.1}
                    value={selectedTitle.start}
                    onChange={(event) =>
                      updateSelectedTitle((item) => ({
                        ...item,
                        start: toFixedNumber(Number(event.target.value), 3),
                      }))
                    }
                    className="accent-accent w-full"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vv-muted">Duration</span>
                    <span className="font-mono">{formatTime(selectedTitle.duration)}</span>
                  </div>
                  <input
                    type="range"
                    min={minItemDurationSeconds}
                    max={Math.max(minItemDurationSeconds, Math.max(totalDuration, 10))}
                    step={0.1}
                    value={selectedTitle.duration}
                    onChange={(event) =>
                      updateSelectedTitle((item) => ({
                        ...item,
                        duration: clamp(
                          Number(event.target.value),
                          minItemDurationSeconds,
                          Math.max(totalDuration, 10)
                        ),
                      }))
                    }
                    className="accent-accent w-full"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-vv-muted text-xs">Color</span>
                  <input
                    type="color"
                    value={selectedTitle.color}
                    onChange={(event) =>
                      updateSelectedTitle((item) => ({
                        ...item,
                        color: event.target.value,
                      }))
                    }
                    className="h-9 w-full cursor-pointer rounded-md border border-white/20 bg-transparent"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      updateSelectedTitle((item) => ({
                        ...item,
                        enabled: !item.enabled,
                      }))
                    }
                    className={`vv-btn-ghost py-2 text-xs ${selectedTitle.enabled ? 'text-accent' : ''}`}
                  >
                    {selectedTitle.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={removeSelectedTitle}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition-all hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Title
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-vv-muted text-sm">
              Select a clip, music bed, or title layer to inspect and edit properties.
            </p>
          )}
        </>
      )}

      {visibleTrackMixer && activeTab === 'mix' && (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-vv-secondary text-xs font-semibold uppercase tracking-wider">Track Mixer</p>
            <div className="ml-auto flex gap-1">
              <button
                onClick={() =>
                  trackRows.forEach((row) =>
                    updateTrack(row.kind, (item) => ({
                      ...item,
                      solo: false,
                    }))
                  )
                }
                className="inline-flex items-center gap-1 rounded border border-white/20 px-2 py-1 text-[11px]"
              >
                <CircleDot className="h-3 w-3" />
                Clear Solo
              </button>
              <button
                onClick={() =>
                  trackRows.forEach((row) =>
                    updateTrack(row.kind, (item) => ({
                      ...item,
                      locked: false,
                    }))
                  )
                }
                className="inline-flex items-center gap-1 rounded border border-white/20 px-2 py-1 text-[11px]"
              >
                <Lock className="h-3 w-3" />
                Unlock All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1.5 text-vv-muted">
              Muted: <span className="font-semibold text-vv-primary">{trackDiagnostics.muted}</span>
            </div>
            <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1.5 text-vv-muted">
              Solo: <span className="font-semibold text-vv-primary">{trackDiagnostics.solo}</span>
            </div>
            <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1.5 text-vv-muted">
              Locked: <span className="font-semibold text-vv-primary">{trackDiagnostics.locked}</span>
            </div>
          </div>

          {trackRows.map((row) => {
            const track = trackStatus.byKind[row.kind];

            return (
              <div key={row.kind} className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold">
                    {row.short} · {track.name}
                  </span>
                  {trackStatus.hasSolo && !track.solo && (
                    <span className="text-vv-muted text-[10px]">Excluded by solo</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <button
                    onClick={() =>
                      updateTrack(row.kind, (item) => ({
                        ...item,
                        locked: !item.locked,
                      }))
                    }
                    className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1 ${
                      track.locked
                        ? 'border-amber-300/60 text-amber-200'
                        : 'border-white/15 text-vv-muted hover:text-vv-primary'
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    {track.locked ? 'Locked' : 'Lock'}
                  </button>
                  <button
                    onClick={() =>
                      updateTrack(row.kind, (item) => ({
                        ...item,
                        muted: !item.muted,
                      }))
                    }
                    className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1 ${
                      track.muted
                        ? 'border-rose-300/60 text-rose-200'
                        : 'border-white/15 text-vv-muted hover:text-vv-primary'
                    }`}
                  >
                    {track.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    {track.muted ? 'Muted' : 'Mute'}
                  </button>
                  <button
                    onClick={() =>
                      updateTrack(row.kind, (item) => ({
                        ...item,
                        solo: !item.solo,
                      }))
                    }
                    className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1 ${
                      track.solo
                        ? 'border-cyan-300/60 text-cyan-200'
                        : 'border-white/15 text-vv-muted hover:text-vv-primary'
                    }`}
                  >
                    <CircleDot className="h-3.5 w-3.5" />
                    {track.solo ? 'Solo' : 'S'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {visibleAudioPanel && activeTab === 'audio' && (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <p className="text-vv-secondary text-xs font-semibold uppercase tracking-wider">Timeline Audio</p>
          <label className="block space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-vv-muted">Master Volume</span>
              <span className="font-mono">{timeline?.masterVolume.toFixed(0) ?? 100}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={150}
              step={1}
              value={timeline?.masterVolume ?? 100}
              onChange={(event) =>
                commitTimeline((state) => ({
                  ...state,
                  masterVolume: Number(event.target.value),
                }))
              }
              className="accent-accent w-full"
            />
          </label>

          <div className="flex flex-wrap gap-1">
            {[50, 75, 100, 125].map((preset) => (
              <button
                key={preset}
                onClick={() =>
                  commitTimeline((state) => ({
                    ...state,
                    masterVolume: preset,
                  }))
                }
                className="rounded border border-white/20 px-2 py-1 text-[11px]"
              >
                {preset}%
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              commitTimeline((state) => ({
                ...state,
                masterMuted: !state.masterMuted,
              }))
            }
            className={`vv-btn-ghost inline-flex w-full items-center justify-center gap-1.5 py-2 text-xs ${
              timeline?.masterMuted ? 'text-accent' : ''
            }`}
          >
            {timeline?.masterMuted ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {timeline?.masterMuted ? 'Unmute Timeline' : 'Mute Timeline'}
          </button>

          <button
            onClick={() =>
              commitTimeline((state) => ({
                ...state,
                showWaveforms: !state.showWaveforms,
              }))
            }
            className={`vv-btn-ghost w-full justify-center py-2 text-xs ${
              timeline?.showWaveforms ? 'text-accent' : ''
            }`}
          >
            {timeline?.showWaveforms ? 'Hide Waveforms' : 'Show Waveforms'}
          </button>
        </div>
      )}
    </div>
  );
}
