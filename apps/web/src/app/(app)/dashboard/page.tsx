'use client';

import Link from 'next/link';
import { useAppStore } from '@/app/store';

export default function DashboardPage() {
  const projects = useAppStore((s) => s.projects);
  const generations = useAppStore((s) => s.generations);

  const totalProjects = projects.length;
  const activeGenerations = generations.filter((g) => g.status === 'processing' || g.status === 'queued').length;
  const completedShots = projects.reduce((acc, p) => acc + p.shots.filter((s) => s.status === 'completed').length, 0);
  const exports = projects.filter((p) => p.status === 'exported').length;

  const stats = [
    {
      label: 'Total Projects',
      value: totalProjects.toString(),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      ),
      accent: 'text-vv-primary', bg: 'bg-white/5',
    },
    {
      label: 'Active Generations',
      value: activeGenerations.toString(),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      accent: 'text-blue-400', bg: 'bg-blue-500/5',
    },
    {
      label: 'Completed Shots',
      value: completedShots.toString(),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'text-emerald-400', bg: 'bg-emerald-500/5',
    },
    {
      label: 'Exports',
      value: exports.toString(),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      ),
      accent: 'text-accent', bg: 'bg-accent/5',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-vv-secondary">Your video projects at a glance</p>
        </div>
        <Link href="/projects/new" className="vv-btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="vv-card-hover group">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-vv-muted">{stat.label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} ${stat.accent} transition-transform group-hover:scale-110`}>
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
          { title: 'Create Project', desc: 'Start from a vibe brief', href: '/projects/new',
            icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg> },
          { title: 'Upload Assets', desc: 'Reference images & clips', href: '/assets',
            icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg> },
          { title: 'Connect Provider', desc: 'Add your API keys', href: '/settings/keys',
            icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg> },
        ].map((action) => (
          <Link key={action.title} href={action.href} className="vv-card-hover group flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/10 transition-all group-hover:bg-accent/15 group-hover:shadow-md group-hover:shadow-accent/10">
              {action.icon}
            </div>
            <div>
              <p className="font-semibold group-hover:text-accent transition-colors">{action.title}</p>
              <p className="text-xs text-vv-muted">{action.desc}</p>
            </div>
            <svg className="ml-auto h-4 w-4 text-vv-muted opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Recent Projects */}
      {projects.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Recent Projects</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project) => {
              const completed = project.shots.filter((s) => s.status === 'completed').length;
              const total = project.shots.length;
              return (
                <Link key={project.id} href={`/projects/${project.id}`} className="vv-card-hover group">
                  {/* Thumbnail */}
                  <div className="relative aspect-video mb-4 overflow-hidden rounded-lg bg-vv-base">
                    {project.shots[0]?.thumbnailUrl ? (
                      <img src={project.shots[0].thumbnailUrl} alt={project.title} className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-vv-surface to-vv-base">
                        <svg className="h-8 w-8 text-vv-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`vv-badge text-xs ${
                        project.status === 'ready' ? 'bg-success/20 text-success' :
                        project.status === 'generating' ? 'bg-blue-500/20 text-blue-400' :
                        project.status === 'exported' ? 'bg-accent/20 text-accent' :
                        'bg-white/10 text-vv-muted'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold group-hover:text-accent transition-colors">{project.title}</h3>
                  <p className="mt-1 text-xs text-vv-muted line-clamp-1">{project.brief}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-vv-disabled">{completed}/{total} shots</span>
                    <span className="text-xs text-vv-disabled">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="vv-card relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(124, 58, 237, 0.5) 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
          <div className="relative flex flex-col items-center justify-center py-16">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/10 ring-1 ring-accent/20 animate-float">
              <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold">No projects yet</h3>
            <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-vv-secondary">
              Create your first project to start turning vague creative ideas into editable first cuts.
            </p>
            <Link href="/projects/new" className="vv-btn-primary px-8 py-3">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Your First Project
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
