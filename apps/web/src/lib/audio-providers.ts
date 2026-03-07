export type AudioProviderId =
  | 'elevenlabs'
  | 'playht'
  | 'whisperflow'
  | 'openai-tts'
  | 'google-tts'
  | 'amazon-polly';

export type AudioProviderCatalogItem = {
  id: AudioProviderId;
  name: string;
  shortName: string;
  description: string;
  docsUrl: string;
  gradient: string;
  letter: string;
  envVars: string[];
  voices: { id: string; label: string; accent?: string }[];
  features: string[];
};

export const audioProviderCatalog: AudioProviderCatalogItem[] = [
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    shortName: 'XI',
    description: 'Ultra-realistic AI voices with emotion control and voice cloning',
    docsUrl: 'https://elevenlabs.io/docs',
    gradient: 'from-violet-500/15 to-purple-500/15',
    letter: 'E',
    envVars: ['ELEVENLABS_API_KEY'],
    voices: [
      { id: 'rachel', label: 'Rachel', accent: 'American' },
      { id: 'clyde', label: 'Clyde', accent: 'American' },
      { id: 'domi', label: 'Domi', accent: 'American' },
      { id: 'dave', label: 'Dave', accent: 'British' },
      { id: 'fin', label: 'Fin', accent: 'Irish' },
      { id: 'sarah', label: 'Sarah', accent: 'American' },
      { id: 'antoni', label: 'Antoni', accent: 'American' },
      { id: 'elli', label: 'Elli', accent: 'American' },
      { id: 'josh', label: 'Josh', accent: 'American' },
      { id: 'arnold', label: 'Arnold', accent: 'American' },
      { id: 'charlotte', label: 'Charlotte', accent: 'Swedish' },
      { id: 'matilda', label: 'Matilda', accent: 'Australian' },
    ],
    features: ['Voice Cloning', 'Emotion Control', 'Stability Slider', 'Style Exaggeration', 'Multilingual v2'],
  },
  {
    id: 'playht',
    name: 'PlayHT',
    shortName: 'PH',
    description: 'High-fidelity text-to-speech with 900+ voices and ultra-realistic prosody',
    docsUrl: 'https://docs.play.ht/',
    gradient: 'from-pink-500/15 to-rose-500/15',
    letter: 'P',
    envVars: ['PLAYHT_API_KEY', 'PLAYHT_USER_ID'],
    voices: [
      { id: 'jennifer', label: 'Jennifer', accent: 'American' },
      { id: 'michael', label: 'Michael', accent: 'American' },
      { id: 'emma', label: 'Emma', accent: 'British' },
      { id: 'james', label: 'James', accent: 'British' },
      { id: 'sofia', label: 'Sofia', accent: 'Spanish' },
      { id: 'hiroshi', label: 'Hiroshi', accent: 'Japanese' },
      { id: 'marie', label: 'Marie', accent: 'French' },
      { id: 'hans', label: 'Hans', accent: 'German' },
    ],
    features: ['Ultra Realistic', '900+ Voices', 'Streaming Audio', 'SSML Support', 'Voice Cloning'],
  },
  {
    id: 'whisperflow',
    name: 'WhisperFlow',
    shortName: 'WF',
    description: 'Whisper-based voice synthesis with precise phonetic control and low latency',
    docsUrl: 'https://whisperflow.ai/docs',
    gradient: 'from-cyan-500/15 to-teal-500/15',
    letter: 'W',
    envVars: ['WHISPERFLOW_API_KEY'],
    voices: [
      { id: 'nova', label: 'Nova', accent: 'American' },
      { id: 'atlas', label: 'Atlas', accent: 'American' },
      { id: 'iris', label: 'Iris', accent: 'British' },
      { id: 'sol', label: 'Sol', accent: 'Australian' },
      { id: 'luna', label: 'Luna', accent: 'American' },
      { id: 'orion', label: 'Orion', accent: 'British' },
    ],
    features: ['Low Latency', 'Phonetic Control', 'Real-time Streaming', 'Multi-speaker', 'Whisper Backend'],
  },
  {
    id: 'openai-tts',
    name: 'OpenAI TTS',
    shortName: 'OA',
    description: 'Natural-sounding speech from OpenAI with Alloy, Echo, Fable, Onyx, Nova, and Shimmer voices',
    docsUrl: 'https://platform.openai.com/docs/guides/text-to-speech',
    gradient: 'from-emerald-500/15 to-green-500/15',
    letter: 'O',
    envVars: ['OPENAI_API_KEY'],
    voices: [
      { id: 'alloy', label: 'Alloy', accent: 'Neutral' },
      { id: 'echo', label: 'Echo', accent: 'Neutral' },
      { id: 'fable', label: 'Fable', accent: 'British' },
      { id: 'onyx', label: 'Onyx', accent: 'Neutral' },
      { id: 'nova', label: 'Nova', accent: 'Neutral' },
      { id: 'shimmer', label: 'Shimmer', accent: 'Neutral' },
    ],
    features: ['HD Quality', 'tts-1 / tts-1-hd Models', 'Low Latency', 'Streaming', 'Multiple Formats'],
  },
  {
    id: 'google-tts',
    name: 'Google Cloud TTS',
    shortName: 'GC',
    description: 'WaveNet and Neural2 voices from Google Cloud with 40+ languages',
    docsUrl: 'https://cloud.google.com/text-to-speech/docs',
    gradient: 'from-blue-500/15 to-sky-500/15',
    letter: 'G',
    envVars: ['GOOGLE_TTS_API_KEY'],
    voices: [
      { id: 'wavenet-a', label: 'WaveNet A', accent: 'American' },
      { id: 'wavenet-b', label: 'WaveNet B', accent: 'American' },
      { id: 'wavenet-c', label: 'WaveNet C', accent: 'British' },
      { id: 'neural2-a', label: 'Neural2 A', accent: 'American' },
      { id: 'neural2-d', label: 'Neural2 D', accent: 'American' },
      { id: 'studio-o', label: 'Studio O', accent: 'American' },
    ],
    features: ['WaveNet', 'Neural2', '40+ Languages', 'SSML', 'Audio Profiles'],
  },
  {
    id: 'amazon-polly',
    name: 'Amazon Polly',
    shortName: 'AP',
    description: 'AWS neural TTS engine with NTTS voices and speech marks for lip sync',
    docsUrl: 'https://docs.aws.amazon.com/polly/',
    gradient: 'from-amber-500/15 to-orange-500/15',
    letter: 'A',
    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
    voices: [
      { id: 'joanna', label: 'Joanna', accent: 'American' },
      { id: 'matthew', label: 'Matthew', accent: 'American' },
      { id: 'amy', label: 'Amy', accent: 'British' },
      { id: 'brian', label: 'Brian', accent: 'British' },
      { id: 'lucia', label: 'Lucia', accent: 'Spanish' },
      { id: 'takumi', label: 'Takumi', accent: 'Japanese' },
    ],
    features: ['Neural TTS', 'Speech Marks', 'Lip Sync Data', 'SSML', 'Newscaster Style'],
  },
];

export type SoundLibrary = {
  id: string;
  name: string;
  description: string;
  url: string;
  license: string;
  licenseUrl: string;
  category: 'sfx' | 'music';
  gradient: string;
};

export const soundLibraries: SoundLibrary[] = [
  {
    id: 'freesound',
    name: 'Freesound',
    description: 'Collaborative database of CC-licensed audio clips, field recordings, and sound effects',
    url: 'https://freesound.org',
    license: 'CC0 / CC-BY / CC-BY-NC',
    licenseUrl: 'https://freesound.org/help/faq/#licenses',
    category: 'sfx',
    gradient: 'from-sky-500/15 to-blue-500/15',
  },
  {
    id: 'pixabay-music',
    name: 'Pixabay Music',
    description: 'Free-to-use royalty-free music tracks and sound effects for any project',
    url: 'https://pixabay.com/music',
    license: 'Pixabay Content License (Free)',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    category: 'music',
    gradient: 'from-emerald-500/15 to-teal-500/15',
  },
  {
    id: 'bbc-sfx',
    name: 'BBC Sound Effects',
    description: '33,000+ sound effects from the BBC Archive — nature, machines, ambiences',
    url: 'https://sound-effects.bbcrewind.co.uk',
    license: 'RemArc License (Personal/Educational)',
    licenseUrl: 'https://sound-effects.bbcrewind.co.uk/licensing',
    category: 'sfx',
    gradient: 'from-red-500/15 to-rose-500/15',
  },
  {
    id: 'opengameart',
    name: 'OpenGameArt',
    description: 'Open-source game audio assets — ambient loops, UI sounds, and cinematic scores',
    url: 'https://opengameart.org',
    license: 'CC0 / CC-BY / GPL',
    licenseUrl: 'https://opengameart.org/content/faq#licenses',
    category: 'sfx',
    gradient: 'from-green-500/15 to-lime-500/15',
  },
  {
    id: 'incompetech',
    name: 'Incompetech (Kevin MacLeod)',
    description: 'Royalty-free background music across every genre — cinematic, electronic, orchestral',
    url: 'https://incompetech.com/music/royalty-free/music.html',
    license: 'CC-BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    category: 'music',
    gradient: 'from-purple-500/15 to-violet-500/15',
  },
];
