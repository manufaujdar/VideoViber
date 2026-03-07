'use client';

import { useEffect, useCallback, useState } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useAppStore } from '@/features/workspace';
import { toast } from 'sonner';

export default function CreateProjectPage() {
  const ideaIntake = useWizardStore((s) => s.ideaIntake);
  const requirementReport = useWizardStore((s) => s.requirementReport);
  const researchSummary = useWizardStore((s) => s.researchSummary);
  const gapChecklist = useWizardStore((s) => s.gapChecklist);
  const projectCreation = useWizardStore((s) => s.projectCreation);
  const setProjectCreation = useWizardStore((s) => s.setProjectCreation);
  const setProjectId = useWizardStore((s) => s.setProjectId);
  const projectId = useWizardStore((s) => s.projectId);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);
  const markCompleted = useWizardStore((s) => s.markCompleted);

  const addProject = useAppStore((s) => s.addProject);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setCurrentPage(5);
  }, [setCurrentPage]);

  // Auto-fill from approved data
  useEffect(() => {
    if (!projectCreation.name && ideaIntake.rawIdea) {
      const words = ideaIntake.rawIdea.split(' ').slice(0, 8).join(' ');
      const suggestedName = words.length > 50 ? words.slice(0, 50) + '…' : words;
      setProjectCreation({
        suggestedName,
        name: suggestedName,
        summary: requirementReport.data?.projectObjective || ideaIntake.rawIdea.slice(0, 200),
        category: ideaIntake.videoGoal || 'general',
        tags: [ideaIntake.targetPlatform, ideaIntake.preferredStyle, ideaIntake.videoGoal].filter(Boolean),
      });
    }
  }, [ideaIntake, requirementReport, projectCreation.name, setProjectCreation]);

  const handleCreate = useCallback(async () => {
    if (!projectCreation.name.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setCreating(true);
    try {
      // Build the brief from all gathered intelligence
      const briefParts = [
        ideaIntake.rawIdea,
        requirementReport.data?.projectObjective ? `\n\nObjective: ${requirementReport.data.projectObjective}` : '',
        requirementReport.data?.audienceUnderstanding ? `\n\nAudience: ${requirementReport.data.audienceUnderstanding}` : '',
        researchSummary.data?.recommendedDirections ? `\n\nDirection: ${researchSummary.data.recommendedDirections}` : '',
      ].join('');

      const id = addProject({
        title: projectCreation.name.trim(),
        brief: briefParts.slice(0, 5000),
        provider: projectCreation.provider || 'gemini',
        shots: [],
      });

      setProjectId(id);
      markCompleted(5);
      toast.success('Project created successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  }, [projectCreation, ideaIntake, requirementReport, researchSummary, addProject, setProjectId, markCompleted]);

  const isReportApproved = requirementReport.status === 'approved' || requirementReport.status === 'locked';

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Create <span className="gradient-text">Project</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          {projectId
            ? 'Your project has been created. Continue to the next step.'
            : 'Create your project workspace from the approved intelligence.'}
        </p>
      </div>

      {/* Pre-project approval check */}
      {!isReportApproved && !projectId && (
        <div className="vv-card border-amber-500/20 bg-amber-500/[0.05]">
          <div className="flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <h4 className="text-sm font-semibold text-amber-200">Requirement Report not approved</h4>
              <p className="mt-1 text-xs text-amber-200/70">
                Go back to the Requirement Report page and approve it before creating the project.
                This ensures your project is built on a solid foundation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Project already created */}
      {projectId && (
        <div className="vv-card border-emerald-500/20 bg-emerald-500/[0.05]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-200">Project Created</h4>
              <p className="text-xs text-emerald-200/70">
                <strong>{projectCreation.name}</strong> — Continue to strategic planning.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Creation form */}
      {!projectId && (
        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="vv-label">Project Name</label>
            <input
              type="text"
              value={projectCreation.name}
              onChange={(e) => setProjectCreation({ name: e.target.value })}
              placeholder="Enter project name"
              className="vv-input w-full text-lg font-semibold"
            />
            {projectCreation.suggestedName && projectCreation.name !== projectCreation.suggestedName && (
              <button
                onClick={() => setProjectCreation({ name: projectCreation.suggestedName })}
                className="text-xs text-cyan-300/60 hover:text-cyan-300 transition-colors"
              >
                ↩ Use suggested: &quot;{projectCreation.suggestedName}&quot;
              </button>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <label className="vv-label">Project Summary</label>
            <textarea
              value={projectCreation.summary}
              onChange={(e) => setProjectCreation({ summary: e.target.value })}
              rows={3}
              className="vv-input w-full resize-none"
              placeholder="Brief project summary..."
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="vv-label">Tags</label>
            <div className="flex flex-wrap gap-2">
              {projectCreation.tags.map((tag, i) => (
                <span key={i} className="vv-badge text-xs">
                  {tag}
                  <button
                    onClick={() =>
                      setProjectCreation({
                        tags: projectCreation.tags.filter((_, idx) => idx !== i),
                      })
                    }
                    className="ml-1 text-vv-muted hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Intelligence summary */}
          <div className="vv-card">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-vv-muted">
              Intelligence Gathered
            </h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  label: 'Requirements',
                  done: requirementReport.status !== 'empty',
                  status: requirementReport.status,
                },
                {
                  label: 'Research',
                  done: researchSummary.status !== 'empty',
                  status: researchSummary.status,
                },
                {
                  label: 'Gap Analysis',
                  done: gapChecklist.status !== 'empty',
                  status: gapChecklist.status,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-lg border p-3 text-center ${
                    item.done ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                >
                  <span className="text-lg">{item.done ? '✓' : '○'}</span>
                  <p className="mt-1 text-xs font-medium text-vv-secondary">{item.label}</p>
                  <p className="text-[10px] text-vv-muted capitalize">{item.status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={creating || !projectCreation.name.trim()}
            className="vv-btn-primary w-full py-3 text-base disabled:opacity-40"
          >
            {creating ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create Project
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
