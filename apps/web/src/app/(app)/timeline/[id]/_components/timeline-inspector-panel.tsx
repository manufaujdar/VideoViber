'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Copy,
  Repeat,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  ClipColor,
  ClipColorClasses,
  MusicBed,
  TimelineClip,
  TimelineSegment,
  TitleOverlay,
  TitleStyle,
  TransitionType,
} from './timeline-editor-domain';

/* ── Collapsible Section ── */
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#2a2a2a]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#8e8e93] hover:text-[#b0b0b0]"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{children}</div>}
    </div>
  );
}

function LabelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-[#8e8e93]">{label}</span>
      <span className="font-mono text-[#e5e5e5]">{value}</span>
    </div>
  );
}

/* ── Props ── */
interface TimelineInspectorPanelProps {
  selectedClip: TimelineClip | null;
  selectedSegment: TimelineSegment | null;
  selectedMusicBed: MusicBed | null;
  selectedTitle: TitleOverlay | null;
  totalDuration: number;
  minClipSpanSeconds: number;
  minItemDurationSeconds: number;
  speedOptions: readonly number[];
  clipColorClasses: ClipColorClasses;
  formatTime: (seconds: number) => string;
  getClipDuration: (clip: TimelineClip) => number;
  toFixedNumber: (value: number, decimals?: number) => number;
  clamp: (value: number, min: number, max: number) => number;
  clampTrimStart: (clip: TimelineClip, nextStart: number) => number;
  clampTrimEnd: (clip: TimelineClip, nextEnd: number) => number;
  updateSelectedClip: (updater: (clip: TimelineClip) => TimelineClip) => void;
  updateSelectedMusicBed: (updater: (item: MusicBed) => MusicBed) => void;
  updateSelectedTitle: (updater: (item: TitleOverlay) => TitleOverlay) => void;
  moveSelectedClip: (direction: -1 | 1) => void;
  duplicateSelectedClip: () => void;
  deleteSelectedClip: () => void;
  removeSelectedMusicBed: () => void;
  removeSelectedTitle: () => void;
  playbackRange: { start: number; end: number } | null;
  onSetRangeFromSelectedClip: () => void;
  onClearPlaybackRange: () => void;
}

export function TimelineInspectorPanel({
  selectedClip,
  selectedSegment,
  selectedMusicBed,
  selectedTitle,
  totalDuration,
  minClipSpanSeconds,
  minItemDurationSeconds,
  speedOptions,
  clipColorClasses,
  formatTime,
  getClipDuration,
  toFixedNumber,
  clamp,
  clampTrimStart,
  clampTrimEnd,
  updateSelectedClip,
  updateSelectedMusicBed,
  updateSelectedTitle,
  moveSelectedClip,
  duplicateSelectedClip,
  deleteSelectedClip,
  removeSelectedMusicBed,
  removeSelectedTitle,
  playbackRange,
  onSetRangeFromSelectedClip,
  onClearPlaybackRange,
}: TimelineInspectorPanelProps) {
  const sliderClass =
    'w-full h-1 appearance-none rounded bg-[#333] cursor-pointer accent-[#0a84ff] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0a84ff]';
  const inputClass =
    'w-full rounded-md border border-[#333] bg-[#1a1a1a] px-2 py-1.5 text-[11px] text-[#e5e5e5] outline-none focus:border-[#0a84ff]/50';
  const btnSmall =
    'rounded border border-[#333] bg-[#222] px-2 py-1 text-[10px] text-[#b0b0b0] hover:border-[#444] hover:text-white transition-colors';
  const btnDanger =
    'inline-flex items-center gap-1 rounded border border-[#ff3b30]/30 bg-[#ff3b30]/10 px-2 py-1 text-[10px] font-medium text-[#ff6961] hover:bg-[#ff3b30]/20';

  /* ── Clip Inspector ── */
  if (selectedClip) {
    return (
      <div className="h-full overflow-y-auto bg-[#1e1e1e]">
        <div className="border-b border-[#2a2a2a] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8e8e93]">
            Inspector
          </p>
        </div>

        <Section title="Clip Info">
          <input
            value={selectedClip.title}
            onChange={(e) =>
              updateSelectedClip((clip) => ({ ...clip, title: e.target.value }))
            }
            className={inputClass}
          />
          <p className="text-[10px] leading-relaxed text-[#666]">{selectedClip.prompt}</p>
          <LabelRow label="Provider" value={selectedClip.provider} />
          <LabelRow label="Source" value={formatTime(selectedClip.sourceDuration)} />
          <LabelRow label="Timeline" value={formatTime(getClipDuration(selectedClip))} />
          {selectedSegment && (
            <>
              <LabelRow label="In" value={formatTime(selectedSegment.start)} />
              <LabelRow label="Out" value={formatTime(selectedSegment.end)} />
            </>
          )}
        </Section>

        <Section title="Timing">
          <LabelRow label="Trim Start" value={formatTime(selectedClip.trimStart)} />
          <input
            type="range"
            min={0}
            max={Math.max(0, selectedClip.trimEnd - minClipSpanSeconds)}
            step={0.05}
            value={selectedClip.trimStart}
            onChange={(e) =>
              updateSelectedClip((clip) => ({
                ...clip,
                trimStart: toFixedNumber(clampTrimStart(clip, Number(e.target.value)), 3),
              }))
            }
            className={sliderClass}
          />

          <LabelRow label="Trim End" value={formatTime(selectedClip.trimEnd)} />
          <input
            type="range"
            min={Math.min(
              selectedClip.sourceDuration,
              selectedClip.trimStart + minClipSpanSeconds
            )}
            max={selectedClip.sourceDuration}
            step={0.05}
            value={selectedClip.trimEnd}
            onChange={(e) =>
              updateSelectedClip((clip) => ({
                ...clip,
                trimEnd: toFixedNumber(clampTrimEnd(clip, Number(e.target.value)), 3),
              }))
            }
            className={sliderClass}
          />
        </Section>

        <Section title="Speed">
          <LabelRow label="Rate" value={`${selectedClip.playbackRate.toFixed(2)}x`} />
          <div className="flex flex-wrap gap-1">
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() =>
                  updateSelectedClip((clip) => ({ ...clip, playbackRate: speed }))
                }
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  selectedClip.playbackRate === speed
                    ? 'bg-[#0a84ff]/20 text-[#0a84ff]'
                    : 'bg-[#222] text-[#8e8e93] hover:text-white'
                }`}
              >
                {speed.toFixed(2)}x
              </button>
            ))}
          </div>
        </Section>

        <Section title="Transition & Audio">
          <div className="flex flex-wrap gap-1">
            {(['cut', 'dissolve', 'fade', 'wipe'] as TransitionType[]).map((t) => (
              <button
                key={t}
                onClick={() =>
                  updateSelectedClip((clip) => ({
                    ...clip,
                    transitionType: t,
                    transitionDuration: t === 'cut' ? 0 : Math.max(clip.transitionDuration, 0.2),
                  }))
                }
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                  selectedClip.transitionType === t
                    ? 'bg-[#0a84ff]/20 text-[#0a84ff]'
                    : 'bg-[#222] text-[#8e8e93] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {selectedClip.transitionType !== 'cut' && (
            <>
              <LabelRow
                label="Transition Duration"
                value={`${selectedClip.transitionDuration.toFixed(1)}s`}
              />
              <input
                type="range"
                min={0.2}
                max={1.5}
                step={0.1}
                value={selectedClip.transitionDuration}
                onChange={(e) =>
                  updateSelectedClip((clip) => ({
                    ...clip,
                    transitionDuration: Number(e.target.value),
                  }))
                }
                className={sliderClass}
              />
            </>
          )}

          <LabelRow label="Volume" value={`${Math.round(selectedClip.audioVolume)}%`} />
          <input
            type="range"
            min={0}
            max={150}
            step={1}
            value={selectedClip.audioVolume}
            onChange={(e) =>
              updateSelectedClip((clip) => ({
                ...clip,
                audioVolume: Number(e.target.value),
              }))
            }
            className={sliderClass}
          />
          <button
            onClick={() =>
              updateSelectedClip((clip) => ({ ...clip, muted: !clip.muted }))
            }
            className={`${btnSmall} w-full ${selectedClip.muted ? 'text-[#0a84ff]' : ''}`}
          >
            {selectedClip.muted ? 'Unmute Clip' : 'Mute Clip'}
          </button>
        </Section>

        <Section title="Appearance">
          <button
            onClick={() =>
              updateSelectedClip((clip) => ({ ...clip, enabled: !clip.enabled }))
            }
            className={`${btnSmall} w-full`}
          >
            {selectedClip.enabled ? '● Enabled' : '○ Disabled'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8e8e93]">Color</span>
            <div className="ml-auto flex gap-1">
              {(Object.keys(clipColorClasses) as ClipColor[]).map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    updateSelectedClip((clip) => ({ ...clip, color }))
                  }
                  className={`h-4 w-4 rounded-full border transition-all ${
                    selectedClip.color === color
                      ? 'scale-110 border-white/80'
                      : 'border-[#444] hover:border-white/50'
                  } ${clipColorClasses[color].accent}`}
                  title={color}
                />
              ))}
            </div>
          </div>
        </Section>

        <Section title="Actions" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-1">
            <button onClick={() => moveSelectedClip(-1)} className={btnSmall}>
              <ArrowLeft className="mr-1 inline h-3 w-3" />Left
            </button>
            <button onClick={() => moveSelectedClip(1)} className={btnSmall}>
              Right<ArrowRight className="ml-1 inline h-3 w-3" />
            </button>
            <button onClick={duplicateSelectedClip} className={btnSmall}>
              <Copy className="mr-1 inline h-3 w-3" />Duplicate
            </button>
            <button onClick={deleteSelectedClip} className={btnDanger}>
              <Trash2 className="h-3 w-3" />Delete
            </button>
          </div>
          <div className="flex gap-1">
            <button onClick={onSetRangeFromSelectedClip} className={btnSmall}>
              Range = Clip
            </button>
            <button onClick={onClearPlaybackRange} className={btnSmall}>
              Clear Range
            </button>
          </div>
        </Section>
      </div>
    );
  }

  /* ── Music Bed Inspector ── */
  if (selectedMusicBed) {
    return (
      <div className="h-full overflow-y-auto bg-[#1e1e1e]">
        <div className="border-b border-[#2a2a2a] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8e8e93]">
            Inspector — Music Bed
          </p>
        </div>
        <Section title="Details">
          <input
            value={selectedMusicBed.title}
            onChange={(e) =>
              updateSelectedMusicBed((item) => ({ ...item, title: e.target.value }))
            }
            className={inputClass}
          />
          <LabelRow label="Start" value={formatTime(selectedMusicBed.start)} />
          <input
            type="range"
            min={0}
            max={Math.max(0, totalDuration)}
            step={0.1}
            value={selectedMusicBed.start}
            onChange={(e) =>
              updateSelectedMusicBed((item) => ({
                ...item,
                start: toFixedNumber(Number(e.target.value), 3),
              }))
            }
            className={sliderClass}
          />
          <LabelRow label="Duration" value={formatTime(selectedMusicBed.duration)} />
          <input
            type="range"
            min={minItemDurationSeconds}
            max={Math.max(minItemDurationSeconds, Math.max(totalDuration, 10))}
            step={0.1}
            value={selectedMusicBed.duration}
            onChange={(e) =>
              updateSelectedMusicBed((item) => ({
                ...item,
                duration: clamp(
                  Number(e.target.value),
                  minItemDurationSeconds,
                  Math.max(totalDuration, 10)
                ),
              }))
            }
            className={sliderClass}
          />
          <LabelRow label="Volume" value={`${Math.round(selectedMusicBed.volume)}%`} />
          <input
            type="range"
            min={0}
            max={150}
            step={1}
            value={selectedMusicBed.volume}
            onChange={(e) =>
              updateSelectedMusicBed((item) => ({
                ...item,
                volume: Number(e.target.value),
              }))
            }
            className={sliderClass}
          />
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() =>
                updateSelectedMusicBed((item) => ({ ...item, muted: !item.muted }))
              }
              className={`${btnSmall} ${selectedMusicBed.muted ? 'text-[#0a84ff]' : ''}`}
            >
              {selectedMusicBed.muted ? (
                <><Volume2 className="mr-1 inline h-3 w-3" />Unmute</>
              ) : (
                <><VolumeX className="mr-1 inline h-3 w-3" />Mute</>
              )}
            </button>
            <button
              onClick={() =>
                updateSelectedMusicBed((item) => ({ ...item, loop: !item.loop }))
              }
              className={`${btnSmall} ${selectedMusicBed.loop ? 'text-[#0a84ff]' : ''}`}
            >
              <Repeat className="mr-1 inline h-3 w-3" />
              {selectedMusicBed.loop ? 'Loop On' : 'Loop Off'}
            </button>
          </div>
          <button onClick={removeSelectedMusicBed} className={btnDanger}>
            <Trash2 className="h-3 w-3" />Delete Music
          </button>
        </Section>
      </div>
    );
  }

  /* ── Title Inspector ── */
  if (selectedTitle) {
    return (
      <div className="h-full overflow-y-auto bg-[#1e1e1e]">
        <div className="border-b border-[#2a2a2a] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8e8e93]">
            Inspector — Title
          </p>
        </div>
        <Section title="Details">
          <input
            value={selectedTitle.text}
            onChange={(e) =>
              updateSelectedTitle((item) => ({ ...item, text: e.target.value }))
            }
            className={inputClass}
          />
          <select
            value={selectedTitle.style}
            onChange={(e) =>
              updateSelectedTitle((item) => ({
                ...item,
                style: e.target.value as TitleStyle,
              }))
            }
            className={inputClass}
          >
            <option value="title">Title Card</option>
            <option value="lower-third">Lower Third</option>
            <option value="caption">Caption</option>
          </select>
          <LabelRow label="Start" value={formatTime(selectedTitle.start)} />
          <input
            type="range"
            min={0}
            max={Math.max(0, totalDuration)}
            step={0.1}
            value={selectedTitle.start}
            onChange={(e) =>
              updateSelectedTitle((item) => ({
                ...item,
                start: toFixedNumber(Number(e.target.value), 3),
              }))
            }
            className={sliderClass}
          />
          <LabelRow label="Duration" value={formatTime(selectedTitle.duration)} />
          <input
            type="range"
            min={minItemDurationSeconds}
            max={Math.max(minItemDurationSeconds, Math.max(totalDuration, 10))}
            step={0.1}
            value={selectedTitle.duration}
            onChange={(e) =>
              updateSelectedTitle((item) => ({
                ...item,
                duration: clamp(
                  Number(e.target.value),
                  minItemDurationSeconds,
                  Math.max(totalDuration, 10)
                ),
              }))
            }
            className={sliderClass}
          />
          <label className="flex items-center gap-2 text-[10px] text-[#8e8e93]">
            Color
            <input
              type="color"
              value={selectedTitle.color}
              onChange={(e) =>
                updateSelectedTitle((item) => ({ ...item, color: e.target.value }))
              }
              className="ml-auto h-6 w-10 cursor-pointer rounded border border-[#333] bg-transparent"
            />
          </label>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() =>
                updateSelectedTitle((item) => ({ ...item, enabled: !item.enabled }))
              }
              className={btnSmall}
            >
              {selectedTitle.enabled ? '● Enabled' : '○ Disabled'}
            </button>
            <button onClick={removeSelectedTitle} className={btnDanger}>
              <Trash2 className="h-3 w-3" />Delete
            </button>
          </div>
        </Section>
      </div>
    );
  }

  /* ── Empty state ── */
  return (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] p-6 text-center">
      <div>
        <p className="text-[12px] text-[#8e8e93]">No selection</p>
        <p className="mt-1 text-[10px] text-[#555]">
          Select a clip, music bed, or title to inspect its properties.
        </p>
      </div>
    </div>
  );
}
