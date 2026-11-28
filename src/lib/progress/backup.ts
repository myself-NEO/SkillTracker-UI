import { type InterviewAttempt, type InterviewsState, sanitizeInterviews } from './interviews';
import { type NotebookState, sanitizeNotebook } from './notebook';
import { type ProgressState, sanitizeProgress } from './progress';

// Backup files: everything the learner has (progress, notebook and mock interviews of every
// topic) in TheSWEguide's format, version 1 (TheSWEguide's lib/progress/backup.ts). A TheSWEguide
// backup imports here, and an export from here imports into TheSWEguide.
//
// TheSWEguide's import replaced what the browser had. Here it adds the backup to the account
// (docs/plan.md, Phase 5): nothing already in the account is removed, and where both have the same
// item, the more recently changed one is kept.

export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: string;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  progress: ProgressState;
  notebook: NotebookState;
  interviews: InterviewsState;
}

export interface BackupParts {
  progress: ProgressState;
  notebook: NotebookState;
  interviews: InterviewsState;
}

export const makeBackup = (parts: BackupParts, now: Date): BackupFile => ({
  app: 'NeoLevelUP',
  version: BACKUP_VERSION,
  exportedAt: now.toISOString(),
  ...parts,
});

/** "neolevelup-backup-2026-11-28.json", dated in the learner's time zone. */
export const backupFileName = (now: Date) => {
  const two = (n: number) => String(n).padStart(2, '0');
  return `neolevelup-backup-${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}.json`;
};

/** What a backup file holds, sanitized. Backups made before mock interviews existed have no `interviews`. */
export type ParsedBackup = Partial<BackupParts>;

export type BackupReadResult = { ok: true; backup: ParsedBackup } | { ok: false; reason: 'invalid' | 'newer' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Reads a backup file's text. Like TheSWEguide, a file needs progress or a notebook to count as a backup. */
export const readBackup = (text: string): BackupReadResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  if (!isRecord(parsed) || (!isRecord(parsed['progress']) && !isRecord(parsed['notebook']))) {
    return { ok: false, reason: 'invalid' };
  }
  if (parsed['version'] !== undefined && parsed['version'] !== BACKUP_VERSION) return { ok: false, reason: 'newer' };
  const backup: ParsedBackup = {};
  if (isRecord(parsed['progress'])) backup.progress = sanitizeProgress(parsed['progress']);
  if (isRecord(parsed['notebook'])) backup.notebook = sanitizeNotebook(parsed['notebook']);
  if (isRecord(parsed['interviews'])) backup.interviews = sanitizeInterviews(parsed['interviews']);
  return { ok: true, backup };
};

// --- Merging a backup into the account -------------------------------------------------------------

/** Both records' keys; for a key in both, `pick` chooses (it gets the account's value first). */
const mergeRecords = <T>(current: Record<string, T>, incoming: Record<string, T>, pick: (mine: T, theirs: T) => T) => {
  const out: Record<string, T> = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (key === '__proto__') continue;
    out[key] = Object.hasOwn(current, key) ? pick(current[key], value) : value;
  }
  return out;
};

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** For timestamps: the later one. */
const later = (mine: number, theirs: number) => (isNumber(theirs) && (!isNumber(mine) || theirs > mine) ? theirs : mine);

/** For entries with a timestamp: the more recently changed one (the account's on a tie). */
const newer =
  <T>(at: (entry: T) => unknown) =>
  (mine: T, theirs: T): T => {
    const a = isRecord(mine) ? at(mine) : undefined;
    const b = isRecord(theirs) ? at(theirs) : undefined;
    return isNumber(b) && (!isNumber(a) || b > a) ? theirs : mine;
  };

export const mergeProgress = (current: ProgressState, incoming: ProgressState): ProgressState => {
  const problems = { ...current.problems };
  for (const [key, status] of Object.entries(incoming.problems)) {
    if (key === '__proto__') continue;
    const mine = current.problemsAt[key];
    const theirs = incoming.problemsAt[key];
    if (!Object.hasOwn(current.problems, key) || (isNumber(theirs) && (!isNumber(mine) || theirs > mine))) problems[key] = status;
  }
  return {
    lessons: mergeRecords(current.lessons, incoming.lessons, later),
    quizzes: mergeRecords(current.quizzes, incoming.quizzes, later),
    problems,
    problemsAt: mergeRecords(current.problemsAt, incoming.problemsAt, later),
    visited: mergeRecords(current.visited, incoming.visited, later),
    resume: mergeRecords(current.resume, incoming.resume, newer((point) => point.at)),
    answers: mergeRecords(current.answers, incoming.answers, newer((answer) => answer.at)),
  };
};

export const mergeNotebook = (current: NotebookState, incoming: NotebookState): NotebookState => ({
  saved: mergeRecords(current.saved, incoming.saved, newer((item) => item.at)),
  difficult: mergeRecords(current.difficult, incoming.difficult, later),
  revise: mergeRecords(current.revise, incoming.revise, later),
  questions: mergeRecords(current.questions, incoming.questions, newer((q) => Math.max(q.ratedAt ?? 0, q.revealedAt ?? 0))),
  notes: mergeRecords(current.notes, incoming.notes, newer((entry) => entry.updatedAt)),
  snippets: mergeRecords(current.snippets, incoming.snippets, newer((entry) => entry.createdAt)),
  reviewed: mergeRecords(current.reviewed, incoming.reviewed, later),
});

/** Finished attempts of both, once each (by when they were completed), oldest first. */
const mergeAttempts = (mine: InterviewAttempt[], theirs: InterviewAttempt[]) => {
  const all = [...(Array.isArray(mine) ? mine : []), ...(Array.isArray(theirs) ? theirs : [])].filter(
    (attempt) => isRecord(attempt) && isNumber(attempt.completedAt),
  );
  const byTime = new Map(all.map((attempt) => [attempt.completedAt, attempt]));
  return [...byTime.values()].sort((a, b) => a.completedAt - b.completedAt);
};

export const mergeInterviews = (current: InterviewsState, incoming: InterviewsState): InterviewsState => ({
  sessions: mergeRecords(current.sessions, incoming.sessions, newer((session) => session.updatedAt)),
  history: mergeRecords(current.history, incoming.history, mergeAttempts),
  checklists: mergeRecords(current.checklists, incoming.checklists, (mine, theirs) =>
    mergeRecords(isRecord(mine) ? mine : {}, isRecord(theirs) ? theirs : {}, later),
  ),
});

/** How much a backup holds, for the confirmation: "3 lessons completed, 2 notes…". */
export const backupSummary = (backup: ParsedBackup): string => {
  const count = (record: object | undefined) => (record ? Object.keys(record).length : 0);
  const parts: [number, string, string][] = [
    [count(backup.progress?.lessons), 'lesson completed', 'lessons completed'],
    [count(backup.progress?.problems), 'problem status', 'problem statuses'],
    [count(backup.notebook?.saved), 'bookmark', 'bookmarks'],
    [count(backup.notebook?.notes), 'note', 'notes'],
    [count(backup.notebook?.snippets), 'saved snippet or diagram', 'saved snippets and diagrams'],
    [count(backup.interviews?.history), 'mock interview problem', 'mock interview problems'],
  ];
  const said = parts.filter(([n]) => n > 0).map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  return said.length ? said.join(', ') : 'nothing yet';
};
