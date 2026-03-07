'use client';

import { useState } from 'react';
import { useWizardNav } from '../hooks/use-wizard-nav';

export function StageNav() {
  const {
    currentDef,
    nextDef,
    isFirstPage,
    isLastPage,
    canProceed,
    canSkip,
    skipRequiresWarning,
    goNext,
    goBack,
    skipCurrent,
    saveAndExit,
    goToProject,
  } = useWizardNav();

  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleSkip = () => {
    if (skipRequiresWarning) {
      setShowSkipConfirm(true);
    } else {
      skipCurrent();
    }
  };

  const confirmSkip = () => {
    setShowSkipConfirm(false);
    skipCurrent();
  };

  return (
    <>
      {/* Skip confirmation overlay */}
      {showSkipConfirm && (
        <div className="absolute inset-x-0 bottom-[65px] z-50 mx-6 animate-fade-in-up">
          <div className="rounded-xl border border-amber-500/25 bg-[#1a1520]/95 backdrop-blur-md p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                <svg className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-200">
                Skip &ldquo;{currentDef?.title}&rdquo;?
                </p>
                <p className="mt-1 text-xs text-vv-secondary leading-relaxed">
                  This step is <span className="text-amber-300 font-medium">recommended</span> for accurate AI output.
                  Skipping may reduce quality of downstream results. You can return to this step anytime.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={confirmSkip}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200 transition-all hover:bg-amber-500/20"
                  >
                    Skip Anyway
                  </button>
                  <button
                    onClick={() => setShowSkipConfirm(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-vv-secondary transition-all hover:bg-white/10"
                  >
                    Stay & Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          {!isFirstPage && (
            <button onClick={goBack} className="vv-btn-ghost text-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back
            </button>
          )}

          <button onClick={saveAndExit} className="vv-btn-ghost text-sm text-vv-muted">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
            Save &amp; Exit
          </button>
        </div>

        <div className="flex items-center gap-3">
          {canSkip && !isLastPage && (
            <button
              onClick={handleSkip}
              className={`vv-btn-ghost text-sm ${
                skipRequiresWarning
                  ? 'text-amber-300/70 hover:text-amber-200'
                  : 'text-vv-muted hover:text-vv-secondary'
              }`}
            >
              Skip
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
              </svg>
            </button>
          )}

          {isLastPage ? (
            <button
              onClick={goToProject}
              className="vv-btn-primary text-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                />
              </svg>
              Go to Project
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canProceed}
              className="vv-btn-primary text-sm whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {nextDef ? `Continue to ${nextDef.shortTitle}` : 'Next'}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5-7.5M21 12H3" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
