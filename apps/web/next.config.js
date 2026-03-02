/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [
        '@videoviber/ui',
        '@videoviber/types',
        '@videoviber/db',
    ],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
        ],
    },
    experimental: {
        optimizePackageImports: ['lucide-react', 'framer-motion'],
    },
};

module.exports = nextConfig;
