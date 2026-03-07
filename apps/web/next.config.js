const path = require('path');

const securityHeaders = [
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
    },
    {
        key: 'X-XSS-Protection',
        value: '0'
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    },
    {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin'
    },
    {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-origin'
    },
    {
        key: 'X-Permitted-Cross-Domain-Policies',
        value: 'none'
    }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    transpilePackages: [
        '@videoviber/ui',
        '@videoviber/types',
        '@videoviber/db',
        '@videoviber/sdk',
        '@videoviber/config',
    ],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'plus.unsplash.com',
            },
        ],
    },
    experimental: {
        outputFileTracingRoot: path.join(__dirname, '../../'),
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ];
    },
};

module.exports = nextConfig;
