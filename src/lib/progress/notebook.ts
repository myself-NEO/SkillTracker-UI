import type { TrackId } from '@content/shared/types';
import type { SelfRating } from './interviews';

// The learner's own revision material: saved lessons, sections and questions, "difficult" and
// "revisit" flags, interview-question attempts, notes and code snippets (diagrams are snippets in
// Mermaid). Ported from TheSWEguide's lib/progress/notebook.ts without React: the same shape and
// keys, so its backups import unchanged, with each action a pure function from the old state to
// the new one. The app's NotebookStore keeps the state.

/** TheSWEguide's localStorage key for this state; backups use the same field names. */
export const NOTEBOOK_KEY = 'learning-notebook-v1';

export type SavedKind = 'lesson' | 'section' | 'question';

export interface SavedItem {
  kind: SavedKind;
  track: TrackId;
  /** lesson slug, `${lesson}#${headingId}`, or question ref (`${page kind}:${slug}#${id}`, or a bank question id) */
  ref: string;
  title: string;
  /** Where it came from: the lesson title for a section, the topic title for a question. */
  context: string;
  /** Stage id (lessons, sections) or interview topic id (questions), for filtering. */
  topic: string;
  /** Model answer of a question saved from a lesson or problem page, so the notebook can show it. */
  body?: string;
  /** Page the item was saved from, when `ref` alone can't locate it. */
  href?: string;
  at: number;
}

/** What a note records; plain notes have no kind. */
export type NoteKind = 'note' | 'tradeoff' | 'formula' | 'pattern' | 'mistake';

export interface Note {
  id: string;
  track: TrackId;
  title: string;
  body: string;
  topic: string;
  /** Set for the note attached to a lesson page. */
  lesson?: string;
  /** Set for the note attached to a practice problem (its slug, or a DSA question ref such as "lc-1"). */
  problem?: string;
  kind?: NoteKind;
  createdAt: number;
  updatedAt: number;
}

export interface Snippet {
  id: string;
  track: TrackId;
  title: string;
  code: string;
  /** The code's language; "mermaid" makes it a diagram. */
  language: string;
  topic: string;
  lesson?: string;
  /** Page the snippet came from. */
  href?: string;
  createdAt: number;
}

export type { SelfRating };

export interface QuestionProgress {
  /** The learner's own attempt, typed before revealing the answer. */
  draft?: string;
  /** Number of hints shown. */
  hints?: number;
  revealedAt?: number;
  rating?: SelfRating;
  ratedAt?: number;
}

export interface NotebookState {
  /** savedKey(...) → item */
  saved: Record<string, SavedItem>;
  /** `${track}:${lesson}` → when it was marked difficult */
  difficult: Record<string, number>;
  /** `${track}:${ref}` → when it was marked for revision (a question id, or `problem:${slug}`) */
  revise: Record<string, number>;
  /** `${track}:${questionId}` → attempt and self-assessment */
  questions: Record<string, QuestionProgress>;
  notes: Record<string, Note>;
  snippets: Record<string, Snippet>;
  /** revision-list item key → when it was last reviewed */
  reviewed: Record<string, number>;
}

export const EMPTY_NOTEBOOK: NotebookState = {
  saved: {},
  difficult: {},
  revise: {},
  questions: {},
  notes: {},
  snippets: {},
  reviewed: {},
};

// --- Reading stored state ------------------------------------------------------------------------

const SAVED_KINDS: readonly string[] = ['lesson', 'section', 'question'];
const NOTE_KINDS: readonly string[] = ['note', 'tradeoff', 'formula', 'pattern', 'mistake'];
const RATINGS: readonly string[] = ['got-it', 'partial', 'missed'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown) => (typeof value === 'string' ? value : undefined);
/** A page of this app ("/java/generics#bounds"); anything else is dropped. */
const appPath = (value: unknown) => (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : undefined);
const time = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

/** The well-formed entries of a record field; `read` returns undefined for an entry to drop. */
const entries = <T>(field: unknown, read: (value: unknown, key: string) => T | undefined): Record<string, T> => {
  if (!isRecord(field)) return {};
  const out: [string, T][] = [];
  for (const [key, value] of Object.entries(field)) {
    if (key === '__proto__') continue;
    const entry = read(value, key);
    if (entry !== undefined) out.push([key, entry]);
  }
  return Object.fromEntries(out);
};

const savedItem = (value: unknown): SavedItem | undefined => {
  if (!isRecord(value) || !SAVED_KINDS.includes(value['kind'] as string)) return undefined;
  const track = text(value['track']);
  const ref = text(value['ref']);
  if (!track || !ref) return undefined;
  const body = text(value['body']);
  const href = appPath(value['href']);
  return {
    kind: value['kind'] as SavedKind,
    track: track as TrackId,
    ref,
    title: text(value['title']) || ref,
    context: text(value['context']) ?? '',
    topic: text(value['topic']) || 'general',
    ...(body !== undefined && { body }),
    ...(href && { href }),
    at: time(value['at']) ?? 0,
  };
};

const note = (value: unknown, id: string): Note | undefined => {
  if (!isRecord(value)) return undefined;
  const track = text(value['track']);
  const body = text(value['body']);
  if (!track || body === undefined) return undefined;
  const lesson = text(value['lesson']);
  const problem = text(value['problem']);
  const kind = NOTE_KINDS.includes(value['kind'] as string) ? (value['kind'] as NoteKind) : undefined;
  const createdAt = time(value['createdAt']) ?? 0;
  return {
    id,
    track: track as TrackId,
    title: text(value['title']) || 'Untitled note',
    body,
    topic: text(value['topic']) || 'general',
    ...(lesson && { lesson }),
    ...(problem && { problem }),
    ...(kind && { kind }),
    createdAt,
    updatedAt: time(value['updatedAt']) ?? createdAt,
  };
};

const snippet = (value: unknown, id: string): Snippet | undefined => {
  if (!isRecord(value)) return undefined;
  const track = text(value['track']);
  const code = text(value['code']);
  if (!track || code === undefined) return undefined;
  const lesson = text(value['lesson']);
  const href = appPath(value['href']);
  return {
    id,
    track: track as TrackId,
    title: text(value['title']) || 'Untitled snippet',
    code,
    language: text(value['language']) || 'text',
    topic: text(value['topic']) || 'general',
    ...(lesson && { lesson }),
    ...(href && { href }),
    createdAt: time(value['createdAt']) ?? 0,
  };
};

const questionProgress = (value: unknown): QuestionProgress | undefined => {
  if (!isRecord(value)) return undefined;
  const out: QuestionProgress = {};
  const draft = text(value['draft']);
  const hints = time(value['hints']);
  const revealedAt = time(value['revealedAt']);
  const ratedAt = time(value['ratedAt']);
  if (draft !== undefined) out.draft = draft;
  if (hints !== undefined) out.hints = hints;
  if (revealedAt !== undefined) out.revealedAt = revealedAt;
  if (RATINGS.includes(value['rating'] as string)) out.rating = value['rating'] as SelfRating;
  if (ratedAt !== undefined) out.ratedAt = ratedAt;
  return out;
};

/**
 * Accepts anything JSON-parsed (stored state, the account's copy, an imported backup) and keeps
 * only well-formed parts. Unlike the other stores it checks every entry: the notebook page shows
 * their text, so a malformed one from a hand-edited backup would break it.
 */
export const sanitizeNotebook = (parsed: unknown): NotebookState => {
  if (!isRecord(parsed)) return EMPTY_NOTEBOOK;
  return {
    saved: entries(parsed['saved'], savedItem),
    difficult: entries(parsed['difficult'], time),
    revise: entries(parsed['revise'], time),
    questions: entries(parsed['questions'], questionProgress),
    notes: entries(parsed['notes'], note),
    snippets: entries(parsed['snippets'], snippet),
    reviewed: entries(parsed['reviewed'], time),
  };
};

// --- Keys and lookups --------------------------------------------------------------------------

export const savedKey = (kind: SavedKind, track: TrackId, ref: string) => `${kind}:${track}:${ref}`;
export const itemKey = (track: TrackId, ref: string) => `${track}:${ref}`;

export const isSaved = (n: NotebookState, kind: SavedKind, track: TrackId, ref: string) =>
  Boolean(n.saved[savedKey(kind, track, ref)]);
export const lessonNote = (n: NotebookState, track: TrackId, lesson: string) =>
  Object.values(n.notes).find((entry) => entry.track === track && entry.lesson === lesson);
export const problemNote = (n: NotebookState, track: TrackId, problem: string) =>
  Object.values(n.notes).find((entry) => entry.track === track && entry.problem === problem);

/** A new note or snippet id, e.g. "mfx3k2a1-4h7qz0". */
export const newNotebookId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// --- Changes -----------------------------------------------------------------------------------

const without = <T>(record: Record<string, T>, k: string) => {
  const { [k]: _removed, ...rest } = record;
  return rest;
};

/** Sets (stamped `now`) or clears a flag; `on` undefined flips it. Setting a set flag stamps it again. */
const toggleTimestamp = (record: Record<string, number>, k: string, on: boolean | undefined, now: number) => {
  const next = on ?? !record[k];
  if (!next && !Object.hasOwn(record, k)) return record;
  return next ? { ...record, [k]: now } : without(record, k);
};

/** Changes to the notebook, as pure functions (`now` is the timestamp to record). */
export const notebookUpdates = {
  toggleSaved: (state: NotebookState, item: Omit<SavedItem, 'at'>, on: boolean | undefined, now: number): NotebookState => {
    const k = savedKey(item.kind, item.track, item.ref);
    const next = on ?? !state.saved[k];
    if (!next && !state.saved[k]) return state;
    return { ...state, saved: next ? { ...state.saved, [k]: { ...item, at: now } } : without(state.saved, k) };
  },
  toggleDifficult: (state: NotebookState, track: TrackId, lesson: string, on: boolean | undefined, now: number): NotebookState => {
    const difficult = toggleTimestamp(state.difficult, itemKey(track, lesson), on, now);
    return difficult === state.difficult ? state : { ...state, difficult };
  },
  toggleRevise: (state: NotebookState, track: TrackId, ref: string, on: boolean | undefined, now: number): NotebookState => {
    const revise = toggleTimestamp(state.revise, itemKey(track, ref), on, now);
    return revise === state.revise ? state : { ...state, revise };
  },
  updateQuestion: (state: NotebookState, track: TrackId, questionId: string, change: Partial<QuestionProgress>): NotebookState => {
    const k = itemKey(track, questionId);
    return { ...state, questions: { ...state.questions, [k]: { ...state.questions[k], ...change } } };
  },
  /** Records a self-assessment; a missed question goes on the revision list. */
  rateQuestion: (state: NotebookState, track: TrackId, questionId: string, rating: SelfRating, now: number): NotebookState => {
    const k = itemKey(track, questionId);
    const revise = rating === 'missed' && !state.revise[k] ? { ...state.revise, [k]: now } : state.revise;
    return { ...state, questions: { ...state.questions, [k]: { ...state.questions[k], rating, ratedAt: now } }, revise };
  },
  saveNote: (state: NotebookState, entry: Omit<Note, 'createdAt' | 'updatedAt'>, now: number): NotebookState => {
    const existing = state.notes[entry.id];
    return {
      ...state,
      notes: { ...state.notes, [entry.id]: { ...entry, createdAt: existing?.createdAt ?? now, updatedAt: now } },
    };
  },
  deleteNote: (state: NotebookState, id: string): NotebookState =>
    state.notes[id] ? { ...state, notes: without(state.notes, id) } : state,
  addSnippet: (state: NotebookState, entry: Omit<Snippet, 'createdAt'>, now: number): NotebookState => ({
    ...state,
    snippets: { ...state.snippets, [entry.id]: { ...entry, createdAt: now } },
  }),
  deleteSnippet: (state: NotebookState, id: string): NotebookState =>
    state.snippets[id] ? { ...state, snippets: without(state.snippets, id) } : state,
  updateSnippet: (
    state: NotebookState,
    id: string,
    change: Partial<Pick<Snippet, 'title' | 'code' | 'topic'>>,
  ): NotebookState =>
    state.snippets[id] ? { ...state, snippets: { ...state.snippets, [id]: { ...state.snippets[id], ...change } } } : state,
  markReviewed: (state: NotebookState, key: string, on: boolean, now: number): NotebookState => {
    if (!on && !Object.hasOwn(state.reviewed, key)) return state;
    return { ...state, reviewed: on ? { ...state.reviewed, [key]: now } : without(state.reviewed, key) };
  },
  /** Removes everything belonging to one track. */
  resetTrack: (state: NotebookState, track: TrackId): NotebookState => {
    const keep = <T>(record: Record<string, T>, belongs: (k: string, v: T) => boolean) =>
      Object.fromEntries(Object.entries(record).filter(([k, v]) => !belongs(k, v))) as Record<string, T>;
    const prefixed = (k: string) => k.startsWith(`${track}:`);
    return {
      saved: keep(state.saved, (_k, v) => v.track === track),
      difficult: keep(state.difficult, prefixed),
      revise: keep(state.revise, prefixed),
      questions: keep(state.questions, prefixed),
      notes: keep(state.notes, (_k, v) => v.track === track),
      snippets: keep(state.snippets, (_k, v) => v.track === track),
      reviewed: keep(state.reviewed, (k) => k.includes(`${track}:`)),
    };
  },
};
