import type { Shot } from '@/app/store';

export type TransitionType = 'cut' | 'dissolve' | 'fade' | 'wipe';
export type ClipColor = 'cyan' | 'amber' | 'rose' | 'emerald' | 'slate';
export type TrackKind = 'video' | 'dialogue' | 'music' | 'titles';
export type TitleStyle = 'title' | 'lower-third' | 'caption';

export interface TimelineClip {
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
  enabled: boolean;
  color: ClipColor;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  status: Shot['status'];
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

export interface TimelineTrack {
  id: string;
  kind: TrackKind;
  name: string;
  locked: boolean;
  muted: boolean;
  solo: boolean;
}

export interface MusicBed {
  id: string;
  title: string;
  start: number;
  duration: number;
  volume: number;
  muted: boolean;
  loop: boolean;
  color: ClipColor;
}

export interface TitleOverlay {
  id: string;
  text: string;
  start: number;
  duration: number;
  style: TitleStyle;
  color: string;
  enabled: boolean;
}

export interface TimelineState {
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

export interface HistoryState {
  entries: TimelineState[];
  index: number;
}

export interface TimelineSegment {
  clip: TimelineClip;
  start: number;
  end: number;
  duration: number;
}

export interface DragState {
  sourceId: string;
  targetId: string | null;
  position: 'before' | 'after' | 'end';
}

export interface TimelineViewportState {
  scrollLeft: number;
  width: number;
}

export interface TimelineTrackRow {
  kind: TrackKind;
  short: string;
  description: string;
  heightClass: string;
}

export interface TimelineTrackStatus {
  tracks: TimelineTrack[];
  byKind: Record<TrackKind, TimelineTrack>;
  hasSolo: boolean;
  videoVisible: boolean;
  dialogueAudible: boolean;
  musicAudible: boolean;
  titlesVisible: boolean;
}

export type ClipColorClasses = Record<
  ClipColor,
  {
    idle: string;
    active: string;
    accent: string;
  }
>;
