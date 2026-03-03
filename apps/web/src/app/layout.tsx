import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const outfit = Outfit({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-outfit',
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#52deff',
};

export const metadata: Metadata = {
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_SITE_URL ?? 'https://video-viber.vercel.app'
    ),
    manifest: '/manifest.webmanifest',
    title: {
        default: 'VideoViber — From Vibe to First Cut',
        template: '%s | VideoViber',
    },
    description:
        'Agentic spec-driven video workspace. Turn vague creative intent into an editable first cut using multiple AI video providers.',
    keywords: ['video', 'AI', 'generation', 'creative', 'workspace', 'timeline', 'video editing', 'AI video'],
    openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: 'VideoViber',
        title: 'VideoViber — From Vibe to First Cut',
        description:
            'Turn vague creative intent into an editable first cut using AI video providers like Runway, Veo, and Luma.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'VideoViber — From Vibe to First Cut',
        description:
            'Agentic spec-driven video workspace. From creative brief to editable timeline in under 10 minutes.',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
    },
    appleWebApp: {
        capable: true,
        title: 'VideoViber',
        statusBarStyle: 'black-translucent',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`dark ${outfit.variable}`} suppressHydrationWarning>
            <body className="min-h-screen bg-vv-base font-sans text-vv-primary antialiased">
                <Script id="videoviber-performance-mode" strategy="beforeInteractive">
                    {`
                      (function () {
                        try {
                          var doc = document.documentElement;
                          var media = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
                          var reducedMotion = !!(media && media.matches);
                          var nav = window.navigator || {};
                          var conn = nav.connection || nav.mozConnection || nav.webkitConnection;
                          var saveData = !!(conn && conn.saveData);
                          var lowCores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency <= 4 : false;
                          var lowMemory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory <= 4 : false;
                          if (reducedMotion || saveData || lowCores || lowMemory) {
                            doc.classList.add('vv-low-motion');
                          }
                        } catch (error) {}
                      })();
                    `}
                </Script>
                {children}
            </body>
        </html>
    );
}
