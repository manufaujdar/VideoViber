'use client';

import { useMemo, useState, type DragEvent as ReactDragEvent, type MouseEvent as ReactMouseEvent, type RefObject } from 'react';
import type {
  ClipColorClasses,
  MusicBed,
  TimelineClip,
  TimelineSegment,
  TimelineState,
  TimelineTrack,
  TimelineTrackRow,
  TimelineTrackStatus,
  TitleOverlay,
  TrackKind,
  TransitionType,
} from './timeline-editor-domain';

interface TimelineTrackCanvasProps {
  timeline: TimelineState | null;
  timelineClips: TimelineClip[];
  totalDuration: number;
  formatTime: (seconds: number) => string;
  trackRows: TimelineTrackRow[];
  trackStatus: TimelineTrackStatus;
  updateTrack: (kind: TrackKind, updater: (track: TimelineTrack) => TimelineTrack) => void;
  trackWidth: number;
  timelineViewportRef: RefObject<HTMLDivElement>;
  rulerTicks: number[];
  seekFromEvent: (event: ReactMouseEvent<HTMLDivElement>) => void;
  seekToTime: (seconds: number) => void;
  onMarkerSelect: (time: number) => void;
  onClearSelections: () => void;
  playheadLeft: number;
  onTrackDragOver: (event: ReactDragEvent<HTMLDivElement>) => void;
  onTrackDrop: (event: ReactDragEvent<HTMLDivElement>) => void;
  onTrackDragLeave: () => void;
  virtualizedSegments: TimelineSegment[];
  virtualizedMusicBeds: MusicBed[];
  virtualizedTitleOverlays: TitleOverlay[];
  timelinePixelsPerSecond: number;
  selectedClipId: string | null;
  selectedMusicId: string | null;
  selectedTitleId: string | null;
  clipColorClasses: ClipColorClasses;
  videoTrackLocked: boolean;
  onClipDragStart: (event: ReactDragEvent<HTMLButtonElement>, clipId: string) => void;
  onClipDragEnd: () => void;
  onSelectClip: (clipId: string, start?: number) => void;
  onSelectMusicBed: (bedId: string, start?: number) => void;
  onSelectTitle: (titleId: string, start?: number) => void;
  onStopPlayback: () => void;
  getTransitionLabel: (type: TransitionType, duration: number) => string;
  dragIndicatorTime: number | null;
  getWaveformBars: (segment: TimelineSegment, bars: number) => number[] | null;
  showMarkers: boolean;
  onRemoveMarker: (markerId: string) => void;
}

type DensityMode = 'compact' | 'balanced' | 'detailed';

const DENSITY_ROW_HEIGHT: Record<DensityMode, Record<TrackKind, number>> = {
  compact: {
    video: 44,
    dialogue: 32,
    music: 32,
    titles: 28,
  },
  balanced: {
    video: 56,
    dialogue: 40,
    music: 40,
    titles: 36,
  },
  detailed: {
    video: 72,
    dialogue: 52,
    music: 52,
    titles: 44,
  },
};

export function TimelineTrackCanvas({
  timeline,
  timelineClips,
  totalDuration,
  formatTime,
  trackRows,
  trackStatus,
  updateTrack,
  trackWidth,
  timelineViewportRef,
  rulerTicks,
  seekFromEvent,
  seekToTime,
  onMarkerSelect,
  onClearSelections,
  playheadLeft,
  onTrackDragOver,
  onTrackDrop,
  onTrackDragLeave,
  virtualizedSegments,
  virtualizedMusicBeds,
  virtualizedTitleOverlays,
  timelinePixelsPerSecond,
  selectedClipId,
  selectedMusicId,
  selectedTitleId,
  clipColorClasses,
  videoTrackLocked,
  onClipDragStart,
  onClipDragEnd,
  onSelectClip,
  onSelectMusicBed,
  onSelectTitle,
  onStopPlayback,
  getTransitionLabel,
  dragIndicatorTime,
  getWaveformBars,
  showMarkers,
  onRemoveMarker,
}: TimelineTrackCanvasProps) {
  const [density, setDensity] = useState<DensityMode>('balanced');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [markerQuery, setMarkerQuery] = useState('');

  const rowHeights = DENSITY_ROW_HEIGHT[density];
  const hasLayers =
    timelineClips.length > 0 || (timeline?.musicBeds.length ?? 0) > 0 || (timeline?.titleOverlays.length ?? 0) > 0;

  const filteredMarkers = useMemo(() => {
    const query = markerQuery.trim().toLowerCase();
    if (!query) return timeline?.markers ?? [];
    return (timeline?.markers ?? []).filter((marker) => marker.label.toLowerCase().includes(query));
  }, [timeline?.markers, markerQuery]);

  const scrollPlayheadIntoView = () => {
    const viewport = timelineViewportRef.current;
    if (!viewport) return;
    const target = Math.max(0, playheadLeft - viewport.clientWidth / 2);
    viewport.scrollTo({ left: target, behavior: 'smooth' });
  };

  return (
    <div className="vv-card shrink-0">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-vv-muted text-xs uppercase tracking-wider">Timeline Tracks</p>
        <p className="text-vv-muted font-mono ml-auto text-xs">
          {timelineClips.length} clips · {formatTime(totalDuration)}
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.02] p-1 text-[11px]">
          {(['compact', 'balanced', 'detailed'] as DensityMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setDensity(mode)}
              className={`rounded px-2 py-1 uppercase ${
                density === mode
                  ? 'bg-cyan-400/20 text-cyan-100'
                  : 'text-vv-muted hover:text-vv-primary'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowMiniMap((value) => !value)}
          className={`vv-btn-ghost px-3 py-1.5 text-xs ${showMiniMap ? 'text-accent' : ''}`}
        >
          {showMiniMap ? 'Hide Minimap' : 'Show Minimap'}
        </button>
        <button onClick={scrollPlayheadIntoView} className="vv-btn-ghost px-3 py-1.5 text-xs">
          Center Playhead
        </button>
      </div>

      {showMiniMap && hasLayers && (
        <div
          className="border-vv-border/60 bg-vv-base/50 relative mb-3 h-8 cursor-pointer rounded-md border"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
            seekToTime(Math.max(0, Math.min(totalDuration, ratio * totalDuration)));
          }}
        >
          {virtualizedSegments.map((segment) => {
            const left = totalDuration > 0 ? (segment.start / totalDuration) * 100 : 0;
            const width = totalDuration > 0 ? (segment.duration / totalDuration) * 100 : 0;
            const color = clipColorClasses[segment.clip.color];
            return (
              <div
                key={`mini-${segment.clip.id}`}
                className={`${color.accent} absolute bottom-1 top-1 rounded opacity-70`}
                style={{ left: `${left}%`, width: `${Math.max(width, 0.25)}%` }}
                title={`${segment.clip.title} · ${formatTime(segment.duration)}`}
              />
            );
          })}
          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-cyan-200"
            style={{ left: `${totalDuration > 0 ? (playheadLeft / (trackWidth || 1)) * 100 : 0}%` }}
          />
        </div>
      )}

      {hasLayers ? (
        <div className="grid grid-cols-[170px_minmax(0,1fr)] gap-3">
          <div className="space-y-2">
            <div className="text-vv-muted h-7 px-2 text-[10px] font-semibold uppercase tracking-wider">
              Track
            </div>
            {trackRows.map((row) => {
              const track = trackStatus.byKind[row.kind];
              const disabledBySolo = trackStatus.hasSolo && !track.solo;
              return (
                <div
                  key={row.kind}
                  className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-2"
                  style={{ height: `${rowHeights[row.kind]}px` }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{row.short}</span>
                    <span className="text-vv-muted">{track.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px]">
                    <button
                      onClick={() =>
                        updateTrack(row.kind, (item) => ({
                          ...item,
                          locked: !item.locked,
                        }))
                      }
                      className={`rounded px-1.5 py-0.5 ${
                        track.locked ? 'bg-amber-400/20 text-amber-100' : 'bg-white/[0.04] text-vv-muted'
                      }`}
                    >
                      L
                    </button>
                    <button
                      onClick={() =>
                        updateTrack(row.kind, (item) => ({
                          ...item,
                          muted: !item.muted,
                        }))
                      }
                      className={`rounded px-1.5 py-0.5 ${
                        track.muted ? 'bg-rose-400/20 text-rose-100' : 'bg-white/[0.04] text-vv-muted'
                      }`}
                    >
                      M
                    </button>
                    <button
                      onClick={() =>
                        updateTrack(row.kind, (item) => ({
                          ...item,
                          solo: !item.solo,
                        }))
                      }
                      className={`rounded px-1.5 py-0.5 ${
                        track.solo ? 'bg-cyan-400/20 text-cyan-100' : 'bg-white/[0.04] text-vv-muted'
                      }`}
                    >
                      S
                    </button>
                    {disabledBySolo && <span className="text-vv-disabled ml-auto">Excluded</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={timelineViewportRef} className="overflow-x-auto">
            <div style={{ width: `${trackWidth}px` }} className="relative min-w-full">
              <div
                className="border-vv-border/60 bg-vv-base/40 relative mb-2 h-7 cursor-pointer rounded-md border"
                onClick={seekFromEvent}
              >
                {rulerTicks.map((tick) => {
                  const left = totalDuration > 0 ? (tick / totalDuration) * 100 : 0;
                  return (
                    <div key={tick} className="absolute inset-y-0" style={{ left: `${left}%` }}>
                      <div className="bg-vv-border/70 h-2 w-px" />
                      <span className="text-vv-muted absolute top-2 text-[10px] font-mono">
                        {formatTime(tick)}
                      </span>
                    </div>
                  );
                })}

                {(showMarkers ? timeline?.markers ?? [] : []).map((marker) => {
                  const left = totalDuration > 0 ? (marker.time / totalDuration) * 100 : 0;
                  return (
                    <button
                      key={marker.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onMarkerSelect(marker.time);
                      }}
                      className="absolute top-0 h-full w-2 -translate-x-1 rounded-sm"
                      style={{ left: `${left}%`, backgroundColor: marker.color }}
                      title={`${marker.label} · ${formatTime(marker.time)}`}
                    />
                  );
                })}
              </div>

              <div className="relative space-y-2">
                <div
                  className="pointer-events-none absolute top-0 z-20 h-full w-px bg-accent shadow-[0_0_10px_rgba(82,222,255,0.8)]"
                  style={{ left: `${playheadLeft}px` }}
                >
                  <div className="bg-accent absolute -left-1.5 -top-1 h-3 w-3 rounded-full" />
                </div>

                <div
                  className="rounded-md border border-white/10 bg-white/[0.02] p-1"
                  style={{ height: `${rowHeights.video}px` }}
                  onClick={seekFromEvent}
                  onDragOver={onTrackDragOver}
                  onDrop={onTrackDrop}
                  onDragLeave={onTrackDragLeave}
                >
                  <div className="relative h-full">
                    {virtualizedSegments.map((segment) => {
                      const clip = segment.clip;
                      const width = Math.max(segment.duration * timelinePixelsPerSecond, 120);
                      const styles = clipColorClasses[clip.color];
                      const left = segment.start * timelinePixelsPerSecond;

                      return (
                        <button
                          key={clip.id}
                          draggable={!videoTrackLocked}
                          onDragStart={(event) => onClipDragStart(event, clip.id)}
                          onDragEnd={onClipDragEnd}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectClip(clip.id, segment.start);
                            onStopPlayback();
                          }}
                          className={`group absolute top-0 flex h-full items-center justify-between rounded-md border px-2 text-left text-xs transition-all ${
                            clip.id === selectedClipId ? styles.active : styles.idle
                          } ${videoTrackLocked ? 'cursor-not-allowed opacity-75' : ''}`}
                          style={{ left: `${left}px`, width: `${width}px` }}
                          title={`${clip.title} · ${formatTime(segment.duration)}`}
                        >
                          <span className="truncate pr-2 font-semibold">{clip.title}</span>
                          <span className="text-[10px] font-mono opacity-85">{formatTime(segment.duration)}</span>

                          {clip.transitionType !== 'cut' && (
                            <span className="absolute -right-1 -top-2 rounded bg-black/70 px-1 py-0.5 text-[9px] uppercase tracking-wide text-white/90">
                              {getTransitionLabel(clip.transitionType, clip.transitionDuration)}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {dragIndicatorTime !== null && (
                      <div
                        className="pointer-events-none absolute inset-y-0 w-0.5 bg-cyan-300/90 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                        style={{ left: `${dragIndicatorTime * timelinePixelsPerSecond}px` }}
                      />
                    )}
                  </div>
                </div>

                <div
                  className="rounded-md border border-white/10 bg-white/[0.02] p-1"
                  style={{ height: `${rowHeights.dialogue}px` }}
                  onClick={seekFromEvent}
                >
                  <div className="relative h-full">
                    {virtualizedSegments.map((segment) => {
                      const clip = segment.clip;
                      const width = Math.max(segment.duration * timelinePixelsPerSecond, 120);
                      const styles = clipColorClasses[clip.color];
                      const left = segment.start * timelinePixelsPerSecond;

                      const effectiveVolume =
                        timeline?.masterMuted || !trackStatus.dialogueAudible || clip.muted
                          ? 0
                          : (clip.audioVolume * (timeline?.masterVolume ?? 100)) / 100;

                      const waveformOpacity = timeline?.showWaveforms
                        ? Math.min(0.95, Math.max(0.15, effectiveVolume / 140))
                        : 0.18;

                      const barCount = Math.min(140, Math.max(24, Math.round(width / 4)));
                      const bars = timeline?.showWaveforms ? getWaveformBars(segment, barCount) : null;

                      return (
                        <button
                          key={`${clip.id}-audio`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectClip(clip.id, segment.start);
                          }}
                          className={`absolute top-0 h-full rounded-md border px-2 text-[10px] transition-all ${
                            clip.id === selectedClipId ? styles.active : styles.idle
                          }`}
                          style={{ left: `${left}px`, width: `${width}px` }}
                          title={`${clip.title} audio · ${Math.round(effectiveVolume)}%`}
                        >
                          {timeline?.showWaveforms && bars ? (
                            <div
                              className="absolute inset-y-1 left-2 right-2 flex items-center gap-[1px] overflow-hidden"
                              style={{ opacity: waveformOpacity }}
                            >
                              {bars.map((amplitude, index) => (
                                <span
                                  key={`${clip.id}-${index}`}
                                  className="w-[2px] flex-1 rounded-sm bg-white/80"
                                  style={{ height: `${Math.max(6, amplitude * 100)}%` }}
                                />
                              ))}
                            </div>
                          ) : (
                            <div
                              className="absolute inset-y-1 left-2 right-2 rounded"
                              style={{
                                opacity: waveformOpacity,
                                background:
                                  'repeating-linear-gradient(90deg, rgba(255,255,255,0.65) 0px, rgba(255,255,255,0.65) 2px, transparent 2px, transparent 6px)',
                              }}
                            />
                          )}
                          <span className="relative z-10 font-mono">
                            {timeline?.masterMuted || !trackStatus.dialogueAudible || clip.muted
                              ? 'Muted'
                              : `${Math.round(effectiveVolume)}%`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="rounded-md border border-white/10 bg-white/[0.02] p-1"
                  style={{ height: `${rowHeights.music}px` }}
                  onClick={seekFromEvent}
                >
                  <div className="relative h-full">
                    {virtualizedMusicBeds.map((item) => {
                      const width = Math.max(item.duration * timelinePixelsPerSecond, 50);
                      const left = item.start * timelinePixelsPerSecond;
                      const styles = clipColorClasses[item.color];
                      const isSelected = item.id === selectedMusicId;
                      const muted = item.muted || !trackStatus.musicAudible;

                      return (
                        <button
                          key={item.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectMusicBed(item.id, item.start);
                          }}
                          className={`absolute top-0 h-full rounded-md border px-2 text-left text-[10px] ${
                            isSelected ? styles.active : styles.idle
                          }`}
                          style={{ left: `${left}px`, width: `${width}px` }}
                          title={`${item.title} · ${formatTime(item.duration)}`}
                        >
                          <span className="truncate font-semibold">{item.title}</span>
                          <span className="ml-2 font-mono">{muted ? 'Muted' : `${item.volume}%`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="rounded-md border border-white/10 bg-white/[0.02] p-1"
                  style={{ height: `${rowHeights.titles}px` }}
                  onClick={seekFromEvent}
                >
                  <div className="relative h-full">
                    {virtualizedTitleOverlays.map((item) => {
                      const width = Math.max(item.duration * timelinePixelsPerSecond, 52);
                      const left = item.start * timelinePixelsPerSecond;
                      const isSelected = item.id === selectedTitleId;

                      return (
                        <button
                          key={item.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectTitle(item.id, item.start);
                          }}
                          className={`absolute top-0 h-full rounded border px-2 text-left text-[10px] ${
                            isSelected
                              ? 'border-fuchsia-200 bg-fuchsia-300/20 text-fuchsia-100'
                              : 'border-fuchsia-300/30 bg-fuchsia-400/10 text-fuchsia-100'
                          }`}
                          style={{ left: `${left}px`, width: `${width}px` }}
                          title={`${item.text} · ${formatTime(item.duration)}`}
                        >
                          <span className="truncate">{item.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-vv-border bg-vv-base/30 flex h-24 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-vv-muted text-sm">No timeline layers available yet.</p>
        </div>
      )}

      {showMarkers && (timeline?.markers.length ?? 0) > 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-vv-muted text-[11px] uppercase tracking-wider">Markers</p>
            <input
              value={markerQuery}
              onChange={(event) => setMarkerQuery(event.target.value)}
              placeholder="Filter markers"
              className="vv-input ml-auto h-8 max-w-[220px] py-1 text-[11px]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredMarkers.map((marker) => (
              <div
                key={marker.id}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs"
              >
                <button
                  onClick={() => {
                    onMarkerSelect(marker.time);
                    onClearSelections();
                  }}
                  className="inline-flex items-center gap-1"
                  title="Jump to marker"
                >
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: marker.color }} />
                  <span>{marker.label}</span>
                  <span className="text-vv-muted font-mono">{formatTime(marker.time)}</span>
                </button>
                <button
                  onClick={() => onRemoveMarker(marker.id)}
                  className="text-vv-muted hover:text-vv-primary px-1"
                  title="Delete marker"
                >
                  x
                </button>
              </div>
            ))}
            {filteredMarkers.length === 0 && (
              <p className="text-vv-muted text-xs">No markers match this filter.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
