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
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ClipboardPaste,
  ClipboardX,
  Clapperboard,
  Copy,
  Download,
  Flag,
  Magnet,
  Music2,
  Pause,
  Play,
  Redo2,
  RefreshCw,
  Repeat,
  ScanLine,
  Scissors,
  Trash2,
  Type,
  Undo2,
  Upload,
} from 'lucide-react';
import { useAppStore, type Shot } from '@/app/store';
import { MotionImage } from '@/components/motion-image';
import { toast } from 'sonner';
import { AgentChatBar } from './_components/agent-chat-bar';
import { AgentSidebar } from './_components/agent-sidebar';
import { TimelineInspectorPanel } from './_components/timeline-inspector-panel';
import { TimelineTrackCanvas } from './_components/timeline-track-canvas';
import {
  AGENT_QUICK_COMMANDS,
  CHAT_HISTORY_LIMIT,
  TIMELINE_MODULE_LABELS,
  TIMELINE_THEME_BY_ID,
  TIMELINE_THEME_PRESETS,
  TIMELINE_THEME_STORAGE_PREFIX,
} from './_components/timeline-editor-config';
import type {
  AgentMessage,
  TimelineModuleFlags,
  TimelineModuleKey,
  TimelineThemeId,
  TimelineThemeStoragePayload,
} from './_components/timeline-editor-types';
import { ThemeLayoutPanel } from './_components/theme-layout-panel';
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
const MAX_IMPORT_DURATION = 60 * 60 * 6; // 6 hours
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

const parseFirstNumber = (value: string) => {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseTimeTextToSeconds = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((part) => Number(part));
    const [first = 0, second = 0, third = 0] = parts;
    if (parts.every((part) => Number.isFinite(part) && part >= 0)) {
      if (parts.length === 2) {
        return first * 60 + second;
      }
      if (parts.length === 3) {
        return first * 3600 + second * 60 + third;
      }
    }
  }

  const minuteMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?/i);
  const secondMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*s(?:ec(?:ond)?s?)?/i);
  if (minuteMatch || secondMatch) {
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    const seconds = secondMatch ? Number(secondMatch[1]) : 0;
    if (Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return minutes * 60 + seconds;
    }
  }

  const raw = Number(trimmed);
  return Number.isFinite(raw) ? raw : null;
};

const parseThemeFromCommand = (command: string): TimelineThemeId | null => {
  const normalized = command.toLowerCase();
  if (normalized.includes('minimal')) return 'minimal-chat';
  if (normalized.includes('advanced') || normalized.includes('studio')) return 'advanced-studio';
  if (normalized.includes('story') || normalized.includes('director')) return 'storyboard-director';
  if (normalized.includes('audio') || normalized.includes('mix')) return 'audio-mix';
  if (normalized.includes('review')) return 'review-focus';
  if (normalized.includes('assistant') || normalized.includes('agent')) return 'assistant-cut';
  if (normalized.includes('finish') || normalized.includes('final')) return 'finishing-suite';
  return null;
};

const formatAgentMessageTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    enabled: true,
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

const isTimelineThemeStoragePayload = (value: unknown): value is TimelineThemeStoragePayload => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<TimelineThemeStoragePayload>;
  if (!candidate.themeId || typeof candidate.themeId !== 'string') return false;
  if (!(candidate.themeId in TIMELINE_THEME_BY_ID)) return false;
  if (!candidate.moduleOverrides || typeof candidate.moduleOverrides !== 'object') {
    return false;
  }
  return true;
};

function clampTrimStart(clip: TimelineClip, nextStart: number) {
  const maxStart = Math.max(0, clip.trimEnd - MIN_CLIP_SPAN_SECONDS);
  return clamp(nextStart, 0, maxStart);
}

function clampTrimEnd(clip: TimelineClip, nextEnd: number) {
  const minEnd = Math.min(clip.sourceDuration, clip.trimStart + MIN_CLIP_SPAN_SECONDS);
  return clamp(nextEnd, minEnd, clip.sourceDuration);
}

type ClipClipboard = {
  clip: TimelineClip;
  mode: 'copy' | 'cut';
};

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
      const color = clipColors.has(clip.color)
        ? clip.color
        : CLIP_COLOR_ORDER[index % CLIP_COLOR_ORDER.length] ?? 'cyan';
      return {
        ...clip,
        enabled: typeof maybeEnabled === 'boolean' ? maybeEnabled : true,
        color,
      };
    }),
    tracks: normalizedTracks,
    titleOverlays: state.titleOverlays.map((title) => {
      const maybeEnabled = (title as TitleOverlay & { enabled?: boolean }).enabled;
      return {
        ...title,
        enabled: typeof maybeEnabled === 'boolean' ? maybeEnabled : true,
      };
    }),
  };
}

function createPastedClip(source: TimelineClip, mode: ClipClipboard['mode']): TimelineClip {
  const title =
    mode === 'copy'
      ? source.title.toLowerCase().includes('(copy)')
        ? source.title
        : `${source.title} (Copy)`
      : source.title;
  return {
    ...source,
    id: uid('clip'),
    title,
  };
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
  const [activeThemeId, setActiveThemeId] = useState<TimelineThemeId>('advanced-studio');
  const [moduleOverrides, setModuleOverrides] = useState<Partial<TimelineModuleFlags>>({});
  const [showModuleEditor, setShowModuleEditor] = useState(false);
  const [agentInput, setAgentInput] = useState('');
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([
    {
      id: uid('agent'),
      role: 'assistant',
      content:
        'Timeline agent ready. Try: "split selected clip", "set in", "set out", "disable selected clip", or "help".',
      createdAt: Date.now(),
    },
  ]);
  const [agentAutoApply, setAgentAutoApply] = useState(true);
  const [agentSafeMode, setAgentSafeMode] = useState(true);
  const [pendingSafeCommand, setPendingSafeCommand] = useState<string | null>(null);

  const loadedProjectIdRef = useRef<string | null>(null);
  const loadedThemeKeyRef = useRef<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const timelineViewportRef = useRef<HTMLDivElement | null>(null);
  const timelineImportInputRef = useRef<HTMLInputElement | null>(null);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const waveformCacheRef = useRef<Map<string, number[]>>(new Map());
  const waveformPendingRef = useRef<Set<string>>(new Set());
  const waveformAudioContextRef = useRef<AudioContext | null>(null);
  const timelineStorageKey = project ? `videoviber-timeline-${project.id}` : null;
  const themeStorageKey = project ? `${TIMELINE_THEME_STORAGE_PREFIX}${project.id}` : null;

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
  const playbackRange = useMemo(() => {
    if (rangeStart === null || rangeEnd === null) return null;
    const safeStart = clamp(Math.min(rangeStart, rangeEnd), 0, totalDuration);
    const safeEnd = clamp(Math.max(rangeStart, rangeEnd), 0, totalDuration);
    if (safeEnd - safeStart < MIN_PLAYBACK_RANGE_SECONDS) return null;
    return {
      start: toFixedNumber(safeStart, 3),
      end: toFixedNumber(safeEnd, 3),
    };
  }, [rangeStart, rangeEnd, totalDuration]);
  const playbackStart = playbackRange?.start ?? 0;
  const playbackEnd = playbackRange?.end ?? totalDuration;

  const activeTheme = TIMELINE_THEME_BY_ID[activeThemeId] ?? TIMELINE_THEME_BY_ID['advanced-studio'];
  const visibleModules = useMemo(
    () => ({ ...activeTheme.modules, ...moduleOverrides }),
    [activeTheme.modules, moduleOverrides]
  );

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
  const disabledClipCount = useMemo(
    () => timelineClips.filter((clip) => !clip.enabled).length,
    [timelineClips]
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
  const canUsePreviewVideo = Boolean(
    previewClip?.videoUrl && trackStatus.videoVisible && previewClip.enabled
  );

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
    const normalized = normalizeTimelineState(state);
    setHistory({ entries: [normalized], index: 0 });
    setSelectedClipId(normalized.clips[0]?.id ?? null);
    setSelectedMusicId(null);
    setSelectedTitleId(null);
    setCurrentTime(0);
    setRangeStart(null);
    setRangeEnd(null);
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

  const setInPoint = useCallback(() => {
    if (totalDuration <= 0) return;
    const nextIn = clamp(currentTime, 0, totalDuration);
    setRangeStart(nextIn);
    setRangeEnd((previous) => {
      if (previous === null) {
        return clamp(nextIn + Math.max(1, MIN_PLAYBACK_RANGE_SECONDS), 0, totalDuration);
      }
      if (previous - nextIn < MIN_PLAYBACK_RANGE_SECONDS) {
        return clamp(nextIn + MIN_PLAYBACK_RANGE_SECONDS, 0, totalDuration);
      }
      return previous;
    });
  }, [currentTime, totalDuration]);

  const setOutPoint = useCallback(() => {
    if (totalDuration <= 0) return;
    const nextOut = clamp(currentTime, 0, totalDuration);
    setRangeEnd(nextOut);
    setRangeStart((previous) => {
      if (previous === null) {
        return clamp(nextOut - Math.max(1, MIN_PLAYBACK_RANGE_SECONDS), 0, totalDuration);
      }
      if (nextOut - previous < MIN_PLAYBACK_RANGE_SECONDS) {
        return clamp(nextOut - MIN_PLAYBACK_RANGE_SECONDS, 0, totalDuration);
      }
      return previous;
    });
  }, [currentTime, totalDuration]);

  const clearPlaybackRange = useCallback(() => {
    setRangeStart(null);
    setRangeEnd(null);
  }, []);

  const setPlaybackRangeToSelectedClip = useCallback(() => {
    if (!selectedSegment) return;
    setRangeStart(toFixedNumber(selectedSegment.start, 3));
    setRangeEnd(toFixedNumber(selectedSegment.end, 3));
  }, [selectedSegment]);

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

  const copySelectedClipToClipboard = useCallback(() => {
    if (!selectedClip) {
      toast.error('Select a clip first to copy.');
      return false;
    }

    setClipClipboard({ clip: selectedClip, mode: 'copy' });
    toast.success(`Copied "${selectedClip.title}".`);
    return true;
  }, [selectedClip]);

  const cutSelectedClipToClipboard = useCallback(() => {
    if (!selectedClipId || !selectedClip) {
      toast.error('Select a clip first to cut.');
      return false;
    }
    if (trackStatus.byKind.video.locked) {
      toast.error('Video track is locked.');
      return false;
    }

    setClipClipboard({ clip: selectedClip, mode: 'cut' });
    let nextSelectedClipId: string | null = null;

    commitTimeline((state) => {
      const index = state.clips.findIndex((clip) => clip.id === selectedClipId);
      if (index < 0) return state;
      const clips = [...state.clips];
      clips.splice(index, 1);
      nextSelectedClipId = clips[index]?.id ?? clips[index - 1]?.id ?? null;
      return { ...state, clips };
    });

    setSelectedClipId(nextSelectedClipId);
    toast.success(`Cut "${selectedClip.title}". Use paste to insert.`);
    return true;
  }, [selectedClipId, selectedClip, trackStatus.byKind.video.locked, commitTimeline]);

  const pasteClipFromClipboard = useCallback(() => {
    if (!clipClipboard) {
      toast.error('Clipboard is empty.');
      return false;
    }
    if (trackStatus.byKind.video.locked) {
      toast.error('Video track is locked.');
      return false;
    }

    let insertedClipId: string | null = null;
    commitTimeline((state) => {
      const clips = [...state.clips];
      const selectedIndex = selectedClipId
        ? clips.findIndex((clip) => clip.id === selectedClipId)
        : -1;
      const insertAt = selectedIndex >= 0 ? selectedIndex + 1 : clips.length;
      const pasted = createPastedClip(clipClipboard.clip, clipClipboard.mode);
      insertedClipId = pasted.id;
      clips.splice(insertAt, 0, pasted);
      return { ...state, clips };
    });

    if (insertedClipId) {
      setSelectedClipId(insertedClipId);
      setSelectedMusicId(null);
      setSelectedTitleId(null);
    }
    if (clipClipboard.mode === 'cut') {
      setClipClipboard(null);
    }

    toast.success(`Pasted "${clipClipboard.clip.title}".`);
    return true;
  }, [clipClipboard, trackStatus.byKind.video.locked, selectedClipId, commitTimeline]);

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

  const deleteCurrentSelection = useCallback(() => {
    if (selectedClipId) {
      deleteSelectedClip();
      return true;
    }
    if (selectedMusicId) {
      removeSelectedMusicBed();
      return true;
    }
    if (selectedTitleId) {
      removeSelectedTitle();
      return true;
    }
    return false;
  }, [
    selectedClipId,
    selectedMusicId,
    selectedTitleId,
    deleteSelectedClip,
    removeSelectedMusicBed,
    removeSelectedTitle,
  ]);

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

  const toggleLoopPlayback = useCallback(() => {
    setLoopPlayback((enabled) => !enabled);
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying((playing) => {
      if (!playing && playbackRange) {
        setCurrentTime((previous) => {
          if (previous < playbackRange.start || previous >= playbackRange.end) {
            return playbackRange.start;
          }
          return previous;
        });
      }
      return !playing;
    });
  }, [playbackRange]);

  const appendAgentMessage = useCallback((role: AgentMessage['role'], content: string) => {
    setAgentMessages((previous) => {
      const next = [
        ...previous,
        {
          id: uid('agent'),
          role,
          content,
          createdAt: Date.now(),
        },
      ];
      return next.length > CHAT_HISTORY_LIMIT ? next.slice(next.length - CHAT_HISTORY_LIMIT) : next;
    });
  }, []);

  const applyThemePreset = useCallback((nextThemeId: TimelineThemeId) => {
    setActiveThemeId(nextThemeId);
    setModuleOverrides({});
    setShowModuleEditor(false);
  }, []);

  const toggleModuleVisibility = useCallback(
    (key: TimelineModuleKey) => {
      setModuleOverrides((previous) => {
        const merged = { ...activeTheme.modules, ...previous };
        const nextValue = !merged[key];
        const next = { ...previous };

        if (nextValue === activeTheme.modules[key]) {
          delete next[key];
        } else {
          next[key] = nextValue;
        }

        return next;
      });
    },
    [activeTheme.modules]
  );

  const runAgentCommand = useCallback(
    (rawInput: string) => {
      const trimmed = rawInput.trim();
      if (!trimmed) return;

      appendAgentMessage('user', trimmed);

      let commandText = trimmed;
      let isConfirming = false;

      if (/^confirm\b/i.test(trimmed) && pendingSafeCommand) {
        commandText = pendingSafeCommand;
        isConfirming = true;
        setPendingSafeCommand(null);
      }

      const lower = commandText.toLowerCase();

      const respond = (message: string) => {
        appendAgentMessage('assistant', message);
      };

      const perform = (
        label: string,
        action: () => void,
        options?: { destructive?: boolean; previewLabel?: string }
      ) => {
        if (options?.destructive && agentSafeMode && !isConfirming) {
          setPendingSafeCommand(commandText);
          respond(
            `Safe mode is on. Confirm this destructive edit with: "confirm ${commandText}".`
          );
          return;
        }

        if (!agentAutoApply) {
          respond(`Auto-apply is off. Pending action: ${options?.previewLabel ?? label}`);
          return;
        }

        action();
        respond(label);
      };

      if (
        lower === 'help' ||
        lower === '?' ||
        lower.includes('what can you do') ||
        lower.includes('commands')
      ) {
        respond(
          'Commands: theme minimal|advanced|storyboard|audio|review|assistant|finishing, split selected clip, copy selected clip, cut selected clip, paste clip, duplicate clip, delete clip, disable selected clip, enable selected clip, add marker intro, add title Intro Card, add music bed, set in, set out, clear range, loop on|off|toggle, mute timeline, unmute timeline, snap on|off, zoom 1.6, speed 1.25, seek 1:20, find clip intro, fit timeline, undo, redo.'
        );
        return;
      }

      if (lower.includes('theme')) {
        const themeId = parseThemeFromCommand(lower);
        if (!themeId) {
          respond(
            'Theme not recognized. Use one of: minimal, advanced, storyboard, audio, review, assistant, finishing.'
          );
          return;
        }

        const theme = TIMELINE_THEME_BY_ID[themeId];
        perform(`Theme switched to "${theme.name}".`, () => applyThemePreset(themeId));
        return;
      }

      if (lower.includes('split')) {
        if (!selectedClip) {
          respond('Select a clip first, then ask me to split.');
          return;
        }
        perform('Split selected clip at playhead.', () => splitSelectedClip());
        return;
      }

      if (lower.includes('duplicate') && lower.includes('clip')) {
        if (!selectedClip) {
          respond('Select a clip first, then ask me to duplicate it.');
          return;
        }
        perform('Duplicated selected clip.', () => duplicateSelectedClip());
        return;
      }

      if (lower.includes('copy') && lower.includes('clip')) {
        if (!selectedClip) {
          respond('Select a clip first, then ask me to copy it.');
          return;
        }
        perform('Copied selected clip to clipboard.', () => {
          copySelectedClipToClipboard();
        });
        return;
      }

      if (lower.includes('cut') && lower.includes('clip')) {
        if (!selectedClip) {
          respond('Select a clip first, then ask me to cut it.');
          return;
        }
        perform('Cut selected clip to clipboard.', () => {
          cutSelectedClipToClipboard();
        }, { destructive: true });
        return;
      }

      if (lower.includes('paste') && lower.includes('clip')) {
        if (!clipClipboard) {
          respond('Clipboard is empty. Copy or cut a clip first.');
          return;
        }
        perform('Pasted clip from clipboard.', () => {
          pasteClipFromClipboard();
        });
        return;
      }

      if (
        (lower.includes('delete') || lower.includes('remove')) &&
        (lower.includes('clip') || lower.includes('selected'))
      ) {
        if (!selectedClip && !selectedMusicBed && !selectedTitle) {
          respond('No timeline item is selected to delete.');
          return;
        }
        perform('Removed selected timeline item.', () => deleteCurrentSelection(), {
          destructive: true,
        });
        return;
      }

      if (lower.includes('disable') && lower.includes('clip')) {
        if (!selectedClip) {
          respond('Select a clip first, then ask me to disable it.');
          return;
        }
        perform(`Disabled "${selectedClip.title}".`, () => {
          updateSelectedClip((clip) => ({
            ...clip,
            enabled: false,
          }));
        });
        return;
      }

      if (lower.includes('enable') && lower.includes('clip')) {
        if (!selectedClip) {
          respond('Select a clip first, then ask me to enable it.');
          return;
        }
        perform(`Enabled "${selectedClip.title}".`, () => {
          updateSelectedClip((clip) => ({
            ...clip,
            enabled: true,
          }));
        });
        return;
      }

      if (lower.includes('add marker') || lower.startsWith('marker ')) {
        if (!timeline) {
          respond('Timeline is not ready yet.');
          return;
        }

        if (totalDuration <= 0) {
          respond('Timeline duration is empty. Add a clip first.');
          return;
        }

        const label =
          commandText
            .replace(/^add\s+marker\s*/i, '')
            .replace(/^marker\s*/i, '')
            .trim() || `Marker ${timeline.markers.length + 1}`;

        perform(`Added marker "${label}".`, () => {
          const markerTime = clamp(currentTime, 0, totalDuration);
          const color = MARKER_COLORS[timeline.markers.length % MARKER_COLORS.length] ?? '#52deff';
          commitTimeline((state) => ({
            ...state,
            markers: [...state.markers, { id: uid('marker'), label, time: markerTime, color }].sort(
              (a, b) => a.time - b.time
            ),
          }));
          setSelectedClipId(null);
          setSelectedMusicId(null);
          setSelectedTitleId(null);
        });
        return;
      }

      if (lower.includes('add title')) {
        const customText = commandText.replace(/^add\s+title\s*/i, '').trim();

        perform(`Added title overlay "${customText || 'New Title'}".`, () => {
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
                text: customText || `Title ${state.titleOverlays.length + 1}`,
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
        });
        return;
      }

      if (lower.includes('add music')) {
        perform('Added a music bed at the playhead.', () => addMusicBedAtPlayhead());
        return;
      }

      if (
        lower === 'set in' ||
        lower.includes('set in point') ||
        lower.includes('mark in') ||
        lower.includes('in point')
      ) {
        perform(`In point set at ${formatTime(currentTime)}.`, () => setInPoint());
        return;
      }

      if (
        lower === 'set out' ||
        lower.includes('set out point') ||
        lower.includes('mark out') ||
        lower.includes('out point')
      ) {
        perform(`Out point set at ${formatTime(currentTime)}.`, () => setOutPoint());
        return;
      }

      if (lower.includes('clear range') || lower.includes('clear in') || lower.includes('reset range')) {
        perform('Playback range cleared.', () => clearPlaybackRange());
        return;
      }

      if (lower.includes('loop on') || lower.includes('enable loop')) {
        perform('Loop playback enabled.', () => setLoopPlayback(true));
        return;
      }

      if (lower.includes('loop off') || lower.includes('disable loop')) {
        perform('Loop playback disabled.', () => setLoopPlayback(false));
        return;
      }

      if (lower.includes('toggle loop')) {
        perform('Loop playback toggled.', () => toggleLoopPlayback());
        return;
      }

      if (lower.includes('mute timeline') && !lower.includes('unmute')) {
        perform('Timeline muted.', () =>
          commitTimeline((state) => ({
            ...state,
            masterMuted: true,
          }))
        );
        return;
      }

      if (lower.includes('unmute timeline')) {
        perform('Timeline unmuted.', () =>
          commitTimeline((state) => ({
            ...state,
            masterMuted: false,
          }))
        );
        return;
      }

      if (lower.includes('snap on')) {
        perform('Snap turned on.', () =>
          commitTimeline((state) => ({
            ...state,
            snapEnabled: true,
          }))
        );
        return;
      }

      if (lower.includes('snap off')) {
        perform('Snap turned off.', () =>
          commitTimeline((state) => ({
            ...state,
            snapEnabled: false,
          }))
        );
        return;
      }

      if (lower.includes('show waveforms')) {
        perform('Waveforms enabled.', () =>
          commitTimeline((state) => ({
            ...state,
            showWaveforms: true,
          }))
        );
        return;
      }

      if (lower.includes('hide waveforms')) {
        perform('Waveforms hidden.', () =>
          commitTimeline((state) => ({
            ...state,
            showWaveforms: false,
          }))
        );
        return;
      }

      if (lower.includes('fit timeline')) {
        perform('Timeline fit to viewport.', () => fitTimelineToViewport());
        return;
      }

      if (lower.includes('undo')) {
        perform('Undo applied.', () => handleUndo());
        return;
      }

      if (lower.includes('redo')) {
        perform('Redo applied.', () => handleRedo());
        return;
      }

      if (lower.includes('zoom')) {
        const nextZoom = parseFirstNumber(lower);
        if (!nextZoom || nextZoom <= 0) {
          respond('Provide a zoom value, for example: "zoom 1.8".');
          return;
        }

        perform(`Zoom set to ${nextZoom.toFixed(2)}x.`, () => {
          setZoom(clamp(nextZoom, 0.25, 8));
        });
        return;
      }

      if (lower.includes('speed')) {
        if (!selectedClip) {
          respond('Select a clip first before changing speed.');
          return;
        }

        const speed = parseFirstNumber(lower);
        if (!speed || speed <= 0) {
          respond('Provide a speed value, for example: "speed 1.25".');
          return;
        }

        perform(`Clip speed set to ${speed.toFixed(2)}x.`, () => {
          updateSelectedClip((clip) => ({
            ...clip,
            playbackRate: clamp(Number(speed.toFixed(2)), 0.25, 3),
          }));
        });
        return;
      }

      if (lower.includes('seek') || lower.includes('jump') || lower.includes('go to')) {
        const timeMatch = commandText.match(
          /(?:seek|jump(?:\s+to)?|go\s+to)\s+([0-9:.]+\s*(?:m(?:in(?:ute)?s?)?|s(?:ec(?:ond)?s?)?)?)/i
        );
        const rawTime = timeMatch?.[1]?.trim();
        const parsed = rawTime ? parseTimeTextToSeconds(rawTime) : null;

        if (parsed === null || !Number.isFinite(parsed)) {
          respond('Provide a valid time, for example: "seek 1:20" or "jump to 45s".');
          return;
        }

        perform(`Moved playhead to ${formatTime(parsed)}.`, () => {
          seekTo(parsed, { disableSnap: true });
        });
        return;
      }

      if (lower.startsWith('find clip') || lower.startsWith('select clip')) {
        const query = commandText.replace(/^(find|select)\s+clip\s*/i, '').trim().toLowerCase();
        if (!query) {
          respond('Provide a clip name, for example: "find clip intro".');
          return;
        }

        const match = timelineClips.find((clip) => {
          const text = `${clip.title} ${clip.prompt}`.toLowerCase();
          return text.includes(query);
        });

        if (!match) {
          respond(`No clip matched "${query}".`);
          return;
        }

        const segment = segments.find((entry) => entry.clip.id === match.id);
        perform(`Selected clip "${match.title}".`, () => {
          setSelectedClipId(match.id);
          setSelectedMusicId(null);
          setSelectedTitleId(null);
          if (segment) {
            seekTo(segment.start, { disableSnap: true });
          }
        });
        return;
      }

      if (lower.includes('refresh clips')) {
        perform('Timeline refreshed from completed clips.', () => refreshFromProjectShots());
        return;
      }

      respond(
        'I could not map that command yet. Try "help" for examples or use one of the quick commands.'
      );
    },
    [
      addMusicBedAtPlayhead,
      agentAutoApply,
      agentSafeMode,
      appendAgentMessage,
      applyThemePreset,
      clearPlaybackRange,
      clipClipboard,
      commitTimeline,
      copySelectedClipToClipboard,
      currentTime,
      cutSelectedClipToClipboard,
      deleteCurrentSelection,
      duplicateSelectedClip,
      fitTimelineToViewport,
      handleRedo,
      handleUndo,
      pendingSafeCommand,
      pasteClipFromClipboard,
      refreshFromProjectShots,
      seekTo,
      selectedClip,
      selectedMusicBed,
      selectedTitle,
      segments,
      setInPoint,
      setOutPoint,
      splitSelectedClip,
      timeline,
      timelineClips,
      totalDuration,
      toggleLoopPlayback,
      trackStatus.byKind.titles.locked,
      updateSelectedClip,
    ]
  );

  const submitAgentInput = useCallback(() => {
    const trimmed = agentInput.trim();
    if (!trimmed) return;
    runAgentCommand(trimmed);
    setAgentInput('');
  }, [agentInput, runAgentCommand]);

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
      const clip = previewSegment?.clip;
      if (!video || !previewSegment || !clip || !clip.videoUrl || !clip.enabled || !trackStatus.videoVisible) {
        return;
      }
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
      const muted = Boolean(timeline?.masterMuted || clipTrackMuted || clip.muted || !clip.enabled);
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
    if (!video || !segment || !segment.clip.videoUrl || !segment.clip.enabled || !trackStatus.videoVisible) {
      return;
    }

    const elapsedSource = video.currentTime - segment.clip.trimStart;
    const elapsedTimeline = elapsedSource / segment.clip.playbackRate;
    const nextTimelineTime = clamp(segment.start + elapsedTimeline, segment.start, segment.end);

    setCurrentTime((previous) =>
      Math.abs(previous - nextTimelineTime) > 1 / 120 ? nextTimelineTime : previous
    );

    if (nextTimelineTime >= segment.end - 1 / 30) {
      const next = segment.end + 0.0001;
      if (next >= playbackEnd) {
        if (loopPlayback) {
          setCurrentTime(playbackStart);
        } else {
          setCurrentTime(playbackEnd);
          setIsPlaying(false);
        }
      } else {
        setCurrentTime(next);
      }
    }
  }, [isPlaying, previewSegment, trackStatus.videoVisible, playbackStart, playbackEnd, loopPlayback]);

  const handlePreviewEnded = useCallback(() => {
    if (!isPlaying) return;

    if (currentTime >= playbackEnd - 1 / 60) {
      if (loopPlayback) {
        setCurrentTime(playbackStart);
      } else {
        setCurrentTime(playbackEnd);
        setIsPlaying(false);
      }
      return;
    }

    setCurrentTime((previous) => Math.min(playbackEnd, previous + 0.001));
  }, [isPlaying, currentTime, playbackStart, playbackEnd, loopPlayback]);

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
        enabled: segment.clip.enabled,
        transition: {
          type: segment.clip.transitionType,
          durationSeconds: toFixedNumber(segment.clip.transitionDuration, 3),
        },
        audio: {
          muted:
            !segment.clip.enabled ||
            segment.clip.muted ||
            timeline.masterMuted ||
            !trackStatus.dialogueAudible ||
            trackStatus.byKind.dialogue.muted,
          clipVolume: toFixedNumber(segment.clip.audioVolume, 1),
          masterVolume: toFixedNumber(timeline.masterVolume, 1),
          effectiveVolumePercent:
            !segment.clip.enabled ||
            segment.clip.muted ||
            timeline.masterMuted ||
            !trackStatus.dialogueAudible
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
    if (!themeStorageKey) return;
    if (loadedThemeKeyRef.current === themeStorageKey) return;
    loadedThemeKeyRef.current = themeStorageKey;

    try {
      const raw = window.localStorage.getItem(themeStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (isTimelineThemeStoragePayload(parsed)) {
        setActiveThemeId(parsed.themeId);
        setModuleOverrides(parsed.moduleOverrides);
      }
    } catch {
      // Ignore malformed theme payloads and use defaults.
    }
  }, [themeStorageKey]);

  useEffect(() => {
    if (!themeStorageKey) return;
    const payload: TimelineThemeStoragePayload = {
      themeId: activeThemeId,
      moduleOverrides,
    };

    try {
      window.localStorage.setItem(themeStorageKey, JSON.stringify(payload));
    } catch {
      // Ignore localStorage write failures.
    }
  }, [themeStorageKey, activeThemeId, moduleOverrides]);

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
    setRangeStart((previous) => (previous === null ? null : clamp(previous, 0, totalDuration)));
    setRangeEnd((previous) => (previous === null ? null : clamp(previous, 0, totalDuration)));
  }, [totalDuration]);

  useEffect(() => {
    if (!playbackRange) return;
    setCurrentTime((previous) => clamp(previous, playbackRange.start, playbackRange.end));
  }, [playbackRange]);

  useEffect(() => {
    syncPreviewVideo(false);
  }, [syncPreviewVideo]);

  useEffect(() => {
    if (!isPlaying || playbackEnd <= playbackStart) return;
    if (canUsePreviewVideo) return;

    const timer = window.setInterval(() => {
      setCurrentTime((previous) => {
        const next = previous + PLAYBACK_TICK_SECONDS;
        if (next >= playbackEnd) {
          if (loopPlayback) {
            return playbackStart;
          }
          setIsPlaying(false);
          return playbackEnd;
        }
        return next;
      });
    }, PLAYBACK_TICK_MS);

    return () => window.clearInterval(timer);
  }, [isPlaying, playbackStart, playbackEnd, loopPlayback, canUsePreviewVideo]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayback();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copySelectedClipToClipboard();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'x') {
        event.preventDefault();
        cutSelectedClipToClipboard();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        pasteClipFromClipboard();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelectedClip();
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

      if (event.key.toLowerCase() === 'l') {
        event.preventDefault();
        toggleLoopPlayback();
        return;
      }

      if (event.key.toLowerCase() === 'i') {
        event.preventDefault();
        setInPoint();
        return;
      }

      if (event.key.toLowerCase() === 'o') {
        event.preventDefault();
        setOutPoint();
        return;
      }

      if (event.key.toLowerCase() === 'x') {
        event.preventDefault();
        clearPlaybackRange();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        splitSelectedClip();
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteCurrentSelection();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    addMarkerAtPlayhead,
    addTitleAtPlayhead,
    clearPlaybackRange,
    copySelectedClipToClipboard,
    currentTime,
    cutSelectedClipToClipboard,
    deleteCurrentSelection,
    duplicateSelectedClip,
    handleRedo,
    handleUndo,
    pasteClipFromClipboard,
    seekTo,
    setInPoint,
    setOutPoint,
    splitSelectedClip,
    toggleLoopPlayback,
    togglePlayback,
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

  const showInspectorColumn =
    visibleModules.inspector || visibleModules.trackMixer || visibleModules.audioPanel;
  const showAgentSidebar = visibleModules.chatSidebar;
  const leftColumnSpanClass =
    showInspectorColumn && showAgentSidebar
      ? 'xl:col-span-7'
      : showInspectorColumn || showAgentSidebar
        ? 'xl:col-span-8'
        : 'xl:col-span-12';
  const inspectorSpanClass = showAgentSidebar ? 'xl:col-span-3' : 'xl:col-span-4';
  const agentSpanClass = showInspectorColumn ? 'xl:col-span-2' : 'xl:col-span-4';

  return (
    <div className="animate-fade-in-up flex h-[calc(100vh-3.5rem)] flex-col space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <a
            href={`/projects/${params.id}`}
            className="text-vv-muted hover:text-vv-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.03]"
          >
            <ChevronLeft className="h-4 w-4" />
          </a>
          <div className="bg-accent/10 text-accent flex h-10 w-10 items-center justify-center rounded-lg">
            <Clapperboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{project.title} - Timeline</h1>
            <p className="text-vv-muted text-xs">
              {timelineClips.length} clips · {timeline?.musicBeds.length ?? 0} music ·{' '}
              {timeline?.titleOverlays.length ?? 0} titles · {formatTime(totalDuration)} total
              {disabledClipCount > 0 ? ` · ${disabledClipCount} disabled` : ''}
              {playbackRange
                ? ` · range ${formatTime(playbackRange.start)}-${formatTime(playbackRange.end)}`
                : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="vv-btn-ghost inline-flex items-center gap-1.5 px-3 disabled:cursor-not-allowed disabled:opacity-40"
            title="Undo (Ctrl/Cmd+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="vv-btn-ghost inline-flex items-center gap-1.5 px-3 disabled:cursor-not-allowed disabled:opacity-40"
            title="Redo (Ctrl/Cmd+Shift+Z)"
          >
            <Redo2 className="h-3.5 w-3.5" />
            Redo
          </button>
          <button
            onClick={toggleLoopPlayback}
            className={`vv-btn-ghost inline-flex items-center gap-1.5 px-3 ${loopPlayback ? 'text-accent' : ''}`}
            title={playbackRange ? 'Loop within In/Out range' : 'Loop full timeline'}
          >
            <Repeat className="h-3.5 w-3.5" />
            {playbackRange ? 'Loop Range' : 'Loop'}
          </button>
          <button
            onClick={fitTimelineToViewport}
            className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
            title="Fit full timeline to viewport"
          >
            <ScanLine className="h-3.5 w-3.5" />
            Fit
          </button>
          <label className="vv-btn-secondary inline-flex cursor-pointer items-center gap-1.5 px-3 py-2 text-xs">
            <Upload className="h-3.5 w-3.5" />
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
            className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
            title="Reset timeline from completed clips"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Clips
          </button>
          <button onClick={handleExport} className="vv-btn-primary inline-flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            Export EDL
          </button>
        </div>
      </div>

      <ThemeLayoutPanel
        activeTheme={activeTheme}
        activeThemeId={activeThemeId}
        themePresets={TIMELINE_THEME_PRESETS}
        moduleLabels={TIMELINE_MODULE_LABELS}
        visibleModules={visibleModules}
        showModuleEditor={showModuleEditor}
        onThemeChange={applyThemePreset}
        onToggleModuleEditor={() => setShowModuleEditor((open) => !open)}
        onResetThemeLayout={() => applyThemePreset(activeThemeId)}
        onToggleModuleVisibility={toggleModuleVisibility}
      />

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-12">
        <div className={`flex min-h-0 flex-col gap-3 ${leftColumnSpanClass}`}>
          {visibleModules.preview && (
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
            ) : previewClip && !previewClip.enabled ? (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(148,163,184,0.22),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(100,116,139,0.18),transparent_44%)] p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-vv-muted">
                    Disabled Clip
                  </div>
                  <p className="text-sm font-semibold text-vv-primary">{previewClip.title}</p>
                  <p className="text-vv-muted mt-2 max-w-md text-xs leading-relaxed">
                    This clip is disabled in the timeline and will be skipped in preview/export output.
                  </p>
                </div>
              </div>
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
          )}

          {visibleModules.timelineControls && (
            <div className="vv-card space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => seekTo(playbackRange?.start ?? 0, { disableSnap: true })}
                className="vv-btn-ghost inline-flex items-center gap-1.5 px-3 py-2 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {playbackRange ? 'In' : 'Start'}
              </button>
              <button
                onClick={togglePlayback}
                className="bg-accent/10 text-accent hover:bg-accent/20 flex h-9 w-9 items-center justify-center rounded-lg transition-all"
                title="Play / Pause"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => seekTo(playbackRange?.end ?? totalDuration, { disableSnap: true })}
                className="vv-btn-ghost inline-flex items-center gap-1.5 px-3 py-2 text-xs"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                {playbackRange ? 'Out' : 'End'}
              </button>
              <div className="text-vv-muted ml-2 font-mono text-xs">
                {formatTime(currentTime)}
                {playbackRange ? ` (${formatTime(playbackRange.start)}-${formatTime(playbackRange.end)})` : ''}
              </div>

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
                className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                disabled={totalDuration <= 0}
              >
                <Flag className="h-3.5 w-3.5" />
                Add Marker (M)
              </button>
              <button
                onClick={addMusicBedAtPlayhead}
                className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                disabled={trackStatus.byKind.music.locked}
              >
                <Music2 className="h-3.5 w-3.5" />
                Add Music
              </button>
              <button
                onClick={addTitleAtPlayhead}
                className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                disabled={trackStatus.byKind.titles.locked}
              >
                <Type className="h-3.5 w-3.5" />
                Add Title (T)
              </button>
              <button
                onClick={splitSelectedClip}
                className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                disabled={!selectedClip || trackStatus.byKind.video.locked}
              >
                <Scissors className="h-3.5 w-3.5" />
                Split Selected
              </button>
              <button
                onClick={copySelectedClipToClipboard}
                className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                disabled={!selectedClip}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
              <button
                onClick={cutSelectedClipToClipboard}
                className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                disabled={!selectedClip || trackStatus.byKind.video.locked}
              >
                <ClipboardX className="h-3.5 w-3.5" />
                Cut
              </button>
              <button
                onClick={pasteClipFromClipboard}
                className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                disabled={!clipClipboard || trackStatus.byKind.video.locked}
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                Paste
              </button>
              <button
                onClick={deleteCurrentSelection}
                className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                disabled={!selectedClip && !selectedMusicBed && !selectedTitle}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
              <button onClick={setInPoint} className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                Set In (I)
              </button>
              <button onClick={setOutPoint} className="vv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs">
                <ArrowRight className="h-3.5 w-3.5" />
                Set Out (O)
              </button>
              <button
                onClick={clearPlaybackRange}
                className="vv-btn-ghost inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                disabled={!playbackRange}
              >
                <ClipboardX className="h-3.5 w-3.5" />
                Clear Range
              </button>
              <button
                onClick={() =>
                  commitTimeline((state) => ({
                    ...state,
                    snapEnabled: !state.snapEnabled,
                  }))
                }
                className={`vv-btn-ghost inline-flex items-center gap-1.5 px-3 py-2 text-xs ${
                  timeline?.snapEnabled ? 'text-accent' : ''
                }`}
              >
                <Magnet className="h-3.5 w-3.5" />
                Snap {timeline?.snapEnabled ? 'On' : 'Off'}
              </button>
            </div>

            {clipClipboard && (
              <p className="text-vv-muted text-[11px]">
                Clipboard ({clipClipboard.mode}):{' '}
                <span className="font-mono">{clipClipboard.clip.title}</span>
              </p>
            )}

            <p className="text-vv-muted text-[11px]">
              Shortcuts: Space play/pause, Arrow Left/Right nudge, I/O set range, X clear range, M
              marker, T title, L loop, Ctrl/Cmd+C copy, Ctrl/Cmd+X cut, Ctrl/Cmd+V paste,
              Delete remove selection, Ctrl/Cmd+Shift+S split, Ctrl/Cmd+Z undo.
            </p>
            </div>
          )}

          {!visibleModules.preview && !visibleModules.timelineControls && (
            <div className="vv-card flex min-h-[160px] items-center justify-center text-sm text-vv-muted">
              Enable `Preview` or `Transport` modules to show editor controls in this theme.
            </div>
          )}
        </div>

        {showInspectorColumn && (
          <TimelineInspectorPanel
            containerSpanClass={inspectorSpanClass}
            visibleInspector={visibleModules.inspector}
            visibleTrackMixer={visibleModules.trackMixer}
            visibleAudioPanel={visibleModules.audioPanel}
            selectedClip={selectedClip}
            selectedSegment={selectedSegment}
            selectedMusicBed={selectedMusicBed}
            selectedTitle={selectedTitle}
            totalDuration={totalDuration}
            minClipSpanSeconds={MIN_CLIP_SPAN_SECONDS}
            minItemDurationSeconds={MIN_ITEM_DURATION_SECONDS}
            speedOptions={SPEED_OPTIONS}
            clipColorClasses={CLIP_COLOR_CLASSES}
            trackRows={trackRows}
            trackStatus={trackStatus}
            timeline={timeline}
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
            updateTrack={updateTrack}
            commitTimeline={commitTimeline}
            playbackRange={playbackRange}
            onSetRangeFromSelectedClip={setPlaybackRangeToSelectedClip}
            onClearPlaybackRange={clearPlaybackRange}
          />
        )}

        {showAgentSidebar && (
          <AgentSidebar
            agentMessages={agentMessages}
            agentAutoApply={agentAutoApply}
            agentSafeMode={agentSafeMode}
            pendingSafeCommand={pendingSafeCommand}
            quickCommands={AGENT_QUICK_COMMANDS}
            onClearHistory={() => setAgentMessages((messages) => messages.slice(-1))}
            onToggleAutoApply={() => setAgentAutoApply((value) => !value)}
            onToggleSafeMode={() => setAgentSafeMode((value) => !value)}
            onRunCommand={runAgentCommand}
            formatMessageTime={formatAgentMessageTime}
            containerSpanClass={agentSpanClass}
          />
        )}
      </div>

      {visibleModules.timelineTracks && (
        <TimelineTrackCanvas
          timeline={timeline}
          timelineClips={timelineClips}
          totalDuration={totalDuration}
          formatTime={formatTime}
          trackRows={trackRows}
          trackStatus={trackStatus}
          updateTrack={updateTrack}
          trackWidth={trackWidth}
          timelineViewportRef={timelineViewportRef}
          rulerTicks={rulerTicks}
          seekFromEvent={seekFromEvent}
          seekToTime={(seconds) => seekTo(seconds, { disableSnap: true })}
          onMarkerSelect={(seconds) => {
            seekTo(seconds, { disableSnap: true });
            setSelectedClipId(null);
            setSelectedMusicId(null);
            setSelectedTitleId(null);
          }}
          onClearSelections={() => {
            setSelectedClipId(null);
            setSelectedMusicId(null);
            setSelectedTitleId(null);
          }}
          playheadLeft={playheadLeft}
          onTrackDragOver={handleTrackDragOver}
          onTrackDrop={handleTrackDrop}
          onTrackDragLeave={() => {
            if (dragState) {
              setDragState((previous) =>
                previous ? { ...previous, targetId: null, position: 'end' } : previous
              );
            }
          }}
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
          showMarkers={visibleModules.markers}
          onRemoveMarker={removeMarker}
          playbackRange={playbackRange}
          onSetRangeIn={setInPoint}
          onSetRangeOut={setOutPoint}
          onClearRange={clearPlaybackRange}
        />
      )}

      {visibleModules.chatBar && (
        <AgentChatBar
          agentInput={agentInput}
          agentAutoApply={agentAutoApply}
          quickCommands={AGENT_QUICK_COMMANDS}
          onInputChange={setAgentInput}
          onSubmit={submitAgentInput}
          onRunCommand={runAgentCommand}
        />
      )}
    </div>
  );
}
