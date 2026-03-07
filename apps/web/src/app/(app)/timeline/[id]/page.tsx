'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAppStore, type Shot } from '@/features/workspace';
import { uploadAssetFile } from '@/lib/asset-upload';
import { MotionImage } from '@/components/motion-image';
import { toast } from 'sonner';
import { TimelineInspectorPanel } from './_components/timeline-inspector-panel';
import { TimelineTrackCanvas } from './_components/timeline-track-canvas';
import { TimelineToolbar } from './_components/timeline-toolbar';
import {
  type ClipColor,
  type DragState,
  type HistoryState,
  type MusicBed,
  type TimelineClip,
  type TimelineSegment,
  type TimelineState,
  type TimelineTrack,
  type TimelineViewportState,
  type TitleOverlay,
  type TitleStyle,
  type TrackKind,
  type TransitionType,
} from './_components/timeline-editor-domain';
import type { ToolMode } from './_components/timeline-editor-types';

const MIN_CLIP_SPAN_SECONDS = 0.3;
const MIN_ITEM_DURATION_SECONDS = 0.5;
const MIN_PLAYBACK_RANGE_SECONDS = 0.1;
const HISTORY_LIMIT = 120;
const PLAYBACK_TICK_SECONDS = 1 / 30;
const PLAYBACK_TICK_MS = 33;
const SNAP_THRESHOLD_SECONDS = 0.32;
const DEFAULT_TIMELINE_ZOOM = 1;
const MARKER_COLORS = ['#52deff', '#ffb36b', '#34d399', '#f472b6', '#a78bfa'];
const TITLE_COLORS = ['#f8fafc', '#fde68a', '#a7f3d0', '#fbcfe8', '#bfdbfe'];
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const CLIP_COLOR_ORDER: ClipColor[] = ['cyan', 'amber', 'emerald', 'rose', 'slate'];
const MAX_TIMELINE_WIDTH_PX = 180000;
const MIN_IMPORT_DURATION = 0.5;
const MAX_IMPORT_DURATION = 60 * 60 * 6;
const WAVEFORM_POINT_MIN = 96;
const WAVEFORM_POINT_MAX = 1024;
const WAVEFORM_STORAGE_PREFIX = 'videoviber-waveform-v1-';

const TRACK_IDS: Record<TrackKind, string> = {
  video: 'track-video',
  dialogue: 'track-dialogue',
  music: 'track-music',
  titles: 'track-titles',
};

const BASE_TRACKS: Record<TrackKind, TimelineTrack> = {
  video: { id: TRACK_IDS.video, kind: 'video', name: 'Video', locked: false, muted: false, solo: false },
  dialogue: { id: TRACK_IDS.dialogue, kind: 'dialogue', name: 'Dialogue', locked: false, muted: false, solo: false },
  music: { id: TRACK_IDS.music, kind: 'music', name: 'Music Bed', locked: false, muted: false, solo: false },
  titles: { id: TRACK_IDS.titles, kind: 'titles', name: 'Titles', locked: false, muted: false, solo: false },
};

const CLIP_COLOR_CLASSES: Record<ClipColor, { idle: string; active: string; accent: string; bg: string }> = {
  cyan: { idle: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100', active: 'border-cyan-200 bg-cyan-300/20', accent: 'bg-cyan-300/90', bg: 'bg-[#0e7490]/40' },
  amber: { idle: 'border-amber-300/30 bg-amber-400/10 text-amber-100', active: 'border-amber-200 bg-amber-300/20', accent: 'bg-amber-300/90', bg: 'bg-[#92400e]/40' },
  emerald: { idle: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100', active: 'border-emerald-200 bg-emerald-300/20', accent: 'bg-emerald-300/90', bg: 'bg-[#065f46]/40' },
  rose: { idle: 'border-rose-300/30 bg-rose-400/10 text-rose-100', active: 'border-rose-200 bg-rose-300/20', accent: 'bg-rose-300/90', bg: 'bg-[#9f1239]/40' },
  slate: { idle: 'border-slate-300/30 bg-slate-400/10 text-slate-100', active: 'border-slate-200 bg-slate-300/20', accent: 'bg-slate-300/90', bg: 'bg-[#334155]/40' },
};

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toFixedNumber = (value: number, decimals = 3) => Number(value.toFixed(decimals));

const formatTime = (seconds: number) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const tenths = Math.floor((safe - Math.floor(safe)) * 10);
  return `${minutes}:${secs.toString().padStart(2, '0')}.${tenths}`;
};

const formatTimecode = (seconds: number) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);
  const f = Math.floor((safe - Math.floor(safe)) * 30);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
};

const getClipDuration = (clip: TimelineClip) => {
  const sourceSpan = Math.max(MIN_CLIP_SPAN_SECONDS, clamp(clip.trimEnd - clip.trimStart, MIN_CLIP_SPAN_SECONDS, clip.sourceDuration));
  return Math.max(MIN_CLIP_SPAN_SECONDS, sourceSpan / clip.playbackRate);
};

const buildSegments = (clips: TimelineClip[]): TimelineSegment[] => {
  let cursor = 0;
  return clips.map((clip) => {
    const duration = getClipDuration(clip);
    const start = cursor;
    const end = start + duration;
    cursor = end;
    return { clip, start, end, duration };
  });
};

const getTickStep = (duration: number) => {
  if (duration <= 20) return 1;
  if (duration <= 60) return 2;
  if (duration <= 180) return 5;
  if (duration <= 600) return 10;
  if (duration <= 1800) return 30;
  if (duration <= 7200) return 60;
  if (duration <= 21600) return 300;
  return 600;
};

const getBasePixelsPerSecond = (duration: number) => {
  if (duration <= 90) return 56;
  if (duration <= 300) return 32;
  if (duration <= 900) return 18;
  if (duration <= 3600) return 8;
  if (duration <= 10800) return 3.5;
  return 2;
};

const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const getWaveformStorageKey = (key: string) => `${WAVEFORM_STORAGE_PREFIX}${hashString(key)}`;

const buildFallbackWaveform = (seed: string, points: number) => {
  let state = 0;
  for (let i = 0; i < seed.length; i += 1) { state = (state + seed.charCodeAt(i) * (i + 1)) % 2147483647; }
  const samples: number[] = [];
  let previous = 0.4;
  for (let i = 0; i < points; i += 1) {
    state = (state * 48271 + 12820163) % 2147483647;
    const noise = (state % 1000) / 1000;
    const shaped = 0.2 + 0.8 * Math.abs(Math.sin((i / points) * Math.PI * 6 + noise * 2));
    const blended = previous * 0.58 + shaped * 0.42;
    samples.push(clamp(blended, 0.05, 1));
    previous = blended;
  }
  return samples;
};

const sampleWaveformWindow = (source: number[], startRatio: number, endRatio: number, bars: number) => {
  if (source.length === 0 || bars <= 0) return [];
  const start = clamp(startRatio, 0, 1);
  const end = clamp(endRatio, start + Number.EPSILON, 1);
  const startIndex = Math.floor(start * (source.length - 1));
  const endIndex = Math.max(startIndex + 1, Math.ceil(end * (source.length - 1)));
  const span = endIndex - startIndex;
  const output: number[] = [];
  for (let barIndex = 0; barIndex < bars; barIndex += 1) {
    const windowStart = startIndex + Math.floor((barIndex / bars) * span);
    const windowEnd = startIndex + Math.floor(((barIndex + 1) / bars) * span);
    let peak = 0;
    for (let i = windowStart; i <= windowEnd; i += 1) {
      const value = source[i];
      if (value !== undefined && value > peak) peak = value;
    }
    output.push(peak || 0.04);
  }
  return output;
};

const getTransitionLabel = (type: TransitionType, duration: number) => {
  if (type === 'cut') return 'Cut';
  return `${type[0]?.toUpperCase() ?? ''}${type.slice(1)} ${duration.toFixed(1)}s`;
};

const getTitleStyleClasses = (style: TitleStyle) => {
  if (style === 'title') return 'left-1/2 top-[14%] -translate-x-1/2 rounded-md px-5 py-2 text-lg font-semibold';
  if (style === 'lower-third') return 'left-[6%] bottom-[14%] rounded-md px-4 py-2 text-sm font-semibold';
  return 'left-1/2 bottom-[12%] -translate-x-1/2 rounded px-3 py-1 text-xs font-medium';
};

const isInteractiveTarget = (target: EventTarget | null) => {
  const node = target as HTMLElement | null;
  if (!node) return false;
  return node.isContentEditable || node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT';
};

function toImportedTitle(fileName: string) {
  return fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim() || 'Imported Clip';
}

function readImportedVideoMetadata(url: string): Promise<{ duration: number; width?: number; height?: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const rawDuration = Number.isFinite(video.duration) ? video.duration : 6;
      resolve({ duration: Math.min(MAX_IMPORT_DURATION, Math.max(MIN_IMPORT_DURATION, rawDuration)), width: video.videoWidth || undefined, height: video.videoHeight || undefined });
    };
    video.onerror = () => reject(new Error('Unable to read video metadata'));
    video.src = url;
  });
}

const shotToTimelineClip = (shot: Shot, index: number): TimelineClip => {
  const sourceDuration = Math.max(1, shot.duration);
  return { id: uid('clip'), shotId: shot.id, title: shot.title || `Clip ${index + 1}`, prompt: shot.prompt, provider: shot.provider, sourceDuration, trimStart: 0, trimEnd: sourceDuration, playbackRate: 1, transitionType: 'cut', transitionDuration: 0, audioVolume: 100, muted: false, enabled: true, color: CLIP_COLOR_ORDER[index % CLIP_COLOR_ORDER.length] ?? 'cyan', thumbnailUrl: shot.thumbnailUrl, videoUrl: shot.videoUrl, status: shot.status };
};

const cloneBaseTrack = (kind: TrackKind): TimelineTrack => ({ ...BASE_TRACKS[kind] });
const createDefaultTracks = (): TimelineTrack[] => [cloneBaseTrack('video'), cloneBaseTrack('dialogue'), cloneBaseTrack('music'), cloneBaseTrack('titles')];

const buildInitialTimeline = (shots: Shot[], projectTitle: string): TimelineState => {
  const clips = shots.map((shot, index) => shotToTimelineClip(shot, index));
  const baseDuration = buildSegments(clips).at(-1)?.end ?? 0;
  const initialMusicDuration = Math.max(6, Math.min(baseDuration || 12, 24));
  return {
    clips, markers: [], tracks: createDefaultTracks(),
    musicBeds: clips.length > 0 ? [{ id: uid('music'), title: 'Ambient Bed', start: 0, duration: toFixedNumber(initialMusicDuration, 3), volume: 42, muted: false, loop: true, color: 'emerald' }] : [],
    titleOverlays: clips.length > 0 ? [{ id: uid('title'), text: projectTitle, start: 0.2, duration: 3.2, style: 'title', color: '#f8fafc', enabled: true }] : [],
    snapEnabled: true, showWaveforms: true, masterVolume: 100, masterMuted: false,
  };
};

const reorderClips = (clips: TimelineClip[], sourceId: string, targetId: string | null, position: 'before' | 'after' | 'end') => {
  const sourceIndex = clips.findIndex((clip) => clip.id === sourceId);
  if (sourceIndex < 0) return clips;
  const sourceClip = clips[sourceIndex];
  if (!sourceClip) return clips;
  const remaining = clips.filter((clip) => clip.id !== sourceId);
  let insertIndex = remaining.length;
  if (position !== 'end') {
    const targetIndex = remaining.findIndex((clip) => clip.id === targetId);
    if (targetIndex < 0) return clips;
    insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
  }
  const reordered = [...remaining];
  reordered.splice(insertIndex, 0, sourceClip);
  return reordered.every((clip, i) => clip.id === clips[i]?.id) ? clips : reordered;
};

const isTimelineState = (value: unknown): value is TimelineState => {
  if (!value || typeof value !== 'object') return false;
  const c = value as Partial<TimelineState>;
  return Array.isArray(c.clips) && Array.isArray(c.markers) && Array.isArray(c.tracks) && Array.isArray(c.musicBeds) && Array.isArray(c.titleOverlays) && typeof c.snapEnabled === 'boolean' && typeof c.showWaveforms === 'boolean' && typeof c.masterVolume === 'number' && typeof c.masterMuted === 'boolean';
};

function clampTrimStart(clip: TimelineClip, nextStart: number) { return clamp(nextStart, 0, Math.max(0, clip.trimEnd - MIN_CLIP_SPAN_SECONDS)); }
function clampTrimEnd(clip: TimelineClip, nextEnd: number) { return clamp(nextEnd, Math.min(clip.sourceDuration, clip.trimStart + MIN_CLIP_SPAN_SECONDS), clip.sourceDuration); }

type ClipClipboard = { clip: TimelineClip; mode: 'copy' | 'cut' };

function normalizeTimelineState(state: TimelineState): TimelineState {
  const clipColors = new Set<ClipColor>(CLIP_COLOR_ORDER);
  const tracksByKind = new Map(state.tracks.map((track) => [track.kind, track] as const));
  const normalizedTracks = createDefaultTracks().map((baseTrack) => {
    const existing = tracksByKind.get(baseTrack.kind);
    return existing ? { ...baseTrack, ...existing } : baseTrack;
  });
  return {
    ...state,
    clips: state.clips.map((clip, index) => {
      const maybeEnabled = (clip as TimelineClip & { enabled?: boolean }).enabled;
      const color = clipColors.has(clip.color) ? clip.color : CLIP_COLOR_ORDER[index % CLIP_COLOR_ORDER.length] ?? 'cyan';
      return { ...clip, enabled: typeof maybeEnabled === 'boolean' ? maybeEnabled : true, color };
    }),
    tracks: normalizedTracks,
    titleOverlays: state.titleOverlays.map((title) => {
      const maybeEnabled = (title as TitleOverlay & { enabled?: boolean }).enabled;
      return { ...title, enabled: typeof maybeEnabled === 'boolean' ? maybeEnabled : true };
    }),
  };
}

function createPastedClip(source: TimelineClip, mode: ClipClipboard['mode']): TimelineClip {
  const title = mode === 'copy' ? (source.title.toLowerCase().includes('(copy)') ? source.title : `${source.title} (Copy)`) : source.title;
  return { ...source, id: uid('clip'), title };
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export default function TimelineEditorPage({ params }: { params: { id: string } }) {
  const project = useAppStore((s) => s.projects.find((p) => p.id === params.id));
  const updateProject = useAppStore((s) => s.updateProject);
  const addShot = useAppStore((s) => s.addShot);
  const addAsset = useAppStore((s) => s.addAsset);

  const completedShots = useMemo(() => project?.shots.filter((shot) => shot.status === 'completed') ?? [], [project]);

  /* ── Core state ── */
  const [history, setHistory] = useState<HistoryState>({ entries: [], index: -1 });
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedMusicId, setSelectedMusicId] = useState<string | null>(null);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopPlayback, setLoopPlayback] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_TIMELINE_ZOOM);
  const [markerLabel, setMarkerLabel] = useState('');
  const [clipClipboard, setClipClipboard] = useState<ClipClipboard | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [importingMedia, setImportingMedia] = useState(false);
  const [, setWaveformVersion] = useState(0);
  const [viewport, setViewport] = useState<TimelineViewportState>({ scrollLeft: 0, width: 0 });
  const [toolMode, setToolMode] = useState<ToolMode>('select');

  /* ── Refs ── */
  const loadedProjectIdRef = useRef<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const timelineViewportRef = useRef<HTMLDivElement | null>(null);
  const timelineImportInputRef = useRef<HTMLInputElement | null>(null);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const waveformCacheRef = useRef<Map<string, number[]>>(new Map());
  const waveformPendingRef = useRef<Set<string>>(new Set());
  const waveformAudioContextRef = useRef<AudioContext | null>(null);
  const timelineStorageKey = project ? `videoviber-timeline-${project.id}` : null;

  /* ── Derived state ── */
  const timeline = history.index >= 0 ? history.entries[history.index] ?? null : null;
  const timelineClips = useMemo(() => timeline?.clips ?? [], [timeline]);
  const segments = useMemo(() => buildSegments(timelineClips), [timelineClips]);
  const segmentByClipId = useMemo(() => new Map(segments.map((s) => [s.clip.id, s] as const)), [segments]);

  const clipTimelineDuration = segments.at(-1)?.end ?? 0;
  const maxMusicEnd = useMemo(() => Math.max(0, ...((timeline?.musicBeds ?? []).map((item) => item.start + item.duration) || [0])), [timeline?.musicBeds]);
  const maxTitleEnd = useMemo(() => Math.max(0, ...((timeline?.titleOverlays ?? []).map((item) => item.start + item.duration) || [0])), [timeline?.titleOverlays]);
  const totalDuration = Math.max(clipTimelineDuration, maxMusicEnd, maxTitleEnd);

  const playbackRange = useMemo(() => {
    if (rangeStart === null || rangeEnd === null) return null;
    const safeStart = clamp(Math.min(rangeStart, rangeEnd), 0, totalDuration);
    const safeEnd = clamp(Math.max(rangeStart, rangeEnd), 0, totalDuration);
    if (safeEnd - safeStart < MIN_PLAYBACK_RANGE_SECONDS) return null;
    return { start: toFixedNumber(safeStart, 3), end: toFixedNumber(safeEnd, 3) };
  }, [rangeStart, rangeEnd, totalDuration]);
  const playbackStart = playbackRange?.start ?? 0;
  const playbackEnd = playbackRange?.end ?? totalDuration;

  /* Track status */
  const trackStatus = useMemo(() => {
    const tracks = timeline?.tracks ?? createDefaultTracks();
    const byKind = {} as Record<TrackKind, TimelineTrack>;
    for (const t of tracks) { byKind[t.kind] = t; }
    const hasSolo = tracks.some((t) => t.solo);
    const isKindAudible = (kind: TrackKind) => {
      const t = byKind[kind];
      if (!t || t.muted) return false;
      return !hasSolo || t.solo;
    };
    const isKindVisible = (kind: TrackKind) => {
      const t = byKind[kind];
      if (!t || t.muted) return false;
      return !hasSolo || t.solo;
    };
    return { tracks, byKind, hasSolo, videoVisible: isKindVisible('video'), dialogueAudible: isKindAudible('dialogue'), musicAudible: isKindAudible('music'), titlesVisible: isKindVisible('titles') };
  }, [timeline?.tracks]);

  /* Zoom / layout math */
  const basePixelsPerSecond = useMemo(() => getBasePixelsPerSecond(totalDuration), [totalDuration]);
  const timelinePixelsPerSecond = basePixelsPerSecond * zoom;
  const trackWidth = useMemo(() => clamp(Math.round(totalDuration * timelinePixelsPerSecond), 200, MAX_TIMELINE_WIDTH_PX), [totalDuration, timelinePixelsPerSecond]);
  const playheadLeft = useMemo(() => (totalDuration > 0 ? clamp((currentTime / totalDuration) * trackWidth, 0, trackWidth) : 0), [currentTime, totalDuration, trackWidth]);

  const rulerTicks = useMemo(() => {
    if (totalDuration <= 0) return [];
    const step = getTickStep(totalDuration);
    const ticks: number[] = [];
    for (let t = 0; t <= totalDuration + step * 0.01; t += step) ticks.push(toFixedNumber(Math.min(t, totalDuration), 3));
    return ticks;
  }, [totalDuration]);

  /* Virtualization */
  const virtualizedSegments = useMemo(() => {
    if (!viewport.width || totalDuration <= 0) return segments;
    const pps = timelinePixelsPerSecond;
    const viewStart = viewport.scrollLeft / pps;
    const viewEnd = (viewport.scrollLeft + viewport.width) / pps;
    const margin = 2;
    return segments.filter((s) => s.end >= viewStart - margin && s.start <= viewEnd + margin);
  }, [segments, viewport, timelinePixelsPerSecond, totalDuration]);

  const virtualizedMusicBeds = useMemo(() => {
    if (!viewport.width || totalDuration <= 0) return timeline?.musicBeds ?? [];
    const pps = timelinePixelsPerSecond;
    const viewStart = viewport.scrollLeft / pps;
    const viewEnd = (viewport.scrollLeft + viewport.width) / pps;
    return (timeline?.musicBeds ?? []).filter((b) => b.start + b.duration >= viewStart - 1 && b.start <= viewEnd + 1);
  }, [timeline?.musicBeds, viewport, timelinePixelsPerSecond, totalDuration]);

  const virtualizedTitleOverlays = useMemo(() => {
    if (!viewport.width || totalDuration <= 0) return timeline?.titleOverlays ?? [];
    const pps = timelinePixelsPerSecond;
    const viewStart = viewport.scrollLeft / pps;
    const viewEnd = (viewport.scrollLeft + viewport.width) / pps;
    return (timeline?.titleOverlays ?? []).filter((t) => t.start + t.duration >= viewStart - 1 && t.start <= viewEnd + 1);
  }, [timeline?.titleOverlays, viewport, timelinePixelsPerSecond, totalDuration]);

  /* Preview / selection */
  const selectedClip = useMemo(() => timelineClips.find((c) => c.id === selectedClipId) ?? null, [timelineClips, selectedClipId]);
  const selectedSegment = useMemo(() => (selectedClipId ? segmentByClipId.get(selectedClipId) ?? null : null), [selectedClipId, segmentByClipId]);
  const selectedMusicBed = useMemo(() => (selectedMusicId ? timeline?.musicBeds.find((b) => b.id === selectedMusicId) ?? null : null), [selectedMusicId, timeline?.musicBeds]);
  const selectedTitle = useMemo(() => (selectedTitleId ? timeline?.titleOverlays.find((t) => t.id === selectedTitleId) ?? null : null), [selectedTitleId, timeline?.titleOverlays]);

  const previewSegment = useMemo(() => segments.find((s) => currentTime >= s.start && currentTime < s.end) ?? segments.at(-1) ?? null, [segments, currentTime]);
  const previewClip = previewSegment?.clip ?? null;
  const canUsePreviewVideo = Boolean(previewClip?.videoUrl && previewClip?.enabled && trackStatus.videoVisible);


  const activeTitles = useMemo(() => {
    if (!trackStatus.titlesVisible) return [];
    return (timeline?.titleOverlays ?? []).filter((t) => t.enabled && currentTime >= t.start && currentTime < t.start + t.duration);
  }, [timeline?.titleOverlays, currentTime, trackStatus.titlesVisible]);

  /* ── Timeline state management ── */
  const loadTimelineState = useCallback((raw: TimelineState) => {
    const normalized = normalizeTimelineState(raw);
    setHistory({ entries: [normalized], index: 0 });
  }, []);

  const initializeTimeline = useCallback((shots: Shot[], projectTitle: string) => {
    const initial = buildInitialTimeline(shots, projectTitle);
    loadTimelineState(initial);
  }, [loadTimelineState]);

  const commitTimeline = useCallback((updater: (state: TimelineState) => TimelineState) => {
    setHistory((prev) => {
      const current = prev.index >= 0 ? prev.entries[prev.index] : null;
      if (!current) return prev;
      const next = updater(current);
      if (next === current) return prev;
      const trimmed = prev.entries.slice(0, prev.index + 1);
      const entries = [...trimmed, next].slice(-HISTORY_LIMIT);
      return { entries, index: entries.length - 1 };
    });
  }, []);

  const canUndo = history.index > 0;
  const canRedo = history.index < history.entries.length - 1;

  const handleUndo = useCallback(() => {
    setHistory((prev) => (prev.index > 0 ? { ...prev, index: prev.index - 1 } : prev));
  }, []);

  const handleRedo = useCallback(() => {
    setHistory((prev) => (prev.index < prev.entries.length - 1 ? { ...prev, index: prev.index + 1 } : prev));
  }, []);

  /* ── Track management ── */
  const updateTrack = useCallback((kind: TrackKind, updater: (track: TimelineTrack) => TimelineTrack) => {
    commitTimeline((state) => ({
      ...state,
      tracks: state.tracks.map((track) => (track.kind === kind ? updater(track) : track)),
    }));
  }, [commitTimeline]);

  /* ── Clip operations ── */
  const updateSelectedClip = useCallback((updater: (clip: TimelineClip) => TimelineClip) => {
    if (!selectedClipId) return;
    commitTimeline((state) => ({
      ...state,
      clips: state.clips.map((clip) => (clip.id === selectedClipId ? updater(clip) : clip)),
    }));
  }, [selectedClipId, commitTimeline]);

  const moveSelectedClip = useCallback((direction: -1 | 1) => {
    if (!selectedClipId || trackStatus.byKind.video.locked) return;
    commitTimeline((state) => {
      const index = state.clips.findIndex((c) => c.id === selectedClipId);
      if (index < 0) return state;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= state.clips.length) return state;
      const clips = [...state.clips];
      const temp = clips[index]!;
      clips[index] = clips[targetIndex]!;
      clips[targetIndex] = temp;
      return { ...state, clips };
    });
    toast.success(`Clip moved ${direction < 0 ? 'left' : 'right'}.`);
  }, [selectedClipId, trackStatus.byKind.video.locked, commitTimeline]);

  const duplicateSelectedClip = useCallback(() => {
    if (!selectedClipId || trackStatus.byKind.video.locked) return;
    commitTimeline((state) => {
      const original = state.clips.find((c) => c.id === selectedClipId);
      if (!original) return state;
      const duplicate = { ...original, id: uid('clip'), title: `${original.title} (Dup)` };
      const index = state.clips.findIndex((c) => c.id === selectedClipId);
      const clips = [...state.clips];
      clips.splice(index + 1, 0, duplicate);
      return { ...state, clips };
    });
    toast.success('Clip duplicated.');
  }, [selectedClipId, trackStatus.byKind.video.locked, commitTimeline]);

  const deleteSelectedClip = useCallback(() => {
    if (!selectedClipId || trackStatus.byKind.video.locked) return;
    commitTimeline((state) => ({ ...state, clips: state.clips.filter((c) => c.id !== selectedClipId) }));
    setSelectedClipId(null);
    toast.success('Clip removed.');
  }, [selectedClipId, trackStatus.byKind.video.locked, commitTimeline]);

  /* Clipboard */
  const copySelectedClipToClipboard = useCallback(() => {
    if (!selectedClip) return;
    setClipClipboard({ clip: selectedClip, mode: 'copy' });
    toast.success('Clip copied to clipboard.');
  }, [selectedClip]);

  const cutSelectedClipToClipboard = useCallback(() => {
    if (!selectedClip || trackStatus.byKind.video.locked) return;
    setClipClipboard({ clip: selectedClip, mode: 'cut' });
    commitTimeline((state) => ({ ...state, clips: state.clips.filter((c) => c.id !== selectedClip.id) }));
    setSelectedClipId(null);
    toast.success('Clip cut to clipboard.');
  }, [selectedClip, trackStatus.byKind.video.locked, commitTimeline]);

  const pasteClipFromClipboard = useCallback(() => {
    if (!clipClipboard || trackStatus.byKind.video.locked) return;
    const newClip = createPastedClip(clipClipboard.clip, clipClipboard.mode);
    commitTimeline((state) => ({ ...state, clips: [...state.clips, newClip] }));
    setSelectedClipId(newClip.id);
    if (clipClipboard.mode === 'cut') setClipClipboard(null);
    toast.success('Clip pasted.');
  }, [clipClipboard, trackStatus.byKind.video.locked, commitTimeline]);

  /* Selection */
  const selectClip = useCallback((clipId: string, startTime?: number) => {
    setSelectedClipId(clipId);
    setSelectedMusicId(null);
    setSelectedTitleId(null);
    if (startTime !== undefined) setCurrentTime(startTime);
  }, []);

  const selectMusicBed = useCallback((bedId: string, startTime?: number) => {
    setSelectedMusicId(bedId);
    setSelectedClipId(null);
    setSelectedTitleId(null);
    if (startTime !== undefined) setCurrentTime(startTime);
  }, []);

  const selectTitle = useCallback((titleId: string, startTime?: number) => {
    setSelectedTitleId(titleId);
    setSelectedClipId(null);
    setSelectedMusicId(null);
    if (startTime !== undefined) setCurrentTime(startTime);
  }, []);

  /* Seek */
  const seekTo = useCallback((target: number, options?: { disableSnap?: boolean }) => {
    const shouldSnap = timeline?.snapEnabled && !options?.disableSnap;
    let nextTime = clamp(target, 0, totalDuration);
    if (shouldSnap) {
      const snapTargets = [...segments.map((s) => s.start), ...segments.map((s) => s.end), ...(timeline?.markers ?? []).map((m) => m.time)];
      if (playbackRange) { snapTargets.push(playbackRange.start, playbackRange.end); }
      for (const st of snapTargets) {
        if (Math.abs(nextTime - st) < SNAP_THRESHOLD_SECONDS) { nextTime = st; break; }
      }
    }
    setCurrentTime(clamp(nextTime, 0, totalDuration));
  }, [totalDuration, segments, timeline?.snapEnabled, timeline?.markers, playbackRange]);

  const seekFromEvent = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const viewportElement = timelineViewportRef.current;
    if (!viewportElement || timelinePixelsPerSecond <= 0) return;
    const rect = viewportElement.getBoundingClientRect();
    const absoluteX = viewportElement.scrollLeft + (event.clientX - rect.left);
    seekTo(absoluteX / timelinePixelsPerSecond);
  }, [timelinePixelsPerSecond, seekTo]);

  /* Split */
  const splitSelectedClip = useCallback(() => {
    if (!selectedClipId || trackStatus.byKind.video.locked) return;
    const segment = segmentByClipId.get(selectedClipId);
    if (!segment) return;
    const localTime = currentTime - segment.start;
    const sourceTime = segment.clip.trimStart + localTime * segment.clip.playbackRate;
    if (sourceTime <= segment.clip.trimStart + 0.1 || sourceTime >= segment.clip.trimEnd - 0.1) {
      toast.error('Playhead too close to clip edge.');
      return;
    }
    commitTimeline((state) => {
      const clipIndex = state.clips.findIndex((c) => c.id === selectedClipId);
      if (clipIndex < 0) return state;
      const original = state.clips[clipIndex]!;
      const clipA = { ...original, id: uid('clip'), trimEnd: toFixedNumber(sourceTime, 3), title: `${original.title} (L)` };
      const clipB = { ...original, id: uid('clip'), trimStart: toFixedNumber(sourceTime, 3), title: `${original.title} (R)`, transitionType: 'cut' as TransitionType, transitionDuration: 0 };
      const clips = [...state.clips];
      clips.splice(clipIndex, 1, clipA, clipB);
      return { ...state, clips };
    });
    toast.success('Clip split at playhead.');
  }, [selectedClipId, currentTime, trackStatus.byKind.video.locked, segmentByClipId, commitTimeline]);

  /* Markers */
  const addMarkerAtPlayhead = useCallback(() => {
    if (!timeline || totalDuration <= 0) return;
    const markerTime = clamp(currentTime, 0, totalDuration);
    const label = markerLabel.trim() || `Marker ${timeline.markers.length + 1}`;
    const color = MARKER_COLORS[timeline.markers.length % MARKER_COLORS.length] ?? '#52deff';
    commitTimeline((state) => ({
      ...state,
      markers: [...state.markers, { id: uid('marker'), label, time: markerTime, color }].sort((a, b) => a.time - b.time),
    }));
    setSelectedClipId(null); setSelectedMusicId(null); setSelectedTitleId(null);
    setMarkerLabel('');
    toast.success(`Marker added at ${formatTime(markerTime)}.`);
  }, [timeline, totalDuration, currentTime, markerLabel, commitTimeline]);

  const removeMarker = useCallback((markerId: string) => {
    commitTimeline((state) => ({ ...state, markers: state.markers.filter((m) => m.id !== markerId) }));
    toast.success('Marker removed.');
  }, [commitTimeline]);

  /* Music beds */
  const addMusicBedAtPlayhead = useCallback(() => {
    if (trackStatus.byKind.music.locked) { toast.error('Music track is locked.'); return; }
    const start = clamp(currentTime, 0, Math.max(totalDuration, 0));
    const id = uid('music');
    commitTimeline((state) => ({
      ...state,
      musicBeds: [...state.musicBeds, { id, title: `Music ${state.musicBeds.length + 1}`, start: toFixedNumber(start, 3), duration: Math.min(8, Math.max(totalDuration - start, 3)), volume: 65, muted: false, loop: false, color: 'amber' as ClipColor }],
    }));
    setSelectedMusicId(id); setSelectedClipId(null); setSelectedTitleId(null);
    toast.success('Music bed added.');
  }, [trackStatus.byKind.music.locked, currentTime, totalDuration, commitTimeline]);

  const updateSelectedMusicBed = useCallback((updater: (item: MusicBed) => MusicBed) => {
    if (!selectedMusicId) return;
    commitTimeline((state) => ({ ...state, musicBeds: state.musicBeds.map((item) => (item.id === selectedMusicId ? updater(item) : item)) }));
  }, [selectedMusicId, commitTimeline]);

  const removeSelectedMusicBed = useCallback(() => {
    if (!selectedMusicId || trackStatus.byKind.music.locked) return;
    commitTimeline((state) => ({ ...state, musicBeds: state.musicBeds.filter((item) => item.id !== selectedMusicId) }));
    setSelectedMusicId(null);
    toast.success('Music bed removed.');
  }, [selectedMusicId, trackStatus.byKind.music.locked, commitTimeline]);

  /* Title overlays */
  const addTitleAtPlayhead = useCallback(() => {
    if (trackStatus.byKind.titles.locked) { toast.error('Title track is locked.'); return; }
    const start = clamp(currentTime, 0, Math.max(totalDuration, 0));
    const id = uid('title');
    commitTimeline((state) => ({
      ...state,
      titleOverlays: [...state.titleOverlays, { id, text: `Title ${state.titleOverlays.length + 1}`, start: toFixedNumber(start, 3), duration: 3, style: 'lower-third' as TitleStyle, color: TITLE_COLORS[state.titleOverlays.length % TITLE_COLORS.length] ?? '#f8fafc', enabled: true }],
    }));
    setSelectedTitleId(id); setSelectedClipId(null); setSelectedMusicId(null);
    toast.success('Title overlay added.');
  }, [trackStatus.byKind.titles.locked, currentTime, totalDuration, commitTimeline]);

  const updateSelectedTitle = useCallback((updater: (item: TitleOverlay) => TitleOverlay) => {
    if (!selectedTitleId) return;
    commitTimeline((state) => ({ ...state, titleOverlays: state.titleOverlays.map((item) => (item.id === selectedTitleId ? updater(item) : item)) }));
  }, [selectedTitleId, commitTimeline]);

  const removeSelectedTitle = useCallback(() => {
    if (!selectedTitleId || trackStatus.byKind.titles.locked) return;
    commitTimeline((state) => ({ ...state, titleOverlays: state.titleOverlays.filter((item) => item.id !== selectedTitleId) }));
    setSelectedTitleId(null);
    toast.success('Title overlay removed.');
  }, [selectedTitleId, trackStatus.byKind.titles.locked, commitTimeline]);

  /* Delete current selection */
  const deleteCurrentSelection = useCallback(() => {
    if (selectedClipId) { deleteSelectedClip(); return; }
    if (selectedMusicId) { removeSelectedMusicBed(); return; }
    if (selectedTitleId) { removeSelectedTitle(); return; }
  }, [selectedClipId, selectedMusicId, selectedTitleId, deleteSelectedClip, removeSelectedMusicBed, removeSelectedTitle]);

  /* Playback range */
  const setInPoint = useCallback(() => { setRangeStart(currentTime); toast.success(`In point at ${formatTime(currentTime)}`); }, [currentTime]);
  const setOutPoint = useCallback(() => { setRangeEnd(currentTime); toast.success(`Out point at ${formatTime(currentTime)}`); }, [currentTime]);
  const clearPlaybackRange = useCallback(() => { setRangeStart(null); setRangeEnd(null); toast.success('Range cleared.'); }, []);
  const setPlaybackRangeToSelectedClip = useCallback(() => {
    if (!selectedSegment) return;
    setRangeStart(selectedSegment.start);
    setRangeEnd(selectedSegment.end);
  }, [selectedSegment]);

  /* Zoom / fit */
  const fitTimelineToViewport = useCallback(() => {
    const vp = timelineViewportRef.current;
    if (!vp || totalDuration <= 0) { setZoom(DEFAULT_TIMELINE_ZOOM); return; }
    const available = Math.max(240, vp.clientWidth - 20);
    setZoom(toFixedNumber(clamp(available / (totalDuration * basePixelsPerSecond), 0.25, 8), 2));
  }, [totalDuration, basePixelsPerSecond]);

  /* Playback */
  const toggleLoopPlayback = useCallback(() => setLoopPlayback((v) => !v), []);
  const togglePlayback = useCallback(() => {
    setIsPlaying((playing) => {
      if (!playing && playbackRange) {
        setCurrentTime((prev) => (prev < playbackRange.start || prev >= playbackRange.end ? playbackRange.start : prev));
      }
      return !playing;
    });
  }, [playbackRange]);

  /* Refresh from project */
  const refreshFromProjectShots = useCallback(() => {
    if (!project) return;
    initializeTimeline(completedShots, project.title);
    toast.success('Timeline refreshed.');
  }, [project, completedShots, initializeTimeline]);

  /* ── Media Import ── */
  const handleImportMedia = useCallback(async (files: FileList) => {
    if (!project || importingMedia) return;
    setImportingMedia(true);
    try {
      for (const file of Array.from(files)) {
        const metadataUrl = URL.createObjectURL(file);
        let metadata: { duration: number; width?: number; height?: number };
        try {
          metadata = await readImportedVideoMetadata(metadataUrl);
        } finally {
          URL.revokeObjectURL(metadataUrl);
        }
        const uploaded = await uploadAssetFile(file, { projectId: project.id });
        const title = toImportedTitle(file.name);
        const newShotData = {
          projectId: project.id, title, prompt: `Imported from ${file.name}`, provider: 'import', status: 'completed' as const,
          duration: metadata.duration, order: timelineClips.length, sourceType: 'import' as const,
          thumbnailUrl: null, videoUrl: uploaded.url,
        };
        const shotId = addShot(project.id, newShotData);
        addAsset({
          projectId: project.id,
          type: 'video' as const,
          url: uploaded.url,
          storagePath: uploaded.storagePath,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'video/mp4',
          storageMode: 'remote-url',
          volatile: false,
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
        });
        const shotForClip: Shot = { ...newShotData, id: shotId, createdAt: new Date().toISOString() };
        const clip = shotToTimelineClip(shotForClip, timelineClips.length);
        commitTimeline((state) => ({ ...state, clips: [...state.clips, clip] }));
      }
      toast.success(`${files.length} clip${files.length > 1 ? 's' : ''} imported.`);
    } catch (err) {
      toast.error('Import failed.');
    } finally {
      setImportingMedia(false);
    }
  }, [project, importingMedia, timelineClips.length, addShot, addAsset, commitTimeline]);

  /* ── Waveform ── */
  const getWaveformKey = useCallback((clip: TimelineClip) => [clip.shotId, clip.videoUrl ?? 'no-video', clip.sourceDuration.toFixed(3), clip.provider].join('|'), []);

  const readCachedWaveform = useCallback((key: string) => {
    const inMemory = waveformCacheRef.current.get(key);
    if (inMemory) return inMemory;
    try {
      const raw = window.localStorage.getItem(getWaveformStorageKey(key));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return null;
      const points = parsed.map((e) => (typeof e === 'number' ? clamp(e, 0, 1) : null)).filter((e): e is number => e !== null);
      if (points.length === 0) return null;
      waveformCacheRef.current.set(key, points);
      return points;
    } catch { return null; }
  }, []);

  const persistWaveform = useCallback((key: string, points: number[]) => {
    waveformCacheRef.current.set(key, points);
    try { window.localStorage.setItem(getWaveformStorageKey(key), JSON.stringify(points)); } catch {}
  }, []);

  const generateWaveformPoints = useCallback(async (clip: TimelineClip, key: string) => {
    const points = clamp(Math.round(clip.sourceDuration * 12), WAVEFORM_POINT_MIN, WAVEFORM_POINT_MAX);
    if (!clip.videoUrl) return buildFallbackWaveform(key, points);
    try {
      const response = await fetch(clip.videoUrl);
      if (!response.ok) throw new Error(`Fetch failed (${response.status})`);
      const buf = await response.arrayBuffer();
      if (!waveformAudioContextRef.current) {
        const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) throw new Error('Web Audio API unavailable');
        waveformAudioContextRef.current = new Ctx();
      }
      const decoded = await waveformAudioContextRef.current.decodeAudioData(buf.slice(0));
      const channel = decoded.getChannelData(0);
      if (!channel || channel.length === 0) throw new Error('No audio channel');
      const bucketSize = Math.max(1, Math.floor(channel.length / points));
      const stride = Math.max(1, Math.floor(bucketSize / 120));
      const result: number[] = [];
      let globalPeak = 0;
      for (let p = 0; p < points; p += 1) {
        const start = p * bucketSize;
        const end = p === points - 1 ? channel.length : Math.min(channel.length, start + bucketSize);
        let peak = 0;
        for (let i = start; i < end; i += stride) { const s = Math.abs(channel[i] ?? 0); if (s > peak) peak = s; }
        globalPeak = Math.max(globalPeak, peak);
        result.push(peak);
      }
      if (globalPeak <= 0) return buildFallbackWaveform(key, points);
      return result.map((s) => clamp(s / globalPeak, 0.03, 1));
    } catch { return buildFallbackWaveform(key, points); }
  }, []);

  const getWaveformBars = useCallback((segment: TimelineSegment, bars: number) => {
    const key = getWaveformKey(segment.clip);
    const source = waveformCacheRef.current.get(key);
    if (!source || source.length === 0) return null;
    const sourceDuration = Math.max(segment.clip.sourceDuration, MIN_CLIP_SPAN_SECONDS);
    const startRatio = clamp(segment.clip.trimStart / sourceDuration, 0, 1);
    const endRatio = clamp(segment.clip.trimEnd / sourceDuration, startRatio + Number.EPSILON, 1);
    return sampleWaveformWindow(source, startRatio, endRatio, bars);
  }, [getWaveformKey]);

  /* ── Drag & Drop ── */
  const handleClipDragStart = useCallback((event: ReactDragEvent<HTMLButtonElement>, clipId: string) => {
    if (trackStatus.byKind.video.locked) { event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', clipId);
    setDragState({ sourceId: clipId, targetId: null, position: 'after' });
  }, [trackStatus.byKind.video.locked]);

  const getTimelineTimeAtClientX = useCallback((clientX: number) => {
    const vp = timelineViewportRef.current;
    if (!vp || timelinePixelsPerSecond <= 0) return 0;
    const rect = vp.getBoundingClientRect();
    return clamp((vp.scrollLeft + (clientX - rect.left)) / timelinePixelsPerSecond, 0, totalDuration);
  }, [timelinePixelsPerSecond, totalDuration]);

  const getDropTargetFromTime = useCallback((time: number): Pick<DragState, 'targetId' | 'position'> => {
    if (segments.length === 0) return { targetId: null, position: 'end' };
    for (const s of segments) { if (time < s.start + s.duration / 2) return { targetId: s.clip.id, position: 'before' }; }
    return { targetId: segments[segments.length - 1]?.clip.id ?? null, position: 'after' };
  }, [segments]);

  const applyDragReorder = useCallback((targetId: string | null, position: 'before' | 'after' | 'end') => {
    if (!dragState || trackStatus.byKind.video.locked) return;
    let moved = false;
    commitTimeline((state) => {
      const reordered = reorderClips(state.clips, dragState.sourceId, targetId, position);
      moved = reordered !== state.clips;
      return moved ? { ...state, clips: reordered } : state;
    });
    if (moved) toast.success('Clips reordered.');
    setDragState(null);
  }, [dragState, trackStatus.byKind.video.locked, commitTimeline]);

  const handleTrackDragOver = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
    if (!dragState) return;
    event.preventDefault();
    const time = getTimelineTimeAtClientX(event.clientX);
    const target = getDropTargetFromTime(time);
    setDragState((prev) => (prev ? { ...prev, ...target } : prev));
  }, [dragState, getTimelineTimeAtClientX, getDropTargetFromTime]);

  const handleTrackDrop = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!dragState) return;
    if (dragState.sourceId === dragState.targetId) { setDragState(null); return; }
    applyDragReorder(dragState.targetId, dragState.position);
  }, [dragState, applyDragReorder]);

  const dragIndicatorTime = useMemo(() => {
    if (!dragState) return null;
    if (dragState.position === 'end' || !dragState.targetId) return totalDuration;
    const targetSegment = segmentByClipId.get(dragState.targetId);
    if (!targetSegment) return null;
    return dragState.position === 'before' ? targetSegment.start : targetSegment.end;
  }, [dragState, segmentByClipId, totalDuration]);

  /* ── Preview video sync ── */
  const syncPreviewVideo = useCallback((forceSeek = false) => {
    const video = previewVideoRef.current;
    const clip = previewSegment?.clip;
    if (!video || !previewSegment || !clip || !clip.videoUrl || !clip.enabled || !trackStatus.videoVisible) return;
    const localTimeline = clamp(currentTime - previewSegment.start, 0, previewSegment.duration);
    const targetTime = clamp(clip.trimStart + localTimeline * clip.playbackRate, clip.trimStart, clip.trimEnd);
    const seekThreshold = isPlaying ? 0.22 : 0.035;
    if (forceSeek || Math.abs(video.currentTime - targetTime) > seekThreshold) { try { video.currentTime = targetTime; } catch {} }
    video.playbackRate = clip.playbackRate;
    const muted = Boolean(timeline?.masterMuted || !trackStatus.dialogueAudible || clip.muted || !clip.enabled);
    const volume = clamp((clip.audioVolume * (timeline?.masterVolume ?? 100)) / 10000, 0, 1);
    video.muted = muted;
    video.volume = muted ? 0 : volume;
    if (isPlaying) { const p = video.play(); if (p && typeof p.catch === 'function') p.catch(() => setIsPlaying(false)); } else { video.pause(); }
  }, [currentTime, isPlaying, previewSegment, timeline?.masterMuted, timeline?.masterVolume, trackStatus.videoVisible, trackStatus.dialogueAudible]);

  const handlePreviewTimeUpdate = useCallback(() => {
    if (!isPlaying) return;
    const video = previewVideoRef.current;
    const segment = previewSegment;
    if (!video || !segment || !segment.clip.videoUrl || !segment.clip.enabled || !trackStatus.videoVisible) return;
    const elapsed = (video.currentTime - segment.clip.trimStart) / segment.clip.playbackRate;
    const next = clamp(segment.start + elapsed, segment.start, segment.end);
    setCurrentTime((prev) => Math.abs(prev - next) > 1 / 120 ? next : prev);
    if (next >= segment.end - 1 / 30) {
      const n = segment.end + 0.0001;
      if (n >= playbackEnd) { loopPlayback ? setCurrentTime(playbackStart) : (setCurrentTime(playbackEnd), setIsPlaying(false)); } else { setCurrentTime(n); }
    }
  }, [isPlaying, previewSegment, trackStatus.videoVisible, playbackStart, playbackEnd, loopPlayback]);

  const handlePreviewEnded = useCallback(() => {
    if (!isPlaying) return;
    if (currentTime >= playbackEnd - 1 / 60) { loopPlayback ? setCurrentTime(playbackStart) : (setCurrentTime(playbackEnd), setIsPlaying(false)); return; }
    setCurrentTime((prev) => Math.min(playbackEnd, prev + 0.001));
  }, [isPlaying, currentTime, playbackStart, playbackEnd, loopPlayback]);

  /* ── Export ── */
  const handleExport = useCallback(() => {
    if (!project || !timeline || timeline.clips.length === 0) { toast.error('No clips to export.'); return; }
    const exportSegments = buildSegments(timeline.clips);
    const manifest = {
      exportedAt: new Date().toISOString(), projectId: project.id, projectTitle: project.title,
      totalDurationSeconds: toFixedNumber(totalDuration, 3),
      timeline: exportSegments.map((s, i) => ({
        order: i + 1, clipId: s.clip.id, title: s.clip.title, prompt: s.clip.prompt, provider: s.clip.provider,
        sourceDurationSeconds: toFixedNumber(s.clip.sourceDuration, 3), timelineStartSeconds: toFixedNumber(s.start, 3), timelineEndSeconds: toFixedNumber(s.end, 3), durationSeconds: toFixedNumber(s.duration, 3),
        trimStartSeconds: toFixedNumber(s.clip.trimStart, 3), trimEndSeconds: toFixedNumber(s.clip.trimEnd, 3), playbackRate: s.clip.playbackRate, enabled: s.clip.enabled,
        transition: { type: s.clip.transitionType, durationSeconds: toFixedNumber(s.clip.transitionDuration, 3) },
        videoUrl: s.clip.videoUrl, thumbnailUrl: s.clip.thumbnailUrl,
      })),
      markers: timeline.markers.map((m) => ({ id: m.id, label: m.label, timeSeconds: toFixedNumber(m.time, 3), color: m.color })),
      musicBeds: timeline.musicBeds.map((b, i) => ({ order: i + 1, id: b.id, title: b.title, startSeconds: toFixedNumber(b.start, 3), durationSeconds: toFixedNumber(b.duration, 3), volume: b.volume, muted: b.muted, loop: b.loop })),
      titleOverlays: timeline.titleOverlays.map((t, i) => ({ order: i + 1, id: t.id, text: t.text, startSeconds: toFixedNumber(t.start, 3), durationSeconds: toFixedNumber(t.duration, 3), style: t.style, color: t.color, enabled: t.enabled })),
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'videoviber-project';
    link.href = url; link.download = `${slug}-edit-decision-list.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    updateProject(project.id, { status: 'exported' });
    toast.success('Edit decision list exported.');
  }, [project, timeline, totalDuration, updateProject]);

  /* ══════════════════════ EFFECTS ══════════════════════ */

  /* Initialize timeline */
  useEffect(() => {
    if (!project) return;
    if (loadedProjectIdRef.current === project.id) return;
    loadedProjectIdRef.current = project.id;
    if (timelineStorageKey) {
      try {
        const raw = window.localStorage.getItem(timelineStorageKey);
        if (raw) { const parsed = JSON.parse(raw) as unknown; if (isTimelineState(parsed)) { loadTimelineState(parsed); toast.success('Recovered saved timeline draft.'); return; } }
      } catch {}
    }
    initializeTimeline(completedShots, project.title);
  }, [project, completedShots, initializeTimeline, loadTimelineState, timelineStorageKey]);

  /* Autosave */
  useEffect(() => {
    if (!timelineStorageKey || !timeline) return;
    if (autosaveTimeoutRef.current !== null) window.clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = window.setTimeout(() => {
      try { window.localStorage.setItem(timelineStorageKey, JSON.stringify(timeline)); } catch {}
    }, 240);
    return () => { if (autosaveTimeoutRef.current !== null) window.clearTimeout(autosaveTimeoutRef.current); };
  }, [timelineStorageKey, timeline]);

  /* Viewport tracking */
  useEffect(() => {
    const vp = timelineViewportRef.current;
    if (!vp) return;
    const update = () => setViewport({ scrollLeft: vp.scrollLeft, width: vp.clientWidth });
    update();
    vp.addEventListener('scroll', update, { passive: true });
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') { observer = new ResizeObserver(() => update()); observer.observe(vp); }
    return () => { vp.removeEventListener('scroll', update); observer?.disconnect(); };
  }, [timelineClips.length, timeline?.musicBeds.length, timeline?.titleOverlays.length]);

  /* Waveform generation */
  useEffect(() => {
    if (!timeline?.showWaveforms || virtualizedSegments.length === 0) return;
    let cancelled = false;
    const candidates = virtualizedSegments.map((e) => e.clip);
    const run = async () => {
      for (const clip of candidates) {
        if (!clip.videoUrl) continue;
        const key = getWaveformKey(clip);
        if (waveformPendingRef.current.has(key) || readCachedWaveform(key)) continue;
        waveformPendingRef.current.add(key);
        const points = await generateWaveformPoints(clip, key);
        waveformPendingRef.current.delete(key);
        if (cancelled) return;
        persistWaveform(key, points);
        setWaveformVersion((v) => v + 1);
        await new Promise((r) => window.setTimeout(r, 0));
      }
    };
    const maybeWindow = window as Window & { requestIdleCallback?: (cb: IdleRequestCallback) => number; cancelIdleCallback?: (h: number) => void };
    let idleHandle: number | null = null;
    let timeoutHandle: number | null = null;
    if (maybeWindow.requestIdleCallback) { idleHandle = maybeWindow.requestIdleCallback(() => { void run(); }); } else { timeoutHandle = window.setTimeout(() => { void run(); }, 16); }
    return () => { cancelled = true; if (idleHandle !== null && maybeWindow.cancelIdleCallback) maybeWindow.cancelIdleCallback(idleHandle); if (timeoutHandle !== null) window.clearTimeout(timeoutHandle); };
  }, [timeline?.showWaveforms, virtualizedSegments, getWaveformKey, readCachedWaveform, generateWaveformPoints, persistWaveform]);

  useEffect(() => () => { if (waveformAudioContextRef.current) { void waveformAudioContextRef.current.close(); waveformAudioContextRef.current = null; } }, []);

  /* Selection cleanup */
  useEffect(() => { if (!selectedClipId) return; if (!timelineClips.some((c) => c.id === selectedClipId)) setSelectedClipId(timelineClips[0]?.id ?? null); }, [selectedClipId, timelineClips]);
  useEffect(() => { if (!selectedMusicId) return; if (!timeline?.musicBeds.some((b) => b.id === selectedMusicId)) setSelectedMusicId(null); }, [selectedMusicId, timeline?.musicBeds]);
  useEffect(() => { if (!selectedTitleId) return; if (!timeline?.titleOverlays.some((t) => t.id === selectedTitleId)) setSelectedTitleId(null); }, [selectedTitleId, timeline?.titleOverlays]);

  /* Clamp times */
  useEffect(() => { setCurrentTime((prev) => clamp(prev, 0, totalDuration)); }, [totalDuration]);
  useEffect(() => { setRangeStart((prev) => (prev === null ? null : clamp(prev, 0, totalDuration))); setRangeEnd((prev) => (prev === null ? null : clamp(prev, 0, totalDuration))); }, [totalDuration]);
  useEffect(() => { if (!playbackRange) return; setCurrentTime((prev) => clamp(prev, playbackRange.start, playbackRange.end)); }, [playbackRange]);

  /* Preview sync */
  useEffect(() => { syncPreviewVideo(false); }, [syncPreviewVideo]);

  /* Timer playback */
  useEffect(() => {
    if (!isPlaying || playbackEnd <= playbackStart) return;
    if (canUsePreviewVideo) return;
    const timer = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + PLAYBACK_TICK_SECONDS;
        if (next >= playbackEnd) { if (loopPlayback) return playbackStart; setIsPlaying(false); return playbackEnd; }
        return next;
      });
    }, PLAYBACK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [isPlaying, playbackStart, playbackEnd, loopPlayback, canUsePreviewVideo]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) return;
      if (event.code === 'Space') { event.preventDefault(); togglePlayback(); return; }
      if (event.key.toLowerCase() === 'a' && !event.metaKey && !event.ctrlKey) { event.preventDefault(); setToolMode('select'); return; }
      if (event.key.toLowerCase() === 'b' && !event.metaKey && !event.ctrlKey) { event.preventDefault(); setToolMode('blade'); return; }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') { event.preventDefault(); copySelectedClipToClipboard(); return; }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'x') { event.preventDefault(); cutSelectedClipToClipboard(); return; }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') { event.preventDefault(); pasteClipFromClipboard(); return; }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') { event.preventDefault(); duplicateSelectedClip(); return; }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) { event.preventDefault(); handleUndo(); return; }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && event.shiftKey) { event.preventDefault(); handleRedo(); return; }
      if (event.key === 'ArrowLeft') { event.preventDefault(); seekTo(currentTime - 0.25, { disableSnap: true }); return; }
      if (event.key === 'ArrowRight') { event.preventDefault(); seekTo(currentTime + 0.25, { disableSnap: true }); return; }
      if (event.key.toLowerCase() === 'm') { event.preventDefault(); addMarkerAtPlayhead(); return; }
      if (event.key.toLowerCase() === 't') { event.preventDefault(); addTitleAtPlayhead(); return; }
      if (event.key.toLowerCase() === 'l') { event.preventDefault(); toggleLoopPlayback(); return; }
      if (event.key.toLowerCase() === 'i') { event.preventDefault(); setInPoint(); return; }
      if (event.key.toLowerCase() === 'o') { event.preventDefault(); setOutPoint(); return; }
      if (event.key.toLowerCase() === 'x') { event.preventDefault(); clearPlaybackRange(); return; }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 's') { event.preventDefault(); splitSelectedClip(); return; }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteCurrentSelection(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [addMarkerAtPlayhead, addTitleAtPlayhead, clearPlaybackRange, copySelectedClipToClipboard, currentTime, cutSelectedClipToClipboard, deleteCurrentSelection, duplicateSelectedClip, handleRedo, handleUndo, pasteClipFromClipboard, seekTo, setInPoint, setOutPoint, splitSelectedClip, toggleLoopPlayback, togglePlayback]);

  /* ══════════════════════ RENDER ══════════════════════ */

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <h2 className="mb-2 text-xl font-bold text-[#e5e5e5]">Project not found</h2>
        <Link href="/dashboard" className="mt-4 rounded bg-[#0a84ff] px-4 py-2 text-sm font-medium text-white">Back to Dashboard</Link>
      </div>
    );
  }

  const trackRows: Array<{ kind: TrackKind; short: string; description: string; heightClass: string }> = [
    { kind: 'video', short: 'V1', description: 'Picture edits', heightClass: 'h-14' },
    { kind: 'dialogue', short: 'A1', description: 'Clip audio', heightClass: 'h-10' },
    { kind: 'music', short: 'A2', description: 'Music bed', heightClass: 'h-10' },
    { kind: 'titles', short: 'T1', description: 'Text overlays', heightClass: 'h-9' },
  ];

  return (
    <div className="flex h-screen flex-col bg-[#02050a] text-sm text-vv-secondary overflow-hidden font-sans">
      {/* ── Top Header ── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-vv-secondary hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs tracking-tight">{project?.title || 'Loading...'}</h1>
        </div>
        <div className="text-xs font-medium text-vv-muted flex items-center gap-2">
          {importingMedia ? (
            <span className="animate-pulse bg-cyan-400/20 text-cyan-300 px-2 py-1 rounded">Importing...</span>
          ) : (
            <span>Studio Pipeline v3.0</span>
          )}
        </div>
      </header>

      {/* ── Top Panel: Viewer + Inspector ── */}
      <div className="flex min-h-0 flex-1 border-b border-[#2a2a2a]">
          {/* Main Content View */}
          <div className="flex flex-1 flex-col overflow-hidden bg-black/60 relative">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.04),transparent_70%)]" />
            <div className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-hidden bg-[#0d0d0d]">
          {canUsePreviewVideo && previewClip?.videoUrl ? (
            <video
              ref={previewVideoRef}
              key={previewClip.id}
              src={previewClip.videoUrl}
              className="h-full w-full object-contain"
              controls={false}
              playsInline
              preload="metadata"
              onTimeUpdate={handlePreviewTimeUpdate}
              onEnded={handlePreviewEnded}
              onLoadedMetadata={() => syncPreviewVideo(true)}
            />
          ) : previewClip && !previewClip.enabled ? (
            <div className="text-center p-8">
              <div className="mx-auto mb-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-wider text-[#666]">Disabled</div>
              <p className="text-[12px] font-medium text-[#8e8e93]">{previewClip.title}</p>
            </div>
          ) : trackStatus.videoVisible && previewClip?.thumbnailUrl ? (
            <MotionImage src={previewClip.thumbnailUrl} alt={previewClip.title} width={1280} height={720} unoptimized className="h-full w-full object-contain" motionPreset="pan" motionSpeed="slow" />
          ) : trackStatus.videoVisible && previewClip ? (
            <div className="text-center p-8">
              <p className="text-[12px] font-medium text-[#e5e5e5]">{previewClip.title}</p>
              <p className="mt-1 text-[10px] text-[#666]">{previewClip.prompt}</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[12px] text-[#666]">No preview</p>
            </div>
          )}

          {/* Title overlays on viewer */}
          {activeTitles.map((title) => (
            <div key={title.id} className={`pointer-events-none absolute z-20 border border-white/15 bg-black/60 text-white/95 shadow-lg backdrop-blur-sm ${getTitleStyleClasses(title.style)}`} style={{ color: title.color }}>
              {title.text}
            </div>
          ))}

          {/* Timecode overlay */}
          <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 font-mono text-[11px] text-[#e5e5e5] backdrop-blur-sm">
            {formatTimecode(currentTime)}
          </div>
          {previewSegment && (
            <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-[10px] text-[#8e8e93] backdrop-blur-sm">
              {previewSegment.clip.title}
            </div>
          )}
        </div>
          </div>

        {/* ── Transport / Toolbar ── */}
        {/* ── Transport / Toolbar ── */}
        <div className="w-[280px] shrink-0 border-l border-[#2a2a2a] bg-black/90 backdrop-blur-xl relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <TimelineInspectorPanel
            selectedClip={selectedClip}
            selectedSegment={selectedSegment}
            selectedMusicBed={selectedMusicBed}
            selectedTitle={selectedTitle}
            totalDuration={totalDuration}
            minClipSpanSeconds={MIN_CLIP_SPAN_SECONDS}
            minItemDurationSeconds={MIN_ITEM_DURATION_SECONDS}
            speedOptions={SPEED_OPTIONS}
            clipColorClasses={CLIP_COLOR_CLASSES}
            formatTime={formatTime}
            getClipDuration={getClipDuration}
            toFixedNumber={toFixedNumber}
            clamp={clamp}
            clampTrimStart={clampTrimStart}
            clampTrimEnd={clampTrimEnd}
            updateSelectedClip={updateSelectedClip}
            updateSelectedMusicBed={updateSelectedMusicBed}
            updateSelectedTitle={updateSelectedTitle}
            moveSelectedClip={moveSelectedClip}
            duplicateSelectedClip={duplicateSelectedClip}
            deleteSelectedClip={deleteSelectedClip}
            removeSelectedMusicBed={removeSelectedMusicBed}
            removeSelectedTitle={removeSelectedTitle}
            playbackRange={playbackRange}
            onSetRangeFromSelectedClip={setPlaybackRangeToSelectedClip}
            onClearPlaybackRange={clearPlaybackRange}
          />
        </div>
      </div>

      {/* ── Toolbar ── */}
      <TimelineToolbar
        isPlaying={isPlaying}
        onTogglePlayback={togglePlayback}
        currentTime={currentTime}
        totalDuration={totalDuration}
        loopPlayback={loopPlayback}
        onToggleLoop={toggleLoopPlayback}
        onJumpStart={() => seekTo(playbackRange?.start ?? 0, { disableSnap: true })}
        onJumpEnd={() => seekTo(playbackRange?.end ?? totalDuration, { disableSnap: true })}
        formatTimecode={formatTimecode}
        playbackRange={playbackRange}
        toolMode={toolMode}
        onToolModeChange={setToolMode}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitTimeline={fitTimelineToViewport}
        snapEnabled={timeline?.snapEnabled ?? true}
        onToggleSnap={() => commitTimeline((s) => ({ ...s, snapEnabled: !s.snapEnabled }))}
        hasSelection={Boolean(selectedClip || selectedMusicBed || selectedTitle)}
        hasClipboard={Boolean(clipClipboard)}
        videoTrackLocked={trackStatus.byKind.video.locked}
        onSplitClip={splitSelectedClip}
        onCopyClip={copySelectedClipToClipboard}
        onCutClip={cutSelectedClipToClipboard}
        onPasteClip={pasteClipFromClipboard}
        onDeleteSelection={deleteCurrentSelection}
        onAddMarker={addMarkerAtPlayhead}
        onAddMusic={addMusicBedAtPlayhead}
        onAddTitle={addTitleAtPlayhead}
        musicTrackLocked={trackStatus.byKind.music.locked}
        titleTrackLocked={trackStatus.byKind.titles.locked}
        hasDuration={totalDuration > 0}
        onSetIn={setInPoint}
        onSetOut={setOutPoint}
        onClearRange={clearPlaybackRange}
        importingMedia={importingMedia}
        onImportFiles={(files) => { void handleImportMedia(files); }}
        onRefreshClips={refreshFromProjectShots}
        onExport={handleExport}
        importInputRef={timelineImportInputRef as React.RefObject<HTMLInputElement>}
      />

      {/* ── Timeline Track Canvas ── */}
      <TimelineTrackCanvas
        timeline={timeline}
        timelineClips={timelineClips}
        totalDuration={totalDuration}
        formatTime={formatTime}
        trackRows={trackRows}
        trackStatus={trackStatus}
        updateTrack={updateTrack}
        trackWidth={trackWidth}
        timelineViewportRef={timelineViewportRef as React.RefObject<HTMLDivElement>}
        rulerTicks={rulerTicks}
        seekFromEvent={seekFromEvent}
        seekToTime={(seconds) => seekTo(seconds, { disableSnap: true })}
        onMarkerSelect={(seconds) => { seekTo(seconds, { disableSnap: true }); setSelectedClipId(null); setSelectedMusicId(null); setSelectedTitleId(null); }}
        onClearSelections={() => { setSelectedClipId(null); setSelectedMusicId(null); setSelectedTitleId(null); }}
        playheadLeft={playheadLeft}
        onTrackDragOver={handleTrackDragOver}
        onTrackDrop={handleTrackDrop}
        onTrackDragLeave={() => { if (dragState) setDragState((prev) => prev ? { ...prev, targetId: null, position: 'end' } : prev); }}
        virtualizedSegments={virtualizedSegments}
        virtualizedMusicBeds={virtualizedMusicBeds}
        virtualizedTitleOverlays={virtualizedTitleOverlays}
        timelinePixelsPerSecond={timelinePixelsPerSecond}
        selectedClipId={selectedClipId}
        selectedMusicId={selectedMusicId}
        selectedTitleId={selectedTitleId}
        clipColorClasses={CLIP_COLOR_CLASSES}
        videoTrackLocked={trackStatus.byKind.video.locked}
        onClipDragStart={handleClipDragStart}
        onClipDragEnd={() => setDragState(null)}
        onSelectClip={selectClip}
        onSelectMusicBed={selectMusicBed}
        onSelectTitle={selectTitle}
        onStopPlayback={() => setIsPlaying(false)}
        getTransitionLabel={getTransitionLabel}
        dragIndicatorTime={dragIndicatorTime}
        getWaveformBars={getWaveformBars}
        showMarkers
        onRemoveMarker={removeMarker}
        playbackRange={playbackRange}
        onSetRangeIn={setInPoint}
        onSetRangeOut={setOutPoint}
        onClearRange={clearPlaybackRange}
      />
    </div>
  );
}
