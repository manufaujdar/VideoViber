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
import { useAppStore, type Shot } from '@/app/store';
import { MotionImage } from '@/components/motion-image';
import { toast } from 'sonner';

type TransitionType = 'cut' | 'dissolve' | 'fade' | 'wipe';
type ClipColor = 'cyan' | 'amber' | 'rose' | 'emerald' | 'slate';
type TrackKind = 'video' | 'dialogue' | 'music' | 'titles';
type TitleStyle = 'title' | 'lower-third' | 'caption';

interface TimelineClip {
  id: string;
  shotId: string;
  title: string;
  prompt: string;
  provider: string;
  sourceDuration: number;
  trimStart: number;
  trimEnd: number;
  playbackRate: number;
  transitionType: TransitionType;
  transitionDuration: number;
  audioVolume: number;
  muted: boolean;
  color: ClipColor;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  status: Shot['status'];
}

interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

interface TimelineTrack {
  id: string;
  kind: TrackKind;
  name: string;
  locked: boolean;
  muted: boolean;
  solo: boolean;
}

interface MusicBed {
  id: string;
  title: string;
  start: number;
  duration: number;
  volume: number;
  muted: boolean;
  loop: boolean;
  color: ClipColor;
}

interface TitleOverlay {
  id: string;
  text: string;
  start: number;
  duration: number;
  style: TitleStyle;
  color: string;
  enabled: boolean;
}

interface TimelineState {
  clips: TimelineClip[];
  markers: TimelineMarker[];
  tracks: TimelineTrack[];
  musicBeds: MusicBed[];
  titleOverlays: TitleOverlay[];
  snapEnabled: boolean;
  showWaveforms: boolean;
  masterVolume: number;
  masterMuted: boolean;
}

interface HistoryState {
  entries: TimelineState[];
  index: number;
}

interface TimelineSegment {
  clip: TimelineClip;
  start: number;
  end: number;
  duration: number;
}

interface DragState {
  sourceId: string;
  targetId: string | null;
  position: 'before' | 'after' | 'end';
}

const MIN_CLIP_SPAN_SECONDS = 0.3;
const MIN_ITEM_DURATION_SECONDS = 0.5;
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
const MAX_IMPORT_DURATION = 60 * 60 * 6; // 6 hours
const WAVEFORM_POINT_MIN = 96;
const WAVEFORM_POINT_MAX = 1024;
const WAVEFORM_STORAGE_PREFIX = 'videoviber-waveform-v1-';

interface TimelineViewportState {
  scrollLeft: number;
  width: number;
}

const TRACK_IDS: Record<TrackKind, string> = {
  video: 'track-video',
  dialogue: 'track-dialogue',
  music: 'track-music',
  titles: 'track-titles',
};

const BASE_TRACKS: Record<TrackKind, TimelineTrack> = {
  video: {
    id: TRACK_IDS.video,
    kind: 'video',
    name: 'Video',
    locked: false,
    muted: false,
    solo: false,
  },
  dialogue: {
    id: TRACK_IDS.dialogue,
    kind: 'dialogue',
    name: 'Dialogue',
    locked: false,
    muted: false,
    solo: false,
  },
  music: {
    id: TRACK_IDS.music,
    kind: 'music',
    name: 'Music Bed',
    locked: false,
    muted: false,
    solo: false,
  },
  titles: {
    id: TRACK_IDS.titles,
    kind: 'titles',
    name: 'Titles',
    locked: false,
    muted: false,
    solo: false,
  },
};

const CLIP_COLOR_CLASSES: Record<ClipColor, { idle: string; active: string; accent: string }> = {
  cyan: {
    idle: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100 hover:border-cyan-200/60',
    active: 'border-cyan-200 bg-cyan-300/20 text-cyan-100 ring-1 ring-cyan-200/50',
    accent: 'bg-cyan-300/90',
  },
  amber: {
    idle: 'border-amber-300/30 bg-amber-400/10 text-amber-100 hover:border-amber-200/60',
    active: 'border-amber-200 bg-amber-300/20 text-amber-100 ring-1 ring-amber-200/50',
    accent: 'bg-amber-300/90',
  },
  emerald: {
    idle: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100 hover:border-emerald-200/60',
    active: 'border-emerald-200 bg-emerald-300/20 text-emerald-100 ring-1 ring-emerald-200/50',
    accent: 'bg-emerald-300/90',
  },
  rose: {
    idle: 'border-rose-300/30 bg-rose-400/10 text-rose-100 hover:border-rose-200/60',
    active: 'border-rose-200 bg-rose-300/20 text-rose-100 ring-1 ring-rose-200/50',
    accent: 'bg-rose-300/90',
  },
  slate: {
    idle: 'border-slate-300/30 bg-slate-400/10 text-slate-100 hover:border-slate-200/60',
    active: 'border-slate-200 bg-slate-300/20 text-slate-100 ring-1 ring-slate-200/50',
    accent: 'bg-slate-300/90',
  },
};

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toFixedNumber = (value: number, decimals = 3) => Number(value.toFixed(decimals));

const formatTime = (seconds: number) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const tenths = Math.floor((safe - Math.floor(safe)) * 10);
  return `${minutes}:${secs.toString().padStart(2, '0')}.${tenths}`;
};

const getClipDuration = (clip: TimelineClip) => {
  const sourceSpan = Math.max(
    MIN_CLIP_SPAN_SECONDS,
    clamp(clip.trimEnd - clip.trimStart, MIN_CLIP_SPAN_SECONDS, clip.sourceDuration)
  );
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
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const getWaveformStorageKey = (key: string) => `${WAVEFORM_STORAGE_PREFIX}${hashString(key)}`;

const buildFallbackWaveform = (seed: string, points: number) => {
  let state = 0;
  for (let index = 0; index < seed.length; index += 1) {
    state = (state + seed.charCodeAt(index) * (index + 1)) % 2147483647;
  }

  const samples: number[] = [];
  let previous = 0.4;
  for (let index = 0; index < points; index += 1) {
    state = (state * 48271 + 12820163) % 2147483647;
    const noise = (state % 1000) / 1000;
    const shaped = 0.2 + 0.8 * Math.abs(Math.sin((index / points) * Math.PI * 6 + noise * 2));
    const blended = previous * 0.58 + shaped * 0.42;
    samples.push(clamp(blended, 0.05, 1));
    previous = blended;
  }
  return samples;
};

const sampleWaveformWindow = (
  source: number[],
  startRatio: number,
  endRatio: number,
  bars: number
) => {
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
      if (value !== undefined && value > peak) {
        peak = value;
      }
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
  if (style === 'title') {
    return 'left-1/2 top-[14%] -translate-x-1/2 rounded-md px-5 py-2 text-lg font-semibold';
  }
  if (style === 'lower-third') {
    return 'left-[6%] bottom-[14%] rounded-md px-4 py-2 text-sm font-semibold';
  }
  return 'left-1/2 bottom-[12%] -translate-x-1/2 rounded px-3 py-1 text-xs font-medium';
};

const isInteractiveTarget = (target: EventTarget | null) => {
  const node = target as HTMLElement | null;
  if (!node) return false;
  const tagName = node.tagName;
  return (
    node.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
  );
};

function toImportedTitle(fileName: string) {
  return fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim() || 'Imported Clip';
}

function readImportedVideoMetadata(
  url: string
): Promise<{ duration: number; width?: number; height?: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const rawDuration = Number.isFinite(video.duration) ? video.duration : 6;
      resolve({
        duration: Math.min(MAX_IMPORT_DURATION, Math.max(MIN_IMPORT_DURATION, rawDuration)),
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
      });
    };
    video.onerror = () => reject(new Error('Unable to read video metadata'));
    video.src = url;
  });
}

const shotToTimelineClip = (shot: Shot, index: number): TimelineClip => {
  const sourceDuration = Math.max(1, shot.duration);
  return {
    id: uid('clip'),
    shotId: shot.id,
    title: shot.title || `Clip ${index + 1}`,
    prompt: shot.prompt,
    provider: shot.provider,
    sourceDuration,
    trimStart: 0,
    trimEnd: sourceDuration,
    playbackRate: 1,
    transitionType: 'cut',
    transitionDuration: 0,
    audioVolume: 100,
    muted: false,
    color: CLIP_COLOR_ORDER[index % CLIP_COLOR_ORDER.length] ?? 'cyan',
    thumbnailUrl: shot.thumbnailUrl,
    videoUrl: shot.videoUrl,
    status: shot.status,
  };
};

const cloneBaseTrack = (kind: TrackKind): TimelineTrack => ({ ...BASE_TRACKS[kind] });

const createDefaultTracks = (): TimelineTrack[] => [
  cloneBaseTrack('video'),
  cloneBaseTrack('dialogue'),
  cloneBaseTrack('music'),
  cloneBaseTrack('titles'),
];

const buildInitialTimeline = (shots: Shot[], projectTitle: string): TimelineState => {
  const clips = shots.map((shot, index) => shotToTimelineClip(shot, index));

  const baseDuration = buildSegments(clips).at(-1)?.end ?? 0;
  const initialMusicDuration = Math.max(6, Math.min(baseDuration || 12, 24));

  return {
    clips,
    markers: [],
    tracks: createDefaultTracks(),
    musicBeds:
      clips.length > 0
        ? [
            {
              id: uid('music'),
              title: 'Ambient Bed',
              start: 0,
              duration: toFixedNumber(initialMusicDuration, 3),
              volume: 42,
              muted: false,
              loop: true,
              color: 'emerald',
            },
          ]
        : [],
    titleOverlays:
      clips.length > 0
        ? [
            {
              id: uid('title'),
              text: projectTitle,
              start: 0.2,
              duration: 3.2,
              style: 'title',
              color: '#f8fafc',
              enabled: true,
            },
          ]
        : [],
    snapEnabled: true,
    showWaveforms: true,
    masterVolume: 100,
    masterMuted: false,
  };
};

const reorderClips = (
  clips: TimelineClip[],
  sourceId: string,
  targetId: string | null,
  position: 'before' | 'after' | 'end'
) => {
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

  const unchanged = reordered.every((clip, index) => clip.id === clips[index]?.id);
  return unchanged ? clips : reordered;
};

const isTimelineState = (value: unknown): value is TimelineState => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<TimelineState>;

  return (
    Array.isArray(candidate.clips) &&
    Array.isArray(candidate.markers) &&
    Array.isArray(candidate.tracks) &&
    Array.isArray(candidate.musicBeds) &&
    Array.isArray(candidate.titleOverlays) &&
    typeof candidate.snapEnabled === 'boolean' &&
    typeof candidate.showWaveforms === 'boolean' &&
    typeof candidate.masterVolume === 'number' &&
    typeof candidate.masterMuted === 'boolean'
  );
};

function clampTrimStart(clip: TimelineClip, nextStart: number) {
  const maxStart = Math.max(0, clip.trimEnd - MIN_CLIP_SPAN_SECONDS);
  return clamp(nextStart, 0, maxStart);
}

function clampTrimEnd(clip: TimelineClip, nextEnd: number) {
  const minEnd = Math.min(clip.sourceDuration, clip.trimStart + MIN_CLIP_SPAN_SECONDS);
  return clamp(nextEnd, minEnd, clip.sourceDuration);
}

export default function TimelineEditorPage({ params }: { params: { id: string } }) {
  const project = useAppStore((s) => s.projects.find((p) => p.id === params.id));
  const updateProject = useAppStore((s) => s.updateProject);
  const addShot = useAppStore((s) => s.addShot);
  const addAsset = useAppStore((s) => s.addAsset);

  const completedShots = useMemo(
    () => project?.shots.filter((shot) => shot.status === 'completed') ?? [],
    [project]
  );

  const [history, setHistory] = useState<HistoryState>({ entries: [], index: -1 });
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedMusicId, setSelectedMusicId] = useState<string | null>(null);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopPlayback, setLoopPlayback] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_TIMELINE_ZOOM);
  const [markerLabel, setMarkerLabel] = useState('');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [importingMedia, setImportingMedia] = useState(false);
  const [, setWaveformVersion] = useState(0);
  const [viewport, setViewport] = useState<TimelineViewportState>({ scrollLeft: 0, width: 0 });

  const loadedProjectIdRef = useRef<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const timelineViewportRef = useRef<HTMLDivElement | null>(null);
  const timelineImportInputRef = useRef<HTMLInputElement | null>(null);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const waveformCacheRef = useRef<Map<string, number[]>>(new Map());
  const waveformPendingRef = useRef<Set<string>>(new Set());
  const waveformAudioContextRef = useRef<AudioContext | null>(null);
  const timelineStorageKey = project ? `videoviber-timeline-${project.id}` : null;

  const timeline = history.index >= 0 ? history.entries[history.index] ?? null : null;
  const timelineClips = useMemo(() => timeline?.clips ?? [], [timeline]);
  const segments = useMemo(() => buildSegments(timelineClips), [timelineClips]);
  const segmentByClipId = useMemo(
    () => new Map(segments.map((segment) => [segment.clip.id, segment] as const)),
    [segments]
  );

  const clipTimelineDuration = segments.at(-1)?.end ?? 0;
  const maxMusicEnd = useMemo(() => {
    return Math.max(
      0,
      ...((timeline?.musicBeds ?? []).map((item) => item.start + item.duration) || [0])
    );
  }, [timeline?.musicBeds]);

  const maxTitleEnd = useMemo(() => {
    return Math.max(
      0,
      ...((timeline?.titleOverlays ?? []).map((item) => item.start + item.duration) || [0])
    );
  }, [timeline?.titleOverlays]);

  const totalDuration = Math.max(clipTimelineDuration, maxMusicEnd, maxTitleEnd);

  const selectedClip = useMemo(
    () => timelineClips.find((clip) => clip.id === selectedClipId) ?? null,
    [timelineClips, selectedClipId]
  );

  const selectedSegment = useMemo(
    () => (selectedClipId ? segmentByClipId.get(selectedClipId) ?? null : null),
    [selectedClipId, segmentByClipId]
  );

  const selectedMusicBed = useMemo(
    () => timeline?.musicBeds.find((item) => item.id === selectedMusicId) ?? null,
    [timeline?.musicBeds, selectedMusicId]
  );

  const selectedTitle = useMemo(
    () => timeline?.titleOverlays.find((item) => item.id === selectedTitleId) ?? null,
    [timeline?.titleOverlays, selectedTitleId]
  );

  const activeSegment = useMemo(() => {
    if (segments.length === 0) return null;
    const found = segments.find((entry) => currentTime >= entry.start && currentTime < entry.end);
    if (found) return found;
    if (currentTime <= 0) return segments[0] ?? null;
    return null;
  }, [segments, currentTime]);

  const previewSegment = useMemo(() => {
    if (isPlaying) {
      return activeSegment;
    }
    if (selectedSegment) {
      return selectedSegment;
    }
    return activeSegment;
  }, [isPlaying, activeSegment, selectedSegment]);

  const trackStatus = useMemo(() => {
    const mergedTracks = createDefaultTracks();

    for (const track of timeline?.tracks ?? []) {
      const index = mergedTracks.findIndex((entry) => entry.kind === track.kind);
      if (index >= 0) {
        mergedTracks[index] = track;
      }
    }

    const byKind: Record<TrackKind, TimelineTrack> = {
      video: mergedTracks.find((track) => track.kind === 'video') ?? cloneBaseTrack('video'),
      dialogue:
        mergedTracks.find((track) => track.kind === 'dialogue') ?? cloneBaseTrack('dialogue'),
      music: mergedTracks.find((track) => track.kind === 'music') ?? cloneBaseTrack('music'),
      titles: mergedTracks.find((track) => track.kind === 'titles') ?? cloneBaseTrack('titles'),
    };

    const soloKinds = mergedTracks.filter((track) => track.solo).map((track) => track.kind);
    const hasSolo = soloKinds.length > 0;

    const isEnabled = (kind: TrackKind, considerMute: boolean) => {
      const track = byKind[kind];
      if (hasSolo && !soloKinds.includes(kind)) return false;
      if (considerMute && track.muted) return false;
      return true;
    };

    return {
      tracks: mergedTracks,
      byKind,
      hasSolo,
      videoVisible: isEnabled('video', true),
      dialogueAudible: isEnabled('dialogue', true),
      musicAudible: isEnabled('music', true),
      titlesVisible: isEnabled('titles', true),
    };
  }, [timeline?.tracks]);

  const activeTitles = useMemo(() => {
    if (!timeline || !trackStatus.titlesVisible) return [];
    return timeline.titleOverlays.filter(
      (item) => item.enabled && currentTime >= item.start && currentTime < item.start + item.duration
    );
  }, [timeline, trackStatus.titlesVisible, currentTime]);

  const previewClip = previewSegment?.clip ?? null;
  const canUsePreviewVideo = Boolean(previewClip?.videoUrl && trackStatus.videoVisible);

  const snapTargets = useMemo(() => {
    const boundaryTimes = segments.flatMap((segment) => [segment.start, segment.end]);
    const markerTimes = timeline?.markers.map((marker) => marker.time) ?? [];
    const musicTimes = timeline?.musicBeds.flatMap((item) => [item.start, item.start + item.duration]) ?? [];
    const titleTimes =
      timeline?.titleOverlays.flatMap((item) => [item.start, item.start + item.duration]) ?? [];

    const all = [...boundaryTimes, ...markerTimes, ...musicTimes, ...titleTimes, 0, totalDuration]
      .filter((value) => Number.isFinite(value))
      .map((value) => toFixedNumber(value, 3));

    const unique = Array.from(new Set(all));
    unique.sort((a, b) => a - b);
    return unique;
  }, [segments, timeline?.markers, timeline?.musicBeds, timeline?.titleOverlays, totalDuration]);

  const tickStep = getTickStep(totalDuration);
  const rulerTicks = useMemo(() => {
    if (totalDuration <= 0) return [0];
    const ticks: number[] = [];
    for (let t = 0; t < totalDuration; t += tickStep) {
      ticks.push(toFixedNumber(t, 2));
    }
    ticks.push(toFixedNumber(totalDuration, 2));
    return Array.from(new Set(ticks));
  }, [totalDuration, tickStep]);

  const basePixelsPerSecond = getBasePixelsPerSecond(totalDuration);
  const targetPixelsPerSecond = basePixelsPerSecond * zoom;
  const naturalTrackWidth = Math.max(totalDuration * targetPixelsPerSecond, 720);
  const widthScale = naturalTrackWidth > MAX_TIMELINE_WIDTH_PX ? MAX_TIMELINE_WIDTH_PX / naturalTrackWidth : 1;
  const timelinePixelsPerSecond = targetPixelsPerSecond * widthScale;
  const trackWidth = Math.min(MAX_TIMELINE_WIDTH_PX, naturalTrackWidth);
  const playheadLeft = currentTime * timelinePixelsPerSecond;
  const visibleStartTime = timelinePixelsPerSecond > 0 ? viewport.scrollLeft / timelinePixelsPerSecond : 0;
  const visibleEndTime =
    timelinePixelsPerSecond > 0
      ? (viewport.scrollLeft + viewport.width) / timelinePixelsPerSecond
      : totalDuration;
  const virtualPaddingSeconds = Math.max(4, (visibleEndTime - visibleStartTime) * 0.8);
  const virtualStartTime = clamp(visibleStartTime - virtualPaddingSeconds, 0, totalDuration || 0);
  const virtualEndTime = clamp(
    visibleEndTime + virtualPaddingSeconds,
    Math.max(0, virtualStartTime),
    Math.max(totalDuration, 0)
  );

  const virtualizedSegments = useMemo(
    () => segments.filter((segment) => segment.end >= virtualStartTime && segment.start <= virtualEndTime),
    [segments, virtualStartTime, virtualEndTime]
  );

  const virtualizedMusicBeds = useMemo(
    () =>
      (timeline?.musicBeds ?? []).filter(
        (item) =>
          item.start + item.duration >= virtualStartTime && item.start <= virtualEndTime
      ),
    [timeline?.musicBeds, virtualStartTime, virtualEndTime]
  );

  const virtualizedTitleOverlays = useMemo(
    () =>
      (timeline?.titleOverlays ?? []).filter(
        (item) =>
          item.start + item.duration >= virtualStartTime && item.start <= virtualEndTime
      ),
    [timeline?.titleOverlays, virtualStartTime, virtualEndTime]
  );

  const commitTimeline = useCallback((updater: (state: TimelineState) => TimelineState) => {
    setHistory((previous) => {
      if (previous.index < 0) return previous;
      const base = previous.entries[previous.index];
      if (!base) return previous;
      const next = updater(base);
      if (next === base) return previous;

      const trimmed = previous.entries.slice(0, previous.index + 1);
      const appended = [...trimmed, next];
      const limited =
        appended.length > HISTORY_LIMIT ? appended.slice(appended.length - HISTORY_LIMIT) : appended;

      return { entries: limited, index: limited.length - 1 };
    });
  }, []);

  const loadTimelineState = useCallback((state: TimelineState) => {
    setHistory({ entries: [state], index: 0 });
    setSelectedClipId(state.clips[0]?.id ?? null);
    setSelectedMusicId(null);
    setSelectedTitleId(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setDragState(null);
  }, []);

  const initializeTimeline = useCallback((shots: Shot[], projectTitle: string) => {
    const initial = buildInitialTimeline(shots, projectTitle);
    loadTimelineState(initial);
  }, [loadTimelineState]);

  const refreshFromProjectShots = useCallback(() => {
    if (!project) return;
    initializeTimeline(completedShots, project.title);
    toast.success('Timeline refreshed from completed shots.');
  }, [project, completedShots, initializeTimeline]);

  const handleImportMedia = useCallback(
    async (fileList: FileList | File[]) => {
      if (!project) return;
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const videos = files.filter((file) => file.type.startsWith('video/'));
      if (videos.length === 0) {
        toast.error('Please choose video files to import.');
        return;
      }

      setImportingMedia(true);
      toast.loading(`Importing ${videos.length} file${videos.length > 1 ? 's' : ''}...`, {
        id: 'timeline-import',
      });

      let imported = 0;
      let skipped = 0;
      let nextOrder = project.shots.reduce((max, shot) => Math.max(max, shot.order), -1) + 1;
      const importedClips: TimelineClip[] = [];

      for (const file of videos) {
        let objectUrl: string | null = null;
        try {
          objectUrl = URL.createObjectURL(file);
          const metadata = await readImportedVideoMetadata(objectUrl);

          const assetId = addAsset({
            name: file.name,
            type: 'video',
            url: objectUrl,
            size: file.size,
            width: metadata.width,
            height: metadata.height,
            duration: metadata.duration,
            mimeType: file.type || 'video/mp4',
            storageMode: 'object-url',
            volatile: true,
            projectId: project.id,
          });

          const shotId = addShot(project.id, {
            projectId: project.id,
            title: toImportedTitle(file.name),
            prompt: `Imported source clip: ${file.name}`,
            status: 'completed',
            provider: 'imported',
            thumbnailUrl: null,
            videoUrl: objectUrl,
            duration: metadata.duration,
            order: nextOrder,
            sourceType: 'import',
            assetId,
            sourceMimeType: file.type || null,
            sourceSizeBytes: file.size,
            importedAt: new Date().toISOString(),
          });

          const clip = shotToTimelineClip(
            {
              id: shotId,
              projectId: project.id,
              title: toImportedTitle(file.name),
              prompt: `Imported source clip: ${file.name}`,
              status: 'completed',
              provider: 'imported',
              thumbnailUrl: null,
              videoUrl: objectUrl,
              duration: metadata.duration,
              order: nextOrder,
              sourceType: 'import',
              assetId,
              sourceMimeType: file.type || null,
              sourceSizeBytes: file.size,
              importedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
            timelineClips.length + imported
          );

          importedClips.push(clip);
          imported += 1;
          nextOrder += 1;
        } catch {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          skipped += 1;
        }
      }

      if (imported > 0) {
        commitTimeline((state) => ({
          ...state,
          clips: [...state.clips, ...importedClips],
        }));
        updateProject(project.id, { status: 'ready' });
        if (importedClips[0]) {
          setSelectedClipId(importedClips[0].id);
          setSelectedMusicId(null);
          setSelectedTitleId(null);
        }
        toast.success(`Imported ${imported} clip${imported > 1 ? 's' : ''}.`, {
          id: 'timeline-import',
        });
      } else {
        toast.error('No clips were imported.', { id: 'timeline-import' });
      }

      if (skipped > 0) {
        toast.warning(`Skipped ${skipped} file${skipped > 1 ? 's' : ''}.`);
      }

      setImportingMedia(false);
    },
    [project, addAsset, addShot, timelineClips.length, commitTimeline, updateProject]
  );

  const canUndo = history.index > 0;
  const canRedo = history.index >= 0 && history.index < history.entries.length - 1;

  const handleUndo = useCallback(() => {
    setHistory((previous) => {
      if (previous.index <= 0) return previous;
      return { ...previous, index: previous.index - 1 };
    });
    setIsPlaying(false);
  }, []);

  const handleRedo = useCallback(() => {
    setHistory((previous) => {
      if (previous.index >= previous.entries.length - 1) return previous;
      return { ...previous, index: previous.index + 1 };
    });
    setIsPlaying(false);
  }, []);

  const seekTo = useCallback(
    (nextTime: number, options?: { disableSnap?: boolean }) => {
      let time = clamp(nextTime, 0, totalDuration);

      if (!options?.disableSnap && timeline?.snapEnabled && snapTargets.length > 0) {
        let closestTime = snapTargets[0];
        let smallestDiff =
          closestTime === undefined ? Number.POSITIVE_INFINITY : Math.abs(time - closestTime);

        for (const candidate of snapTargets) {
          const diff = Math.abs(time - candidate);
          if (diff < smallestDiff) {
            smallestDiff = diff;
            closestTime = candidate;
          }
        }

        if (closestTime !== undefined && smallestDiff <= SNAP_THRESHOLD_SECONDS) {
          time = closestTime;
        }
      }

      setCurrentTime(time);
    },
    [timeline?.snapEnabled, snapTargets, totalDuration]
  );

  const seekFromEvent = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = rect.width > 0 ? clamp((event.clientX - rect.left) / rect.width, 0, 1) : 0;
      seekTo(ratio * totalDuration, { disableSnap: true });
    },
    [seekTo, totalDuration]
  );

  const selectClip = useCallback(
    (clipId: string, start?: number) => {
      setSelectedClipId(clipId);
      setSelectedMusicId(null);
      setSelectedTitleId(null);
      if (typeof start === 'number') {
        seekTo(start, { disableSnap: true });
      }
    },
    [seekTo]
  );

  const selectMusicBed = useCallback(
    (bedId: string, start?: number) => {
      setSelectedMusicId(bedId);
      setSelectedClipId(null);
      setSelectedTitleId(null);
      if (typeof start === 'number') {
        seekTo(start, { disableSnap: true });
      }
    },
    [seekTo]
  );

  const selectTitle = useCallback(
    (titleId: string, start?: number) => {
      setSelectedTitleId(titleId);
      setSelectedClipId(null);
      setSelectedMusicId(null);
      if (typeof start === 'number') {
        seekTo(start, { disableSnap: true });
      }
    },
    [seekTo]
  );

  const updateTrack = useCallback(
    (kind: TrackKind, updater: (track: TimelineTrack) => TimelineTrack) => {
      commitTimeline((state) => {
        const existing = state.tracks.find((track) => track.kind === kind);
        if (existing) {
          return {
            ...state,
            tracks: state.tracks.map((track) => (track.kind === kind ? updater(track) : track)),
          };
        }

        return {
          ...state,
          tracks: [...state.tracks, updater(cloneBaseTrack(kind))],
        };
      });
    },
    [commitTimeline]
  );

  const updateSelectedClip = useCallback(
    (updater: (clip: TimelineClip) => TimelineClip) => {
      if (!selectedClipId) return;
      if (trackStatus.byKind.video.locked) {
        toast.error('Video track is locked. Unlock it to edit clips.');
        return;
      }
      commitTimeline((state) => ({
        ...state,
        clips: state.clips.map((clip) => (clip.id === selectedClipId ? updater(clip) : clip)),
      }));
    },
    [selectedClipId, trackStatus.byKind.video.locked, commitTimeline]
  );

  const updateSelectedMusicBed = useCallback(
    (updater: (item: MusicBed) => MusicBed) => {
      if (!selectedMusicId) return;
      if (trackStatus.byKind.music.locked) {
        toast.error('Music track is locked. Unlock it to edit music beds.');
        return;
      }
      commitTimeline((state) => ({
        ...state,
        musicBeds: state.musicBeds.map((item) => (item.id === selectedMusicId ? updater(item) : item)),
      }));
    },
    [selectedMusicId, trackStatus.byKind.music.locked, commitTimeline]
  );

  const updateSelectedTitle = useCallback(
    (updater: (item: TitleOverlay) => TitleOverlay) => {
      if (!selectedTitleId) return;
      if (trackStatus.byKind.titles.locked) {
        toast.error('Title track is locked. Unlock it to edit overlays.');
        return;
      }
      commitTimeline((state) => ({
        ...state,
        titleOverlays: state.titleOverlays.map((item) =>
          item.id === selectedTitleId ? updater(item) : item
        ),
      }));
    },
    [selectedTitleId, trackStatus.byKind.titles.locked, commitTimeline]
  );

  const moveSelectedClip = useCallback(
    (direction: -1 | 1) => {
      if (!selectedClipId) return;
      if (trackStatus.byKind.video.locked) {
        toast.error('Video track is locked.');
        return;
      }

      commitTimeline((state) => {
        const index = state.clips.findIndex((clip) => clip.id === selectedClipId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= state.clips.length) return state;

        const clips = [...state.clips];
        const [moved] = clips.splice(index, 1);
        if (!moved) return state;
        clips.splice(nextIndex, 0, moved);
        return { ...state, clips };
      });
    },
    [selectedClipId, trackStatus.byKind.video.locked, commitTimeline]
  );

  const duplicateSelectedClip = useCallback(() => {
    if (!selectedClipId) return;
    if (trackStatus.byKind.video.locked) {
      toast.error('Video track is locked.');
      return;
    }

    commitTimeline((state) => {
      const index = state.clips.findIndex((clip) => clip.id === selectedClipId);
      if (index < 0) return state;

      const original = state.clips[index];
      if (!original) return state;

      const copy: TimelineClip = {
        ...original,
        id: uid('clip'),
        title: `${original.title} (Copy)`,
      };
      const clips = [...state.clips];
      clips.splice(index + 1, 0, copy);
      return { ...state, clips };
    });
    toast.success('Clip duplicated.');
  }, [selectedClipId, trackStatus.byKind.video.locked, commitTimeline]);

  const deleteSelectedClip = useCallback(() => {
    if (!selectedClipId) return;
    if (trackStatus.byKind.video.locked) {
      toast.error('Video track is locked.');
      return;
    }

    commitTimeline((state) => ({
      ...state,
      clips: state.clips.filter((clip) => clip.id !== selectedClipId),
    }));
    setSelectedClipId(null);
    toast.success('Clip removed from timeline.');
  }, [selectedClipId, trackStatus.byKind.video.locked, commitTimeline]);

  const splitSelectedClip = useCallback(() => {
    if (!selectedClipId) return;
    if (trackStatus.byKind.video.locked) {
      toast.error('Video track is locked.');
      return;
    }

    const segment = segments.find((entry) => entry.clip.id === selectedClipId);
    if (!segment) return;

    const clip = segment.clip;
    const localPlayhead = clamp(currentTime - segment.start, 0, segment.duration);
    const fallback = segment.duration / 2;
    const splitAtPlayback =
      localPlayhead > MIN_CLIP_SPAN_SECONDS && segment.duration - localPlayhead > MIN_CLIP_SPAN_SECONDS
        ? localPlayhead
        : fallback;
    const sourceSplit = clip.trimStart + splitAtPlayback * clip.playbackRate;
    const minSplit = clip.trimStart + MIN_CLIP_SPAN_SECONDS * clip.playbackRate;
    const maxSplit = clip.trimEnd - MIN_CLIP_SPAN_SECONDS * clip.playbackRate;
    const normalizedSplit = clamp(sourceSplit, minSplit, maxSplit);

    if (normalizedSplit <= minSplit || normalizedSplit >= maxSplit) {
      toast.error('Playhead is too close to clip edges to split.');
      return;
    }

    let rightClipId: string | null = null;

    commitTimeline((state) => {
      const index = state.clips.findIndex((entry) => entry.id === selectedClipId);
      if (index < 0) return state;
      const original = state.clips[index];
      if (!original) return state;

      rightClipId = uid('clip');

      const leftClip: TimelineClip = {
        ...original,
        trimEnd: toFixedNumber(normalizedSplit, 3),
        transitionType: 'cut',
        transitionDuration: 0,
      };

      const rightClip: TimelineClip = {
        ...original,
        id: rightClipId,
        title: `${original.title} (Part B)`,
        trimStart: toFixedNumber(normalizedSplit, 3),
      };

      const clips = [...state.clips];
      clips.splice(index, 1, leftClip, rightClip);

      return { ...state, clips };
    });

    if (rightClipId) {
      setSelectedClipId(rightClipId);
    }

    toast.success('Clip split at playhead.');
  }, [selectedClipId, trackStatus.byKind.video.locked, segments, currentTime, commitTimeline]);

  const addMarkerAtPlayhead = useCallback(() => {
    if (!timeline) return;
    if (totalDuration <= 0) {
      toast.error('Add clips or timeline layers before creating markers.');
      return;
    }

    const label = markerLabel.trim() || `Marker ${timeline.markers.length + 1}`;
    const markerTime = clamp(currentTime, 0, totalDuration);
    const color = MARKER_COLORS[timeline.markers.length % MARKER_COLORS.length] ?? '#52deff';

    commitTimeline((state) => ({
      ...state,
      markers: [...state.markers, { id: uid('marker'), label, time: markerTime, color }].sort(
        (a, b) => a.time - b.time
      ),
    }));

    setMarkerLabel('');
    toast.success(`Added marker "${label}".`);
  }, [timeline, markerLabel, currentTime, totalDuration, commitTimeline]);

  const removeMarker = useCallback(
    (markerId: string) => {
      commitTimeline((state) => ({
        ...state,
        markers: state.markers.filter((marker) => marker.id !== markerId),
      }));
    },
    [commitTimeline]
  );

  const addMusicBedAtPlayhead = useCallback(() => {
    if (trackStatus.byKind.music.locked) {
      toast.error('Music track is locked.');
      return;
    }

    const start = clamp(currentTime, 0, Math.max(totalDuration, 0));
    const id = uid('music');

    commitTimeline((state) => {
      const remaining = Math.max(2, totalDuration - start);
      const duration = clamp(remaining > 2 ? Math.min(remaining, 16) : 8, 2, 40);

      return {
        ...state,
        musicBeds: [
          ...state.musicBeds,
          {
            id,
            title: `Music ${state.musicBeds.length + 1}`,
            start: toFixedNumber(start, 3),
            duration: toFixedNumber(duration, 3),
            volume: 35,
            muted: false,
            loop: true,
            color: CLIP_COLOR_ORDER[state.musicBeds.length % CLIP_COLOR_ORDER.length] ?? 'emerald',
          },
        ],
      };
    });

    setSelectedMusicId(id);
    setSelectedClipId(null);
    setSelectedTitleId(null);
    toast.success('Music bed added.');
  }, [trackStatus.byKind.music.locked, currentTime, totalDuration, commitTimeline]);

  const removeSelectedMusicBed = useCallback(() => {
    if (!selectedMusicId) return;
    if (trackStatus.byKind.music.locked) {
      toast.error('Music track is locked.');
      return;
    }

    commitTimeline((state) => ({
      ...state,
      musicBeds: state.musicBeds.filter((item) => item.id !== selectedMusicId),
    }));

    setSelectedMusicId(null);
    toast.success('Music bed removed.');
  }, [selectedMusicId, trackStatus.byKind.music.locked, commitTimeline]);

  const addTitleAtPlayhead = useCallback(() => {
    if (trackStatus.byKind.titles.locked) {
      toast.error('Title track is locked.');
      return;
    }

    const start = clamp(currentTime, 0, Math.max(totalDuration, 0));
    const id = uid('title');

    commitTimeline((state) => ({
      ...state,
      titleOverlays: [
        ...state.titleOverlays,
        {
          id,
          text: `Title ${state.titleOverlays.length + 1}`,
          start: toFixedNumber(start, 3),
          duration: 3,
          style: 'lower-third',
          color: TITLE_COLORS[state.titleOverlays.length % TITLE_COLORS.length] ?? '#f8fafc',
          enabled: true,
        },
      ],
    }));

    setSelectedTitleId(id);
    setSelectedClipId(null);
    setSelectedMusicId(null);
    toast.success('Title overlay added.');
  }, [trackStatus.byKind.titles.locked, currentTime, totalDuration, commitTimeline]);

  const removeSelectedTitle = useCallback(() => {
    if (!selectedTitleId) return;
    if (trackStatus.byKind.titles.locked) {
      toast.error('Title track is locked.');
      return;
    }

    commitTimeline((state) => ({
      ...state,
      titleOverlays: state.titleOverlays.filter((item) => item.id !== selectedTitleId),
    }));

    setSelectedTitleId(null);
    toast.success('Title overlay removed.');
  }, [selectedTitleId, trackStatus.byKind.titles.locked, commitTimeline]);

  const fitTimelineToViewport = useCallback(() => {
    const viewport = timelineViewportRef.current;
    if (!viewport || totalDuration <= 0) {
      setZoom(DEFAULT_TIMELINE_ZOOM);
      return;
    }

    const available = Math.max(240, viewport.clientWidth - 20);
    const nextZoom = clamp(available / (totalDuration * basePixelsPerSecond), 0.25, 8);
    setZoom(toFixedNumber(nextZoom, 2));
  }, [totalDuration, basePixelsPerSecond]);

  const getWaveformKey = useCallback((clip: TimelineClip) => {
    return [
      clip.shotId,
      clip.videoUrl ?? 'no-video',
      clip.sourceDuration.toFixed(3),
      clip.provider,
    ].join('|');
  }, []);

  const readCachedWaveform = useCallback((key: string) => {
    const inMemory = waveformCacheRef.current.get(key);
    if (inMemory) return inMemory;

    try {
      const raw = window.localStorage.getItem(getWaveformStorageKey(key));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return null;
      const points = parsed
        .map((entry) => (typeof entry === 'number' ? clamp(entry, 0, 1) : null))
        .filter((entry): entry is number => entry !== null);
      if (points.length === 0) return null;
      waveformCacheRef.current.set(key, points);
      return points;
    } catch {
      return null;
    }
  }, []);

  const persistWaveform = useCallback((key: string, points: number[]) => {
    waveformCacheRef.current.set(key, points);
    try {
      window.localStorage.setItem(getWaveformStorageKey(key), JSON.stringify(points));
    } catch {
      // Ignore localStorage quota issues.
    }
  }, []);

  const generateWaveformPoints = useCallback(
    async (clip: TimelineClip, key: string) => {
      const points = clamp(Math.round(clip.sourceDuration * 12), WAVEFORM_POINT_MIN, WAVEFORM_POINT_MAX);

      if (!clip.videoUrl) {
        return buildFallbackWaveform(key, points);
      }

      try {
        const response = await fetch(clip.videoUrl);
        if (!response.ok) {
          throw new Error(`Waveform fetch failed (${response.status})`);
        }
        const audioBufferBytes = await response.arrayBuffer();

        if (!waveformAudioContextRef.current) {
          const Context = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!Context) {
            throw new Error('Web Audio API unavailable');
          }
          waveformAudioContextRef.current = new Context();
        }

        const audioContext = waveformAudioContextRef.current;
        const decoded = await audioContext.decodeAudioData(audioBufferBytes.slice(0));
        const channel = decoded.getChannelData(0);
        if (!channel || channel.length === 0) {
          throw new Error('No decodable audio channel');
        }

        const bucketSize = Math.max(1, Math.floor(channel.length / points));
        const stride = Math.max(1, Math.floor(bucketSize / 120));
        const result: number[] = [];
        let globalPeak = 0;

        for (let point = 0; point < points; point += 1) {
          const start = point * bucketSize;
          const end = point === points - 1 ? channel.length : Math.min(channel.length, start + bucketSize);
          let peak = 0;
          for (let index = start; index < end; index += stride) {
            const sample = Math.abs(channel[index] ?? 0);
            if (sample > peak) peak = sample;
          }
          globalPeak = Math.max(globalPeak, peak);
          result.push(peak);
        }

        if (globalPeak <= 0) {
          return buildFallbackWaveform(key, points);
        }

        return result.map((sample) => clamp(sample / globalPeak, 0.03, 1));
      } catch {
        return buildFallbackWaveform(key, points);
      }
    },
    []
  );

  const getWaveformBars = useCallback(
    (segment: TimelineSegment, bars: number) => {
      const key = getWaveformKey(segment.clip);
      const source = waveformCacheRef.current.get(key);
      if (!source || source.length === 0) return null;
      const sourceDuration = Math.max(segment.clip.sourceDuration, MIN_CLIP_SPAN_SECONDS);
      const startRatio = clamp(segment.clip.trimStart / sourceDuration, 0, 1);
      const endRatio = clamp(segment.clip.trimEnd / sourceDuration, startRatio + Number.EPSILON, 1);
      return sampleWaveformWindow(source, startRatio, endRatio, bars);
    },
    [getWaveformKey]
  );

  const handleClipDragStart = useCallback(
    (event: ReactDragEvent<HTMLButtonElement>, clipId: string) => {
      if (trackStatus.byKind.video.locked) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', clipId);
      setDragState({ sourceId: clipId, targetId: null, position: 'after' });
    },
    [trackStatus.byKind.video.locked]
  );

  const getTimelineTimeAtClientX = useCallback(
    (clientX: number) => {
      const viewportElement = timelineViewportRef.current;
      if (!viewportElement || timelinePixelsPerSecond <= 0) return 0;
      const rect = viewportElement.getBoundingClientRect();
      const absoluteX = viewportElement.scrollLeft + (clientX - rect.left);
      return clamp(absoluteX / timelinePixelsPerSecond, 0, totalDuration);
    },
    [timelinePixelsPerSecond, totalDuration]
  );

  const getDropTargetFromTime = useCallback(
    (time: number): Pick<DragState, 'targetId' | 'position'> => {
      if (segments.length === 0) {
        return { targetId: null, position: 'end' };
      }

      for (const segment of segments) {
        const midpoint = segment.start + segment.duration / 2;
        if (time < midpoint) {
          return { targetId: segment.clip.id, position: 'before' };
        }
      }

      const last = segments[segments.length - 1];
      return { targetId: last?.clip.id ?? null, position: 'after' };
    },
    [segments]
  );

  const applyDragReorder = useCallback(
    (targetId: string | null, position: 'before' | 'after' | 'end') => {
      if (!dragState) return;
      if (trackStatus.byKind.video.locked) return;

      let moved = false;

      commitTimeline((state) => {
        const reordered = reorderClips(state.clips, dragState.sourceId, targetId, position);
        moved = reordered !== state.clips;
        return moved ? { ...state, clips: reordered } : state;
      });

      if (moved) {
        toast.success('Clips reordered.');
      }
      setDragState(null);
    },
    [dragState, trackStatus.byKind.video.locked, commitTimeline]
  );

  const handleTrackDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      if (!dragState) return;
      event.preventDefault();
      const time = getTimelineTimeAtClientX(event.clientX);
      const target = getDropTargetFromTime(time);
      setDragState((previous) => (previous ? { ...previous, ...target } : previous));
    },
    [dragState, getTimelineTimeAtClientX, getDropTargetFromTime]
  );

  const handleTrackDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!dragState) return;
      if (dragState.sourceId === dragState.targetId) {
        setDragState(null);
        return;
      }
      applyDragReorder(dragState.targetId, dragState.position);
    },
    [dragState, applyDragReorder]
  );

  const dragIndicatorTime = useMemo(() => {
    if (!dragState) return null;
    if (dragState.position === 'end' || !dragState.targetId) return totalDuration;
    const targetSegment = segmentByClipId.get(dragState.targetId);
    if (!targetSegment) return null;
    return dragState.position === 'before' ? targetSegment.start : targetSegment.end;
  }, [dragState, segmentByClipId, totalDuration]);

  const syncPreviewVideo = useCallback(
    (forceSeek = false) => {
      const video = previewVideoRef.current;
      if (!video || !previewSegment || !previewSegment.clip.videoUrl || !trackStatus.videoVisible) {
        return;
      }

      const clip = previewSegment.clip;
      const localTimeline = clamp(currentTime - previewSegment.start, 0, previewSegment.duration);
      const targetTime = clamp(
        clip.trimStart + localTimeline * clip.playbackRate,
        clip.trimStart,
        clip.trimEnd
      );

      const seekThreshold = isPlaying ? 0.22 : 0.035;
      if (forceSeek || Math.abs(video.currentTime - targetTime) > seekThreshold) {
        try {
          video.currentTime = targetTime;
        } catch {
          // Ignore media seek errors from unavailable ranges.
        }
      }

      video.playbackRate = clip.playbackRate;

      const clipTrackMuted = !trackStatus.dialogueAudible;
      const muted = Boolean(timeline?.masterMuted || clipTrackMuted || clip.muted);
      const volume = clamp((clip.audioVolume * (timeline?.masterVolume ?? 100)) / 10000, 0, 1);

      video.muted = muted;
      video.volume = muted ? 0 : volume;

      if (isPlaying) {
        const promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(() => {
            setIsPlaying(false);
          });
        }
      } else {
        video.pause();
      }
    },
    [
      currentTime,
      isPlaying,
      previewSegment,
      timeline?.masterMuted,
      timeline?.masterVolume,
      trackStatus.videoVisible,
      trackStatus.dialogueAudible,
    ]
  );

  const handlePreviewTimeUpdate = useCallback(() => {
    if (!isPlaying) return;

    const video = previewVideoRef.current;
    const segment = previewSegment;
    if (!video || !segment || !segment.clip.videoUrl || !trackStatus.videoVisible) return;

    const elapsedSource = video.currentTime - segment.clip.trimStart;
    const elapsedTimeline = elapsedSource / segment.clip.playbackRate;
    const nextTimelineTime = clamp(segment.start + elapsedTimeline, segment.start, segment.end);

    setCurrentTime((previous) =>
      Math.abs(previous - nextTimelineTime) > 1 / 120 ? nextTimelineTime : previous
    );

    if (nextTimelineTime >= segment.end - 1 / 30) {
      const next = segment.end + 0.0001;
      if (next >= totalDuration) {
        if (loopPlayback) {
          setCurrentTime(0);
        } else {
          setCurrentTime(totalDuration);
          setIsPlaying(false);
        }
      } else {
        setCurrentTime(next);
      }
    }
  }, [isPlaying, previewSegment, trackStatus.videoVisible, totalDuration, loopPlayback]);

  const handlePreviewEnded = useCallback(() => {
    if (!isPlaying) return;

    if (currentTime >= totalDuration - 1 / 60) {
      if (loopPlayback) {
        setCurrentTime(0);
      } else {
        setCurrentTime(totalDuration);
        setIsPlaying(false);
      }
      return;
    }

    setCurrentTime((previous) => Math.min(totalDuration, previous + 0.001));
  }, [isPlaying, currentTime, totalDuration, loopPlayback]);

  const handleExport = useCallback(() => {
    if (!project || !timeline) return;
    if (timeline.clips.length === 0) {
      toast.error('No timeline clips available to export.');
      return;
    }

    const exportSegments = buildSegments(timeline.clips);
    const manifest = {
      exportedAt: new Date().toISOString(),
      projectId: project.id,
      projectTitle: project.title,
      totalDurationSeconds: toFixedNumber(totalDuration, 3),
      timelineSettings: {
        snapEnabled: timeline.snapEnabled,
        showWaveforms: timeline.showWaveforms,
        masterVolume: timeline.masterVolume,
        masterMuted: timeline.masterMuted,
      },
      tracks: trackStatus.tracks.map((track) => ({
        id: track.id,
        kind: track.kind,
        name: track.name,
        locked: track.locked,
        muted: track.muted,
        solo: track.solo,
      })),
      markers: timeline.markers.map((marker) => ({
        id: marker.id,
        label: marker.label,
        timeSeconds: toFixedNumber(marker.time, 3),
        color: marker.color,
      })),
      musicBeds: timeline.musicBeds.map((item, index) => ({
        order: index + 1,
        id: item.id,
        title: item.title,
        startSeconds: toFixedNumber(item.start, 3),
        durationSeconds: toFixedNumber(item.duration, 3),
        endSeconds: toFixedNumber(item.start + item.duration, 3),
        volume: item.volume,
        muted: item.muted || !trackStatus.musicAudible,
        loop: item.loop,
        color: item.color,
      })),
      titleOverlays: timeline.titleOverlays.map((item, index) => ({
        order: index + 1,
        id: item.id,
        text: item.text,
        startSeconds: toFixedNumber(item.start, 3),
        durationSeconds: toFixedNumber(item.duration, 3),
        endSeconds: toFixedNumber(item.start + item.duration, 3),
        style: item.style,
        color: item.color,
        enabled: item.enabled && trackStatus.titlesVisible,
      })),
      timeline: exportSegments.map((segment, index) => ({
        order: index + 1,
        clipId: segment.clip.id,
        sourceShotId: segment.clip.shotId,
        title: segment.clip.title,
        prompt: segment.clip.prompt,
        provider: segment.clip.provider,
        sourceDurationSeconds: toFixedNumber(segment.clip.sourceDuration, 3),
        timelineStartSeconds: toFixedNumber(segment.start, 3),
        timelineEndSeconds: toFixedNumber(segment.end, 3),
        durationSeconds: toFixedNumber(segment.duration, 3),
        trimStartSeconds: toFixedNumber(segment.clip.trimStart, 3),
        trimEndSeconds: toFixedNumber(segment.clip.trimEnd, 3),
        playbackRate: segment.clip.playbackRate,
        transition: {
          type: segment.clip.transitionType,
          durationSeconds: toFixedNumber(segment.clip.transitionDuration, 3),
        },
        audio: {
          muted:
            segment.clip.muted ||
            timeline.masterMuted ||
            !trackStatus.dialogueAudible ||
            trackStatus.byKind.dialogue.muted,
          clipVolume: toFixedNumber(segment.clip.audioVolume, 1),
          masterVolume: toFixedNumber(timeline.masterVolume, 1),
          effectiveVolumePercent:
            segment.clip.muted || timeline.masterMuted || !trackStatus.dialogueAudible
              ? 0
              : toFixedNumber((segment.clip.audioVolume * timeline.masterVolume) / 100, 1),
        },
        color: segment.clip.color,
        thumbnailUrl: segment.clip.thumbnailUrl,
        videoUrl: segment.clip.videoUrl,
      })),
      sourceClips: completedShots.map((shot, index) => ({
        order: index + 1,
        id: shot.id,
        title: shot.title,
        prompt: shot.prompt,
        provider: shot.provider,
        durationSeconds: shot.duration,
        thumbnailUrl: shot.thumbnailUrl,
        videoUrl: shot.videoUrl,
      })),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    const slug =
      project.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'videoviber-project';

    link.href = url;
    link.download = `${slug}-edit-decision-list.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    updateProject(project.id, { status: 'exported' });
    toast.success('Edit decision list exported.');
  }, [project, timeline, totalDuration, completedShots, trackStatus, updateProject]);

  useEffect(() => {
    if (!project) return;
    if (loadedProjectIdRef.current === project.id) return;
    loadedProjectIdRef.current = project.id;

    if (timelineStorageKey) {
      try {
        const raw = window.localStorage.getItem(timelineStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (isTimelineState(parsed)) {
            loadTimelineState(parsed);
            toast.success('Recovered saved timeline draft.');
            return;
          }
        }
      } catch {
        // Ignore malformed local drafts and start fresh.
      }
    }

    initializeTimeline(completedShots, project.title);
  }, [project, completedShots, initializeTimeline, loadTimelineState, timelineStorageKey]);

  useEffect(() => {
    if (!timelineStorageKey || !timeline) return;
    if (autosaveTimeoutRef.current !== null) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(timelineStorageKey, JSON.stringify(timeline));
      } catch {
        // Ignore localStorage write failures.
      }
    }, 240);

    return () => {
      if (autosaveTimeoutRef.current !== null) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [timelineStorageKey, timeline]);

  useEffect(() => {
    const viewportElement = timelineViewportRef.current;
    if (!viewportElement) return;

    const updateViewport = () => {
      setViewport({
        scrollLeft: viewportElement.scrollLeft,
        width: viewportElement.clientWidth,
      });
    };

    updateViewport();

    const onScroll = () => updateViewport();
    viewportElement.addEventListener('scroll', onScroll, { passive: true });

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateViewport());
      observer.observe(viewportElement);
    }

    return () => {
      viewportElement.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    };
  }, [timelineClips.length, timeline?.musicBeds.length, timeline?.titleOverlays.length]);

  useEffect(() => {
    if (!timeline?.showWaveforms) return;
    if (virtualizedSegments.length === 0) return;

    let cancelled = false;
    const candidates = virtualizedSegments.map((entry) => entry.clip);

    const run = async () => {
      for (const clip of candidates) {
        if (!clip.videoUrl) continue;

        const key = getWaveformKey(clip);
        if (waveformPendingRef.current.has(key)) continue;
        if (readCachedWaveform(key)) continue;

        waveformPendingRef.current.add(key);
        const points = await generateWaveformPoints(clip, key);
        waveformPendingRef.current.delete(key);

        if (cancelled) return;
        persistWaveform(key, points);
        setWaveformVersion((value) => value + 1);

        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
    };

    const maybeWindow = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    let idleHandle: number | null = null;
    let timeoutHandle: number | null = null;

    if (maybeWindow.requestIdleCallback) {
      idleHandle = maybeWindow.requestIdleCallback(() => {
        void run();
      });
    } else {
      timeoutHandle = window.setTimeout(() => {
        void run();
      }, 16);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== null && maybeWindow.cancelIdleCallback) {
        maybeWindow.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, [
    timeline?.showWaveforms,
    virtualizedSegments,
    getWaveformKey,
    readCachedWaveform,
    generateWaveformPoints,
    persistWaveform,
  ]);

  useEffect(
    () => () => {
      if (waveformAudioContextRef.current) {
        void waveformAudioContextRef.current.close();
        waveformAudioContextRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedClipId) return;
    const exists = timelineClips.some((clip) => clip.id === selectedClipId);
    if (!exists) {
      setSelectedClipId(timelineClips[0]?.id ?? null);
    }
  }, [selectedClipId, timelineClips]);

  useEffect(() => {
    if (!selectedMusicId) return;
    const exists = timeline?.musicBeds.some((item) => item.id === selectedMusicId);
    if (!exists) setSelectedMusicId(null);
  }, [selectedMusicId, timeline?.musicBeds]);

  useEffect(() => {
    if (!selectedTitleId) return;
    const exists = timeline?.titleOverlays.some((item) => item.id === selectedTitleId);
    if (!exists) setSelectedTitleId(null);
  }, [selectedTitleId, timeline?.titleOverlays]);

  useEffect(() => {
    setCurrentTime((previous) => clamp(previous, 0, totalDuration));
  }, [totalDuration]);

  useEffect(() => {
    syncPreviewVideo(false);
  }, [syncPreviewVideo]);

  useEffect(() => {
    if (!isPlaying || totalDuration <= 0) return;
    if (canUsePreviewVideo) return;

    const timer = window.setInterval(() => {
      setCurrentTime((previous) => {
        const next = previous + PLAYBACK_TICK_SECONDS;
        if (next >= totalDuration) {
          if (loopPlayback) {
            return 0;
          }
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
    }, PLAYBACK_TICK_MS);

    return () => window.clearInterval(timer);
  }, [isPlaying, totalDuration, loopPlayback, canUsePreviewVideo]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        setIsPlaying((playing) => !playing);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        seekTo(currentTime - 0.25, { disableSnap: true });
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        seekTo(currentTime + 0.25, { disableSnap: true });
        return;
      }

      if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        addMarkerAtPlayhead();
        return;
      }

      if (event.key.toLowerCase() === 't') {
        event.preventDefault();
        addTitleAtPlayhead();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        splitSelectedClip();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    addMarkerAtPlayhead,
    addTitleAtPlayhead,
    currentTime,
    handleRedo,
    handleUndo,
    seekTo,
    splitSelectedClip,
  ]);

  if (!project) {
    return (
      <div className="animate-fade-in-up flex flex-col items-center justify-center py-32">
        <h2 className="mb-2 text-xl font-bold">Project not found</h2>
        <Link href="/dashboard" className="vv-btn-primary mt-4">
          Back to Dashboard
        </Link>
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
    <div className="animate-fade-in-up flex h-[calc(100vh-3.5rem)] flex-col space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <a
            href={`/projects/${params.id}`}
            className="text-vv-muted hover:text-vv-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.03]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </a>
          <div className="bg-accent/10 text-accent flex h-10 w-10 items-center justify-center rounded-lg">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{project.title} - Timeline</h1>
            <p className="text-vv-muted text-xs">
              {timelineClips.length} clips · {timeline?.musicBeds.length ?? 0} music ·{' '}
              {timeline?.titleOverlays.length ?? 0} titles · {formatTime(totalDuration)} total
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="vv-btn-ghost px-3 disabled:cursor-not-allowed disabled:opacity-40"
            title="Undo (Ctrl/Cmd+Z)"
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="vv-btn-ghost px-3 disabled:cursor-not-allowed disabled:opacity-40"
            title="Redo (Ctrl/Cmd+Shift+Z)"
          >
            Redo
          </button>
          <button
            onClick={() => setLoopPlayback((enabled) => !enabled)}
            className={`vv-btn-ghost px-3 ${loopPlayback ? 'text-accent' : ''}`}
            title="Loop playback"
          >
            Loop
          </button>
          <button
            onClick={fitTimelineToViewport}
            className="vv-btn-secondary px-3 py-2 text-xs"
            title="Fit full timeline to viewport"
          >
            Fit
          </button>
          <label className="vv-btn-secondary cursor-pointer px-3 py-2 text-xs">
            {importingMedia ? 'Importing...' : 'Import Clips'}
            <input
              ref={timelineImportInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              disabled={importingMedia}
              onChange={(event) => {
                if (event.target.files) {
                  void handleImportMedia(event.target.files);
                }
                if (timelineImportInputRef.current) {
                  timelineImportInputRef.current.value = '';
                }
              }}
            />
          </label>
          <button
            onClick={refreshFromProjectShots}
            className="vv-btn-secondary px-3 py-2 text-xs"
            title="Reset timeline from completed clips"
          >
            Refresh Clips
          </button>
          <button onClick={handleExport} className="vv-btn-primary">
            Export EDL
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-12">
        <div className="flex min-h-0 flex-col gap-3 xl:col-span-8">
          <div className="vv-card from-vv-surface to-vv-base relative flex min-h-[260px] flex-1 items-center justify-center overflow-hidden bg-gradient-to-br">
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
            ) : trackStatus.videoVisible && previewClip?.thumbnailUrl ? (
              <MotionImage
                src={previewClip.thumbnailUrl}
                alt={previewClip.title}
                width={1280}
                height={720}
                unoptimized
                className="h-full w-full object-contain"
                motionPreset="pan"
                motionSpeed="slow"
              />
            ) : trackStatus.videoVisible && previewClip ? (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(82,222,255,0.2),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,175,103,0.16),transparent_42%)] p-8 text-center">
                <div>
                  <div className="bg-accent/10 ring-accent/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ring-1">
                    <svg
                      className="text-accent h-7 w-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold">{previewClip.title}</p>
                  <p className="text-vv-muted mt-2 max-w-md text-xs leading-relaxed">
                    {previewClip.prompt}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                  <svg
                    className="text-vv-muted h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                    />
                  </svg>
                </div>
                <p className="text-vv-muted text-sm font-medium">
                  {trackStatus.videoVisible ? 'No clip preview available' : 'Video track muted or excluded by solo'}
                </p>
                <p className="text-vv-disabled mt-1 text-xs">
                  {trackStatus.videoVisible
                    ? 'Generate or select clips to preview'
                    : 'Toggle track mute/solo to show video'}
                </p>
              </div>
            )}

            {activeTitles.map((title) => (
              <div
                key={title.id}
                className={`pointer-events-none absolute z-20 border border-white/15 bg-black/60 text-white/95 shadow-lg backdrop-blur-sm ${getTitleStyleClasses(
                  title.style
                )}`}
                style={{ color: title.color }}
              >
                {title.text}
              </div>
            ))}

            <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-1.5 font-mono text-xs text-white backdrop-blur-sm">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </div>
            {previewSegment && (
              <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm">
                {previewSegment.clip.title} · {formatTime(previewSegment.duration)}
              </div>
            )}
          </div>

          <div className="vv-card space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => seekTo(0, { disableSnap: true })}
                className="vv-btn-ghost px-3 py-2 text-xs"
              >
                Start
              </button>
              <button
                onClick={() => setIsPlaying((playing) => !playing)}
                className="bg-accent/10 text-accent hover:bg-accent/20 flex h-9 w-9 items-center justify-center rounded-lg transition-all"
                title="Play / Pause"
              >
                {isPlaying ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
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
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={() => seekTo(totalDuration, { disableSnap: true })}
                className="vv-btn-ghost px-3 py-2 text-xs"
              >
                End
              </button>
              <div className="text-vv-muted ml-2 font-mono text-xs">{formatTime(currentTime)}</div>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-vv-muted text-[10px] uppercase tracking-wider">Zoom</span>
                <input
                  type="range"
                  min="0.25"
                  max="8"
                  step="0.1"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="accent-accent w-28"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                value={markerLabel}
                onChange={(event) => setMarkerLabel(event.target.value)}
                placeholder="Marker label"
                className="vv-input h-9 w-full max-w-[220px] py-2 text-xs"
              />
              <button
                onClick={addMarkerAtPlayhead}
                className="vv-btn-secondary px-3 py-2 text-xs"
                disabled={totalDuration <= 0}
              >
                Add Marker (M)
              </button>
              <button
                onClick={addMusicBedAtPlayhead}
                className="vv-btn-secondary px-3 py-2 text-xs"
                disabled={trackStatus.byKind.music.locked}
              >
                Add Music
              </button>
              <button
                onClick={addTitleAtPlayhead}
                className="vv-btn-secondary px-3 py-2 text-xs"
                disabled={trackStatus.byKind.titles.locked}
              >
                Add Title (T)
              </button>
              <button
                onClick={splitSelectedClip}
                className="vv-btn-secondary px-3 py-2 text-xs"
                disabled={!selectedClip || trackStatus.byKind.video.locked}
              >
                Split Selected
              </button>
              <button
                onClick={() =>
                  commitTimeline((state) => ({
                    ...state,
                    snapEnabled: !state.snapEnabled,
                  }))
                }
                className={`vv-btn-ghost px-3 py-2 text-xs ${timeline?.snapEnabled ? 'text-accent' : ''}`}
              >
                Snap {timeline?.snapEnabled ? 'On' : 'Off'}
              </button>
            </div>

            <p className="text-vv-muted text-[11px]">
              Shortcuts: Space play/pause, Arrow Left/Right nudge, M marker, T title, Ctrl/Cmd+Shift+S split, Ctrl/Cmd+Z undo.
            </p>
          </div>
        </div>

        <div className="vv-card min-h-0 overflow-y-auto xl:col-span-4">
          <div className="mb-4 flex items-center gap-2">
            <svg
              className="text-accent h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <h3 className="text-vv-secondary text-sm font-bold">Inspector</h3>
          </div>

          {selectedClip ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold">Clip: {selectedClip.title}</h4>
                <p className="text-vv-muted mt-1 text-xs">{selectedClip.prompt}</p>
              </div>

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
                    max={Math.max(0, selectedClip.trimEnd - MIN_CLIP_SPAN_SECONDS)}
                    step={0.05}
                    value={selectedClip.trimStart}
                    onChange={(event) =>
                      updateSelectedClip((clip) => ({
                        ...clip,
                        trimStart: toFixedNumber(clampTrimStart(clip, Number(event.target.value)), 3),
                      }))
                    }
                    className="accent-accent w-full"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vv-muted">Trim End</span>
                    <span className="font-mono">{formatTime(selectedClip.trimEnd)}</span>
                  </div>
                  <input
                    type="range"
                    min={Math.min(
                      selectedClip.sourceDuration,
                      selectedClip.trimStart + MIN_CLIP_SPAN_SECONDS
                    )}
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
                    {SPEED_OPTIONS.map((speed) => (
                      <option key={speed} value={speed}>
                        {speed.toFixed(2)}x
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <p className="text-vv-secondary text-xs font-semibold uppercase tracking-wider">
                  Transition and Audio
                </p>

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
                  className={`vv-btn-ghost w-full justify-center py-2 text-xs ${selectedClip.muted ? 'text-accent' : ''}`}
                >
                  {selectedClip.muted ? 'Unmute Clip' : 'Mute Clip'}
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-vv-muted text-xs">Clip Color</span>
                  <div className="ml-auto flex gap-1">
                    {(Object.keys(CLIP_COLOR_CLASSES) as ClipColor[]).map((color) => (
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
                        } ${CLIP_COLOR_CLASSES[color].accent}`}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => moveSelectedClip(-1)}
                  className="vv-btn-secondary px-3 py-2 text-xs"
                >
                  Move Left
                </button>
                <button
                  onClick={() => moveSelectedClip(1)}
                  className="vv-btn-secondary px-3 py-2 text-xs"
                >
                  Move Right
                </button>
                <button onClick={duplicateSelectedClip} className="vv-btn-secondary px-3 py-2 text-xs">
                  Duplicate
                </button>
                <button
                  onClick={deleteSelectedClip}
                  className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition-all hover:bg-red-500/20"
                >
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
                    min={MIN_ITEM_DURATION_SECONDS}
                    max={Math.max(MIN_ITEM_DURATION_SECONDS, Math.max(totalDuration, 10))}
                    step={0.1}
                    value={selectedMusicBed.duration}
                    onChange={(event) =>
                      updateSelectedMusicBed((item) => ({
                        ...item,
                        duration: clamp(
                          Number(event.target.value),
                          MIN_ITEM_DURATION_SECONDS,
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
                    className={`vv-btn-ghost py-2 text-xs ${selectedMusicBed.muted ? 'text-accent' : ''}`}
                  >
                    {selectedMusicBed.muted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    onClick={() =>
                      updateSelectedMusicBed((item) => ({
                        ...item,
                        loop: !item.loop,
                      }))
                    }
                    className={`vv-btn-ghost py-2 text-xs ${selectedMusicBed.loop ? 'text-accent' : ''}`}
                  >
                    {selectedMusicBed.loop ? 'Loop On' : 'Loop Off'}
                  </button>
                </div>

                <button
                  onClick={removeSelectedMusicBed}
                  className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition-all hover:bg-red-500/20"
                >
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
                    min={MIN_ITEM_DURATION_SECONDS}
                    max={Math.max(MIN_ITEM_DURATION_SECONDS, Math.max(totalDuration, 10))}
                    step={0.1}
                    value={selectedTitle.duration}
                    onChange={(event) =>
                      updateSelectedTitle((item) => ({
                        ...item,
                        duration: clamp(
                          Number(event.target.value),
                          MIN_ITEM_DURATION_SECONDS,
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
                    className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition-all hover:bg-red-500/20"
                  >
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

          <div className="mt-5 space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <p className="text-vv-secondary text-xs font-semibold uppercase tracking-wider">Track Mixer</p>
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
                      className={`rounded-md border px-2 py-1 ${track.locked ? 'border-amber-300/60 text-amber-200' : 'border-white/15 text-vv-muted hover:text-vv-primary'}`}
                    >
                      {track.locked ? 'Locked' : 'Lock'}
                    </button>
                    <button
                      onClick={() =>
                        updateTrack(row.kind, (item) => ({
                          ...item,
                          muted: !item.muted,
                        }))
                      }
                      className={`rounded-md border px-2 py-1 ${track.muted ? 'border-rose-300/60 text-rose-200' : 'border-white/15 text-vv-muted hover:text-vv-primary'}`}
                    >
                      {track.muted ? 'Muted' : 'Mute'}
                    </button>
                    <button
                      onClick={() =>
                        updateTrack(row.kind, (item) => ({
                          ...item,
                          solo: !item.solo,
                        }))
                      }
                      className={`rounded-md border px-2 py-1 ${track.solo ? 'border-cyan-300/60 text-cyan-200' : 'border-white/15 text-vv-muted hover:text-vv-primary'}`}
                    >
                      {track.solo ? 'Solo' : 'S'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <p className="text-vv-secondary text-xs font-semibold uppercase tracking-wider">
              Timeline Audio
            </p>
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

            <button
              onClick={() =>
                commitTimeline((state) => ({
                  ...state,
                  masterMuted: !state.masterMuted,
                }))
              }
              className={`vv-btn-ghost w-full justify-center py-2 text-xs ${timeline?.masterMuted ? 'text-accent' : ''}`}
            >
              {timeline?.masterMuted ? 'Unmute Timeline' : 'Mute Timeline'}
            </button>

            <button
              onClick={() =>
                commitTimeline((state) => ({
                  ...state,
                  showWaveforms: !state.showWaveforms,
                }))
              }
              className={`vv-btn-ghost w-full justify-center py-2 text-xs ${timeline?.showWaveforms ? 'text-accent' : ''}`}
            >
              {timeline?.showWaveforms ? 'Hide Waveforms' : 'Show Waveforms'}
            </button>
          </div>
        </div>
      </div>

      <div className="vv-card shrink-0">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-vv-muted text-xs uppercase tracking-wider">Timeline Tracks</p>
          <p className="text-vv-muted font-mono text-xs">
            {timelineClips.length} clips · {formatTime(totalDuration)}
          </p>
        </div>

        {timelineClips.length > 0 || (timeline?.musicBeds.length ?? 0) > 0 || (timeline?.titleOverlays.length ?? 0) > 0 ? (
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
                    className={`rounded-md border border-white/10 bg-white/[0.02] px-2 py-2 ${row.heightClass}`}
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
                        className={`rounded px-1.5 py-0.5 ${track.locked ? 'bg-amber-400/20 text-amber-100' : 'bg-white/[0.04] text-vv-muted'}`}
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
                        className={`rounded px-1.5 py-0.5 ${track.muted ? 'bg-rose-400/20 text-rose-100' : 'bg-white/[0.04] text-vv-muted'}`}
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
                        className={`rounded px-1.5 py-0.5 ${track.solo ? 'bg-cyan-400/20 text-cyan-100' : 'bg-white/[0.04] text-vv-muted'}`}
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

                  {(timeline?.markers ?? []).map((marker) => {
                    const left = totalDuration > 0 ? (marker.time / totalDuration) * 100 : 0;
                    return (
                      <button
                        key={marker.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          seekTo(marker.time, { disableSnap: true });
                          setSelectedClipId(null);
                          setSelectedMusicId(null);
                          setSelectedTitleId(null);
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
                    className="h-14 rounded-md border border-white/10 bg-white/[0.02] p-1"
                    onClick={seekFromEvent}
                    onDragOver={handleTrackDragOver}
                    onDrop={handleTrackDrop}
                    onDragLeave={() => {
                      if (dragState) {
                        setDragState((previous) =>
                          previous ? { ...previous, targetId: null, position: 'end' } : previous
                        );
                      }
                    }}
                  >
                    <div className="relative h-full">
                      {virtualizedSegments.map((segment) => {
                        const clip = segment.clip;
                        const width = Math.max(segment.duration * timelinePixelsPerSecond, 120);
                        const styles = CLIP_COLOR_CLASSES[clip.color];
                        const left = segment.start * timelinePixelsPerSecond;

                        return (
                          <button
                            key={clip.id}
                            draggable={!trackStatus.byKind.video.locked}
                            onDragStart={(event) => handleClipDragStart(event, clip.id)}
                            onDragEnd={() => setDragState(null)}
                            onClick={(event) => {
                              event.stopPropagation();
                              selectClip(clip.id, segment.start);
                              setIsPlaying(false);
                            }}
                            className={`group absolute top-0 flex h-full items-center justify-between rounded-md border px-2 text-left text-xs transition-all ${
                              clip.id === selectedClipId ? styles.active : styles.idle
                            } ${trackStatus.byKind.video.locked ? 'cursor-not-allowed opacity-75' : ''}`}
                            style={{ left: `${left}px`, width: `${width}px` }}
                            title={`${clip.title} · ${formatTime(segment.duration)}`}
                          >
                            <span className="truncate pr-2 font-semibold">{clip.title}</span>
                            <span className="text-[10px] font-mono opacity-85">
                              {formatTime(segment.duration)}
                            </span>

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
                    className="h-10 rounded-md border border-white/10 bg-white/[0.02] p-1"
                    onClick={seekFromEvent}
                  >
                    <div className="relative h-full">
                      {virtualizedSegments.map((segment) => {
                        const clip = segment.clip;
                        const width = Math.max(segment.duration * timelinePixelsPerSecond, 120);
                        const styles = CLIP_COLOR_CLASSES[clip.color];
                        const left = segment.start * timelinePixelsPerSecond;

                        const effectiveVolume =
                          timeline?.masterMuted || !trackStatus.dialogueAudible || clip.muted
                            ? 0
                            : (clip.audioVolume * (timeline?.masterVolume ?? 100)) / 100;

                        const waveformOpacity = timeline?.showWaveforms
                          ? clamp(effectiveVolume / 140, 0.15, 0.95)
                          : 0.18;

                        const barCount = clamp(Math.round(width / 4), 24, 140);
                        const bars = timeline?.showWaveforms
                          ? getWaveformBars(segment, barCount)
                          : null;

                        return (
                          <button
                            key={`${clip.id}-audio`}
                            onClick={(event) => {
                              event.stopPropagation();
                              selectClip(clip.id, segment.start);
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
                    className="h-10 rounded-md border border-white/10 bg-white/[0.02] p-1"
                    onClick={seekFromEvent}
                  >
                    <div className="relative h-full">
                      {virtualizedMusicBeds.map((item) => {
                        const width = Math.max(item.duration * timelinePixelsPerSecond, 50);
                        const left = item.start * timelinePixelsPerSecond;
                        const styles = CLIP_COLOR_CLASSES[item.color];
                        const isSelected = item.id === selectedMusicId;
                        const muted = item.muted || !trackStatus.musicAudible;

                        return (
                          <button
                            key={item.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              selectMusicBed(item.id, item.start);
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
                    className="h-9 rounded-md border border-white/10 bg-white/[0.02] p-1"
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
                              selectTitle(item.id, item.start);
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

        {(timeline?.markers.length ?? 0) > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-vv-muted text-[11px] uppercase tracking-wider">Markers</p>
            <div className="flex flex-wrap gap-2">
              {(timeline?.markers ?? []).map((marker) => (
                <div
                  key={marker.id}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs"
                >
                  <button
                    onClick={() => seekTo(marker.time, { disableSnap: true })}
                    className="inline-flex items-center gap-1"
                    title="Jump to marker"
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: marker.color }}
                    />
                    <span>{marker.label}</span>
                    <span className="text-vv-muted font-mono">{formatTime(marker.time)}</span>
                  </button>
                  <button
                    onClick={() => removeMarker(marker.id)}
                    className="text-vv-muted hover:text-vv-primary px-1"
                    title="Delete marker"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
