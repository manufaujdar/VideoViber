export const pricingTiers = [
  {
    name: 'Pro Workspace',
    availability: 'Available now',
    summary:
      'Run the full engine locally. Configure custom providers, validate generation flows, and retain absolute control.',
    includes: [
      'Full UI workflow from project brief to timeline',
      'Unrestricted provider diagnostics & validation',
      'Zero synthetic billing meters or quotas',
      'Engineered for ultimate local prototyping',
    ],
    cta: { href: '/settings/keys', label: 'Configure Environment' },
  },
  {
    name: 'Studio Cloud',
    availability: 'Rolling out in phases',
    summary:
      'Uncompromising hosted performance. Managed reliability, strict deployment guardrails, and unified workspace governance.',
    includes: [
      'Centralized team workspace with role governance',
      'Frictionless managed deployments and updates',
      'Direct production support & incident tracing',
      'Built for teams pushing client-facing output',
    ],
    cta: { href: '/contact', label: 'Request Studio Access' },
  },
  {
    name: 'Cinema Enterprise',
    availability: 'By engagement',
    summary:
      'Bespoke architecture, compliant alignment, and dedicated deployment strategy for the most demanding scale.',
    includes: [
      'Deep security and governance integration',
      'Custom architecture and migration execution',
      'Priority escalation for mission-critical workflows',
      'Engineered for maximum scale and compliance',
    ],
    cta: { href: '/contact', label: 'Consult with Engineering' },
  },
] as const;

export const pricingFaq = [
  {
    q: 'Where are fixed dollar plans listed?',
    a: 'Public fixed-price tiers are not finalized yet. We currently prioritize transparent capability rollout over placeholder pricing tables.',
  },
  {
    q: 'Can I build with VideoViber today?',
    a: 'Yes. The developer workspace and provider diagnostics are already usable for implementation and internal testing.',
  },
  {
    q: 'Is provider usage billed through VideoViber?',
    a: 'In developer mode, provider usage is billed directly by your selected provider account (BYOK model).',
  },
  {
    q: 'How do teams join managed rollout?',
    a: 'Use the contact page with your workload profile, provider mix, and expected concurrency. We onboard by readiness and fit.',
  },
] as const;
