'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore, hasInProgressSession } from '@/features/wizard/wizard-store';
import { WIZARD_PAGES } from '@/features/wizard/wizard-constants';
import { StageStepper } from '@/features/wizard/components/stage-stepper';
import { StageNav } from '@/features/wizard/components/stage-nav';

import { StepDependencyBanner } from '@/features/wizard/components/step-dependency-banner';

function ResumeDialog({
  onResume,
  onStartFresh,
  session,
}: {
  onResume: () => void;
  onStartFresh: () => void;
  session: { currentPage?: number; savedAt?: string; ideaSnippet?: string; projectName?: string };
}) {
  const pageDef = WIZARD_PAGES.find((p) => p.page === session.currentPage);
  const timeAgo = session.savedAt ? getTimeAgo(session.savedAt) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0a0a0f] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
            <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-vv-primary">Resume or Start Fresh?</h2>
            <p className="text-xs text-vv-muted">You have an in-progress wizard session</p>
          </div>
        </div>

        {/* Session info */}
        <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          {session.projectName && (
            <p className="mb-1 text-sm font-semibold text-vv-primary">{session.projectName}</p>
          )}
          {session.ideaSnippet && (
            <p className="mb-2 text-xs text-vv-secondary line-clamp-2">
              &ldquo;{session.ideaSnippet}{session.ideaSnippet.length >= 80 ? '…' : ''}&rdquo;
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-vv-muted">
            {pageDef && (
              <span className="vv-badge bg-cyan-500/10 text-cyan-300 text-[10px]">
                Step {session.currentPage}: {pageDef.shortTitle}
              </span>
            )}
            {timeAgo && <span>Saved {timeAgo}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onResume}
            className="vv-btn-primary flex-1 py-2.5 text-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
            Resume
          </button>
          <button
            onClick={onStartFresh}
            className="vv-btn-ghost flex-1 py-2.5 text-sm text-amber-300/80"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function WizardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrateFromStorage = useWizardStore((s) => s.hydrateFromStorage);
  const resetWizard = useWizardStore((s) => s.resetWizard);
  const currentPage = useWizardStore((s) => s.currentPage);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check for existing session before hydrating
    const session = hasInProgressSession();

    if (session.exists && session.currentPage && session.currentPage > 1) {
      // User has real progress — show the resume dialog
      setShowResumeDialog(true);
    } else {
      // No session or user was on page 1 — just hydrate silently
      hydrateFromStorage();
    }
    setHydrated(true);
  }, [hydrateFromStorage]);

  const handleResume = () => {
    const restored = hydrateFromStorage();
    setShowResumeDialog(false);
    if (restored) {
      // Navigate to the saved page
      const page = useWizardStore.getState().currentPage;
      const def = WIZARD_PAGES.find((p) => p.page === page);
      if (def && def.page !== 1) {
        router.push(def.route);
      }
    }
  };

  const handleStartFresh = () => {
    resetWizard();
    setShowResumeDialog(false);
    router.push('/projects/new');
  };

  // Get session info for the dialog
  const sessionInfo = hasInProgressSession();

  if (!hydrated) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Resume dialog */}
      {showResumeDialog && (
        <ResumeDialog
          onResume={handleResume}
          onStartFresh={handleStartFresh}
          session={{
            currentPage: sessionInfo.currentPage,
            savedAt: sessionInfo.savedAt,
            ideaSnippet: sessionInfo.ideaSnippet,
            projectName: sessionInfo.projectName,
          }}
        />
      )}

      {/* Wizard header with stepper */}
      <div className="shrink-0 border-b border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="vv-page-eyebrow mb-0">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
                AI Pre-Production
              </span>
            </div>

            {/* Progress summary */}
            <span className="hidden text-xs text-vv-muted sm:inline">
              Step {currentPage} of {WIZARD_PAGES.length}
            </span>
          </div>
          <StageStepper />
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <StepDependencyBanner />
          {children}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="shrink-0 relative">
        <div className="mx-auto max-w-4xl">
          <StageNav />
        </div>
      </div>
    </div>
  );
}
