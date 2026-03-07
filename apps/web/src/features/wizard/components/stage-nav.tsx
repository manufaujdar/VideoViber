'use client';

import { useWizardNav } from '../hooks/use-wizard-nav';
import { WIZARD_PAGES } from '../wizard-constants';

export function StageNav() {
  const {
    currentPage,
    currentDef,
    nextDef,
    isFirstPage,
    isLastPage,
    goNext,
    goBack,
    skipCurrent,
    saveAndExit,
  } = useWizardNav();

  const isSkippable = currentDef?.skippable ?? false;

  return (
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
        {isSkippable && !isLastPage && (
          <button onClick={skipCurrent} className="vv-btn-ghost text-sm text-amber-300/80">
            Skip
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
            </svg>
          </button>
        )}

        {isLastPage ? (
          <button onClick={goNext} className="vv-btn-primary text-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
              />
            </svg>
            Launch Project
          </button>
        ) : (
          <button onClick={goNext} className="vv-btn-primary text-sm">
            {nextDef ? `Continue to ${nextDef.shortTitle}` : 'Next'}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5-7.5M21 12H3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
