'use client';

import { useEffect, useCallback } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { ReviewGate } from '@/features/wizard/components/review-gate';
import type { ContextBible } from '@/features/wizard/wizard-types';

const contextSections: Array<{
  key: keyof ContextBible;
  label: string;
  description: string;
  icon: string;
  placeholder: string;
}> = [
  {
    key: 'subjectContext',
    label: 'Subject Context',
    description: 'What is the subject of this video? Characters, products, concepts.',
    icon: '🎭',
    placeholder: 'Describe the main subject, character, product, or concept of the video...',
  },
  {
    key: 'worldContext',
    label: 'World Context',
    description: 'The environment, setting, era, and visual world.',
    icon: '🌍',
    placeholder: 'Describe the world, setting, and environment the video takes place in...',
  },
  {
    key: 'messageContext',
    label: 'Message Context',
    description: 'The core message, CTA, and emotional takeaway.',
    icon: '💬',
    placeholder: 'What message should the viewer receive? What should they feel and do?',
  },
  {
    key: 'continuityRules',
    label: 'Continuity Rules',
    description: 'Rules that must be consistent across all scenes and shots.',
    icon: '🔗',
    placeholder: 'Color palette, recurring objects, character consistency, tone consistency...',
  },
  {
    key: 'brandVoice',
    label: 'Brand Voice',
    description: 'Tone, language, personality, and communication style.',
    icon: '📢',
    placeholder: 'Formal, casual, energetic, calm, witty, authoritative...',
  },
  {
    key: 'visualIdentity',
    label: 'Visual Identity',
    description: 'Colors, fonts, visual motifs, and aesthetic guidelines.',
    icon: '🎨',
    placeholder: 'Brand colors, fonts, logo usage, visual style constraints...',
  },
];

export default function ContextPage() {
  const ideaIntake = useWizardStore((s) => s.ideaIntake);
  const requirementReport = useWizardStore((s) => s.requirementReport);
  const strategyBrief = useWizardStore((s) => s.strategyBrief);
  const contextBible = useWizardStore((s) => s.contextBible);
  const setContextBible = useWizardStore((s) => s.setContextBible);
  const updateDocumentStatus = useWizardStore((s) => s.updateDocumentStatus);
  const lockSection = useWizardStore((s) => s.lockSection);
  const unlockSection = useWizardStore((s) => s.unlockSection);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);

  useEffect(() => {
    setCurrentPage(7);
  }, [setCurrentPage]);

  // Auto-populate from prior data if context is empty
  useEffect(() => {
    if (contextBible.status === 'empty') {
      const bible: ContextBible = {
        subjectContext: requirementReport.data?.projectObjective || '',
        worldContext: requirementReport.data?.visualStyleDirections || '',
        messageContext: requirementReport.data?.scriptStructure || '',
        continuityRules: '',
        brandVoice: '',
        visualIdentity: strategyBrief.data?.videoStyle || '',
      };
      setContextBible(bible, 0.6, ['Auto-populated from requirement report and strategy. Please review and edit.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = useCallback(
    (key: keyof ContextBible, value: string) => {
      if (!contextBible.data) return;
      setContextBible(
        { ...contextBible.data, [key]: value },
        contextBible.confidence,
        contextBible.assumptions
      );
      updateDocumentStatus('contextBible', 'user_edited');
    },
    [contextBible, setContextBible, updateDocumentStatus]
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Context <span className="gradient-text">Bible</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          Build the context rules that guide all downstream AI agents. Lock sections to prevent
          agents from overriding your decisions.
        </p>
      </div>

      <ReviewGate
        document={contextBible}
        title="Context Bible"
        onApprove={() => updateDocumentStatus('contextBible', 'approved')}
        onRegenerate={() => {
          // Reset to auto-populated values
          const bible: ContextBible = {
            subjectContext: requirementReport.data?.projectObjective || '',
            worldContext: requirementReport.data?.visualStyleDirections || '',
            messageContext: requirementReport.data?.scriptStructure || '',
            continuityRules: '',
            brandVoice: '',
            visualIdentity: strategyBrief.data?.videoStyle || '',
          };
          setContextBible(bible, 0.6, ['Reset from approved data. Edit as needed.']);
        }}
      >
        <div className="space-y-4">
          {contextSections.map(({ key, label, description, icon, placeholder }) => {
            const isLocked = contextBible.lockedSections.includes(key);
            return (
              <div
                key={key}
                className={`rounded-xl border p-4 transition-all ${
                  isLocked
                    ? 'border-violet-500/20 bg-violet-500/[0.03]'
                    : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{icon}</span>
                    <h4 className="text-sm font-semibold text-vv-primary">{label}</h4>
                  </div>
                  <button
                    onClick={() =>
                      isLocked
                        ? unlockSection('contextBible', key)
                        : lockSection('contextBible', key)
                    }
                    className={`vv-badge cursor-pointer text-[10px] transition-colors ${
                      isLocked
                        ? 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/25'
                        : 'bg-white/5 text-vv-muted hover:bg-white/10'
                    }`}
                  >
                    {isLocked ? '🔒 Locked' : '🔓 Lock'}
                  </button>
                </div>
                <p className="mb-2 text-xs text-vv-muted">{description}</p>
                <textarea
                  value={contextBible.data?.[key] || ''}
                  onChange={(e) => updateField(key, e.target.value)}
                  placeholder={placeholder}
                  rows={3}
                  disabled={isLocked}
                  className={`vv-input w-full resize-none text-sm ${
                    isLocked ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            );
          })}
        </div>
      </ReviewGate>

      {/* Context bible explanation */}
      <div className="vv-card border-cyan-500/10 bg-cyan-500/[0.03]">
        <div className="flex items-start gap-3">
          <span className="text-cyan-300 text-lg">ℹ</span>
          <div>
            <h4 className="text-sm font-semibold text-cyan-200">How the Context Bible works</h4>
            <p className="mt-1 text-xs text-vv-secondary leading-relaxed">
              Every AI agent that runs after this step will reference and respect the Context Bible.
              <strong className="text-cyan-200/80"> Locked sections</strong> cannot be modified by
              any downstream agent — they become immutable rules for the project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
