import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-outfit',
});

export const metadata: Metadata = {
    title: 'VideoViber — From Vibe to First Cut',
    description:
        'Agentic spec-driven video workspace. Turn vague creative intent into an editable first cut using multiple AI video providers.',
    keywords: ['video', 'AI', 'generation', 'creative', 'workspace', 'timeline'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`dark ${outfit.variable}`}>
            <body className="min-h-screen bg-vv-base font-sans text-vv-primary antialiased">
                {children}
            </body>
        </html>
    );
}
