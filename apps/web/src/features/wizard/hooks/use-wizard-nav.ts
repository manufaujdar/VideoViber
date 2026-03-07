'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '../wizard-store';
import { WIZARD_PAGES } from '../wizard-constants';
import { toast } from 'sonner';

/** Pages that absolutely cannot be skipped (critical data entry points) */
const HARD_REQUIRED_PAGES = new Set([1, 5]);

export function useWizardNav() {
  const router = useRouter();
  const currentPage = useWizardStore((s) => s.currentPage);
  const completedPages = useWizardStore((s) => s.completedPages);
  const skippedPages = useWizardStore((s) => s.skippedPages);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);
  const markCompleted = useWizardStore((s) => s.markCompleted);
  const markSkipped = useWizardStore((s) => s.markSkipped);
  const ideaIntake = useWizardStore((s) => s.ideaIntake);
  const requirementReport = useWizardStore((s) => s.requirementReport);
  const projectId = useWizardStore((s) => s.projectId);
  const conceptVariations = useWizardStore((s) => s.conceptVariations);
  const resetWizard = useWizardStore((s) => s.resetWizard);
  const completeWizard = useWizardStore((s) => s.completeWizard);
  const invalidateDownstream = useWizardStore((s) => s.invalidateDownstream);

  const currentDef = WIZARD_PAGES.find((p) => p.page === currentPage) ?? WIZARD_PAGES[0];
  const nextDef = WIZARD_PAGES.find((p) => p.page === currentPage + 1);
  const prevDef = WIZARD_PAGES.find((p) => p.page === currentPage - 1);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === WIZARD_PAGES.length;

  /**
   * Validates whether the user can proceed from the current page.
   * Returns an error message if blocked, null if OK.
   */
  const validateCurrentPage = useCallback((): string | null => {
    switch (currentPage) {
      case 1: // Idea Intake — must have a real idea
        if (!ideaIntake.rawIdea || ideaIntake.rawIdea.trim().length < 10) {
          return 'Please describe your video idea (at least 10 characters).';
        }
        return null;

      case 2: // Requirement Report — must have report generated
        if (!requirementReport.data) {
          return 'Run the AI Requirement Analyst first, then approve or proceed.';
        }
        return null;

      case 5: // Project Creation — must have created the project
        if (!projectId) {
          return 'Please create the project before continuing.';
        }
        return null;

      case 9: // Concepts — must select a concept
        if (!conceptVariations.data?.selectedId) {
          return 'Select a concept direction before continuing.';
        }
        return null;

      default:
        return null;
    }
  }, [currentPage, ideaIntake.rawIdea, requirementReport.data, projectId, conceptVariations.data?.selectedId]);

  /** Whether the user can proceed from the current page (no blocking validation errors). */
  const canProceed = validateCurrentPage() === null;

  /** Whether the current page can be skipped */
  const canSkip = !isLastPage && !HARD_REQUIRED_PAGES.has(currentPage);

  /** Whether skipping the current page is NOT recommended (non-skippable in constants) */
  const skipRequiresWarning = canSkip && !(currentDef?.skippable ?? false);

  const goToPage = useCallback(
    (page: number) => {
      const def = WIZARD_PAGES.find((p) => p.page === page);
      if (!def) return;
      setCurrentPage(page);
      router.push(def.route);
    },
    [setCurrentPage, router]
  );

  const goNext = useCallback(() => {
    // Validate before proceeding
    const validationError = validateCurrentPage();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!nextDef) return;
    markCompleted(currentPage);
    setCurrentPage(nextDef.page);
    router.push(nextDef.route);
  }, [currentPage, nextDef, markCompleted, setCurrentPage, router, validateCurrentPage]);

  const goBack = useCallback(() => {
    if (!prevDef) return;
    setCurrentPage(prevDef.page);
    router.push(prevDef.route);
  }, [prevDef, setCurrentPage, router]);

  /**
   * Skip the current page. Shows a warning toast explaining the impact.
   * Hard-required pages (1, 5) cannot be skipped.
   */
  const skipCurrent = useCallback(() => {
    if (!nextDef || !canSkip) return;

    const isRecommended = !(currentDef?.skippable ?? false);

    markSkipped(currentPage);
    setCurrentPage(nextDef.page);
    router.push(nextDef.route);

    if (isRecommended) {
      toast.warning(`Skipped: ${currentDef?.title}`, {
        description: 'This step is recommended for best results. You can return anytime.',
        duration: 5000,
      });
    } else {
      toast.info(`Skipped: ${currentDef?.title}`, {
        description: 'You can return to this step later.',
        duration: 3000,
      });
    }
  }, [currentPage, nextDef, canSkip, currentDef, markSkipped, setCurrentPage, router]);

  /** Save progress and exit to projects list with confirmation toast */
  const saveAndExit = useCallback(() => {
    toast.success('Progress saved — you can resume anytime.', {
      description: `Saved at Step ${currentPage}: ${currentDef?.title}`,
    });
    router.push('/projects');
  }, [router, currentPage, currentDef?.title]);

  /** Navigate to the created project workspace (used on final page) */
  const goToProject = useCallback(() => {
    if (projectId) {
      completeWizard();
      toast.success('Wizard complete! Opening your project workspace.');
      router.push(`/projects/${projectId}`);
    }
  }, [projectId, completeWizard, router]);

  /** Start a completely fresh wizard, clearing all saved data */
  const startFresh = useCallback(() => {
    resetWizard();
    router.push('/projects/new');
  }, [resetWizard, router]);

  /**
   * Trigger downstream invalidation when a user regenerates an approved doc.
   * Call this from page components when regenerating AI output.
   */
  const regenerateAndInvalidate = useCallback(
    (pageNumber: number) => {
      invalidateDownstream(pageNumber);
    },
    [invalidateDownstream]
  );

  /** Check what the furthest reachable page is */
  const furthestPage = Math.max(currentPage, ...completedPages, ...skippedPages);

  const isCompleted = (page: number) => completedPages.includes(page);
  const isSkippedPage = (page: number) => skippedPages.includes(page);
  const canNavigateTo = (page: number) =>
    page <= furthestPage || completedPages.includes(page) || skippedPages.includes(page);

  return {
    currentPage,
    currentDef,
    nextDef,
    prevDef,
    isFirstPage,
    isLastPage,
    canProceed,
    canSkip,
    skipRequiresWarning,
    furthestPage,
    goToPage,
    goNext,
    goBack,
    skipCurrent,
    saveAndExit,
    goToProject,
    startFresh,
    regenerateAndInvalidate,
    isCompleted,
    isSkippedPage,
    canNavigateTo,
  };
}
