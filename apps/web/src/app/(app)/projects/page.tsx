'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAppStore } from '@/app/store';
import { MotionImage } from '@/components/motion-image';

const statusStyles: Record<string, string> = {
  ready: 'bg-success/20 text-success',
  generating: 'bg-blue-500/20 text-blue-400',
  exported: 'bg-accent/20 text-accent',
  draft: 'bg-white/10 text-vv-muted',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProjectsPage() {
  const projects = useAppStore((state) => state.projects);
  const [query, setQuery] = useState('');

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sorted = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (!normalizedQuery) return sorted;
    return sorted.filter(
      (project) =>
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.brief.toLowerCase().includes(normalizedQuery)
    );
  }, [projects, query]);

  const stats = useMemo(() => {
    const ready = projects.filter((project) => project.status === 'ready').length;
    const generating = projects.filter((project) => project.status === 'generating').length;
    const exported = projects.filter((project) => project.status === 'exported').length;

    return [
      { label: 'Total', value: projects.length },
      { label: 'Ready', value: ready },
      { label: 'Generating', value: generating },
      { label: 'Exported', value: exported },
    ];
  }, [projects]);

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-vv-secondary mt-1 text-sm">Track project status and jump into editing.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            className="vv-input h-10 w-full sm:w-64"
          />
          <Link href="/projects/new" className="vv-btn-primary whitespace-nowrap">
            New Project
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="vv-card px-4 py-3">
            <p className="text-vv-muted text-xs uppercase tracking-wider">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="vv-card py-16 text-center">
          <h2 className="text-lg font-semibold">{projects.length === 0 ? 'No projects yet' : 'No matches found'}</h2>
          <p className="text-vv-secondary mt-2 text-sm">
            {projects.length === 0
              ? 'Create your first project to start generating shots.'
              : 'Try a different search term.'}
          </p>
          {projects.length === 0 && (
            <Link href="/projects/new" className="vv-btn-primary mt-6 inline-flex">
              Create Project
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
              <Link key={project.id} href={`/projects/${project.id}`} className="vv-card-hover group block">
                <div className="bg-vv-base relative mb-4 aspect-video overflow-hidden rounded-xl">
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
                </div>

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="group-hover:text-accent line-clamp-1 text-sm font-semibold transition-colors">
                      {project.title}
                    </h2>
                    <span className={`vv-badge text-[11px] ${statusStyles[project.status] || statusStyles.draft}`}>
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
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
