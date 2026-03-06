import { LayoutGrid, RotateCcw } from 'lucide-react';
import type {
  TimelineModuleFlags,
  TimelineModuleKey,
  TimelineThemeId,
  TimelineThemePreset,
} from './timeline-editor-types';

interface ThemeLayoutPanelProps {
  activeTheme: TimelineThemePreset;
  activeThemeId: TimelineThemeId;
  themePresets: TimelineThemePreset[];
  moduleLabels: Record<TimelineModuleKey, string>;
  visibleModules: TimelineModuleFlags;
  showModuleEditor: boolean;
  onThemeChange: (themeId: TimelineThemeId) => void;
  onToggleModuleEditor: () => void;
  onResetThemeLayout: () => void;
  onToggleModuleVisibility: (key: TimelineModuleKey) => void;
}

export function ThemeLayoutPanel({
  activeTheme,
  activeThemeId,
  themePresets,
  moduleLabels,
  visibleModules,
  showModuleEditor,
  onThemeChange,
  onToggleModuleEditor,
  onResetThemeLayout,
  onToggleModuleVisibility,
}: ThemeLayoutPanelProps) {
  return (
    <div className="vv-card shrink-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-accent rounded-full border border-cyan-200/30 bg-cyan-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
          {activeTheme.name}
        </span>
        <span className="text-vv-muted text-xs">{activeTheme.summary}</span>
        <button
          onClick={onToggleModuleEditor}
          className={`vv-btn-ghost ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs ${
            showModuleEditor ? 'text-accent' : ''
          }`}
          title="Toggle module visibility editor"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Modules
        </button>
        <button
          onClick={onResetThemeLayout}
          className="vv-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          title="Reset module overrides for this theme"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Theme Layout
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-vv-muted text-[10px] font-semibold uppercase tracking-wider">Theme</span>
        <select
          value={activeThemeId}
          onChange={(event) => onThemeChange(event.target.value as TimelineThemeId)}
          className="vv-input h-8 py-1 text-xs"
        >
          {themePresets.map((theme) => (
            <option key={theme.id} value={theme.id} className="bg-[#0a1220] text-white">
              {theme.name}
            </option>
          ))}
        </select>
      </div>

      {showModuleEditor && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(moduleLabels) as TimelineModuleKey[]).map((moduleKey) => (
            <button
              key={moduleKey}
              onClick={() => onToggleModuleVisibility(moduleKey)}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all ${
                visibleModules[moduleKey]
                  ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100'
                  : 'border-white/15 bg-white/[0.02] text-vv-muted hover:text-vv-primary'
              }`}
            >
              <span>{moduleLabels[moduleKey]}</span>
              <span>{visibleModules[moduleKey] ? 'On' : 'Off'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
