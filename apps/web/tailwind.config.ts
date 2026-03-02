import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/**/*.{ts,tsx}',
        '../../packages/ui/src/**/*.{ts,tsx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // ─── Background ─────────────────────────
                'vv-base': '#0a0a0b',
                'vv-surface': '#141416',
                'vv-elevated': '#1c1c1f',
                'vv-overlay': '#242428',
                'vv-hover': '#2a2a2f',

                // ─── Border ─────────────────────────────
                'vv-border-subtle': '#2a2a2e',
                'vv-border': '#3a3a3f',
                'vv-border-strong': '#4a4a50',

                // ─── Text ───────────────────────────────
                'vv-primary': '#fafafa',
                'vv-secondary': '#a1a1aa',
                'vv-muted': '#71717a',
                'vv-disabled': '#52525b',

                // ─── Accent ─────────────────────────────
                accent: {
                    DEFAULT: '#7c3aed',
                    hover: '#8b5cf6',
                    muted: 'rgba(124, 58, 237, 0.15)',
                    subtle: 'rgba(124, 58, 237, 0.08)',
                },

                // ─── Status ─────────────────────────────
                success: { DEFAULT: '#10b981', muted: 'rgba(16, 185, 129, 0.15)' },
                warning: { DEFAULT: '#f59e0b', muted: 'rgba(245, 158, 11, 0.15)' },
                error: { DEFAULT: '#ef4444', muted: 'rgba(239, 68, 68, 0.15)' },
                info: { DEFAULT: '#0ea5e9', muted: 'rgba(14, 165, 233, 0.15)' },

                // ─── Generation State ───────────────────
                state: {
                    draft: '#6b7280',
                    planned: '#8b5cf6',
                    queued: '#f59e0b',
                    submitted: '#f59e0b',
                    processing: '#3b82f6',
                    completed: '#10b981',
                    failed: '#ef4444',
                    canceled: '#6b7280',
                    expired: '#6b7280',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
            },
            fontSize: {
                xs: ['0.75rem', { lineHeight: '1rem' }],
                sm: ['0.8125rem', { lineHeight: '1.25rem' }],
                base: ['0.875rem', { lineHeight: '1.5rem' }],
                lg: ['1.125rem', { lineHeight: '1.75rem' }],
                xl: ['1.5rem', { lineHeight: '2rem' }],
                '2xl': ['2.25rem', { lineHeight: '2.5rem' }],
                '3xl': ['3rem', { lineHeight: '1' }],
            },
            borderRadius: {
                sm: '6px',
                md: '8px',
                lg: '12px',
                xl: '16px',
            },
            boxShadow: {
                sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
                md: '0 4px 6px rgba(0, 0, 0, 0.3)',
                lg: '0 10px 15px rgba(0, 0, 0, 0.4)',
                xl: '0 20px 25px rgba(0, 0, 0, 0.5)',
            },
            spacing: {
                sidebar: '240px',
                'sidebar-collapsed': '64px',
            },
            transitionDuration: {
                fast: '150ms',
                normal: '250ms',
                slow: '350ms',
            },
            zIndex: {
                dropdown: '50',
                sticky: '100',
                overlay: '200',
                modal: '300',
                toast: '400',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 2s linear infinite',
            },
        },
    },
    plugins: [],
};

export default config;
