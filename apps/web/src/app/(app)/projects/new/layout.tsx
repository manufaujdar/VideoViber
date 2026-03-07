'use client';

import { useEffect, type ReactNode } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { StageStepper } from '@/features/wizard/components/stage-stepper';
import { StageNav } from '@/features/wizard/components/stage-nav';

export default function WizardLayout({ children }: { children: ReactNode }) {
  const hydrateFromStorage = useWizardStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <div className="flex h-full flex-col">
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
          </div>
          <StageStepper />
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {children}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="shrink-0">
        <div className="mx-auto max-w-4xl">
          <StageNav />
        </div>
      </div>
    </div>
  );
}
