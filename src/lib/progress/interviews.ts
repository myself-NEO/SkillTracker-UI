import type { RubricId } from '@content/shared/rubric';
import type { TrackId } from '@content/shared/types';

// Mock-interview sessions and attempts, and the ticks of interactive checklists, ported from
// TheSWEguide's lib/progress/interviews.ts with the same field names, so its backups import, and
// with each change a pure function from the old state to the new one. The app's InterviewsStore
// keeps the state.

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

// --- Reading stored state ------------------------------------------------------------------------

const PHASE_IDS: readonly string[] = [
  'brief',
  'clarify',
  'requirements',
  'estimation',
  'api',
  'data-model',
  'architecture',
  'deep-dives',
  'bottlenecks',
  'tradeoffs',
  'entities',
  'class-design',
  'implementation',
  'edge-cases',
  'extensibility',
  'evaluation',
];
const RATINGS: readonly string[] = ['got-it', 'partial', 'missed'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** The well-formed entries of a record; `read` returns undefined for an entry to drop. */
const entries = <T>(field: unknown, read: (value: unknown) => T | undefined): Record<string, T> => {
  if (!isRecord(field)) return {};
  const out: [string, T][] = [];
  for (const [key, value] of Object.entries(field)) {
    if (key === '__proto__') continue;
    const entry = read(value);
    if (entry !== undefined) out.push([key, entry]);
  }
  return Object.fromEntries(out);
};

const numbers = (field: unknown) => entries(field, (value) => (isNumber(value) ? value : undefined));
const texts = (field: unknown) => entries(field, (value) => (typeof value === 'string' ? value : undefined));
const ratings = (field: unknown) =>
  entries(field, (value) => (RATINGS.includes(value as string) ? (value as SelfRating) : undefined)) as Partial<
    Record<RubricId, SelfRating>
  >;

/** A stored session, or undefined when it can't be resumed. */
const sessionOf = (value: unknown): InterviewSession | undefined => {
  if (!isRecord(value) || !isNumber(value['startedAt'])) return undefined;
  // A question that matched nothing has `matched: null`, which the account's copy leaves out (the
  // server doesn't write null members), so a missing one means no match too.
  const asked = Array.isArray(value['asked'])
    ? value['asked'].flatMap((entry): AskedQuestion[] =>
        isRecord(entry) && typeof entry['text'] === 'string' && isNumber(entry['at'])
          ? [{ text: entry['text'], matched: isNumber(entry['matched']) ? entry['matched'] : null, at: entry['at'] }]
          : [],
      )
    : [];
  const estimate = isRecord(value['estimate'])
    ? entries(value['estimate'], (field) => (typeof field === 'string' || isNumber(field) ? field : undefined))
    : undefined;
  return {
    startedAt: value['startedAt'],
    updatedAt: isNumber(value['updatedAt']) ? value['updatedAt'] : value['startedAt'],
    minutes: value['minutes'] === 60 ? 60 : 45,
    phase: PHASE_IDS.includes(value['phase'] as string) ? (value['phase'] as PhaseId) : 'clarify',
    timeInPhase: numbers(value['timeInPhase']),
    ...(isNumber(value['runningSince']) && { runningSince: value['runningSince'] }),
    asked,
    drafts: texts(value['drafts']),
    hints: numbers(value['hints']),
    revealed: numbers(value['revealed']),
    checks: entries(value['checks'], (field) => (field === true ? true : undefined)),
    ...(estimate && { estimate }),
    ...(typeof value['diagram'] === 'string' && { diagram: value['diagram'] }),
    ...(Array.isArray(value['deepDives']) && { deepDives: value['deepDives'].filter(isNumber) }),
    ratings: ratings(value['ratings']),
  };
};

const attemptsOf = (value: unknown): InterviewAttempt[] | undefined =>
  Array.isArray(value)
    ? value
        .filter((entry): entry is Record<string, unknown> => isRecord(entry) && isNumber(entry['completedAt']))
        .map((entry) => ({
          completedAt: entry['completedAt'] as number,
          minutes: entry['minutes'] === 60 ? 60 : 45,
          elapsedMs: isNumber(entry['elapsedMs']) ? entry['elapsedMs'] : 0,
          score: isNumber(entry['score']) ? entry['score'] : 0,
          ratings: ratings(entry['ratings']),
          clarifyCoverage: isNumber(entry['clarifyCoverage']) ? entry['clarifyCoverage'] : 0,
          hintsUsed: isNumber(entry['hintsUsed']) ? entry['hintsUsed'] : 0,
        }))
    : undefined;

/**
 * Accepts anything JSON-parsed (stored state, the account's copy, an imported backup) and keeps
 * only well-formed parts. Sessions and attempts are checked entry by entry, as the mock interview
 * shows them.
 */
export const sanitizeInterviews = (parsed: unknown): InterviewsState => {
  if (!isRecord(parsed)) return EMPTY_INTERVIEWS;
  return {
    sessions: entries(parsed['sessions'], sessionOf),
    history: entries(parsed['history'], attemptsOf),
    checklists: entries(parsed['checklists'], (list) => (isRecord(list) ? numbers(list) : undefined)),
  };
};

// --- Sessions ----------------------------------------------------------------------------------

/** Key of a problem's session and attempts, e.g. "hld:url-shortener". */
export const sessionKey = (track: TrackId, problem: string) => `${track}:${problem}`;

/** Time spent so far, including the stretch that is still running. */
export const elapsedMs = (session: InterviewSession, now: number) =>
  Object.values(session.timeInPhase).reduce((sum, ms) => sum + (ms ?? 0), 0) +
  (session.runningSince ? now - session.runningSince : 0);

export const phaseElapsedMs = (session: InterviewSession, phase: PhaseId, now: number) =>
  (session.timeInPhase[phase] ?? 0) + (session.phase === phase && session.runningSince ? now - session.runningSince : 0);

/** Banks the running stretch into the current phase. */
const bank = (session: InterviewSession, now: number): InterviewSession =>
  session.runningSince
    ? {
        ...session,
        timeInPhase: { ...session.timeInPhase, [session.phase]: (session.timeInPhase[session.phase] ?? 0) + (now - session.runningSince) },
        runningSince: now,
      }
    : session;

const RATING_SCORE: Record<SelfRating, number> = { 'got-it': 1, partial: 0.5, missed: 0 };

/** A rubric score 0–100: strong = 1, partly = 0.5, missed = 0, over every dimension. */
export const rubricScore = (given: Partial<Record<RubricId, SelfRating>>, dimensions: number) => {
  const values = Object.values(given).filter((rating): rating is SelfRating => Boolean(rating));
  return dimensions === 0 ? 0 : Math.round((values.reduce((sum, rating) => sum + RATING_SCORE[rating], 0) / dimensions) * 100);
};

const without = <T>(record: Record<string, T>, k: string) => {
  const { [k]: _removed, ...rest } = record;
  return rest;
};

/** Changes a problem's session (stamping it `now`); no session, no change. */
const updateSession = (
  state: InterviewsState,
  track: TrackId,
  problem: string,
  now: number,
  change: (session: InterviewSession) => InterviewSession,
): InterviewsState => {
  const k = sessionKey(track, problem);
  const current = state.sessions[k];
  if (!current) return state;
  const next = change(current);
  return next === current ? state : { ...state, sessions: { ...state.sessions, [k]: { ...next, updatedAt: now } } };
};

/** Changes to the state, as pure functions (`now` is the timestamp to record). */
export const interviewUpdates = {
  toggleChecklistItem: (state: InterviewsState, pageKey: string, item: string, on: boolean, now: number): InterviewsState => {
    const list = state.checklists[pageKey] ?? {};
    if (Boolean(list[item]) === on) return state;
    const next = on ? { ...list, [item]: now } : without(list, item);
    return { ...state, checklists: { ...state.checklists, [pageKey]: next } };
  },
  /** Starts an attempt at a problem, with the timer running. */
  start: (state: InterviewsState, track: TrackId, problem: string, minutes: 45 | 60, now: number): InterviewsState => ({
    ...state,
    sessions: {
      ...state.sessions,
      [sessionKey(track, problem)]: {
        startedAt: now,
        updatedAt: now,
        minutes,
        phase: 'clarify',
        timeInPhase: {},
        runningSince: now,
        asked: [],
        drafts: {},
        hints: {},
        revealed: {},
        checks: {},
        ratings: {},
      },
    },
  }),
  setPhase: (state: InterviewsState, track: TrackId, problem: string, phase: PhaseId, now: number) =>
    updateSession(state, track, problem, now, (s) => (s.phase === phase ? s : { ...bank(s, now), phase })),
  /** Runs or pauses the clock; time paused doesn't count. */
  setTimerRunning: (state: InterviewsState, track: TrackId, problem: string, running: boolean, now: number) =>
    updateSession(state, track, problem, now, (s) => {
      if (running === Boolean(s.runningSince)) return s;
      if (running) return { ...s, runningSince: now };
      const { runningSince: _stopped, ...paused } = bank(s, now);
      return paused;
    }),
  ask: (state: InterviewsState, track: TrackId, problem: string, text: string, matched: number | null, now: number) =>
    updateSession(state, track, problem, now, (s) => ({ ...s, asked: [...s.asked, { text, matched, at: now }] })),
  setDraft: (state: InterviewsState, track: TrackId, problem: string, key: string, text: string, now: number) =>
    updateSession(state, track, problem, now, (s) => (s.drafts[key] === text ? s : { ...s, drafts: { ...s.drafts, [key]: text } })),
  showHint: (state: InterviewsState, track: TrackId, problem: string, key: string, now: number) =>
    updateSession(state, track, problem, now, (s) => ({ ...s, hints: { ...s.hints, [key]: (s.hints[key] ?? 0) + 1 } })),
  reveal: (state: InterviewsState, track: TrackId, problem: string, key: string, now: number) =>
    updateSession(state, track, problem, now, (s) => (s.revealed[key] ? s : { ...s, revealed: { ...s.revealed, [key]: now } })),
  setCheck: (state: InterviewsState, track: TrackId, problem: string, key: string, on: boolean, now: number) =>
    updateSession(state, track, problem, now, (s) =>
      Boolean(s.checks[key]) === on ? s : { ...s, checks: on ? { ...s.checks, [key]: true } : without(s.checks, key) },
    ),
  setEstimate: (state: InterviewsState, track: TrackId, problem: string, values: Record<string, number | string>, now: number) =>
    updateSession(state, track, problem, now, (s) => ({ ...s, estimate: values })),
  setDiagram: (state: InterviewsState, track: TrackId, problem: string, source: string, now: number) =>
    updateSession(state, track, problem, now, (s) => (s.diagram === source ? s : { ...s, diagram: source })),
  setDeepDives: (state: InterviewsState, track: TrackId, problem: string, chosen: number[], now: number) =>
    updateSession(state, track, problem, now, (s) => ({ ...s, deepDives: chosen })),
  rate: (state: InterviewsState, track: TrackId, problem: string, id: RubricId, rating: SelfRating, now: number) =>
    updateSession(state, track, problem, now, (s) => (s.ratings[id] === rating ? s : { ...s, ratings: { ...s.ratings, [id]: rating } })),
  /** Ends the attempt: it moves into the history and the session is cleared. */
  finish: (
    state: InterviewsState,
    track: TrackId,
    problem: string,
    summary: Pick<InterviewAttempt, 'score' | 'clarifyCoverage' | 'hintsUsed'>,
    now: number,
  ): InterviewsState => {
    const k = sessionKey(track, problem);
    const session = state.sessions[k];
    if (!session) return state;
    const attempt: InterviewAttempt = {
      ...summary,
      completedAt: now,
      minutes: session.minutes,
      elapsedMs: elapsedMs(session, now),
      ratings: session.ratings,
    };
    return {
      ...state,
      sessions: without(state.sessions, k),
      history: { ...state.history, [k]: [...(state.history[k] ?? []), attempt] },
    };
  },
  discard: (state: InterviewsState, track: TrackId, problem: string): InterviewsState => {
    const k = sessionKey(track, problem);
    return state.sessions[k] ? { ...state, sessions: without(state.sessions, k) } : state;
  },
  /** Removes everything belonging to one track (keys start with the track id). */
  resetTrack: (state: InterviewsState, track: TrackId): InterviewsState => {
    const keep = <T>(record: Record<string, T>) =>
      Object.fromEntries(Object.entries(record).filter(([k]) => !k.startsWith(`${track}:`))) as Record<string, T>;
    return { sessions: keep(state.sessions), history: keep(state.history), checklists: keep(state.checklists) };
  },
};
