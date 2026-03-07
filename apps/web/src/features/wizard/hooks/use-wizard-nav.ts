'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '../wizard-store';
import { WIZARD_PAGES } from '../wizard-constants';

export function useWizardNav() {
  const router = useRouter();
  const currentPage = useWizardStore((s) => s.currentPage);
  const completedPages = useWizardStore((s) => s.completedPages);
  const skippedPages = useWizardStore((s) => s.skippedPages);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);
  const markCompleted = useWizardStore((s) => s.markCompleted);
  const markSkipped = useWizardStore((s) => s.markSkipped);

  const currentDef = WIZARD_PAGES.find((p) => p.page === currentPage) ?? WIZARD_PAGES[0];
  const nextDef = WIZARD_PAGES.find((p) => p.page === currentPage + 1);
  const prevDef = WIZARD_PAGES.find((p) => p.page === currentPage - 1);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === WIZARD_PAGES.length;

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
    if (!nextDef) return;
    markCompleted(currentPage);
    setCurrentPage(nextDef.page);
    router.push(nextDef.route);
  }, [currentPage, nextDef, markCompleted, setCurrentPage, router]);

  const goBack = useCallback(() => {
    if (!prevDef) return;
    setCurrentPage(prevDef.page);
    router.push(prevDef.route);
  }, [prevDef, setCurrentPage, router]);

  const skipCurrent = useCallback(() => {
    if (!nextDef) return;
    markSkipped(currentPage);
    setCurrentPage(nextDef.page);
    router.push(nextDef.route);
  }, [currentPage, nextDef, markSkipped, setCurrentPage, router]);

  const saveAndExit = useCallback(() => {
    // State is already persisted via the store
    router.push('/projects');
  }, [router]);

  const isCompleted = (page: number) => completedPages.includes(page);
  const isSkippedPage = (page: number) => skippedPages.includes(page);
  const canNavigateTo = (page: number) =>
    page <= currentPage || completedPages.includes(page) || skippedPages.includes(page);

  return {
    currentPage,
    currentDef,
    nextDef,
    prevDef,
    isFirstPage,
    isLastPage,
    goToPage,
    goNext,
    goBack,
    skipCurrent,
    saveAndExit,
    isCompleted,
    isSkippedPage,
    canNavigateTo,
  };
}
