/* Timeline editor constants – FCP-style fixed layout (no theme system) */

export const TIMELINE_STORAGE_PREFIX = 'videoviber-timeline-';

export const TOOL_MODES = ['select', 'blade'] as const;
export type ToolMode = (typeof TOOL_MODES)[number];

export const KEYBOARD_SHORTCUT_LABELS: Record<string, string> = {
  'Space': 'Play / Pause',
  'A': 'Select tool',
  'B': 'Blade tool',
  'I': 'Set In point',
  'O': 'Set Out point',
  'X': 'Clear range',
  'M': 'Add marker',
  'T': 'Add title',
  'L': 'Toggle loop',
  '←/→': 'Nudge playhead',
  '⌘Z': 'Undo',
  '⇧⌘Z': 'Redo',
  '⌘C': 'Copy clip',
  '⌘X': 'Cut clip',
  '⌘V': 'Paste clip',
  '⌘D': 'Duplicate clip',
  '⇧⌘S': 'Split clip',
  'Del': 'Delete selection',
};
