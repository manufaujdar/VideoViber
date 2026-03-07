'use client';

import Link from 'next/link';
import { useAppStore } from '@/features/workspace';
import { MotionImage } from '@/components/motion-image';

export default function DashboardPage() {
  const projects = useAppStore((s) => s.projects);
  const generations = useAppStore((s) => s.generations);

  const activeProjects = projects.filter((project) => !project.archivedAt);
  const archivedProjects = projects.filter((project) => Boolean(project.archivedAt)).length;
  const totalProjects = activeProjects.length;
  const activeGenerations = generations.filter(
    (g) => g.status === 'processing' || g.status === 'queued'
  ).length;
  const completedShots = activeProjects.reduce(
    (acc, p) => acc + p.shots.filter((s) => s.status === 'completed').length,
    0
  );
  const recentProjects = [...activeProjects]
    .sort((a, b) => {
      if (a.starred !== b.starred) {
        return a.starred ? -1 : 1;
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    })
    .slice(0, 6);

  const stats = [
    {
      label: 'Active Projects',
      value: totalProjects.toString(),
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
          />
        </svg>
      ),
      accent: 'text-vv-primary',
      bg: 'bg-white/5',
    },
    {
      label: 'Active Generations',
      value: activeGenerations.toString(),
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      ),
      accent: 'text-blue-400',
      bg: 'bg-blue-500/5',
    },
    {
      label: 'Completed Shots',
      value: completedShots.toString(),
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/5',
    },
    {
      label: 'Archived Projects',
      value: archivedProjects.toString(),
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      ),
      accent: 'text-amber-300',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-vv-secondary mt-1 text-sm">Active render pipeline and scene inventory</p>
        </div>
        <Link href="/projects/new" className="vv-btn-primary">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Initialize Scene
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="vv-card-hover glass-strong border-white/5 group pt-5 pb-5 pl-6 pr-6">
            <div className="flex items-center justify-between">
              <p className="text-vv-muted text-xs font-semibold uppercase tracking-wider">
                {stat.label}
              </p>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} ${stat.accent} transition-transform group-hover:scale-110`}
              >
                {stat.icon}
              </div>
            </div>
            <p className={`mt-3 text-3xl font-bold ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Initialize Scene',
            desc: 'Configure shot parameters',
            href: '/projects/new',
            icon: (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
            ),
          },
          {
            title: 'Studio Vault',
            desc: 'Manage project inventory',
            href: '/projects',
            icon: (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                />
              </svg>
            ),
          },
          {
            title: 'Connect Provider',
            desc: 'Add your API keys',
            href: '/settings/keys',
            icon: (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
            ),
          },
          {
            title: 'Audio Studio',
            desc: 'Generate AI voiceovers',
            href: '/audio-studio',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            ),
          },
          {
            title: 'Media Library',
            desc: 'Browse royalty-free assets',
            href: '/media-library',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25z" />
              </svg>
            ),
          },
        ].map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="vv-card-hover group flex items-center gap-4"
          >
            <div className="bg-accent/10 text-accent ring-accent/10 group-hover:bg-accent/15 group-hover:shadow-accent/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-all group-hover:shadow-md">
              {action.icon}
            </div>
            <div>
              <p className="group-hover:text-accent font-semibold transition-colors">
                {action.title}
              </p>
              <p className="text-vv-muted text-xs">{action.desc}</p>
            </div>
            <svg
              className="text-vv-muted ml-auto h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Recent Projects */}
      {recentProjects.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Recent Projects</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project, index) => {
              const completed = project.shots.filter((s) => s.status === 'completed').length;
              const total = project.shots.length;
              return (
                <a
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="vv-card-hover group"
                >
                  {/* Thumbnail */}
                  <div className="bg-vv-base relative mb-4 aspect-video overflow-hidden rounded-lg">
                    {project.shots[0]?.thumbnailUrl ? (
                      <MotionImage
                        src={project.shots[0].thumbnailUrl}
                        alt={project.title}
                        width={640}
                        height={360}
                        unoptimized
                        className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                        motionPreset="drift"
                        motionSpeed="medium"
                        motionDelayMs={index * 140}
                      />
                    ) : (
                      <div className="from-vv-surface to-vv-base flex h-full items-center justify-center bg-gradient-to-br">
                        <svg
                          className="text-vv-border h-8 w-8"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="absolute right-2 top-2">
                      <div className="flex items-center gap-1.5">
                        {project.starred && (
                          <span className="vv-badge bg-amber-500/20 text-amber-300 text-[11px]">
                            Starred
                          </span>
                        )}
                        <span
                          className={`vv-badge text-xs ${
                            project.status === 'ready'
                              ? 'bg-success/20 text-success'
                              : project.status === 'generating'
                                ? 'bg-blue-500/20 text-blue-400'
                                : project.status === 'exported'
                                  ? 'bg-accent/20 text-accent'
                                  : 'text-vv-muted bg-white/10'
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <h3 className="group-hover:text-accent font-semibold transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-vv-muted mt-1 line-clamp-1 text-xs">{project.brief}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-vv-disabled text-xs">
                      {completed}/{total} shots
                    </span>
                    <span className="text-vv-disabled text-xs">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="bg-accent h-full rounded-full transition-all"
                      style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                    />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ) : projects.length > 0 ? (
        <div className="vv-card glass-strong border-white/5 py-16 text-center">
          <h3 className="text-xl font-bold tracking-tight">Pipeline is dormant</h3>
          <p className="text-vv-secondary mt-2 text-sm">
            Your projects are currently archived. Restore them from the Studio Vault.
          </p>
          <Link href="/projects" className="vv-btn-secondary mt-6 inline-flex px-6 py-2.5">
            Open Studio Vault
          </Link>
        </div>
      ) : (
        <div className="vv-card relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(82, 222, 255, 0.5) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative flex flex-col items-center justify-center py-16">
            <div className="from-accent/20 ring-accent/20 animate-float mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br to-amber-300/10 ring-1">
              <svg
                className="text-accent h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold tracking-tight">No scenes instantiated</h3>
            <p className="text-vv-secondary mb-8 max-w-md text-center text-sm leading-relaxed">
              Initialize your first project to start turning creative intent into verifiable generative timelines.
            </p>
            <Link href="/projects/new" className="vv-btn-primary px-8 py-3">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Initialize First Scene
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
