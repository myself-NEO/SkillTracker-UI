import type { RubricId } from '@content/shared/rubric';
import type { TrackId } from '@content/shared/types';

// Mock-interview sessions and the ticks of interactive checklists, ported from TheSWEguide's
// lib/progress/interviews.ts with the same field names, so its backups import (docs/plan.md,
// Phase 5). The session updates (the timed mock interviews) are ported with those, in Phase 6.

/** TheSWEguide's localStorage key for this state. */
export const INTERVIEWS_KEY = 'learning-interviews-v1';

/** How the learner rated themselves on a rubric dimension. */
export type SelfRating = 'got-it' | 'partial' | 'missed';

/** Phases of the HLD and LLD mock interviews (each track uses its own subset). */
export type PhaseId =
  | 'brief'
  | 'clarify'
  | 'requirements'
  // HLD
  | 'estimation'
  | 'api'
  | 'data-model'
  | 'architecture'
  | 'deep-dives'
  | 'bottlenecks'
  | 'tradeoffs'
  // LLD
  | 'entities'
  | 'class-design'
  | 'implementation'
  | 'edge-cases'
  | 'extensibility'
  | 'evaluation';

export interface AskedQuestion {
  text: string;
  /** Index of the scripted clarifying question it matched, or null when nothing matched. */
  matched: number | null;
  at: number;
}

export interface InterviewSession {
  startedAt: number;
  updatedAt: number;
  minutes: 45 | 60;
  phase: PhaseId;
  /** Milliseconds the timer ran while each phase was open. */
  timeInPhase: Partial<Record<PhaseId, number>>;
  /** Set while the timer is running: when the current stretch started. */
  runningSince?: number;
  asked: AskedQuestion[];
  /** The learner's own answers, keyed by phase id (or `deep:<n>` for a deep dive). */
  drafts: Record<string, string>;
  /** Hints shown per key. */
  hints: Record<string, number>;
  /** Reference answers opened, key → when. */
  revealed: Record<string, number>;
  /** Coverage items the learner confirmed they included, `${list}:${index}` → true. */
  checks: Record<string, boolean>;
  /** Capacity-estimation inputs as the learner left them. */
  estimate?: Record<string, number | string>;
  /** Source of the learner's diagram: Mermaid architecture (HLD) or a `uml` class diagram (LLD). */
  diagram?: string;
  /** Deep dives (HLD) or follow-ups (LLD) the learner chose to work on (indexes into the script's list). */
  deepDives?: number[];
  ratings: Partial<Record<RubricId, SelfRating>>;
}

export interface InterviewAttempt {
  completedAt: number;
  minutes: 45 | 60;
  elapsedMs: number;
  /** Rubric score 0-100: got it = 1, partially = 0.5, missed = 0. */
  score: number;
  ratings: Partial<Record<RubricId, SelfRating>>;
  /** Share of the scripted clarifying questions the learner asked about (0-1). */
  clarifyCoverage: number;
  hintsUsed: number;
}

export interface InterviewsState {
  /** `${track}:${problem}` → the attempt in progress */
  sessions: Record<string, InterviewSession>;
  /** `${track}:${problem}` → finished attempts, oldest first */
  history: Record<string, InterviewAttempt[]>;
  /** page key (`${track}:${kind}:${slug}`) → checklist item id → when it was ticked */
  checklists: Record<string, Record<string, number>>;
}

export const EMPTY_INTERVIEWS: InterviewsState = { sessions: {}, history: {}, checklists: {} };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Accepts anything JSON-parsed (stored state or an imported backup) and keeps only well-formed parts. */
export const sanitizeInterviews = (parsed: unknown): InterviewsState => {
  if (!isRecord(parsed)) return EMPTY_INTERVIEWS;
  const field = <T>(name: keyof InterviewsState) => (isRecord(parsed[name]) ? parsed[name] : {}) as Record<string, T>;
  return { sessions: field('sessions'), history: field('history'), checklists: field('checklists') };
};

const without = <T>(record: Record<string, T>, k: string) => {
  const { [k]: _removed, ...rest } = record;
  return rest;
};

/** Changes to the state, as pure functions (`now` is the timestamp to record). */
export const interviewUpdates = {
  toggleChecklistItem: (state: InterviewsState, pageKey: string, item: string, on: boolean, now: number): InterviewsState => {
    const list = state.checklists[pageKey] ?? {};
    if (Boolean(list[item]) === on) return state;
    const next = on ? { ...list, [item]: now } : without(list, item);
    return { ...state, checklists: { ...state.checklists, [pageKey]: next } };
  },
  /** Removes everything belonging to one track (keys start with the track id). */
  resetTrack: (state: InterviewsState, track: TrackId): InterviewsState => {
    const keep = <T>(record: Record<string, T>) =>
      Object.fromEntries(Object.entries(record).filter(([k]) => !k.startsWith(`${track}:`))) as Record<string, T>;
    return { sessions: keep(state.sessions), history: keep(state.history), checklists: keep(state.checklists) };
  },
};
