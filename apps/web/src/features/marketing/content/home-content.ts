export const homeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VideoViber',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  description:
    'AI-native video studio for building cinematic worlds with continuity memory, shot planning, and timeline direction.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export type ModePreset = {
  id: string;
  label: string;
  tone: string;
  description: string;
  previewImage: string;
  controls: { name: string; value: string; level: number }[];
};

export const marketingModePresets: ModePreset[] = [
  {
    id: 'mythic',
    label: 'ProRes Raw',
    tone: 'Unmatched Clarity',
    description:
      'Maximum dynamic range and zero-compression fidelity. Designed for pristine cinematic output and advanced color grading.',
    previewImage:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=80',
    controls: [
      { name: 'Lens Drift', value: 'Orbital', level: 72 },
      { name: 'Color Space', value: 'Rec.2020', level: 84 },
      { name: 'Sensor Size', value: 'Super 35', level: 92 },
    ],
  },
  {
    id: 'kinetic',
    label: 'Action Sequence',
    tone: 'High Velocity',
    description:
      'Unleash dynamic camera movements, aggressive speed ramps, and absolute precision for rhythm-driven edits.',
    previewImage:
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1600&q=80',
    controls: [
      { name: 'Shutter Angle', value: '45°', level: 88 },
      { name: 'Motion Blur', value: 'Minimal', level: 76 },
      { name: 'Stabilization', value: 'Adaptive', level: 69 },
    ],
  },
  {
    id: 'dream',
    label: 'Narrative Depth',
    tone: 'Story First',
    description:
      'Soft diffusion, intimate closeups, and fluid transitions engineered to evoke emotion and pure cinematic poetry.',
    previewImage:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80',
    controls: [
      { name: 'Aperture', value: 'f/1.4', level: 66 },
      { name: 'Diffusion', value: 'Pro-Mist 1/4', level: 93 },
      { name: 'Focus Pull', value: 'Automated', level: 95 },
    ],
  },
];

export const missionTracks = [
  {
    title: 'World Construction',
    description:
      'Transform a one-line concept into an expansive, coherent universe with unified lighting, architecture, and texture.',
    reward: 'Absolute Scale',
    difficulty: 'Studio',
    image:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Persistent Identity',
    description:
      'Lock character identity, wardrobe, and emotional arcs across perfectly consistent shots, scene after scene.',
    reward: 'Perfect Continuity',
    difficulty: 'Production',
    image:
      'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Non-Linear Mastery',
    description:
      'Compose reveal beats, bridge transitions, and climax pacing entirely within the multi-track timeline.',
    reward: 'Total Control',
    difficulty: 'Cinema',
    image:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=80',
  },
] as const;

export const showcaseShots = [
  {
    title: 'Eclipse Metropolis',
    meta: '8 sec • continuity active',
    image:
      'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: 'Signal Ocean',
    meta: '10 sec • atmosphere preset',
    image:
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: 'Portrait of Tomorrow',
    meta: '6 sec • style memory locked',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=80',
  },
] as const;

export const marketingPipeline = [
  {
    step: '01',
    title: 'Vision to Reality',
    description: 'Describe emotion, camera language, and narrative turn instead of writing brittle prompts.',
  },
  {
    step: '02',
    title: 'Automated Breakdown',
    description: 'VideoViber converts your brief into a precise shot list with guaranteed structural integrity.',
  },
  {
    step: '03',
    title: 'Real-Time Direction',
    description: 'Steer shots, lock characters, and swap providers natively inside the active timeline.',
  },
  {
    step: '04',
    title: 'Ship the Masterpiece',
    description: 'Export a flawless cinematic master with pristine continuity from first frame to final beat.',
  },
] as const;
