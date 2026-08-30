import type { FavoriteIdea, GenerationInput, Preferences, ProjectIdea, SessionState } from "@/types";

const KEYS = {
  favorites: "pz.favorites",
  preferences: "pz.preferences",
  sessionBatch: "pz.session.currentBatch",
  sessionSeenNames: "pz.session.seenNames",
  sessionLastInput: "pz.session.lastInput"
} as const;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function isValidIdea(value: unknown): value is ProjectIdea {
  if (typeof value !== "object" || value === null) return false;
  const idea = value as Partial<ProjectIdea>;
  return typeof idea.id === "string" && typeof idea.name === "string" && typeof idea.scores === "object";
}

// ---- favorites (localStorage, durable) ----

export function getFavorites(): FavoriteIdea[] {
  const raw = safeParse<unknown[]>(localStorage.getItem(KEYS.favorites), []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidIdea) as FavoriteIdea[];
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((idea) => idea.id === id);
}

export function addFavorite(idea: ProjectIdea): void {
  const current = getFavorites();
  const withoutExisting = current.filter((f) => f.id !== idea.id);
  const favorite: FavoriteIdea = { ...idea, favoritedAt: new Date().toISOString() };
  localStorage.setItem(KEYS.favorites, JSON.stringify([favorite, ...withoutExisting]));
}

export function removeFavorite(id: string): void {
  const current = getFavorites().filter((f) => f.id !== id);
  localStorage.setItem(KEYS.favorites, JSON.stringify(current));
}

// ---- preferences (localStorage, durable) ----

const DEFAULT_PREFERENCES: Preferences = { theme: "system" };

export function getPreferences(): Preferences {
  return safeParse<Preferences>(localStorage.getItem(KEYS.preferences), DEFAULT_PREFERENCES);
}

export function setPreferences(patch: Partial<Preferences>): void {
  const next = { ...getPreferences(), ...patch };
  localStorage.setItem(KEYS.preferences, JSON.stringify(next));
}

// ---- session (sessionStorage, cleared when the tab closes) ----

export function getSession(): SessionState {
  return {
    currentBatch: safeParse<ProjectIdea[]>(sessionStorage.getItem(KEYS.sessionBatch), []),
    seenNames: safeParse<string[]>(sessionStorage.getItem(KEYS.sessionSeenNames), []),
    lastInput: safeParse<GenerationInput | null>(sessionStorage.getItem(KEYS.sessionLastInput), null)
  };
}

export function setSessionBatch(batch: ProjectIdea[]): void {
  sessionStorage.setItem(KEYS.sessionBatch, JSON.stringify(batch));
}

export function addSeenNames(names: string[]): void {
  const current = safeParse<string[]>(sessionStorage.getItem(KEYS.sessionSeenNames), []);
  const next = Array.from(new Set([...current, ...names]));
  sessionStorage.setItem(KEYS.sessionSeenNames, JSON.stringify(next));
}

export function setLastInput(input: GenerationInput): void {
  sessionStorage.setItem(KEYS.sessionLastInput, JSON.stringify(input));
}

export function findIdeaById(id: string): ProjectIdea | undefined {
  const favorite = getFavorites().find((f) => f.id === id);
  if (favorite) return favorite;
  return getSession().currentBatch.find((idea) => idea.id === id);
}
