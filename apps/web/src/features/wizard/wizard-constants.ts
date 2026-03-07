/* ─── Wizard Page Definitions ──────────────────────────── */

export interface WizardPageDef {
  page: number;
  slug: string;
  route: string;
  title: string;
  shortTitle: string;
  description: string;
  group: 'intelligence' | 'creation' | 'planning' | 'production' | 'launch';
  skippable: boolean;
  agentName?: string;
}

export const WIZARD_PAGES: WizardPageDef[] = [
  {
    page: 1,
    slug: '',
    route: '/projects/new',
    title: 'Idea Intake',
    shortTitle: 'Idea',
    description: 'Describe your video idea, target platform, and audience.',
    group: 'intelligence',
    skippable: false,
  },
  {
    page: 2,
    slug: 'requirement',
    route: '/projects/new/requirement',
    title: 'AI Requirement Report',
    shortTitle: 'Requirements',
    description: 'AI analyzes your idea and generates a detailed project requirement report.',
    group: 'intelligence',
    skippable: false,
    agentName: 'Requirement Analyst',
  },
  {
    page: 3,
    slug: 'research',
    route: '/projects/new/research',
    title: 'Trend & Topic Research',
    shortTitle: 'Research',
    description: 'AI researches trends, audience patterns, and content opportunities.',
    group: 'intelligence',
    skippable: true,
    agentName: 'Trend Researcher',
  },
  {
    page: 4,
    slug: 'gaps',
    route: '/projects/new/gaps',
    title: 'Gap Detection',
    shortTitle: 'Gaps',
    description: 'Identify missing information before project creation.',
    group: 'intelligence',
    skippable: true,
    agentName: 'Gap Detector',
  },
  {
    page: 5,
    slug: 'create',
    route: '/projects/new/create',
    title: 'Project Creation',
    shortTitle: 'Create',
    description: 'Create your project workspace from approved intelligence.',
    group: 'creation',
    skippable: false,
  },
  {
    page: 6,
    slug: 'strategy',
    route: '/projects/new/strategy',
    title: 'Strategic Planning',
    shortTitle: 'Strategy',
    description: 'AI creates a strategic content plan based on your approved research.',
    group: 'planning',
    skippable: true,
    agentName: 'Strategy Planner',
  },
  {
    page: 7,
    slug: 'context',
    route: '/projects/new/context',
    title: 'Context Bible',
    shortTitle: 'Context',
    description: 'Build the context rules that guide all downstream AI agents.',
    group: 'planning',
    skippable: true,
  },
  {
    page: 8,
    slug: 'assets',
    route: '/projects/new/assets',
    title: 'Asset Intake',
    shortTitle: 'Assets',
    description: 'Upload reference images, videos, and brand assets for the project.',
    group: 'planning',
    skippable: true,
  },
  {
    page: 9,
    slug: 'concepts',
    route: '/projects/new/concepts',
    title: 'Concept Variations',
    shortTitle: 'Concepts',
    description: 'AI generates concept directions. Select the one that best fits.',
    group: 'planning',
    skippable: false,
    agentName: 'Concept Generator',
  },
  {
    page: 10,
    slug: 'script',
    route: '/projects/new/script',
    title: 'Script Blueprint',
    shortTitle: 'Script',
    description: 'AI writes the script and a critic agent reviews it for quality.',
    group: 'planning',
    skippable: false,
    agentName: 'Script Writer',
  },
  {
    page: 11,
    slug: 'scenes',
    route: '/projects/new/scenes',
    title: 'Scene Breakdown',
    shortTitle: 'Scenes',
    description: 'AI breaks the script into production-ready scenes.',
    group: 'production',
    skippable: false,
    agentName: 'Scene Architect',
  },
  {
    page: 12,
    slug: 'shots',
    route: '/projects/new/shots',
    title: 'Shot Planning',
    shortTitle: 'Shots',
    description: 'Define shots with AI prompts, camera angles, and motion.',
    group: 'production',
    skippable: false,
    agentName: 'Shot Planner',
  },
  {
    page: 13,
    slug: 'audio',
    route: '/projects/new/audio',
    title: 'Audio & Effects',
    shortTitle: 'Audio',
    description: 'Plan music, SFX, voiceover, and transitions.',
    group: 'production',
    skippable: true,
    agentName: 'Audio Director',
  },
  {
    page: 14,
    slug: 'timeline',
    route: '/projects/new/timeline-review',
    title: 'Timeline Review',
    shortTitle: 'Timeline',
    description: 'Review the assembled timeline before production.',
    group: 'production',
    skippable: false,
  },
  {
    page: 15,
    slug: 'readiness',
    route: '/projects/new/readiness',
    title: 'Production Readiness',
    shortTitle: 'Readiness',
    description: 'AI audits the full production plan — checks for gaps, weak prompts, and alignment.',
    group: 'launch',
    skippable: false,
    agentName: 'QA Readiness',
  },
  {
    page: 16,
    slug: 'launch',
    route: '/projects/new/launch',
    title: 'Launch & Export',
    shortTitle: 'Launch',
    description: 'Final production pack summary. Import to project workspace and start generating.',
    group: 'launch',
    skippable: false,
  },
];

export const PAGE_GROUPS = [
  { id: 'intelligence', label: 'Pre-Project Intelligence', pages: [1, 2, 3, 4] },
  { id: 'creation', label: 'Project Creation', pages: [5] },
  { id: 'planning', label: 'Creative Planning', pages: [6, 7, 8, 9, 10] },
  { id: 'production', label: 'Production Pipeline', pages: [11, 12, 13, 14] },
  { id: 'launch', label: 'Launch', pages: [15, 16] },
] as const;

export const TOTAL_PAGES = WIZARD_PAGES.length;

export const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', icon: '▶' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'twitter', label: 'X / Twitter', icon: '𝕏' },
  { id: 'custom', label: 'Custom', icon: '⚙' },
] as const;

export const VIDEO_GOALS = [
  { id: 'brand_awareness', label: 'Brand Awareness' },
  { id: 'product_demo', label: 'Product Demo' },
  { id: 'explainer', label: 'Explainer' },
  { id: 'promo', label: 'Promotional' },
  { id: 'storytelling', label: 'Storytelling' },
  { id: 'educational', label: 'Educational' },
  { id: 'social_reel', label: 'Social Reel' },
  { id: 'ad_creative', label: 'Ad Creative' },
  { id: 'vlog', label: 'Vlog' },
  { id: 'other', label: 'Other' },
] as const;

export const STYLE_PRESETS = [
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'vibrant', label: 'Vibrant' },
  { id: 'retro', label: 'Retro' },
  { id: 'neon', label: 'Neon' },
  { id: 'documentary', label: 'Documentary' },
  { id: 'anime', label: 'Anime' },
  { id: 'photorealistic', label: 'Photorealistic' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'corporate', label: 'Corporate' },
] as const;
