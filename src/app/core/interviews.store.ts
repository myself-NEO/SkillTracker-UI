import { Injectable } from '@angular/core';
import type { TrackId } from '@content/shared/types';
import {
  EMPTY_INTERVIEWS,
  INTERVIEWS_KEY,
  type InterviewsState,
  interviewUpdates,
  sanitizeInterviews,
} from '@lib/progress/interviews';
import { UserStorage } from './user-storage';

/**
 * The learner's checklist ticks and (from Phase 6) mock-interview sessions, kept in this browser
 * under their account (`st:<userId>:learning-interviews-v1`, see UserStorage).
 */
@Injectable({ providedIn: 'root' })
export class InterviewsStore {
  private readonly storage = new UserStorage<InterviewsState>({
    key: INTERVIEWS_KEY,
    empty: EMPTY_INTERVIEWS,
    sanitize: sanitizeInterviews,
  });

  readonly state = this.storage.value;

  toggleChecklistItem(pageKey: string, item: string, on: boolean) {
    this.storage.update((s) => interviewUpdates.toggleChecklistItem(s, pageKey, item, on, Date.now()));
  }

  resetTrack(track: TrackId) {
    this.storage.update((s) => interviewUpdates.resetTrack(s, track));
  }

  /** Replaces the state, e.g. with an imported backup (already sanitized). */
  replace(next: InterviewsState) {
    this.storage.update(() => next);
  }
}
