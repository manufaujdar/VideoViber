'use client';

import { WIZARD_PAGES } from '../wizard-constants';
import { useWizardStore } from '../wizard-store';
import { useWizardNav } from '../hooks/use-wizard-nav';

export function StageStepper() {
  const currentPage = useWizardStore((s) => s.currentPage);
  const completedPages = useWizardStore((s) => s.completedPages);
  const skippedPages = useWizardStore((s) => s.skippedPages);
  const { goToPage, canNavigateTo } = useWizardNav();

  return (
    <div className="w-full">
      {/* Desktop stepper — horizontally scrollable for many steps */}
      <div className="hidden md:block overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-center gap-0 px-4 min-w-max">
          {WIZARD_PAGES.map((page, idx) => {
            const isActive = page.page === currentPage;
            const isDone = completedPages.includes(page.page);
            const isSkipped = skippedPages.includes(page.page);
            const canGo = canNavigateTo(page.page);

            return (
              <div key={page.page} className="flex items-center">
                {/* Step dot + label */}
                <button
                  onClick={() => canGo && goToPage(page.page)}
                  disabled={!canGo}
                  className={`group flex flex-col items-center gap-1.5 transition-all duration-300 ${
                    canGo ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? 'border-cyan-400/60 bg-cyan-400/20 text-cyan-300 shadow-[0_0_16px_rgba(82,222,255,0.25)]'
                        : isDone
                          ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                          : isSkipped
                            ? 'border-amber-400/40 bg-amber-500/15 text-amber-300'
                            : 'border-white/10 bg-white/[0.03] text-vv-muted'
                    }`}
                  >
                    {isDone ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : isSkipped ? (
                      <span className="text-[10px]">⊘</span>
                    ) : (
                      page.page
                    )}

                    {isActive && (
                      <span className="absolute inset-0 animate-ping rounded-full border border-cyan-400/30" />
                    )}
                  </div>

                  <span
                    className={`max-w-[72px] truncate text-center text-[10px] font-medium transition-colors ${
                      isActive ? 'text-cyan-300' : isDone ? 'text-emerald-300/70' : 'text-vv-muted'
                    }`}
                  >
                    {page.shortTitle}
                  </span>
                </button>

                {/* Connector line */}
                {idx < WIZARD_PAGES.length - 1 && (
                  <div className="mx-1 h-px w-4 lg:w-8">
                    <div
                      className={`h-full rounded transition-all duration-500 ${
                        isDone
                          ? 'bg-gradient-to-r from-emerald-500/50 to-emerald-500/20'
                          : isActive
                            ? 'bg-gradient-to-r from-cyan-400/50 to-white/5'
                            : 'bg-white/[0.06]'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile stepper */}
      <div className="flex items-center justify-between px-4 py-2 md:hidden">
        <span className="text-xs font-semibold text-cyan-300">
          Step {currentPage} of {WIZARD_PAGES.length}
        </span>
        <span className="text-xs text-vv-secondary truncate max-w-[120px]">{WIZARD_PAGES[currentPage - 1]?.title}</span>
        <div className="flex gap-1">
          {WIZARD_PAGES.map((p) => (
            <div
              key={p.page}
              className={`h-1.5 rounded-full transition-all ${
                p.page === currentPage
                  ? 'w-4 bg-cyan-400'
                  : completedPages.includes(p.page)
                    ? 'w-1.5 bg-emerald-400'
                    : skippedPages.includes(p.page)
                      ? 'w-1.5 bg-amber-400'
                      : 'w-1.5 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
