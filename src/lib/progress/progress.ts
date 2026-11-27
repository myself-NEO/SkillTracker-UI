import type { ProblemStatus, TrackId } from '@content/shared/types';
import { questionHash } from './hash';

// The learner's progress: which lessons are done or opened, quiz answers, problem statuses and
// where to resume each topic. Ported from TheSWEguide's lib/progress/progress.ts without React:
// the same shape and keys (so TheSWEguide backups import unchanged), with each action a pure
// function from the old state to the new one. The app's ProgressStore keeps the state.

/** One knowledge-check question, as the learner has answered it so far. */
export interface QuizAnswerRecord {
  track: TrackId;
  lesson: string;
  prompt: string;
  /** Text of the correct option and the explanation, kept so mistakes can be reviewed later. */
  correct: string;
  explanation: string;
  attempts: number;
  /** Whether the very first choice was right: the basis of quiz accuracy. */
  firstCorrect: boolean;
  solved: boolean;
  /** The most recent wrong choice, if any. */
  lastWrong?: string;
  at: number;
}

export interface ResumePoint {
  slug: string;
  /** id of the section heading the learner last read */
  heading?: string;
  at: number;
}

export interface ProgressState {
  /** `${track}:${slug}` → completion timestamp */
  lessons: Record<string, number>;
  /** `${track}:${slug}` → timestamp the lesson's knowledge check was passed */
  quizzes: Record<string, number>;
  /** `${track}:${slug}` → status (absent means not started) */
  problems: Record<string, ProblemStatus>;
  /** `${track}:${slug}` → when the problem's status last changed */
  problemsAt: Record<string, number>;
  /** `${track}:${slug}` → last time the lesson was opened (opened but not completed = in progress) */
  visited: Record<string, number>;
  /** track id → the lesson and section the learner was last reading */
  resume: Record<string, ResumePoint>;
  /** `${track}:${lesson}:${question hash}` → answer record */
  answers: Record<string, QuizAnswerRecord>;
}

/** TheSWEguide's localStorage key for this state; backups use the same field names. */
export const PROGRESS_KEY = 'learning-progress-v1';

export const EMPTY_PROGRESS: ProgressState = {
  lessons: {},
  quizzes: {},
  problems: {},
  problemsAt: {},
  visited: {},
  resume: {},
  answers: {},
};

const key = (track: TrackId, slug: string) => `${track}:${slug}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const recordField = <T>(parsed: Record<string, unknown>, field: string) =>
  (isRecord(parsed[field]) ? parsed[field] : {}) as Record<string, T>;

/** Accepts anything JSON-parsed (stored state or an imported backup) and keeps only well-formed parts. */
export const sanitizeProgress = (parsed: unknown): ProgressState => {
  if (!isRecord(parsed)) return EMPTY_PROGRESS;
  return {
    lessons: recordField(parsed, 'lessons'),
    quizzes: recordField(parsed, 'quizzes'),
    problems: recordField(parsed, 'problems'),
    problemsAt: recordField(parsed, 'problemsAt'),
    visited: recordField(parsed, 'visited'),
    resume: recordField(parsed, 'resume'),
    answers: recordField(parsed, 'answers'),
  };
};

const without = <T>(record: Record<string, T>, k: string) => {
  const { [k]: _removed, ...rest } = record;
  return rest;
};

const withoutTrack = <T>(record: Record<string, T>, track: TrackId) =>
  Object.fromEntries(Object.entries(record).filter(([k]) => !k.startsWith(`${track}:`))) as Record<string, T>;

export interface QuizAnswer {
  prompt: string;
  correct: boolean;
  chosen: string;
  correctText: string;
  explanation: string;
}

/** Every change to the progress, as pure functions of the current state (`now` is the timestamp to record). */
export const progressUpdates = {
  setLessonComplete: (state: ProgressState, track: TrackId, slug: string, done: boolean, now: number): ProgressState => {
    const k = key(track, slug);
    return { ...state, lessons: done ? { ...state.lessons, [k]: now } : without(state.lessons, k) };
  },
  markQuizPassed: (state: ProgressState, track: TrackId, slug: string, now: number): ProgressState => {
    const k = key(track, slug);
    return state.quizzes[k] ? state : { ...state, quizzes: { ...state.quizzes, [k]: now } };
  },
  setProblemStatus: (state: ProgressState, track: TrackId, slug: string, status: ProblemStatus, now: number): ProgressState => {
    const k = key(track, slug);
    return {
      ...state,
      problems: status === 'not-started' ? without(state.problems, k) : { ...state.problems, [k]: status },
      problemsAt: status === 'not-started' ? without(state.problemsAt, k) : { ...state.problemsAt, [k]: now },
    };
  },
  /** Moves a problem from "not started" to "in progress" (used when a hint or solution is opened). */
  markProblemStarted: (state: ProgressState, track: TrackId, slug: string, now: number): ProgressState =>
    state.problems[key(track, slug)] ? state : progressUpdates.setProblemStatus(state, track, slug, 'in-progress', now),
  /** Records that a lesson was opened, and makes it the track's resume point. */
  markLessonVisited: (state: ProgressState, track: TrackId, slug: string, now: number): ProgressState => {
    const previous = state.resume[track];
    return {
      ...state,
      visited: { ...state.visited, [key(track, slug)]: now },
      // Keep the saved section when the learner comes back to the same lesson.
      resume: { ...state.resume, [track]: { slug, heading: previous?.slug === slug ? previous.heading : undefined, at: now } },
    };
  },
  setResumeHeading: (state: ProgressState, track: TrackId, slug: string, heading: string | undefined, now: number): ProgressState => {
    const current = state.resume[track];
    if (current?.slug === slug && current.heading === heading) return state;
    return { ...state, resume: { ...state.resume, [track]: { slug, heading, at: now } } };
  },
  recordQuizAnswer: (state: ProgressState, track: TrackId, lesson: string, answer: QuizAnswer, now: number): ProgressState => {
    const k = `${key(track, lesson)}:${questionHash(answer.prompt)}`;
    const previous = state.answers[k];
    const record: QuizAnswerRecord = {
      track,
      lesson,
      prompt: answer.prompt,
      correct: answer.correctText,
      explanation: answer.explanation,
      attempts: (previous?.attempts ?? 0) + 1,
      firstCorrect: previous ? previous.firstCorrect : answer.correct,
      solved: Boolean(previous?.solved) || answer.correct,
      lastWrong: answer.correct ? previous?.lastWrong : answer.chosen,
      at: now,
    };
    return { ...state, answers: { ...state.answers, [k]: record } };
  },
  /** Clears one topic's progress and leaves the others alone. */
  resetTrack: (state: ProgressState, track: TrackId): ProgressState => ({
    lessons: withoutTrack(state.lessons, track),
    quizzes: withoutTrack(state.quizzes, track),
    problems: withoutTrack(state.problems, track),
    problemsAt: withoutTrack(state.problemsAt, track),
    visited: withoutTrack(state.visited, track),
    resume: without(state.resume, track),
    answers: withoutTrack(state.answers, track),
  }),
};

export const isLessonComplete = (p: ProgressState, track: TrackId, slug: string) => Boolean(p.lessons[key(track, slug)]);
export const isQuizPassed = (p: ProgressState, track: TrackId, slug: string) => Boolean(p.quizzes[key(track, slug)]);
export const isLessonVisited = (p: ProgressState, track: TrackId, slug: string) => Boolean(p.visited[key(track, slug)]);
export const problemStatus = (p: ProgressState, track: TrackId, slug: string): ProblemStatus =>
  p.problems[key(track, slug)] ?? 'not-started';

/** Quiz answers of one track. */
export const trackAnswers = (p: ProgressState, track: TrackId) => Object.values(p.answers).filter((a) => a.track === track);
