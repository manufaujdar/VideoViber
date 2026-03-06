import type {
  AgentQuickCommand,
  TimelineModuleKey,
  TimelineThemeId,
  TimelineThemePreset,
} from './timeline-editor-types';

export const TIMELINE_THEME_STORAGE_PREFIX = 'videoviber-theme-v2-';
export const CHAT_HISTORY_LIMIT = 180;

export const TIMELINE_MODULE_LABELS: Record<TimelineModuleKey, string> = {
  preview: 'Preview',
  timelineControls: 'Transport',
  inspector: 'Inspector',
  trackMixer: 'Track Mixer',
  audioPanel: 'Master Audio',
  timelineTracks: 'Timeline Tracks',
  markers: 'Markers',
  chatSidebar: 'Chat Sidebar',
  chatBar: 'Bottom Chat Bar',
};

export const TIMELINE_THEME_PRESETS: TimelineThemePreset[] = [
  {
    id: 'minimal-chat',
    name: 'Minimal Chat Cut',
    summary: 'Only preview, timeline tracks, and command chat.',
    modules: {
      preview: true,
      timelineControls: false,
      inspector: false,
      trackMixer: false,
      audioPanel: false,
      timelineTracks: true,
      markers: false,
      chatSidebar: false,
      chatBar: true,
    },
  },
  {
    id: 'advanced-studio',
    name: 'Advanced Timeline Studio',
    summary: 'Full editor with inspector, mixer, markers, and agent panel.',
    modules: {
      preview: true,
      timelineControls: true,
      inspector: true,
      trackMixer: true,
      audioPanel: true,
      timelineTracks: true,
      markers: true,
      chatSidebar: true,
      chatBar: true,
    },
  },
  {
    id: 'storyboard-director',
    name: 'Storyboard Director',
    summary: 'Story-focused layout with titles, markers, and agent guidance.',
    modules: {
      preview: true,
      timelineControls: true,
      inspector: true,
      trackMixer: false,
      audioPanel: false,
      timelineTracks: true,
      markers: true,
      chatSidebar: true,
      chatBar: true,
    },
  },
  {
    id: 'audio-mix',
    name: 'Audio Mix Session',
    summary: 'Prioritizes dialogue/music balancing and track controls.',
    modules: {
      preview: true,
      timelineControls: true,
      inspector: true,
      trackMixer: true,
      audioPanel: true,
      timelineTracks: true,
      markers: false,
      chatSidebar: true,
      chatBar: true,
    },
  },
  {
    id: 'review-focus',
    name: 'Review Focus',
    summary: 'Lean review mode with timeline + notes + chat history.',
    modules: {
      preview: true,
      timelineControls: true,
      inspector: false,
      trackMixer: false,
      audioPanel: false,
      timelineTracks: true,
      markers: true,
      chatSidebar: true,
      chatBar: true,
    },
  },
];

export const TIMELINE_THEME_BY_ID = Object.fromEntries(
  TIMELINE_THEME_PRESETS.map((theme) => [theme.id, theme])
) as Record<TimelineThemeId, TimelineThemePreset>;

export const AGENT_QUICK_COMMANDS: AgentQuickCommand[] = [
  { label: 'Split selected clip', command: 'split selected clip' },
  { label: 'Add marker', command: 'add marker beat' },
  { label: 'Add title', command: 'add title Opening Card' },
  { label: 'Add music bed', command: 'add music bed' },
  { label: 'Mute timeline', command: 'mute timeline' },
  { label: 'Theme: Minimal', command: 'theme minimal' },
  { label: 'Theme: Advanced', command: 'theme advanced' },
  { label: 'Fit timeline', command: 'fit timeline' },
];
