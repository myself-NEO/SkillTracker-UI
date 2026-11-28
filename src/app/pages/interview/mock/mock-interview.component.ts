import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ProblemMeta } from '@content/shared/types';
import type { MockScriptFile } from '@lib/content/catalog';
import { formatClock, MOCK_KITS, type MockKit, type MockScript, type MockTopic } from '@lib/interview/mock';
import { type PhaseId, rubricScore } from '@lib/progress/interviews';
import { problemStatus } from '@lib/progress/progress';
import { ProgressStore } from '../../../core/progress.store';
import { StateSync } from '../../../core/state-sync.service';
import { ArrowIconComponent } from '../../../ui/icons';
import { HldPhaseComponent } from './hld-phase.component';
import { LldPhaseComponent } from './lld-phase.component';
import { MockAttempt } from './mock-attempt';
import { MOCK_BUTTON, MOCK_PRIMARY } from './mock-parts';
import { MockBriefComponent, MockClarifyComponent, MockEvaluationComponent } from './mock-screens';

/**
 * One LLD or HLD problem as a timed, guided mock interview (ported from TheSWEguide's
 * MockInterview.tsx): the brief and past attempts, then the phases against the clock, from the
 * clarifying questions to the self-evaluation. The attempt is kept with the learner's account
 * (InterviewsStore), so it can be left and resumed; the clock stops while the page is hidden or left.
 */
@Component({
  selector: 'app-mock-interview',
  imports: [
    RouterLink,
    ArrowIconComponent,
    MockBriefComponent,
    MockClarifyComponent,
    MockEvaluationComponent,
    HldPhaseComponent,
    LldPhaseComponent,
  ],
  providers: [MockAttempt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (attempt.session(); as session) {
      @let phase = currentPhase()!;
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside aria-label="Interview timer and phases" class="min-w-0 space-y-4 self-start lg:sticky lg:top-20">
          <div class="rounded-xl border border-border bg-surface p-3">
            <p class="text-xs text-muted">Elapsed</p>
            <p class="font-mono text-2xl font-semibold" [class]="overTime() ? 'text-warning' : 'text-fg'" aria-live="off">
              {{ clock(attempt.elapsed()) }} <span class="text-sm text-muted">/ {{ session.minutes }}:00</span>
            </p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <button type="button" (click)="attempt.setTimerRunning(!attempt.running())" [class]="button + ' px-2! py-1! text-xs!'">
                {{ attempt.running() ? 'Pause' : 'Resume' }}
              </button>
              <button type="button" (click)="discard()" [class]="button + ' px-2! py-1! text-xs! hover:text-danger!'">Discard</button>
            </div>
            @if (!attempt.running()) {
              <p class="mt-2 text-[11px] text-warning">Timer paused.</p>
            }
          </div>
          <nav aria-label="Interview phases">
            <ol class="flex [scrollbar-width:thin] gap-1 overflow-x-auto pb-1 lg:flex-col">
              @for (step of steps(); track step.id) {
                <li class="shrink-0">
                  <button
                    type="button"
                    (click)="goTo(step.id)"
                    [attr.aria-current]="step.current ? 'step' : null"
                    class="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                    [class]="
                      step.current
                        ? 'bg-accent-soft font-semibold text-accent'
                        : step.spent > 0
                          ? 'text-fg-soft hover:bg-surface-2'
                          : 'text-muted hover:bg-surface-2'
                    "
                  >
                    <span class="whitespace-nowrap">{{ $index + 1 }}. {{ step.short }}</span>
                    @if (step.budget > 0) {
                      <span class="font-mono text-[10px]" [class]="step.over ? 'text-warning' : 'text-muted'">
                        {{ clock(step.spent) }}/{{ step.budget }}m
                      </span>
                    }
                  </button>
                </li>
              }
            </ol>
          </nav>
        </aside>

        <div #panel tabindex="-1" class="min-w-0 scroll-mt-32 focus:outline-hidden">
          <div class="mb-5">
            <p class="mb-1 text-xs font-semibold tracking-wider text-muted uppercase">
              Step {{ phaseIndex() + 1 }} of {{ phases().length }}
              @if (budget() > 0) {
                <span [class.text-warning]="phaseSpent() > budget() * 60000">
                  · {{ clock(phaseSpent()) }} of ~{{ budget() }} min
                </span>
              }
            </p>
            <h2 class="mb-2 font-display text-2xl font-semibold text-fg">{{ phase.label }}</h2>
            @if (guide(); as guide) {
              <div class="rounded-lg border border-border bg-surface px-4 py-3 text-sm">
                <p class="text-fg-soft">{{ guide.goal }}</p>
                <p class="mt-1 text-muted">Say something like: <span class="text-fg-soft">{{ guide.say }}</span></p>
              </div>
            }
          </div>

          @switch (phase.id) {
            @case ('clarify') {
              <app-mock-clarify />
            }
            @case ('evaluation') {
              <app-mock-evaluation [checklistItems]="file().checklist" (finish)="finish()" />
            }
            @default {
              @if (topic() === 'hld') {
                <app-hld-phase [phase]="phase.id" />
              } @else {
                <app-lld-phase [phase]="phase.id" />
              }
            }
          }

          <nav aria-label="Phase navigation" class="mt-8 flex flex-wrap justify-between gap-3">
            @if (previousPhase(); as previous) {
              <button type="button" (click)="goTo(previous.id)" [class]="button">
                <svg appArrowIcon class="size-4 rotate-180"></svg> {{ previous.short }}
              </button>
            } @else {
              <span></span>
            }
            @if (nextPhase(); as next) {
              <button type="button" (click)="goTo(next.id)" [class]="primary">
                Next: {{ next.short }} <svg appArrowIcon class="size-4"></svg>
              </button>
            }
          </nav>
        </div>
      </div>
    } @else {
      @if (finished()) {
        <div
          role="status"
          class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
        >
          <span>Attempt saved. The problem is now marked Attempted — mark it Completed once you can do it without hints.</span>
          <button type="button" (click)="markCompleted()" [class]="button">Mark Completed</button>
        </div>
      }
      <app-mock-brief [problem]="problem()" />
    }

    <p class="mt-10 text-xs text-muted">
      Drafts, timings and ratings are saved to your account.
      <a [routerLink]="basePath() + '/interview'" class="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">
        All mock interviews
      </a>
    </p>
  `,
})
export class MockInterviewComponent {
  protected readonly attempt = inject(MockAttempt);
  private readonly progress = inject(ProgressStore);
  private readonly injector = inject(Injector);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  readonly topic = input.required<MockTopic>();
  /** The track's route prefix, e.g. "/hld". */
  readonly basePath = input.required<string>();
  readonly problem = input.required<ProblemMeta>();
  /** The problem's interview script, built from its breakdown. */
  readonly file = input.required<MockScriptFile>();

  protected readonly button = MOCK_BUTTON;
  protected readonly primary = MOCK_PRIMARY;
  private readonly kit = computed(() => MOCK_KITS[this.topic()] as MockKit);
  /** Set once an attempt is finished here, for the "Attempt saved" note. */
  protected readonly finished = signal(false);

  protected readonly phases = computed(() => this.kit().phases);
  /** The phase the attempt is in; a phase another version had falls back to the first. */
  protected readonly phaseIndex = computed(() => {
    const session = this.attempt.session();
    return session ? Math.max(0, this.phases().findIndex((phase) => phase.id === session.phase)) : -1;
  });
  protected readonly currentPhase = computed(() => this.phases()[this.phaseIndex()]);
  protected readonly previousPhase = computed(() => this.phases()[this.phaseIndex() - 1]);
  protected readonly nextPhase = computed(() => this.phases()[this.phaseIndex() + 1]);
  protected readonly guide = computed(() => {
    const phase = this.currentPhase();
    return phase && this.kit().guide[phase.id];
  });
  private readonly budgets = computed(() => this.kit().budgets[this.attempt.session()?.minutes ?? 45]);
  /** Suggested minutes for the current phase (none for the self-evaluation). */
  protected readonly budget = computed(() => {
    const phase = this.currentPhase();
    return phase && phase.id !== 'evaluation' ? this.budgets()[phase.id] : 0;
  });
  protected readonly phaseSpent = computed(() => {
    const phase = this.currentPhase();
    return phase ? this.attempt.phaseElapsed(phase.id) : 0;
  });
  protected readonly overTime = computed(() => this.attempt.elapsed() > (this.attempt.session()?.minutes ?? 0) * 60_000);
  protected readonly steps = computed(() =>
    this.phases().map((phase) => {
      const spent = this.attempt.phaseElapsed(phase.id);
      const budget = phase.id === 'evaluation' ? 0 : this.budgets()[phase.id];
      return { id: phase.id, short: phase.short, current: phase.id === this.currentPhase()?.id, spent, budget, over: spent > budget * 60_000 };
    }),
  );

  constructor() {
    this.attempt.connect({
      topic: this.topic,
      basePath: this.basePath,
      slug: computed(() => this.problem().slug),
      script: computed(() => this.file().script as MockScript),
      kit: this.kit,
    });

    // The clock moves on every second while it runs.
    effect((onCleanup) => {
      if (!this.attempt.running()) return;
      this.attempt.now.set(Date.now());
      const timer = setInterval(() => this.attempt.now.set(Date.now()), 1000);
      onCleanup(() => clearInterval(timer));
    });

    // Time away doesn't count: the clock stops when the page is hidden or closed, and when the
    // learner leaves it (they resume it themselves).
    const pause = () => this.attempt.setTimerRunning(false);
    const removeExitHook = inject(StateSync).beforeExit(pause);
    inject(DestroyRef).onDestroy(() => {
      removeExitHook();
      pause();
    });
  }

  protected clock(ms: number) {
    return formatClock(ms);
  }

  protected goTo(phase: PhaseId) {
    this.attempt.setPhase(phase);
    afterNextRender(
      () => {
        const panel = this.panel()?.nativeElement;
        panel?.focus({ preventScroll: true });
        panel?.scrollIntoView({ block: 'start' });
      },
      { injector: this.injector },
    );
  }

  protected discard() {
    if (window.confirm('Discard this attempt? Your drafts for it will be deleted.')) this.attempt.discard();
  }

  protected finish() {
    const session = this.attempt.session();
    if (!session) return;
    const kit = this.kit();
    const total = this.attempt.script().clarifications.length;
    this.attempt.finish({
      score: rubricScore(session.ratings, kit.rubric.length),
      clarifyCoverage: total ? this.attempt.matched().size / total : 0,
      hintsUsed: this.attempt.hintsUsed(),
    });
    const topic = this.topic();
    const slug = this.problem().slug;
    if (problemStatus(this.progress.progress(), topic, slug) !== 'completed') this.progress.setProblemStatus(topic, slug, 'attempted');
    this.finished.set(true);
  }

  protected markCompleted() {
    this.progress.setProblemStatus(this.topic(), this.problem().slug, 'completed');
  }
}
