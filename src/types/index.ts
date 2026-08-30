export type BuildSize = "Tiny" | "Small" | "Medium" | "Large";
export type AiRequired = "Yes" | "No" | "Optional";
export type PotentialLevel = "Low" | "Medium" | "High";

export interface GenerationInput {
  fieldId: string;
  niche: string;
  problem: string;
  targetUsers?: string;
}

export interface ProjectScores {
  usefulness: number;
  originality: number;
  buildability: number;
  communityValue: number;
  openSourceSuitability: number;
  scope: number;
  difficulty: number;
}

export interface ProjectIdea {
  id: string;
  name: string;
  tagline: string;
  fieldId: string;
  fieldName: string;
  nicheLabel: string;
  problemInput: string;
  targetUsers: string;
  whyItShouldExist: string;
  solution: string;
  coreFeatures: string[];
  mvpFeatures: string[];
  futureFeatures: string[];
  techStack: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  buildSize: BuildSize;
  aiRequired: AiRequired;
  openSourcePotential: PotentialLevel;
  communityValue: PotentialLevel;
  githubDescription: string;
  scores: ProjectScores;
  categoryId: string;
  categoryName: string;
  createdAt: string;
}

export interface FavoriteIdea extends ProjectIdea {
  favoritedAt: string;
}

export interface Preferences {
  theme: "light" | "dark" | "system";
}

export interface SessionState {
  currentBatch: ProjectIdea[];
  seenNames: string[];
  lastInput: GenerationInput | null;
}

// ---- knowledge base shapes ----

export interface FieldDef {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  domainWords: string[];
  defaultAudiences: string[];
}

export interface NicheDef {
  id: string;
  label: string;
  compatibleFields: string[];
  compatibleCategories: string[];
}

export interface AudienceDef {
  id: string;
  label: string;
  compatibleFields: string[];
}

export interface WeightedKeyword {
  term: string;
  weight: number;
}

export interface ProblemTypeDef {
  id: string;
  name: string;
  description: string;
  keywords: WeightedKeyword[];
}

export type CapabilitiesMap = Record<string, string[]>;

export interface NamingSuffix {
  word: string;
  fitCategories: string[];
}

export interface NamingPrefix {
  word: string;
  fitCategories: string[];
}

export interface NamingPatterns {
  suffixes: NamingSuffix[];
  prefixModifiers: NamingPrefix[];
  brandSuffixes: string[];
  genericActionWords: string[];
  genericOutcomeWords: string[];
  maxNameLength: number;
}

export type TechStackVariant = "cli" | "webDashboard" | "browserOnly";
export type TechStacksMap = Record<string, Record<TechStackVariant, string[]>>;

export interface CategoryTemplate {
  taglines: string[];
  why: string[];
  solution: string[];
  githubDesc: string[];
}

export type ProjectTemplatesMap = Record<string, CategoryTemplate>;

export interface ClassificationResult {
  categoryId: string;
  score: number;
}
