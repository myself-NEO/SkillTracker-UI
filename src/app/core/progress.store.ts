import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import type { ProblemStatus, TrackId } from '@content/shared/types';
import {
  EMPTY_PROGRESS,
  PROGRESS_KEY,
  type ProgressState,
  progressUpdates,
  type QuizAnswer,
  sanitizeProgress,
} from '@lib/progress/progress';
import { AuthService } from '../services/auth.service';

/**
 * The signed-in learner's progress, kept in this browser under their account id
 * (`st:<userId>:learning-progress-v1`), so two accounts on one browser don't mix. Syncing it to the
 * account on the server comes later (docs/plan.md, Phase 5). Other tabs see changes via `storage` events.
 */
@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly auth = inject(AuthService);
  private readonly state = signal<ProgressState>(EMPTY_PROGRESS);
  private storageKey: string | null = null;

  /** The current progress; read it in templates and computed signals. */
  readonly progress = this.state.asReadonly();

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      untracked(() => this.load(userId));
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && event.key === this.storageKey) this.state.set(this.read());
      });
    }
  }

  setLessonComplete(track: TrackId, slug: string, done: boolean) {
    this.update((s) => progressUpdates.setLessonComplete(s, track, slug, done, Date.now()));
  }

  markQuizPassed(track: TrackId, slug: string) {
    this.update((s) => progressUpdates.markQuizPassed(s, track, slug, Date.now()));
  }

  setProblemStatus(track: TrackId, slug: string, status: ProblemStatus) {
    this.update((s) => progressUpdates.setProblemStatus(s, track, slug, status, Date.now()));
  }

  markProblemStarted(track: TrackId, slug: string) {
    this.update((s) => progressUpdates.markProblemStarted(s, track, slug, Date.now()));
  }

  markLessonVisited(track: TrackId, slug: string) {
    this.update((s) => progressUpdates.markLessonVisited(s, track, slug, Date.now()));
  }

  setResumeHeading(track: TrackId, slug: string, heading: string | undefined) {
    this.update((s) => progressUpdates.setResumeHeading(s, track, slug, heading, Date.now()));
  }

  recordQuizAnswer(track: TrackId, lesson: string, answer: QuizAnswer) {
    this.update((s) => progressUpdates.recordQuizAnswer(s, track, lesson, answer, Date.now()));
  }

  resetTrack(track: TrackId) {
    this.update((s) => progressUpdates.resetTrack(s, track));
  }

  /** Replaces the progress, e.g. with an imported backup (already sanitized). */
  replace(next: ProgressState) {
    this.update(() => next);
  }

  private load(userId: string | null) {
    this.storageKey = userId ? `st:${userId}:${PROGRESS_KEY}` : null;
    this.state.set(this.read());
  }

  private read(): ProgressState {
    if (!this.storageKey) return EMPTY_PROGRESS;
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? sanitizeProgress(JSON.parse(raw)) : EMPTY_PROGRESS;
    } catch {
      return EMPTY_PROGRESS; // unreadable or unavailable storage: start empty
    }
  }

  private update(change: (state: ProgressState) => ProgressState) {
    const current = this.state();
    const next = change(current);
    if (next === current) return;
    this.state.set(next);
    if (!this.storageKey) return; // signed out: nothing to keep
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(next));
    } catch {
      // Storage unavailable or full: keep the state for this visit only.
    }
  }
}
