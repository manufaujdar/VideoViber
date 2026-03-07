export type MarketingLink = { href: string; label: string };

export const marketingNavLinks: MarketingLink[] = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/showcase', label: 'Showcase' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export const marketingFooterLinks: Record<string, MarketingLink[]> = {
  Product: [
    { href: '/features', label: 'Features' },
    { href: '/showcase', label: 'Showcase' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/projects/new', label: 'New Project' },
  ],
  Company: [
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: '/careers', label: 'Careers' },
    { href: '/contact', label: 'Contact' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/security', label: 'Security' },
  ],
};

export const marketingFooterPills: MarketingLink[] = [
  { href: '/blog', label: 'Journal' },
  { href: '/security', label: 'Security' },
  { href: '/contact', label: 'Contact' },
];
