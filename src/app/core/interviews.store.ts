import { Injectable } from '@angular/core';
import type { RubricId } from '@content/shared/rubric';
import type { TrackId } from '@content/shared/types';
import {
  EMPTY_INTERVIEWS,
  type InterviewAttempt,
  INTERVIEWS_KEY,
  type InterviewsState,
  interviewUpdates,
  type PhaseId,
  sanitizeInterviews,
  type SelfRating,
} from '@lib/progress/interviews';
import { UserStorage } from './user-storage';

/**
 * The learner's checklist ticks and mock-interview sessions and attempts, kept in this browser under
 * their account (`st:<userId>:learning-interviews-v1`) and with the account on the server
 * (UserStorage, StateSync). A session's changes apply to the problem's attempt in progress, if any.
 */
@Injectable({ providedIn: 'root' })
export class InterviewsStore {
  private readonly storage = new UserStorage<InterviewsState>({
    key: INTERVIEWS_KEY,
    empty: EMPTY_INTERVIEWS,
    sanitize: sanitizeInterviews,
    sync: 'interviews',
  });

  readonly state = this.storage.value;

  toggleChecklistItem(pageKey: string, item: string, on: boolean) {
    this.storage.update((s) => interviewUpdates.toggleChecklistItem(s, pageKey, item, on, Date.now()));
  }

  start(track: TrackId, problem: string, minutes: 45 | 60) {
    this.storage.update((s) => interviewUpdates.start(s, track, problem, minutes, Date.now()));
  }

  setPhase(track: TrackId, problem: string, phase: PhaseId) {
    this.storage.update((s) => interviewUpdates.setPhase(s, track, problem, phase, Date.now()));
  }

  setTimerRunning(track: TrackId, problem: string, running: boolean) {
    this.storage.update((s) => interviewUpdates.setTimerRunning(s, track, problem, running, Date.now()));
  }

  ask(track: TrackId, problem: string, text: string, matched: number | null) {
    this.storage.update((s) => interviewUpdates.ask(s, track, problem, text, matched, Date.now()));
  }

  setDraft(track: TrackId, problem: string, key: string, text: string) {
    this.storage.update((s) => interviewUpdates.setDraft(s, track, problem, key, text, Date.now()));
  }

  showHint(track: TrackId, problem: string, key: string) {
    this.storage.update((s) => interviewUpdates.showHint(s, track, problem, key, Date.now()));
  }

  reveal(track: TrackId, problem: string, key: string) {
    this.storage.update((s) => interviewUpdates.reveal(s, track, problem, key, Date.now()));
  }

  setCheck(track: TrackId, problem: string, key: string, on: boolean) {
    this.storage.update((s) => interviewUpdates.setCheck(s, track, problem, key, on, Date.now()));
  }

  setEstimate(track: TrackId, problem: string, values: Record<string, number | string>) {
    this.storage.update((s) => interviewUpdates.setEstimate(s, track, problem, values, Date.now()));
  }

  setDiagram(track: TrackId, problem: string, source: string) {
    this.storage.update((s) => interviewUpdates.setDiagram(s, track, problem, source, Date.now()));
  }

  setDeepDives(track: TrackId, problem: string, chosen: number[]) {
    this.storage.update((s) => interviewUpdates.setDeepDives(s, track, problem, chosen, Date.now()));
  }

  rate(track: TrackId, problem: string, id: RubricId, rating: SelfRating) {
    this.storage.update((s) => interviewUpdates.rate(s, track, problem, id, rating, Date.now()));
  }

  finish(track: TrackId, problem: string, summary: Pick<InterviewAttempt, 'score' | 'clarifyCoverage' | 'hintsUsed'>) {
    this.storage.update((s) => interviewUpdates.finish(s, track, problem, summary, Date.now()));
  }

  discard(track: TrackId, problem: string) {
    this.storage.update((s) => interviewUpdates.discard(s, track, problem));
  }

  resetTrack(track: TrackId) {
    this.storage.update((s) => interviewUpdates.resetTrack(s, track));
  }

  /** Replaces the state, e.g. with an imported backup (already sanitized). */
  replace(next: InterviewsState) {
    this.storage.update(() => next);
  }
}
