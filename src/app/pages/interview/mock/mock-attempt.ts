import { computed, Injectable, inject, type Signal, signal } from '@angular/core';
import type { RubricId } from '@content/shared/rubric';
import type { MockKit, MockScript, MockTopic } from '@lib/interview/mock';
import {
  elapsedMs,
  type InterviewAttempt,
  type InterviewSession,
  type PhaseId,
  phaseElapsedMs,
  type SelfRating,
  sessionKey,
} from '@lib/progress/interviews';
import { InterviewsStore } from '../../../core/interviews.store';

export interface MockAttemptSource {
  topic: Signal<MockTopic>;
  /** The track's route prefix, e.g. "/hld", for links in the script's Markdown. */
  basePath: Signal<string>;
  slug: Signal<string>;
  script: Signal<MockScript>;
  kit: Signal<MockKit>;
}

/** What the screens read once an attempt has gone (they are on their way out by then). */
const NO_SESSION: InterviewSession = {
  startedAt: 0,
  updatedAt: 0,
  minutes: 45,
  phase: 'clarify',
  timeInPhase: {},
  asked: [],
  drafts: {},
  hints: {},
  revealed: {},
  checks: {},
  ratings: {},
};

/**
 * A problem's mock interview, for the simulator's screens: the attempt in progress, where its
 * changes go, and the clock. MockInterviewComponent provides it and connects it to its inputs.
 */
@Injectable()
export class MockAttempt {
  private readonly store = inject(InterviewsStore);
  private source!: MockAttemptSource;

  /** The time, moved on every second while the clock runs (MockInterviewComponent). */
  readonly now = signal(Date.now());

  readonly topic = computed(() => this.source.topic());
  readonly basePath = computed(() => this.source.basePath());
  readonly slug = computed(() => this.source.slug());
  readonly script = computed(() => this.source.script());
  readonly kit = computed(() => this.source.kit());

  private readonly key = computed(() => sessionKey(this.topic(), this.slug()));
  /** The attempt in progress, if there is one. */
  readonly session = computed(() => this.store.state().sessions[this.key()]);
  /** The attempt in progress, for screens shown only while there is one. */
  readonly current = computed(() => this.session() ?? NO_SESSION);
  /** Finished attempts, oldest first. */
  readonly history = computed(() => this.store.state().history[this.key()] ?? []);

  /** The scripted clarifying questions asked about (their indexes). */
  readonly matched = computed(
    () => new Set(this.current().asked.flatMap((asked) => (asked.matched === null ? [] : [asked.matched]))),
  );
  readonly hintsUsed = computed(() => Object.values(this.current().hints).reduce((sum, shown) => sum + shown, 0));
  readonly running = computed(() => Boolean(this.session()?.runningSince));
  /** Time on the clock so far. */
  readonly elapsed = computed(() => {
    const session = this.session();
    return session ? elapsedMs(session, this.clock(session)) : 0;
  });

  connect(source: MockAttemptSource) {
    this.source = source;
  }

  phaseElapsed(phase: PhaseId) {
    const session = this.session();
    return session ? phaseElapsedMs(session, phase, this.clock(session)) : 0;
  }

  /** Never before the session's last change: the ticker may not have caught up with a resume yet. */
  private clock(session: InterviewSession) {
    return Math.max(this.now(), session.updatedAt);
  }

  start(minutes: 45 | 60) {
    this.store.start(this.topic(), this.slug(), minutes);
  }

  setPhase(phase: PhaseId) {
    this.store.setPhase(this.topic(), this.slug(), phase);
  }

  setTimerRunning(running: boolean) {
    this.store.setTimerRunning(this.topic(), this.slug(), running);
  }

  ask(text: string, matched: number | null) {
    this.store.ask(this.topic(), this.slug(), text, matched);
  }

  setDraft(key: string, text: string) {
    this.store.setDraft(this.topic(), this.slug(), key, text);
  }

  showHint(key: string) {
    this.store.showHint(this.topic(), this.slug(), key);
  }

  reveal(key: string) {
    this.store.reveal(this.topic(), this.slug(), key);
  }

  setCheck(key: string, on: boolean) {
    this.store.setCheck(this.topic(), this.slug(), key, on);
  }

  setEstimate(values: Record<string, string>) {
    this.store.setEstimate(this.topic(), this.slug(), values);
  }

  setDiagram(source: string) {
    this.store.setDiagram(this.topic(), this.slug(), source);
  }

  setChosen(chosen: number[]) {
    this.store.setDeepDives(this.topic(), this.slug(), chosen);
  }

  rate(id: RubricId, rating: SelfRating) {
    this.store.rate(this.topic(), this.slug(), id, rating);
  }

  finish(summary: Pick<InterviewAttempt, 'score' | 'clarifyCoverage' | 'hintsUsed'>) {
    this.store.finish(this.topic(), this.slug(), summary);
  }

  discard() {
    this.store.discard(this.topic(), this.slug());
  }
}
