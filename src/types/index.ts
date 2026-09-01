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

// ---- decision trace (Kit Depth Upgrade, Stage A) ----
// Every non-deterministic or lookup-based pick the engine makes records itself here,
// at the point of the roll — same principle as naming.ts's composeRationale(), just
// generalized to every pick instead of only the name. This is what lets the kit render
// real "chosen X over Y because Z" prose instead of re-deriving a guess after the fact.

export type DecisionSource = "axis" | "category" | "field" | "random";

export interface Decision {
  id: string;
  subject: string;
  chosen: string;
  alternatives: { value: string; weight: number }[];
  reason: string;
  isDefault: boolean;
  source: DecisionSource;
}

// ---- classification axes (Kit Depth Upgrade, Stage A) ----
// Six orthogonal axes extracted from the same problem text the category classifier
// scores, so kit depth doesn't fan out from categoryId alone. temporality/interaction/
// stakes/scale are single-valued; dataOrigin/outputArtifact are multi-valued.

export type Temporality = "one-shot" | "scheduled" | "real-time" | "retrospective";
export type Interaction = "background" | "on-demand" | "collaborative";
export type DataOrigin = "entered" | "imported" | "fetched" | "sensed" | "derived";
export type OutputArtifact = "alert" | "report" | "dashboard" | "file" | "ranked-list" | "decision";
export type Stakes = "casual" | "operational" | "regulated";
export type Scale = "single-user" | "team" | "public";

export interface Axes {
  temporality: Temporality;
  interaction: Interaction;
  dataOrigin: DataOrigin[];
  outputArtifact: OutputArtifact[];
  stakes: Stakes;
  scale: Scale;
}

export interface ProjectIdea {
  id: string;
  name: string;
  namingRationale: string;
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
  axes: Axes;
  decisions: Decision[];
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
export type KitPhrasingMap = Record<string, string[]>;

export interface NamingSuffix {
  word: string;
  fitCategories: string[];
  meaning: string;
}

export interface NamingPrefix {
  word: string;
  fitCategories: string[];
  meaning: string;
}

export interface NamingBrandSuffix {
  word: string;
  meaning: string;
}

export interface NamingPatterns {
  suffixes: NamingSuffix[];
  prefixModifiers: NamingPrefix[];
  brandSuffixes: NamingBrandSuffix[];
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

// ---- IdeaSpec: the fact-expansion layer (Kit Depth Upgrade, Stage A) ----
// A pure derivation from an already-generated ProjectIdea (which now carries axes +
// decisions) — no new randomness, no new inputs. See src/engine/spec/ideaSpec.ts.

export type Provenance = "derived" | "axis" | "category-default" | "generic";

export interface EntityField {
  name: string;
  type: string;
  note?: string;
}

export interface Entity {
  name: string;
  fields: EntityField[];
  relations: string[];
}

export interface ScreenStates {
  default: string;
  loading: string;
  empty: string;
  error: string;
  success: string;
}

export interface Screen {
  name: string;
  purpose: string;
  states: ScreenStates;
}

export interface Route {
  path: string;
  screen: string;
  guard?: string;
}

export interface FnSig {
  name: string;
  params: string;
  returns: string;
  description: string;
}

export interface Risk {
  id: string;
  description: string;
  impact: string;
  mitigation: string;
  source: string;
}

export interface NotApplicable {
  section: string;
  reason: string;
}

export interface VRule {
  field: string;
  rule: string;
  reason: string;
}

export interface Task {
  id: string;
  goal: string;
  files: string[];
  dependsOn: string[];
  acceptance: string;
  commitMessage: string;
}

export interface IdeaSpec {
  idea: ProjectIdea;
  entities: Entity[];
  screens: Screen[];
  routes: Route[];
  moduleSurface: FnSig[];
  risks: Risk[];
  notApplicable: NotApplicable[];
  validationRules: VRule[];
  tasks: Task[];
  provenance: Record<string, Provenance>;
}
