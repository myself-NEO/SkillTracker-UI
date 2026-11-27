import { Injectable } from '@angular/core';
import type { ProblemStatus, TrackId } from '@content/shared/types';
import {
  EMPTY_PROGRESS,
  PROGRESS_KEY,
  type ProgressState,
  progressUpdates,
  type QuizAnswer,
  sanitizeProgress,
} from '@lib/progress/progress';
import { UserStorage } from './user-storage';

/**
 * The signed-in learner's progress (lessons completed and visited, quiz answers, problem statuses,
 * where to continue), kept in this browser under their account (`st:<userId>:learning-progress-v1`,
 * see UserStorage).
 */
@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly storage = new UserStorage<ProgressState>({
    key: PROGRESS_KEY,
    empty: EMPTY_PROGRESS,
    sanitize: sanitizeProgress,
  });

  /** The current progress; read it in templates and computed signals. */
  readonly progress = this.storage.value;

  setLessonComplete(track: TrackId, slug: string, done: boolean) {
    this.storage.update((s) => progressUpdates.setLessonComplete(s, track, slug, done, Date.now()));
  }

  markQuizPassed(track: TrackId, slug: string) {
    this.storage.update((s) => progressUpdates.markQuizPassed(s, track, slug, Date.now()));
  }

  setProblemStatus(track: TrackId, slug: string, status: ProblemStatus) {
    this.storage.update((s) => progressUpdates.setProblemStatus(s, track, slug, status, Date.now()));
  }

  markProblemStarted(track: TrackId, slug: string) {
    this.storage.update((s) => progressUpdates.markProblemStarted(s, track, slug, Date.now()));
  }

  markLessonVisited(track: TrackId, slug: string) {
    this.storage.update((s) => progressUpdates.markLessonVisited(s, track, slug, Date.now()));
  }

  setResumeHeading(track: TrackId, slug: string, heading: string | undefined) {
    this.storage.update((s) => progressUpdates.setResumeHeading(s, track, slug, heading, Date.now()));
  }

  recordQuizAnswer(track: TrackId, lesson: string, answer: QuizAnswer) {
    this.storage.update((s) => progressUpdates.recordQuizAnswer(s, track, lesson, answer, Date.now()));
  }

  resetTrack(track: TrackId) {
    this.storage.update((s) => progressUpdates.resetTrack(s, track));
  }

  /** Replaces the progress, e.g. with an imported backup (already sanitized). */
  replace(next: ProgressState) {
    this.storage.update(() => next);
  }
}
