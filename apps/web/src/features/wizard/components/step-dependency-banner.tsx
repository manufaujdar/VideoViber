'use client';

import { useWizardStore } from '../wizard-store';
import { WIZARD_PAGES } from '../wizard-constants';

/**
 * Maps each page to its prerequisites — which prior data should be available
 * for optimal results. Each entry lists the store keys and friendly labels.
 */
const PAGE_PREREQUISITES: Record<number, Array<{
  storeKey: string;
  label: string;
  pageNumber: number;
}>> = {
  2: [{ storeKey: 'ideaIntake.rawIdea', label: 'Idea Intake', pageNumber: 1 }],
  3: [{ storeKey: 'requirementReport.data', label: 'Requirements Report', pageNumber: 2 }],
  4: [{ storeKey: 'researchSummary.data', label: 'Research Summary', pageNumber: 3 }],
  5: [
    { storeKey: 'ideaIntake.rawIdea', label: 'Idea Intake', pageNumber: 1 },
    { storeKey: 'requirementReport.data', label: 'Requirements Report', pageNumber: 2 },
  ],
  6: [{ storeKey: 'projectId', label: 'Project Creation', pageNumber: 5 }],
  7: [{ storeKey: 'strategyBrief.data', label: 'Strategy Brief', pageNumber: 6 }],
  9: [{ storeKey: 'contextBible.data', label: 'Context Bible', pageNumber: 7 }],
  10: [{ storeKey: 'conceptVariations.data', label: 'Concept Selection', pageNumber: 9 }],
  11: [{ storeKey: 'scriptDraft.data', label: 'Script Blueprint', pageNumber: 10 }],
  12: [{ storeKey: 'sceneBreakdown.data', label: 'Scene Breakdown', pageNumber: 11 }],
  13: [
    { storeKey: 'sceneBreakdown.data', label: 'Scene Breakdown', pageNumber: 11 },
    { storeKey: 'scriptDraft.data', label: 'Script Blueprint', pageNumber: 10 },
  ],
  14: [
    { storeKey: 'sceneBreakdown.data', label: 'Scene Breakdown', pageNumber: 11 },
    { storeKey: 'shotPlan.data', label: 'Shot Plan', pageNumber: 12 },
  ],
  15: [
    { storeKey: 'sceneBreakdown.data', label: 'Scene Breakdown', pageNumber: 11 },
    { storeKey: 'shotPlan.data', label: 'Shot Plan', pageNumber: 12 },
    { storeKey: 'scriptDraft.data', label: 'Script Blueprint', pageNumber: 10 },
  ],
  16: [
    { storeKey: 'projectId', label: 'Project Creation', pageNumber: 5 },
    { storeKey: 'shotPlan.data', label: 'Shot Plan', pageNumber: 12 },
  ],
};

/**
 * Checks a nested property path like "ideaIntake.rawIdea" on the store state.
 */
function resolveStoreValue(state: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((obj, key) => {
    if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
    return undefined;
  }, state);
}

export function StepDependencyBanner() {
  // Get the full store state (shallow)
  const currentPage = useWizardStore((s) => s.currentPage);
  const state = useWizardStore.getState();

  const prerequisites = PAGE_PREREQUISITES[currentPage];
  if (!prerequisites || prerequisites.length === 0) return null;

  // Check which prerequisites are missing
  const missing = prerequisites.filter((prereq) => {
    const value = resolveStoreValue(state as unknown as Record<string, unknown>, prereq.storeKey);
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim().length === 0) return true;
    return false;
  });

  if (missing.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-200">
            Recommended: Complete previous {missing.length === 1 ? 'step' : 'steps'} first
          </p>
          <p className="mt-0.5 text-xs text-amber-300/70">
            For best accuracy, complete these before proceeding:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missing.map((m) => {
              const pageDef = WIZARD_PAGES.find((p) => p.page === m.pageNumber);
              return (
                <span
                  key={m.storeKey}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200"
                >
                  <span className="font-mono text-[10px] text-amber-400/60">
                    {m.pageNumber}
                  </span>
                  {pageDef?.shortTitle ?? m.label}
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-amber-300/50">
            You can still continue, but AI outputs may be less accurate without this context.
          </p>
        </div>
      </div>
    </div>
  );
}
