'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { type Project, useAppStore } from '@/features/workspace';
import { MotionImage } from '@/components/motion-image';

type ProjectView = 'active' | 'starred' | 'archived' | 'all';

const statusStyles: Record<Project['status'], string> = {
  ready: 'bg-success/20 text-success',
  generating: 'bg-blue-500/20 text-blue-400',
  exported: 'bg-accent/20 text-accent',
  draft: 'bg-white/10 text-vv-muted',
};

const viewOptions: Array<{ id: ProjectView; label: string }> = [
  { id: 'active', label: 'Active' },
  { id: 'starred', label: 'Starred' },
  { id: 'archived', label: 'Archived' },
  { id: 'all', label: 'All' },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isMatch(project: Project, query: string) {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return (
    project.title.toLowerCase().includes(normalized) ||
    project.brief.toLowerCase().includes(normalized) ||
    project.provider.toLowerCase().includes(normalized)
  );
}

function inView(project: Project, view: ProjectView) {
  const isArchived = Boolean(project.archivedAt);
  if (view === 'active') return !isArchived;
  if (view === 'archived') return isArchived;
  if (view === 'starred') return project.starred && !isArchived;
  return true;
}

export default function ProjectsPage() {
  const projects = useAppStore((state) => state.projects);
  const renameProject = useAppStore((state) => state.renameProject);
  const toggleProjectStar = useAppStore((state) => state.toggleProjectStar);
  const archiveProject = useAppStore((state) => state.archiveProject);
  const restoreProject = useAppStore((state) => state.restoreProject);
  const deleteProject = useAppStore((state) => state.deleteProject);

  const [query, setQuery] = useState('');
  const [view, setView] = useState<ProjectView>('active');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const counts = useMemo(() => {
    const active = projects.filter((project) => !project.archivedAt).length;
    const starred = projects.filter((project) => project.starred && !project.archivedAt).length;
    const archived = projects.filter((project) => Boolean(project.archivedAt)).length;
    return {
      total: projects.length,
      active,
      starred,
      archived,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...projects]
      .sort((a, b) => {
        if (a.starred !== b.starred) {
          return a.starred ? -1 : 1;
        }
        return b.updatedAt.localeCompare(a.updatedAt);
      })
      .filter((project) => inView(project, view) && isMatch(project, normalizedQuery));
  }, [projects, query, view]);

  const renamingProject = useMemo(
    () => projects.find((project) => project.id === renamingId) ?? null,
    [projects, renamingId]
  );

  useEffect(() => {
    if (!renamingProject) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setRenamingId(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [renamingProject]);

  const openRenameModal = (project: Project) => {
    setRenamingId(project.id);
    setRenameValue(project.title);
  };

  const submitRename = () => {
    if (!renamingProject) return;
    const normalized = renameValue.trim();
    if (!normalized) {
      toast.error('Project name cannot be empty.');
      return;
    }
    renameProject(renamingProject.id, normalized);
    toast.success('Project renamed.');
    setRenamingId(null);
  };

  const handleDelete = (project: Project) => {
    const confirmed = window.confirm(`Delete "${project.title}" permanently? This cannot be undone.`);
    if (!confirmed) return;
    deleteProject(project.id);
    toast.success('Project deleted.');
  };

  const handleArchiveToggle = (project: Project) => {
    if (project.archivedAt) {
      restoreProject(project.id);
      toast.success('Project restored.');
      return;
    }
    archiveProject(project.id);
    toast.success('Project archived.');
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Studio Vault</h1>
          <p className="text-vv-secondary mt-1 text-sm">
            Manage studio assets and render pipeline inventory.
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, brief, or provider"
            className="vv-input h-10 w-full sm:w-72"
          />
          <Link href="/projects/new" className="vv-btn-primary whitespace-nowrap">
            Initialize Scene
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="vv-card px-4 py-3">
          <p className="text-vv-muted text-xs uppercase tracking-wider">Active</p>
          <p className="mt-1 text-2xl font-bold">{counts.active}</p>
        </div>
        <div className="vv-card px-4 py-3">
          <p className="text-vv-muted text-xs uppercase tracking-wider">Starred</p>
          <p className="mt-1 text-2xl font-bold">{counts.starred}</p>
        </div>
        <div className="vv-card px-4 py-3">
          <p className="text-vv-muted text-xs uppercase tracking-wider">Archived</p>
          <p className="mt-1 text-2xl font-bold">{counts.archived}</p>
        </div>
        <div className="vv-card px-4 py-3">
          <p className="text-vv-muted text-xs uppercase tracking-wider">Total</p>
          <p className="mt-1 text-2xl font-bold">{counts.total}</p>
        </div>
      </div>

      <div className="flex w-fit items-center gap-1 rounded-xl bg-black/40 p-1 ring-1 ring-white/10">
        {viewOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setView(option.id)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
              view === option.id
                ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20'
                : 'text-vv-secondary hover:bg-white/5 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="vv-card py-16 text-center">
          <h2 className="text-xl font-bold tracking-tight">
            {projects.length === 0 ? 'Vault is empty' : 'No scenes match this view'}
          </h2>
          <p className="text-vv-secondary mt-2 text-sm">
            {projects.length === 0
              ? 'Initialize your first scene to start generating shots.'
              : 'Adjust search or change the selected filter.'}
          </p>
          {projects.length === 0 && (
            <Link href="/projects/new" className="vv-btn-primary mt-6 inline-flex">
              Initialize Scene
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project, index) => {
            const completed = project.shots.filter((shot) => shot.status === 'completed').length;
            const total = project.shots.length || 1;
            const progress = Math.round((completed / total) * 100);
            const previewShot = project.shots[0];

            return (
              <article key={project.id} className="vv-card-hover space-y-4 rounded-2xl p-4">
                <div className="bg-vv-base relative aspect-video overflow-hidden rounded-xl ring-1 ring-white/10 shadow-lg">
                  <Link href={`/projects/${project.id}`} className="absolute inset-0 z-10" />
                  {previewShot?.thumbnailUrl ? (
                    <MotionImage
                      src={previewShot.thumbnailUrl}
                      alt={project.title}
                      width={640}
                      height={360}
                      unoptimized
                      className="h-full w-full object-cover"
                      motionPreset="drift"
                      motionSpeed="slow"
                      motionDelayMs={index * 120}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg
                        className="text-vv-border h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h16.5m0 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0h-9.5"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="absolute left-2 top-2 z-20 flex items-center gap-1.5">
                    {project.starred && (
                      <span className="vv-badge bg-amber-500/20 text-amber-300 text-[11px]">Starred</span>
                    )}
                    {project.archivedAt && (
                      <span className="vv-badge bg-white/15 text-vv-secondary text-[11px]">Archived</span>
                    )}
                  </div>

                  <button
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleProjectStar(project.id);
                    }}
                    className={`absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                      project.starred
                        ? 'border-amber-400/40 bg-amber-500/20 text-amber-300'
                        : 'border-white/15 bg-black/35 text-vv-secondary hover:text-vv-primary'
                    }`}
                    aria-label={project.starred ? 'Unstar project' : 'Star project'}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.48 3.5a.75.75 0 011.04 0l2.75 2.79 3.88.56a.75.75 0 01.41 1.28l-2.81 2.74.67 3.87a.75.75 0 01-1.09.79L12 14.08l-3.47 1.82a.75.75 0 01-1.09-.79l.67-3.87-2.81-2.74a.75.75 0 01.41-1.28l3.88-.56 2.75-2.79z" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="hover:text-accent line-clamp-1 text-sm font-semibold transition-colors"
                    >
                      {project.title}
                    </Link>
                    <span className={`vv-badge text-[11px] ${statusStyles[project.status]}`}>
                      {project.status}
                    </span>
                  </div>

                  <p className="text-vv-secondary line-clamp-2 text-xs">{project.brief}</p>

                  <div className="space-y-1">
                    <div className="text-vv-muted flex items-center justify-between text-[11px]">
                      <span>
                        {completed}/{project.shots.length} shots
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="bg-white/8 h-1.5 overflow-hidden rounded-full">
                      <div className="bg-accent h-full rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="text-vv-muted flex items-center justify-between text-[11px]">
                    <span className="capitalize">{project.provider}</span>
                    <span>Updated {formatDate(project.updatedAt)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link href={`/projects/${project.id}`} className="vv-btn-primary px-3 py-1.5 text-xs">
                      Open
                    </Link>
                    <button
                      onClick={() => openRenameModal(project)}
                      className="vv-btn-secondary px-3 py-1.5 text-xs"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleArchiveToggle(project)}
                      className="vv-btn-secondary px-3 py-1.5 text-xs"
                    >
                      {project.archivedAt ? 'Restore' : 'Archive'}
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {renamingProject && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setRenamingId(null)}
        >
          <div className="vv-card w-full max-w-md p-5" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-semibold">Rename Project</h2>
            <p className="text-vv-secondary mt-1 text-sm">
              Update the project name used across dashboard, timeline, and generation records.
            </p>
            <div className="mt-4 space-y-3">
              <input
                autoFocus
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="vv-input w-full"
                placeholder="Project name"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitRename();
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setRenamingId(null)} className="vv-btn-secondary px-3 py-2 text-xs">
                  Cancel
                </button>
                <button onClick={submitRename} className="vv-btn-primary px-3 py-2 text-xs">
                  Save Name
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
