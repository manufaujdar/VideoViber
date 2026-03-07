/* ─── Wizard Document Types ─────────────────────────────── */

export type DocumentStatus =
  | 'empty'
  | 'draft'
  | 'user_edited'
  | 'approved'
  | 'locked'
  | 'needs_review';

export interface DocumentWithState<T> {
  data: T | null;
  status: DocumentStatus;
  confidence: number; // 0-1
  assumptions: string[];
  userNotes: string[];
  lockedSections: string[];
  lastUpdated: string;
}

export function emptyDocument<T>(): DocumentWithState<T> {
  return {
    data: null,
    status: 'empty',
    confidence: 0,
    assumptions: [],
    userNotes: [],
    lockedSections: [],
    lastUpdated: '',
  };
}

/* ─── Stage 0: Idea Intake ─────────────────────────────── */

export interface IdeaIntakeData {
  rawIdea: string;
  targetPlatform: string;
  roughAudience: string;
  videoGoal: string;
  referenceLinks: string[];
  preferredStyle: string;
}

export const emptyIdeaIntake: IdeaIntakeData = {
  rawIdea: '',
  targetPlatform: '',
  roughAudience: '',
  videoGoal: '',
  referenceLinks: [],
  preferredStyle: '',
};

/* ─── Stage 1-2: Requirement Report ────────────────────── */

export interface RequirementReportSection {
  id: string;
  title: string;
  content: string;
  status: DocumentStatus;
}

export interface RequirementReport {
  projectObjective: string;
  audienceUnderstanding: string;
  contentFormat: string;
  recommendedDuration: string;
  visualStyleDirections: string;
  scriptStructure: string;
  assetRequirements: string;
  missingInformation: string;
  musicEffectDirection: string;
  productionRisks: string;
  platformRecommendations: string;
  suggestedWorkflow: string;
  sections: RequirementReportSection[];
}

/* ─── Stage 3: Research Summary ────────────────────────── */

export interface ResearchCard {
  id: string;
  title: string;
  description: string;
  category: 'trend' | 'competitor' | 'opportunity' | 'avoid' | 'hook' | 'style';
  relevance: number; // 0-1
  selected: boolean;
}

export interface ResearchSummary {
  trendSummary: string;
  competitorSummary: string;
  contentOpportunities: string;
  anglesToAvoid: string;
  recommendedDirections: string;
  cards: ResearchCard[];
}

/* ─── Stage 4: Gap Checklist ───────────────────────────── */

export interface GapItem {
  id: string;
  area: string;
  description: string;
  severity: 'critical' | 'important' | 'optional';
  filled: boolean;
  userInput: string;
  skipped: boolean;
}

export interface GapChecklist {
  items: GapItem[];
  summary: string;
}

/* ─── Stage 5: Project Creation ────────────────────────── */

export interface ProjectCreationData {
  suggestedName: string;
  name: string;
  summary: string;
  category: string;
  tags: string[];
  provider: string;
}

/* ─── Stage 6: Strategy Brief ──────────────────────────── */

export interface StrategyBrief {
  contentObjective: string;
  narrativeStrategy: string;
  viewerJourney: string;
  videoStyle: string;
  durationRecommendation: string;
  contentArchitecture: string;
}

/* ─── Stage 7: Context Bible ───────────────────────────── */

export interface ContextBible {
  subjectContext: string;
  worldContext: string;
  messageContext: string;
  continuityRules: string;
  brandVoice: string;
  visualIdentity: string;
}

/* ─── Stage 8: Asset Intake ────────────────────────────── */

export interface UploadedAsset {
  id: string;
  fileName: string;
  fileType: 'image' | 'video' | 'audio' | 'document';
  url: string;
  storagePath: string;
  sizeBytes: number;
  description: string;
}

export interface AssetIntakeData {
  uploadedAssets: UploadedAsset[];
  referenceNotes: string;
}

export const emptyAssetIntake: AssetIntakeData = {
  uploadedAssets: [],
  referenceNotes: '',
};

/* ─── Stage 9: Concept Variations ──────────────────────── */

export interface ConceptDirection {
  id: string;
  name: string;
  description: string;
  approach: string;
  visualMood: string;
  narrativeStyle: string;
  selected: boolean;
}

export interface ConceptVariations {
  directions: ConceptDirection[];
  selectedId: string | null;
}

/* ─── Stage 10: Script + Critique ──────────────────────── */

export interface ScriptDraft {
  hook: string;
  body: string;
  cta: string;
  fullScript: string;
  visualNotes: string;
}

export interface CritiqueReport {
  clarityScore: number;
  retentionScore: number;
  persuasionScore: number;
  flaggedLines: Array<{ line: string; issue: string; suggestion: string }>;
  overallFeedback: string;
}

export interface SceneItem {
  id: string;
  title: string;
  purpose: string;
  duration: number;
  visualDescription: string;
  transition: string;
  order: number;
}

export interface ShotItem {
  id: string;
  sceneId: string;
  title: string;
  prompt: string;
  negativePrompt: string;
  cameraAngle: string;
  motion: string;
  lighting: string;
  continuityTags: string[];
  duration: number;
  order: number;
}

export interface ReadinessCheckItem {
  id: string;
  check: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface ReadinessReport {
  overallStatus: 'ready' | 'warnings' | 'not_ready';
  checks: ReadinessCheckItem[];
  summary: string;
}

/* ─── Stage 11: Scene Breakdown ───────────────────────── */

export interface SceneBreakdown {
  scenes: SceneItem[];
  totalDuration: number;
  sceneCount: number;
}

/* ─── Stage 12: Shot Plan ─────────────────────────────── */

export interface ShotPlan {
  shots: ShotItem[];
  totalShots: number;
  estimatedRenderTime: string;
}

/* ─── Stage 13: Audio & Effects ───────────────────────── */

export interface AudioTrack {
  id: string;
  type: 'music' | 'sfx' | 'voiceover' | 'ambient';
  label: string;
  description: string;
  startTime: number;
  duration: number;
  sceneId: string;
  volume: number;
  source: string;
}

export interface AudioPlan {
  tracks: AudioTrack[];
  voiceoverScript: string;
  musicMood: string;
  overallNotes: string;
}

/* ─── Stage 14: Timeline Review ───────────────────────── */

export interface TimelineEntry {
  id: string;
  type: 'scene' | 'shot' | 'audio' | 'transition';
  label: string;
  startTime: number;
  duration: number;
  sceneId?: string;
  shotId?: string;
  details: string;
}

export interface TimelineReview {
  entries: TimelineEntry[];
  totalDuration: number;
  warnings: string[];
  approved: boolean;
}
