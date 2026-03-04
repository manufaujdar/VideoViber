'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/app/store';
import { BrandLogo } from '@/components/brand-logo';
import { Toaster } from 'sonner';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
        />
      </svg>
    ),
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
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
    href: '/assets',
    label: 'Assets',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    ),
  },
  {
    href: '/generations',
    label: 'Generations',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992"
        />
      </svg>
    ),
  },
];

const accountNavItems = [
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/settings/keys',
    label: 'API Keys',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
        />
      </svg>
    ),
  },
];

type NavItem = (typeof navItems)[number];

function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
        ${
          isActive
            ? 'bg-accent/10 text-accent shadow-accent/5 shadow-sm'
            : 'text-vv-secondary hover:text-vv-primary hover:bg-white/[0.03]'
        }`}
    >
      <span
        className={`transition-colors ${isActive ? 'text-accent' : 'text-vv-muted group-hover:text-vv-secondary'}`}
      >
        {item.icon}
      </span>
      {item.label}
      {isActive && (
        <div className="bg-accent shadow-accent/50 ml-auto h-1.5 w-1.5 rounded-full shadow-sm" />
      )}
    </Link>
  );
}

function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const displayName = useAppStore((state) => state.settings.displayName.trim());
  const projectCount = useAppStore((state) => state.projects.length);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`vv-sidebar-shell md:w-sidebar fixed left-0 top-0 z-50 flex h-screen w-[85vw] max-w-[280px] flex-col transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo — clicks to home */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <BrandLogo href="/" wordmarkClassName="text-[0.82rem] tracking-[0.17em]" />
          <button
            onClick={onClose}
            className="text-vv-muted hover:text-vv-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.03] md:hidden"
            aria-label="Close sidebar"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="text-vv-muted/60 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest">
            Workspace
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return <NavLink key={item.href} item={item} isActive={isActive} onNavigate={onClose} />;
          })}
        </nav>

        {/* Account Section — pushed to bottom */}
        <div className="border-t border-white/10 px-3 py-3">
          <p className="text-vv-muted/60 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest">
            Account
          </p>
          {accountNavItems.map((item) => {
            const isActive = pathname === item.href;
            return <NavLink key={item.href} item={item} isActive={isActive} onNavigate={onClose} />;
          })}
        </div>

        {/* User */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.03]">
            <div className="from-accent/20 text-accent ring-accent/20 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br to-amber-300/20 text-sm font-bold ring-1">
              U
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {displayName || 'Workspace Owner'}
              </p>
              <p className="text-vv-muted text-xs">{projectCount} project(s)</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function TopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname();

  const pageTitle = useMemo(() => {
    if (pathname === '/projects') return 'Projects';
    if (pathname.startsWith('/projects/new')) return 'Create Project';
    if (pathname.startsWith('/projects/')) return 'Project Workspace';
    if (pathname.startsWith('/timeline/')) return 'Timeline Editor';
    if (pathname.startsWith('/settings/keys')) return 'API Keys';
    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/generations')) return 'Generations';
    if (pathname.startsWith('/assets')) return 'Assets';
    return 'Dashboard';
  }, [pathname]);

  return (
    <header className="vv-topbar-shell sticky top-0 z-40 flex h-14 items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          className="text-vv-muted hover:text-vv-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.03] md:hidden"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 6.75h15m-15 5.25h15m-15 5.25h15"
            />
          </svg>
        </button>
        <BrandLogo href="/" compact className="md:hidden" />
        <div>
          <p className="text-sm font-semibold">{pageTitle}</p>
          <p className="text-vv-muted hidden text-xs sm:block">Production workspace</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/projects/new"
          className="vv-btn-secondary hidden px-3 py-2 text-xs sm:inline-flex"
        >
          New Project
        </Link>
        <button className="text-vv-muted hover:text-vv-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.03]">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="md:ml-sidebar flex flex-1 flex-col">
        <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'linear-gradient(165deg, rgba(11, 20, 34, 0.92), rgba(7, 13, 22, 0.94))',
            border: '1px solid rgba(82, 222, 255, 0.24)',
            color: '#edf4ff',
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
}
