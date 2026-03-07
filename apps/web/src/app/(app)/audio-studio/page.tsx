'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  audioProviderCatalog,
  soundLibraries,
  type AudioProviderId,
} from '@/lib/audio-providers';

type TabId = 'voice' | 'libraries';

export default function AudioStudioPage() {
  const [activeTab, setActiveTab] = useState<TabId>('voice');
  const [selectedProvider, setSelectedProvider] = useState<AudioProviderId>('elevenlabs');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [stability, setStability] = useState(75);
  const [styleExaggeration, setStyleExaggeration] = useState(0);
  const [scriptText, setScriptText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'sfx' | 'music'>('all');

  const provider = useMemo(
    () => audioProviderCatalog.find((p) => p.id === selectedProvider) ?? audioProviderCatalog[0]!,
    [selectedProvider]
  );

  const filteredLibraries = useMemo(
    () => (libraryFilter === 'all' ? soundLibraries : soundLibraries.filter((l) => l.category === libraryFilter)),
    [libraryFilter]
  );

  const handleProviderChange = useCallback((id: AudioProviderId) => {
    setSelectedProvider(id);
    setSelectedVoice('');
    setGeneratedAudioUrl(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!scriptText.trim()) {
      toast.error('Enter a script to synthesize.');
      return;
    }
    if (!selectedVoice) {
      toast.error('Select a voice first.');
      return;
    }
    setGenerating(true);
    setGeneratedAudioUrl(null);
    // Simulate generation (real API integration would go here)
    await new Promise((r) => setTimeout(r, 2200));
    setGeneratedAudioUrl(`data:audio/wav;base64,UklGR`); // placeholder
    setGenerating(false);
    toast.success(`Audio generated with ${provider.name} — ${selectedVoice}`);
  }, [scriptText, selectedVoice, provider.name]);

  const handleExportToTimeline = useCallback(() => {
    toast.success('Audio clip exported to timeline dialogue track (A1).');
  }, []);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'voice',
      label: 'AI Voice Generation',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      ),
    },
    {
      id: 'libraries',
      label: 'Sound Libraries',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div>
        <div className="vv-badge bg-violet-500/10 text-violet-300 mb-3 font-mono tracking-widest">Studio</div>
        <h1 className="text-3xl font-bold tracking-tight">Audio Studio</h1>
        <p className="text-vv-secondary mt-2 text-sm leading-relaxed">
          Generate AI voiceovers, browse royalty-free sound effects, and sync audio to your timeline.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] p-1 ring-1 ring-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-accent/10 text-accent shadow-sm ring-1 ring-accent/20'
                : 'text-vv-secondary hover:text-vv-primary hover:bg-white/[0.03]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB 1: AI Voice Generation ═══════════════ */}
      {activeTab === 'voice' && (
        <div className="space-y-6">
          {/* Provider Selector */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Select Provider</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {audioProviderCatalog.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`vv-card group relative text-left transition-all ${
                    selectedProvider === p.id
                      ? 'ring-2 ring-accent/40 bg-accent/5'
                      : 'hover:bg-white/[0.03] ring-1 ring-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${p.gradient} text-sm font-bold ring-1 ring-white/10`}>
                      {p.letter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-vv-muted text-xs truncate">{p.description}</p>
                    </div>
                  </div>
                  {selectedProvider === p.id && (
                    <div className="absolute top-2 right-2">
                      <div className="h-2 w-2 rounded-full bg-accent shadow-accent/50 shadow-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Provider Info Bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.02] px-4 py-3 ring-1 ring-white/10">
            <span className="text-xs font-semibold text-vv-secondary uppercase tracking-wider">Active:</span>
            <span className="text-sm font-bold text-accent">{provider.name}</span>
            <span className="text-vv-muted">·</span>
            <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">
              API Documentation ↗
            </a>
            <span className="text-vv-muted">·</span>
            <span className="text-xs text-vv-muted font-mono">{provider.envVars.join(', ')}</span>
          </div>

          {/* Voice + Config Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Voice Selection */}
            <div className="vv-card glass-strong border-white/5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-vv-muted">Voice Selection</h3>
              <div className="grid grid-cols-2 gap-2">
                {provider.voices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`rounded-lg px-3 py-2.5 text-left text-sm transition-all ring-1 ${
                      selectedVoice === voice.id
                        ? 'bg-accent/10 text-accent ring-accent/30'
                        : 'ring-white/10 text-vv-secondary hover:bg-white/[0.03] hover:text-white'
                    }`}
                  >
                    <p className="font-medium">{voice.label}</p>
                    {voice.accent && <p className="text-[10px] text-vv-muted mt-0.5">{voice.accent}</p>}
                  </button>
                ))}
              </div>

              {/* Features */}
              <div className="border-t border-white/5 pt-3">
                <p className="text-[10px] text-vv-muted uppercase tracking-widest mb-2">Provider Features</p>
                <div className="flex flex-wrap gap-1.5">
                  {provider.features.map((f) => (
                    <span key={f} className="vv-badge bg-white/5 text-vv-secondary text-[10px] font-mono">{f}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Voice Configuration */}
            <div className="vv-card glass-strong border-white/5 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-vv-muted">Voice Configuration</h3>

              {/* Speed */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-vv-secondary">Speed</span>
                  <span className="font-mono text-accent">{speed.toFixed(2)}x</span>
                </div>
                <input type="range" min={0.25} max={4} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" />
                <div className="flex justify-between text-[10px] text-vv-muted mt-1">
                  <span>0.25x</span><span>1.0x</span><span>4.0x</span>
                </div>
              </div>

              {/* Pitch */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-vv-secondary">Pitch</span>
                  <span className="font-mono text-amber-300">{pitch > 0 ? '+' : ''}{pitch} st</span>
                </div>
                <input type="range" min={-20} max={20} step={1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" />
                <div className="flex justify-between text-[10px] text-vv-muted mt-1">
                  <span>-20 st</span><span>0</span><span>+20 st</span>
                </div>
              </div>

              {/* Stability */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-vv-secondary">Stability</span>
                  <span className="font-mono text-emerald-300">{stability}%</span>
                </div>
                <input type="range" min={0} max={100} step={1} value={stability} onChange={(e) => setStability(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" />
                <div className="flex justify-between text-[10px] text-vv-muted mt-1">
                  <span>Variable</span><span>Consistent</span>
                </div>
              </div>

              {/* Style Exaggeration */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-vv-secondary">Style Exaggeration</span>
                  <span className="font-mono text-pink-300">{styleExaggeration}%</span>
                </div>
                <input type="range" min={0} max={100} step={1} value={styleExaggeration} onChange={(e) => setStyleExaggeration(Number(e.target.value))}
                  className="w-full accent-pink-400 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" />
                <div className="flex justify-between text-[10px] text-vv-muted mt-1">
                  <span>Subtle</span><span>Dramatic</span>
                </div>
              </div>
            </div>
          </div>

          {/* Script Input */}
          <div className="vv-card glass-strong border-white/5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-vv-muted">Script / Dialogue</h3>
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Enter voiceover text here... Supports up to 5000 characters per generation."
              rows={5}
              maxLength={5000}
              className="vv-input w-full resize-y font-mono text-sm leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-vv-muted">{scriptText.length} / 5000 characters</span>
              <div className="flex items-center gap-3">
                {generatedAudioUrl && (
                  <button onClick={handleExportToTimeline} className="vv-btn-secondary text-xs px-4 py-2">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Export to Timeline
                  </button>
                )}
                <button
                  onClick={() => void handleGenerate()}
                  disabled={generating || !scriptText.trim() || !selectedVoice}
                  className="vv-btn-primary px-6 py-2.5 text-sm disabled:opacity-40"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Synthesizing...
                    </span>
                  ) : (
                    'Generate Audio'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Generated Audio Preview */}
          {generatedAudioUrl && (
            <div className="vv-card glass-strong border-accent/20 bg-accent/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-accent">Audio Generated Successfully</p>
                  <p className="text-xs text-vv-secondary">{provider.name} · {selectedVoice} · {speed}x speed</p>
                </div>
              </div>
              <div className="flex h-10 items-center gap-1 rounded-lg bg-white/5 px-3">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="w-1 rounded-full bg-accent/60" style={{ height: `${8 + Math.random() * 24}px` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB 2: Sound Libraries ═══════════════ */}
      {activeTab === 'libraries' && (
        <div className="space-y-6">
          {/* Filter */}
          <div className="flex items-center gap-2">
            {(['all', 'sfx', 'music'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setLibraryFilter(f)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-all ${
                  libraryFilter === f
                    ? 'bg-accent/10 text-accent ring-1 ring-accent/20'
                    : 'text-vv-secondary hover:bg-white/[0.03] hover:text-vv-primary'
                }`}
              >
                {f === 'all' ? 'All' : f === 'sfx' ? 'Sound Effects' : 'Music'}
              </button>
            ))}
          </div>

          {/* Library Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLibraries.map((lib) => (
              <div key={lib.id} className="vv-card-hover glass-strong border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${lib.gradient} text-sm font-bold ring-1 ring-white/10`}>
                    {lib.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{lib.name}</p>
                    <span className={`vv-badge text-[10px] font-mono ${lib.category === 'sfx' ? 'bg-cyan-500/10 text-cyan-300' : 'bg-violet-500/10 text-violet-300'}`}>
                      {lib.category === 'sfx' ? 'SFX' : 'Music'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-vv-secondary leading-relaxed">{lib.description}</p>
                <div className="space-y-1.5 border-t border-white/5 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vv-muted">License:</span>
                    <a href={lib.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">{lib.license}</a>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <a href={lib.url} target="_blank" rel="noopener noreferrer" className="vv-btn-secondary flex-1 justify-center text-xs py-2">
                    Browse Library ↗
                  </a>
                  <button onClick={() => toast.success(`Import audio files from ${lib.name} via the file picker.`)} className="vv-btn-primary flex-1 justify-center text-xs py-2">
                    Import Audio
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Attribution Notice */}
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-5 py-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-200">Attribution & Legal Notice</p>
                <p className="text-xs text-amber-100/70 mt-1 leading-relaxed">
                  Always check the specific license of each audio asset before using it in your production.
                  CC-BY licensed content requires you to credit the original author in your project credits.
                  BBC Sound Effects are licensed for personal and educational use only under the RemArc License.
                  When in doubt, refer to each library&apos;s licensing page linked above.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
