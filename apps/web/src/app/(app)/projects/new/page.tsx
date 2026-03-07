'use client';

import { useEffect } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { PLATFORMS, VIDEO_GOALS, STYLE_PRESETS } from '@/features/wizard/wizard-constants';
import { SelectableChipGroup } from '@/features/wizard/components/selectable-chip';

export default function IdeaIntakePage() {
  const ideaIntake = useWizardStore((s) => s.ideaIntake);
  const setIdeaIntake = useWizardStore((s) => s.setIdeaIntake);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [setCurrentPage]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-vv-primary sm:text-3xl">
          What do you want to <span className="gradient-text">create?</span>
        </h1>
        <p className="mt-2 text-sm text-vv-secondary sm:text-base">
          Describe your video idea. AI will analyze it and build a full production plan.
        </p>
      </div>

      {/* Main idea input */}
      <div className="space-y-2">
        <label className="vv-label flex items-center gap-2">
          <svg className="h-4 w-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
            />
          </svg>
          Your Idea
        </label>
        <textarea
          value={ideaIntake.rawIdea}
          onChange={(e) => setIdeaIntake({ rawIdea: e.target.value })}
          placeholder="I want to make a short cinematic reel about a futuristic shoe brand for Instagram..."
          rows={4}
          className="vv-input w-full resize-none text-base leading-relaxed"
        />
        <span className="text-xs text-vv-muted">
          {ideaIntake.rawIdea.length > 0 ? `${ideaIntake.rawIdea.length} characters` : 'Be as descriptive as you like'}
        </span>
      </div>

      {/* Platform */}
      <SelectableChipGroup
        label="Target Platform"
        options={PLATFORMS}
        selected={ideaIntake.targetPlatform}
        onChange={(val) => setIdeaIntake({ targetPlatform: val as string })}
      />

      {/* Video goal */}
      <SelectableChipGroup
        label="Video Goal"
        options={VIDEO_GOALS}
        selected={ideaIntake.videoGoal}
        onChange={(val) => setIdeaIntake({ videoGoal: val as string })}
      />

      {/* Audience */}
      <div className="space-y-2">
        <label className="vv-label flex items-center gap-2">
          <svg className="h-4 w-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-4-1.626M12 10.5a3 3 0 110-6 3 3 0 010 6z"
            />
          </svg>
          Target Audience
        </label>
        <input
          type="text"
          value={ideaIntake.roughAudience}
          onChange={(e) => setIdeaIntake({ roughAudience: e.target.value })}
          placeholder="Young professionals, tech enthusiasts, Gen Z consumers..."
          className="vv-input w-full"
        />
      </div>

      {/* Style preference */}
      <SelectableChipGroup
        label="Preferred Style (optional)"
        options={STYLE_PRESETS}
        selected={ideaIntake.preferredStyle}
        onChange={(val) => setIdeaIntake({ preferredStyle: val as string })}
      />

      {/* Reference links */}
      <div className="space-y-2">
        <label className="vv-label flex items-center gap-2">
          <svg className="h-4 w-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.868-3.556a4.5 4.5 0 00-6.364-6.364L4.5 8.25a4.5 4.5 0 006.364 6.364L13.19 8.688z"
            />
          </svg>
          Reference Links (optional)
        </label>
        <input
          type="text"
          value={ideaIntake.referenceLinks.join(', ')}
          onChange={(e) =>
            setIdeaIntake({
              referenceLinks: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Paste inspiration URLs, comma-separated"
          className="vv-input w-full"
        />
        <span className="text-xs text-vv-muted">
          YouTube videos, Instagram posts, Dribbble shots, or any creative reference
        </span>
      </div>

      {/* Info card */}
      <div className="vv-card border-cyan-500/10 bg-cyan-500/[0.03]">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-cyan-200">What happens next?</h4>
            <p className="mt-1 text-xs text-vv-secondary leading-relaxed">
              Our AI Requirement Analyst will analyze your idea and generate a detailed project
              requirement report — covering audience insights, recommended format, style direction,
              asset needs, and production risks. You&apos;ll review, edit, and approve it before any project
              is created.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
