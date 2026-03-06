import {
  Eye,
  EyeOff,
  LayoutDashboard,
  Monitor,
  PanelLeft,
  PanelRight,
  Pin,
  PinOff,
  RotateCcw,
  Rows3,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  TimelineColumnPreset,
  TimelineDensityMode,
  TimelineUiPreferences,
} from './timeline-editor-types';

interface TimelineWorkspaceToolbarProps {
  preferences: TimelineUiPreferences;
  availablePanels: {
    preview: boolean;
    transport: boolean;
    tracks: boolean;
    inspector: boolean;
    agent: boolean;
  };
  onDensityChange: (density: TimelineDensityMode) => void;
  onColumnPresetChange: (preset: TimelineColumnPreset) => void;
  onTogglePreview: () => void;
  onToggleTransport: () => void;
  onToggleTracks: () => void;
  onToggleInspector: () => void;
  onToggleAgent: () => void;
  onToggleDockTransport: () => void;
  onReset: () => void;
}

const DENSITY_OPTIONS: Array<{ id: TimelineDensityMode; label: string }> = [
  { id: 'compact', label: 'Compact' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'spacious', label: 'Spacious' },
];

const PRESET_OPTIONS: Array<{ id: TimelineColumnPreset; label: string }> = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'timeline-focus', label: 'Timeline Focus' },
  { id: 'inspector-focus', label: 'Inspector Focus' },
];

export function TimelineWorkspaceToolbar({
  preferences,
  availablePanels,
  onDensityChange,
  onColumnPresetChange,
  onTogglePreview,
  onToggleTransport,
  onToggleTracks,
  onToggleInspector,
  onToggleAgent,
  onToggleDockTransport,
  onReset,
}: TimelineWorkspaceToolbarProps) {
  return (
    <div className="vv-card shrink-0 space-y-3" role="region" aria-label="Workspace layout controls">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="text-vv-primary text-sm font-semibold">Workspace Layout</p>
          <p className="text-vv-secondary text-[11px]">
            Optimized around common editor patterns where timeline content keeps the largest focus.
          </p>
        </div>
        <button
          onClick={onReset}
          className="vv-btn-ghost ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          title="Reset layout preferences"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Layout
        </button>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <p className="text-vv-muted mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
            <Rows3 className="h-3 w-3" />
            Density
          </p>
          <div className="flex flex-wrap gap-1">
            {DENSITY_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => onDensityChange(option.id)}
                aria-pressed={preferences.density === option.id}
                className={`rounded-md border px-2 py-1 text-xs ${
                  preferences.density === option.id
                    ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-100'
                    : 'border-white/15 text-vv-secondary hover:text-vv-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <p className="text-vv-muted mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
            <LayoutDashboard className="h-3 w-3" />
            Columns
          </p>
          <div className="flex flex-wrap gap-1">
            {PRESET_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => onColumnPresetChange(option.id)}
                aria-pressed={preferences.columnPreset === option.id}
                className={`rounded-md border px-2 py-1 text-xs ${
                  preferences.columnPreset === option.id
                    ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-100'
                    : 'border-white/15 text-vv-secondary hover:text-vv-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-2 pr-1">
          {availablePanels.preview && (
            <button
              onClick={onTogglePreview}
              aria-pressed={!preferences.previewCollapsed}
              className="vv-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              {preferences.previewCollapsed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {preferences.previewCollapsed ? 'Show Preview' : 'Hide Preview'}
            </button>
          )}
          {availablePanels.transport && (
            <button
              onClick={onToggleTransport}
              aria-pressed={!preferences.transportCollapsed}
              className="vv-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {preferences.transportCollapsed ? 'Show Transport' : 'Hide Transport'}
            </button>
          )}
          {availablePanels.tracks && (
            <button
              onClick={onToggleTracks}
              aria-pressed={!preferences.tracksCollapsed}
              className="vv-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <Monitor className="h-3.5 w-3.5" />
              {preferences.tracksCollapsed ? 'Show Tracks' : 'Hide Tracks'}
            </button>
          )}
          {availablePanels.inspector && (
            <button
              onClick={onToggleInspector}
              aria-pressed={!preferences.inspectorCollapsed}
              className="vv-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <PanelRight className="h-3.5 w-3.5" />
              {preferences.inspectorCollapsed ? 'Show Inspector' : 'Hide Inspector'}
            </button>
          )}
          {availablePanels.agent && (
            <button
              onClick={onToggleAgent}
              aria-pressed={!preferences.agentCollapsed}
              className="vv-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <PanelLeft className="h-3.5 w-3.5" />
              {preferences.agentCollapsed ? 'Show Agent Panel' : 'Hide Agent Panel'}
            </button>
          )}
          {availablePanels.transport && (
            <button
              onClick={onToggleDockTransport}
              aria-pressed={preferences.dockTransport}
              className={`vv-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs ${
                preferences.dockTransport ? 'text-accent' : ''
              }`}
            >
              {preferences.dockTransport ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
              {preferences.dockTransport ? 'Transport Docked' : 'Dock Transport'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
