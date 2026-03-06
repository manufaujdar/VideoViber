export type TimelineThemeId =
  | 'minimal-chat'
  | 'advanced-studio'
  | 'storyboard-director'
  | 'audio-mix'
  | 'review-focus'
  | 'assistant-cut'
  | 'finishing-suite';

export type TimelineModuleKey =
  | 'preview'
  | 'timelineControls'
  | 'inspector'
  | 'trackMixer'
  | 'audioPanel'
  | 'timelineTracks'
  | 'markers'
  | 'chatSidebar'
  | 'chatBar';

export type TimelineModuleFlags = Record<TimelineModuleKey, boolean>;

export interface TimelineThemePreset {
  id: TimelineThemeId;
  name: string;
  summary: string;
  modules: TimelineModuleFlags;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface TimelineThemeStoragePayload {
  themeId: TimelineThemeId;
  moduleOverrides: Partial<TimelineModuleFlags>;
}

export interface AgentQuickCommand {
  label: string;
  command: string;
}
