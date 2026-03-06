'use client';

import {
  useMemo,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';
import { Lock, Volume2, VolumeX, CircleDot, Trash2 } from 'lucide-react';
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

/* ── Track row height (fixed FCP-style) ── */
const ROW_HEIGHTS: Record<TrackKind, number> = {
  video: 56,
  dialogue: 40,
  music: 40,
  titles: 32,
};

const clampPercent = (v: number) => Math.max(0, Math.min(100, v));

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
  playbackRange: { start: number; end: number } | null;
  onSetRangeIn: () => void;
  onSetRangeOut: () => void;
  onClearRange: () => void;
}

export function TimelineTrackCanvas({
  timeline,
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
  playbackRange,
}: TimelineTrackCanvasProps) {
  const trackKindRow = useMemo(
    () => trackRows.reduce<Record<string, TimelineTrackRow>>((map, row) => {
      map[row.kind] = row;
      return map;
    }, {}),
    [trackRows]
  );

  /* Playback range overlay positions */
  const rangeOverlay = useMemo(() => {
    if (!playbackRange || totalDuration <= 0) return null;
    return {
      leftPercent: clampPercent((playbackRange.start / totalDuration) * 100),
      widthPercent: clampPercent(
        ((playbackRange.end - playbackRange.start) / totalDuration) * 100
      ),
    };
  }, [playbackRange, totalDuration]);

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-[#2a2a2a] bg-[#1a1a1a]">
      {/* Track canvas area */}
      <div className="flex min-h-0 flex-1">
        {/* ── Track Headers (fixed left sidebar) ── */}
        <div className="flex w-[80px] shrink-0 flex-col border-r border-[#2a2a2a] bg-[#161616]">
          {/* Ruler header spacer */}
          <div className="h-6 border-b border-[#2a2a2a]" />

          {trackRows.map((row) => {
            const trackState = trackStatus.tracks.find((t) => t.kind === row.kind);
            const isLocked = trackState?.locked ?? false;
            const isMuted = trackState?.muted ?? false;
            const isSolo = trackState?.solo ?? false;
            const height = ROW_HEIGHTS[row.kind];

            return (
              <div
                key={row.kind}
                className="flex items-center border-b border-[#2a2a2a] px-1.5"
                style={{ height }}
              >
                <div className="flex flex-1 flex-col items-start gap-0.5">
                  <span className="text-[11px] font-semibold text-[#e5e5e5]">{row.short}</span>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() =>
                        updateTrack(row.kind, (t) => ({
                          ...t,
                          muted: !t.muted,
                        }))
                      }
                      className={`rounded p-0.5 ${
                        isMuted
                          ? 'text-[#ff6961] bg-[#ff3b30]/10'
                          : 'text-[#666] hover:text-[#b0b0b0]'
                      }`}
                      title={isMuted ? 'Unmute track' : 'Mute track'}
                    >
                      {isMuted ? (
                        <VolumeX className="h-3 w-3" />
                      ) : (
                        <Volume2 className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        updateTrack(row.kind, (t) => ({
                          ...t,
                          solo: !t.solo,
                        }))
                      }
                      className={`rounded px-1 text-[8px] font-bold ${
                        isSolo
                          ? 'text-[#ffd60a] bg-[#ffd60a]/10'
                          : 'text-[#666] hover:text-[#b0b0b0]'
                      }`}
                      title={isSolo ? 'Unsolo track' : 'Solo track'}
                    >
                      S
                    </button>
                    <button
                      onClick={() =>
                        updateTrack(row.kind, (t) => ({
                          ...t,
                          locked: !t.locked,
                        }))
                      }
                      className={`rounded p-0.5 ${
                        isLocked
                          ? 'text-[#ff9f0a] bg-[#ff9f0a]/10'
                          : 'text-[#666] hover:text-[#b0b0b0]'
                      }`}
                      title={isLocked ? 'Unlock track' : 'Lock track'}
                    >
                      <Lock className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Scrollable Timeline Area ── */}
        <div
          ref={timelineViewportRef}
          className="relative flex-1 overflow-x-auto overflow-y-hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onClearSelections();
              onStopPlayback();
            }
          }}
        >
          <div
            className="relative"
            style={{ width: Math.max(trackWidth, 200), minHeight: '100%' }}
          >
            {/* ── Ruler ── */}
            <div
              className="sticky top-0 z-30 h-6 border-b border-[#2a2a2a] bg-[#161616]"
              onMouseDown={(e) => seekFromEvent(e)}
            >
              {rulerTicks.map((tick) => {
                if (totalDuration <= 0) return null;
                const left = clampPercent((tick / totalDuration) * 100);
                return (
                  <div
                    key={tick}
                    className="absolute top-0 flex h-full flex-col items-center"
                    style={{ left: `${left}%` }}
                  >
                    <div className="h-2 w-px bg-[#444]" />
                    <span className="mt-px text-[8px] font-mono text-[#666]">
                      {formatTime(tick)}
                    </span>
                  </div>
                );
              })}

              {/* Range overlay on ruler */}
              {rangeOverlay && (
                <div
                  className="absolute bottom-0 h-1.5 bg-[#ffd60a]/40"
                  style={{
                    left: `${rangeOverlay.leftPercent}%`,
                    width: `${rangeOverlay.widthPercent}%`,
                  }}
                />
              )}
            </div>

            {/* ── Markers ── */}
            {showMarkers &&
              timeline?.markers.map((marker) => {
                if (totalDuration <= 0) return null;
                const left = clampPercent((marker.time / totalDuration) * 100);
                return (
                  <div
                    key={marker.id}
                    className="group absolute z-20"
                    style={{ left: `${left}%`, top: 0 }}
                  >
                    <button
                      onClick={() => onMarkerSelect(marker.time)}
                      className="relative -translate-x-1/2"
                      title={`${marker.label} (${formatTime(marker.time)})`}
                    >
                      <div
                        className="h-3 w-1.5 rounded-b-sm"
                        style={{ backgroundColor: marker.color }}
                      />
                    </button>
                    <button
                      onClick={() => onRemoveMarker(marker.id)}
                      className="absolute -right-4 -top-1 hidden rounded bg-[#ff3b30]/80 p-0.5 group-hover:block"
                      title="Remove marker"
                    >
                      <Trash2 className="h-2 w-2 text-white" />
                    </button>
                  </div>
                );
              })}

            {/* ── Track Rows ── */}
            <div
              onDragOver={onTrackDragOver}
              onDrop={onTrackDrop}
              onDragLeave={onTrackDragLeave}
            >
              {/* Video track (V1) */}
              <div
                className="relative border-b border-[#252525] bg-[#1c1c1c]"
                style={{ height: ROW_HEIGHTS.video }}
              >
                {/* Range overlay */}
                {rangeOverlay && (
                  <div
                    className="pointer-events-none absolute inset-y-0 bg-[#ffd60a]/[0.04]"
                    style={{
                      left: `${rangeOverlay.leftPercent}%`,
                      width: `${rangeOverlay.widthPercent}%`,
                    }}
                  />
                )}

                {virtualizedSegments.map((segment) => {
                  if (totalDuration <= 0) return null;
                  const leftPercent = clampPercent((segment.start / totalDuration) * 100);
                  const widthPercent = clampPercent((segment.duration / totalDuration) * 100);
                  const isSelected = selectedClipId === segment.clip.id;
                  const isDisabled = !segment.clip.enabled;
                  const colorClasses = clipColorClasses[segment.clip.color] ?? clipColorClasses.cyan;
                  const transLabel = getTransitionLabel(
                    segment.clip.transitionType,
                    segment.clip.transitionDuration
                  );

                  /* Waveform */
                  const barCount = Math.max(
                    8,
                    Math.round((segment.duration * timelinePixelsPerSecond) / 4)
                  );
                  const waveformBars = timeline?.showWaveforms
                    ? getWaveformBars(segment, barCount)
                    : null;

                  return (
                    <button
                      key={segment.clip.id}
                      onClick={() => onSelectClip(segment.clip.id, segment.start)}
                      draggable={!videoTrackLocked}
                      onDragStart={(e) => onClipDragStart(e, segment.clip.id)}
                      onDragEnd={onClipDragEnd}
                      className={`group absolute inset-y-0.5 overflow-hidden rounded-sm border transition-all ${
                        isSelected
                          ? 'z-10 border-[#0a84ff] ring-1 ring-[#0a84ff]/40'
                          : 'border-transparent hover:border-[#555]'
                      } ${isDisabled ? 'opacity-40' : ''} ${colorClasses.bg}`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        minWidth: 2,
                      }}
                      title={`${segment.clip.title} (${formatTime(segment.duration)})`}
                    >
                      {/* Filmstrip thumbnail */}
                      {segment.clip.thumbnailUrl && (
                        <div className="absolute inset-0 opacity-30">
                          <img
                            src={segment.clip.thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Text label */}
                      <div className="relative flex h-full items-end px-1 pb-0.5">
                        <span className="truncate text-[9px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {segment.clip.title}
                        </span>
                      </div>

                      {/* Waveform overlay */}
                      {waveformBars && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-3 items-end overflow-hidden px-px">
                          {waveformBars.map((bar, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-white/20"
                              style={{ height: `${Math.round(bar * 100)}%`, minHeight: 1 }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Transition label */}
                      {transLabel && (
                        <div className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 py-px text-[7px] text-white/70">
                          {transLabel}
                        </div>
                      )}

                      {/* Speed indicator */}
                      {segment.clip.playbackRate !== 1 && (
                        <div className="absolute left-0.5 top-0.5 rounded bg-black/60 px-1 py-px text-[7px] text-[#0a84ff]">
                          {segment.clip.playbackRate.toFixed(1)}x
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Dialogue track (A1) */}
              <div
                className="relative border-b border-[#252525] bg-[#1a1a1a]"
                style={{ height: ROW_HEIGHTS.dialogue }}
              >
                {rangeOverlay && (
                  <div
                    className="pointer-events-none absolute inset-y-0 bg-[#ffd60a]/[0.03]"
                    style={{
                      left: `${rangeOverlay.leftPercent}%`,
                      width: `${rangeOverlay.widthPercent}%`,
                    }}
                  />
                )}

                {/* Shadow audio blocks from video clips */}
                {virtualizedSegments.map((segment) => {
                  if (totalDuration <= 0) return null;
                  const leftPercent = clampPercent((segment.start / totalDuration) * 100);
                  const widthPercent = clampPercent((segment.duration / totalDuration) * 100);
                  const isDisabled = !segment.clip.enabled || segment.clip.muted;

                  const barCount = Math.max(
                    8,
                    Math.round((segment.duration * timelinePixelsPerSecond) / 4)
                  );
                  const waveformBars = timeline?.showWaveforms
                    ? getWaveformBars(segment, barCount)
                    : null;

                  return (
                    <div
                      key={`audio-${segment.clip.id}`}
                      className={`absolute inset-y-0.5 overflow-hidden rounded-sm bg-[#5e5ce6]/30 border border-[#5e5ce6]/20 ${
                        isDisabled ? 'opacity-30' : ''
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        minWidth: 2,
                      }}
                    >
                      {waveformBars && (
                        <div className="flex h-full items-center overflow-hidden px-px">
                          {waveformBars.map((bar, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-[#5e5ce6]/50"
                              style={{
                                height: `${Math.round(bar * 80)}%`,
                                minHeight: 1,
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {!waveformBars && (
                        <div className="flex h-full items-center px-1">
                          <span className="truncate text-[8px] text-[#5e5ce6]/60">
                            {segment.clip.title}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Music track (A2) */}
              <div
                className="relative border-b border-[#252525] bg-[#1c1c1c]"
                style={{ height: ROW_HEIGHTS.music }}
              >
                {rangeOverlay && (
                  <div
                    className="pointer-events-none absolute inset-y-0 bg-[#ffd60a]/[0.03]"
                    style={{
                      left: `${rangeOverlay.leftPercent}%`,
                      width: `${rangeOverlay.widthPercent}%`,
                    }}
                  />
                )}

                {virtualizedMusicBeds.map((bed) => {
                  if (totalDuration <= 0) return null;
                  const leftPercent = clampPercent((bed.start / totalDuration) * 100);
                  const widthPercent = clampPercent((bed.duration / totalDuration) * 100);
                  const isSelected = selectedMusicId === bed.id;

                  return (
                    <button
                      key={bed.id}
                      onClick={() => onSelectMusicBed(bed.id, bed.start)}
                      className={`absolute inset-y-0.5 overflow-hidden rounded-sm border transition-all ${
                        isSelected
                          ? 'z-10 border-[#30d158] ring-1 ring-[#30d158]/40'
                          : 'border-transparent hover:border-[#30d158]/50'
                      } bg-[#30d158]/20 ${bed.muted ? 'opacity-30' : ''}`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        minWidth: 2,
                      }}
                      title={`${bed.title} (${formatTime(bed.duration)})`}
                    >
                      <div className="flex h-full items-center px-1">
                        <span className="truncate text-[8px] font-medium text-[#30d158]">
                          ♪ {bed.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Titles track (T1) */}
              <div
                className="relative border-b border-[#252525] bg-[#1a1a1a]"
                style={{ height: ROW_HEIGHTS.titles }}
              >
                {rangeOverlay && (
                  <div
                    className="pointer-events-none absolute inset-y-0 bg-[#ffd60a]/[0.03]"
                    style={{
                      left: `${rangeOverlay.leftPercent}%`,
                      width: `${rangeOverlay.widthPercent}%`,
                    }}
                  />
                )}

                {virtualizedTitleOverlays.map((title) => {
                  if (totalDuration <= 0) return null;
                  const leftPercent = clampPercent((title.start / totalDuration) * 100);
                  const widthPercent = clampPercent((title.duration / totalDuration) * 100);
                  const isSelected = selectedTitleId === title.id;

                  return (
                    <button
                      key={title.id}
                      onClick={() => onSelectTitle(title.id, title.start)}
                      className={`absolute inset-y-0.5 overflow-hidden rounded-sm border transition-all ${
                        isSelected
                          ? 'z-10 border-[#bf5af2] ring-1 ring-[#bf5af2]/40'
                          : 'border-transparent hover:border-[#bf5af2]/50'
                      } bg-[#bf5af2]/20 ${!title.enabled ? 'opacity-30' : ''}`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        minWidth: 2,
                      }}
                      title={`${title.text} (${formatTime(title.duration)})`}
                    >
                      <div className="flex h-full items-center px-1">
                        <span className="truncate text-[8px] font-medium" style={{ color: title.color }}>
                          T {title.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Playhead ── */}
            <div
              className="pointer-events-none absolute top-0 z-40"
              style={{ left: playheadLeft, transform: 'translateX(-50%)' }}
            >
              {/* Playhead head (triangle) */}
              <div className="flex justify-center">
                <div
                  className="h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#ff3b30]"
                />
              </div>
              {/* Playhead line */}
              <div className="mx-auto h-[500px] w-px bg-[#ff3b30] shadow-[0_0_4px_rgba(255,59,48,0.5)]" />
            </div>

            {/* ── Drag indicator ── */}
            {dragIndicatorTime !== null && totalDuration > 0 && (
              <div
                className="pointer-events-none absolute top-0 z-30"
                style={{
                  left: `${clampPercent((dragIndicatorTime / totalDuration) * 100)}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="mx-auto h-full w-px bg-[#0a84ff] shadow-[0_0_6px_rgba(10,132,255,0.6)]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
