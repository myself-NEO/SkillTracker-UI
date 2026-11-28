import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { ProblemMeta } from '@content/shared/types';
import type { ChecklistWidget, InlineText } from '@lib/content/doc';
import { formatClock } from '@lib/interview/mock';
import { rubricScore, type SelfRating } from '@lib/progress/interviews';
import { problemStatus } from '@lib/progress/progress';
import { ProgressStore } from '../../../core/progress.store';
import { ArrowIconComponent } from '../../../ui/icons';
import { InlineCodeComponent } from '../../../ui/inline-code.component';
import { MarkdownComponent } from '../../../ui/markdown.component';
import { onRadioGroupKeyDown } from '../../../ui/radio-group';
import { ChecklistComponent } from '../../../widgets/checklist.component';
import type { BodyPage } from '../../../widgets/page';
import { StatusBadgeComponent } from '../../article/article-parts';
import { MockAttempt } from './mock-attempt';
import { MOCK_BUTTON, MOCK_PRIMARY } from './mock-parts';

// The screens every mock interview has (ported from TheSWEguide's MockInterview.tsx): the brief
// before an attempt (with the attempts so far), the clarifying-question chat, and the
// self-evaluation that finishes an attempt.

const RATINGS: { id: SelfRating; label: string; classes: string }[] = [
  { id: 'got-it', label: 'Strong', classes: 'bg-success-soft border-success/50 text-success' },
  { id: 'partial', label: 'Partly', classes: 'bg-warning-soft border-warning/50 text-warning' },
  { id: 'missed', label: 'Missed', classes: 'bg-danger-soft border-danger/50 text-danger' },
];

const dateOf = (at: number) => new Date(at).toLocaleDateString();

/** The problem as the interviewer puts it, how the simulator works, the interview's length, and the attempts so far. */
@Component({
  selector: 'app-mock-brief',
  imports: [MarkdownComponent, ArrowIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block space-y-8' },
  template: `
    <section aria-labelledby="prompt-heading" class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 id="prompt-heading" class="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">The interviewer says</h2>
      <app-markdown [markdown]="attempt.script().prompt" [basePath]="attempt.basePath()" />
    </section>

    <section aria-labelledby="how-heading" class="grid gap-5 md:grid-cols-2">
      <div class="rounded-2xl border border-accent/30 bg-accent-soft p-5">
        <h2 id="how-heading" class="mb-2 font-bold text-fg">How this works</h2>
        <ol class="list-inside list-decimal space-y-1.5 text-sm text-fg-soft">
          @for (step of attempt.kit().howItWorks; track step) {
            <li>{{ step }}</li>
          }
        </ol>
        <p class="mt-3 text-xs text-muted">
          Feedback is deterministic: answers are matched to your questions by keywords, coverage is checked against the
          reference requirements, and the final score is your own self-assessment. Nothing here is graded by AI.
        </p>
      </div>
      <div class="rounded-2xl border border-border bg-surface p-5">
        <h2 class="mb-3 font-bold text-fg">Interview length</h2>
        <div
          role="radiogroup"
          aria-label="Interview length"
          (keydown)="onRadioGroupKeyDown($event)"
          class="mb-4 inline-flex gap-1 rounded-xl border border-border bg-bg p-1"
        >
          @for (length of lengths; track length) {
            <button
              type="button"
              role="radio"
              [attr.aria-checked]="minutes() === length"
              [tabIndex]="minutes() === length ? 0 : -1"
              (click)="minutes.set(length)"
              class="rounded-lg px-4 py-1.5 text-sm font-semibold focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              [class]="minutes() === length ? 'bg-accent-soft text-accent' : 'text-muted hover:text-fg'"
            >
              {{ length }} minutes
            </button>
          }
        </div>
        <ul class="mb-5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
          @for (phase of budgets(); track phase.id) {
            <li class="flex justify-between gap-2">
              <span>{{ phase.short }}</span>
              <span>{{ phase.minutes }} min</span>
            </li>
          }
        </ul>
        <button type="button" (click)="start()" [class]="primary">
          {{ history().length > 0 ? 'Start a new attempt' : 'Start the interview' }}
          <svg appArrowIcon class="size-4"></svg>
        </button>
      </div>
    </section>

    @if (history().length > 0) {
      <section aria-labelledby="history-heading" class="rounded-2xl border border-border bg-surface p-5">
        <h2 id="history-heading" class="mb-3 font-bold text-fg">Your attempts</h2>
        @if (last(); as last) {
          <p class="mb-3 text-sm text-fg-soft">
            Last attempt: <strong class="text-fg">{{ last.score }}%</strong> self-score in {{ clock(last.elapsedMs) }} of
            {{ last.minutes }} min, asked about {{ percent(last.clarifyCoverage) }}% of the key questions,
            {{ last.hintsUsed }} hint{{ last.hintsUsed === 1 ? '' : 's' }} used.
          </p>
        }
        <div class="overflow-x-auto" tabindex="0" role="region" aria-label="Your attempts (scrollable)">
          <table class="w-full min-w-[32rem] text-sm">
            <thead>
              <tr class="text-left text-xs text-muted">
                <th class="py-1.5 pr-3 font-semibold">Date</th>
                <th class="py-1.5 pr-3 font-semibold">Score</th>
                <th class="py-1.5 pr-3 font-semibold">Time</th>
                <th class="py-1.5 font-semibold">Weakest areas</th>
              </tr>
            </thead>
            <tbody>
              @for (row of attempts(); track row.completedAt) {
                <tr class="border-t border-border text-fg-soft">
                  <td class="py-1.5 pr-3">{{ row.date }}</td>
                  <td class="py-1.5 pr-3">{{ row.score }}%</td>
                  <td class="py-1.5 pr-3">{{ row.time }}</td>
                  <td class="py-1.5 text-xs text-muted">{{ row.weakest }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
})
export class MockBriefComponent {
  protected readonly attempt = inject(MockAttempt);
  private readonly progress = inject(ProgressStore);

  readonly problem = input.required<ProblemMeta>();

  protected readonly primary = MOCK_PRIMARY;
  protected readonly lengths = [45, 60] as const;
  protected readonly onRadioGroupKeyDown = onRadioGroupKeyDown;
  protected readonly minutes = linkedSignal<45 | 60>(() => (this.problem().minutes >= 60 ? 60 : 45));
  protected readonly history = this.attempt.history;
  protected readonly last = computed(() => this.history().at(-1));
  protected readonly budgets = computed(() => {
    const kit = this.attempt.kit();
    return kit.phases
      .filter((phase) => phase.id !== 'evaluation')
      .map((phase) => ({ id: phase.id, short: phase.short, minutes: kit.budgets[this.minutes()][phase.id] }));
  });
  /** Newest first. */
  protected readonly attempts = computed(() => {
    const rubric = this.attempt.kit().rubric;
    return [...this.history()].reverse().map((attempt) => ({
      completedAt: attempt.completedAt,
      date: dateOf(attempt.completedAt),
      score: attempt.score,
      time: `${formatClock(attempt.elapsedMs)} / ${attempt.minutes}:00`,
      weakest:
        rubric
          .filter((dimension) => attempt.ratings[dimension.id] === 'missed')
          .map((dimension) => dimension.label)
          .join(', ') || '—',
    }));
  });

  protected clock(ms: number) {
    return formatClock(ms);
  }

  protected percent(share: number) {
    return Math.round(share * 100);
  }

  protected start() {
    this.attempt.start(this.minutes());
    this.progress.markProblemStarted(this.attempt.topic(), this.attempt.slug());
  }
}

/** The clarifying questions: the learner asks, and the interviewer answers from the problem's script. */
@Component({
  selector: 'app-mock-clarify',
  imports: [MarkdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block space-y-5' },
  template: `
    @if (conversation().length > 0) {
      <ol #log class="max-h-[28rem] space-y-3 overflow-y-auto pr-1" aria-label="Conversation" aria-live="polite" tabindex="0">
        @for (entry of conversation(); track $index) {
          <li class="space-y-1.5">
            <p
              class="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-sm [overflow-wrap:anywhere] text-accent-fg"
            >
              {{ entry.text }}
            </p>
            <div
              class="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-2 px-3 py-2 text-sm [overflow-wrap:anywhere] text-fg [&_p]:my-0! [&_p]:text-sm! [&_p]:leading-6!"
            >
              <span class="mb-0.5 block text-[10px] font-semibold tracking-wider text-muted uppercase">
                Interviewer {{ entry.source }}
              </span>
              <app-markdown [markdown]="entry.reply" [basePath]="attempt.basePath()" />
            </div>
          </li>
        }
      </ol>
    }
    <form class="flex flex-col gap-2 sm:flex-row" (submit)="ask($event)">
      <label for="clarify-input" class="sr-only">Ask the interviewer a clarifying question</label>
      <input
        #input
        id="clarify-input"
        [value]="question()"
        (input)="question.set($any($event.target).value)"
        [placeholder]="attempt.kit().clarifyPlaceholder"
        autocomplete="off"
        class="flex-1 rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-fg placeholder:text-faint focus:ring-2 focus:ring-accent focus:outline-hidden"
      />
      <button type="submit" [disabled]="!question().trim()" [class]="primary + ' justify-center disabled:bg-surface-3 disabled:text-muted'">
        Ask
      </button>
    </form>
    <p class="text-sm text-muted" aria-live="polite">
      You have asked about <strong class="text-fg">{{ attempt.matched().size }}</strong> of the {{ clarifications().length }} topics
      this interviewer has answers for. Matching uses keywords, so rephrase if an answer doesn’t fit.
    </p>
    @if (showAll()) {
      <section aria-label="All clarifying questions" class="rounded-xl border border-success/30 bg-success-soft px-4 py-4">
        <p class="mb-2 text-xs font-semibold tracking-wider text-success uppercase">Questions a strong candidate asks</p>
        <ul class="space-y-2.5">
          @for (item of clarifications(); track $index) {
            <li class="text-sm">
              <p class="font-semibold text-fg">
                {{ attempt.matched().has($index) ? '✓' : '○' }} {{ item.question
                }}<span class="sr-only">{{ attempt.matched().has($index) ? ' (you asked this)' : ' (not asked)' }}</span>
              </p>
              <div class="text-fg-soft">
                <app-markdown [markdown]="item.answer" [basePath]="attempt.basePath()" />
              </div>
            </li>
          }
        </ul>
        @if (appendix(); as appendix) {
          <div class="mt-4 border-t border-border pt-3">
            <p class="mb-1 text-xs font-semibold text-muted">{{ appendix.title }}</p>
            <app-markdown [markdown]="appendix.markdown" [basePath]="attempt.basePath()" />
          </div>
        }
      </section>
    } @else {
      <button type="button" (click)="attempt.reveal('clarify')" [class]="button">
        🔍 Show every question the interviewer had answers for
      </button>
    }
  `,
})
export class MockClarifyComponent {
  protected readonly attempt = inject(MockAttempt);
  private readonly injector = inject(Injector);
  private readonly log = viewChild<ElementRef<HTMLElement>>('log');
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly button = MOCK_BUTTON;
  protected readonly primary = MOCK_PRIMARY;
  protected readonly question = signal('');
  protected readonly clarifications = computed(() => this.attempt.script().clarifications);
  protected readonly showAll = computed(() => Boolean(this.attempt.current().revealed['clarify']));
  protected readonly appendix = computed(() => this.attempt.kit().clarifyAppendix?.(this.attempt.script()));
  protected readonly conversation = computed(() => {
    const kit = this.attempt.kit();
    const clarifications = this.clarifications();
    return this.attempt.current().asked.map((asked) => {
      const match = asked.matched === null ? undefined : clarifications[asked.matched];
      return {
        text: asked.text,
        source: match ? `· scripted answer to “${match.question}”` : '· no scripted answer',
        reply: match?.answer ?? (kit.designChoice.test(asked.text) ? kit.designChoiceAnswer : kit.noMatchAnswer),
      };
    });
  });

  protected ask(event: Event) {
    event.preventDefault();
    const text = this.question().trim();
    if (!text) return;
    const result = this.attempt.kit().matcher.matchClarification(text, this.clarifications(), this.attempt.matched());
    this.attempt.ask(text, result ? result.index : null);
    this.question.set('');
    afterNextRender(
      () => {
        this.log()?.nativeElement.lastElementChild?.scrollIntoView({ block: 'nearest' });
        this.input().nativeElement.focus();
      },
      { injector: this.injector },
    );
  }
}

/** The end of an attempt: how it went, the learner's ratings on the rubric, the checklist, and Finish. */
@Component({
  selector: 'app-mock-evaluation',
  imports: [MarkdownComponent, InlineCodeComponent, ChecklistComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block space-y-6' },
  template: `
    <section aria-labelledby="summary-heading" class="rounded-xl border border-border bg-surface p-4">
      <h3 id="summary-heading" class="mb-3 font-bold text-fg">How the attempt went</h3>
      <ul class="mb-4 grid gap-3 text-sm sm:grid-cols-3">
        <li class="rounded-lg border border-border p-3">
          <p class="text-xs text-muted">Total time</p>
          <p class="text-lg font-semibold text-fg">
            {{ clock(attempt.elapsed()) }} <span class="text-sm text-muted">/ {{ session().minutes }}:00</span>
          </p>
        </li>
        <li class="rounded-lg border border-border p-3">
          <p class="text-xs text-muted">Clarifying coverage</p>
          <p class="text-lg font-semibold text-fg">{{ attempt.matched().size }} / {{ attempt.script().clarifications.length }}</p>
        </li>
        <li class="rounded-lg border border-border p-3">
          <p class="text-xs text-muted">Hints used · references opened before drafting</p>
          <p class="text-lg font-semibold text-fg">{{ attempt.hintsUsed() }} · {{ revealedBeforeDraft() }}</p>
        </li>
      </ul>
      <div class="overflow-x-auto" tabindex="0" role="region" aria-label="Time per phase (scrollable)">
        <table class="w-full min-w-[24rem] text-sm">
          <thead>
            <tr class="text-left text-xs text-muted">
              <th class="py-1 pr-3 font-semibold">Phase</th>
              <th class="py-1 pr-3 font-semibold">Time</th>
              <th class="py-1 font-semibold">Budget</th>
            </tr>
          </thead>
          <tbody>
            @for (row of timings(); track row.id) {
              <tr class="border-t border-border">
                <td class="py-1 pr-3 text-fg-soft">{{ row.short }}</td>
                <td class="py-1 pr-3" [class]="row.over ? 'text-warning' : 'text-fg-soft'">{{ row.time }}</td>
                <td class="py-1 text-muted">{{ row.budget }}:00</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <fieldset class="space-y-3">
      <legend class="mb-1 font-bold text-fg">Rate yourself on the rubric</legend>
      <p class="text-sm text-muted">Compare your drafts with the references you opened. Be strict: “Strong” means you would get full credit.</p>
      @for (dimension of rubric(); track dimension.id) {
        @let given = session().ratings[dimension.id];
        <div
          class="rounded-xl border border-border bg-surface p-4"
          role="radiogroup"
          [attr.aria-label]="dimension.label"
          (keydown)="onRadioGroupKeyDown($event)"
        >
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p class="font-semibold text-fg">{{ dimension.label }}</p>
            <span class="flex gap-1">
              @for (rating of ratings; track rating.id) {
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="given === rating.id"
                  [tabIndex]="given === rating.id || (!given && $first) ? 0 : -1"
                  (click)="attempt.rate(dimension.id, rating.id)"
                  class="rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  [class]="given === rating.id ? rating.classes : 'border-border text-muted hover:text-fg'"
                >
                  {{ rating.label }}
                </button>
              }
            </span>
          </div>
          <p class="text-xs text-muted"><span class="font-semibold text-success">Strong: </span><span appInlineCode [text]="dimension.strong"></span></p>
          <p class="mt-1 text-xs text-muted"><span class="font-semibold text-danger">Weak: </span><span appInlineCode [text]="dimension.weak"></span></p>
        </div>
      }
    </fieldset>

    @if (checklist().items.length > 0) {
      <app-checklist [widget]="checklist()" [page]="checklistPage()" />
    }

    @if (followUps(); as followUps) {
      <section aria-labelledby="followups-heading">
        <h3 id="followups-heading" class="mb-1 font-bold text-fg">Follow-up questions to practise</h3>
        <p class="mb-2 text-sm text-muted">Answer each out loud before opening it. Save the ones you struggled with to your notebook.</p>
        <app-markdown [markdown]="followUps" [basePath]="attempt.basePath()" />
      </section>
    }

    <div class="flex flex-col justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4 sm:flex-row sm:items-center">
      <div>
        <p class="font-semibold text-fg">
          Self-score: {{ score() }}%
          @if (rated() < rubric().length) {
            <span class="text-sm font-normal text-muted">({{ rated() }} of {{ rubric().length }} rated)</span>
          }
        </p>
        <p class="text-sm text-muted">
          Finishing saves this attempt and marks the problem <em>Attempted</em> (currently <app-status-badge [status]="status()" />).
          Areas you rate “Missed” go on your revision list.
        </p>
      </div>
      <button
        type="button"
        (click)="finish.emit()"
        [disabled]="rated() < rubric().length"
        [class]="primary + ' shrink-0 justify-center disabled:bg-surface-3 disabled:text-muted'"
      >
        Finish interview
      </button>
    </div>
  `,
})
export class MockEvaluationComponent {
  protected readonly attempt = inject(MockAttempt);
  private readonly progress = inject(ProgressStore);

  /** The rendered checklist items of the problem's script. */
  readonly checklistItems = input.required<InlineText[]>();
  readonly finish = output<void>();

  protected readonly primary = MOCK_PRIMARY;
  protected readonly ratings = RATINGS;
  protected readonly onRadioGroupKeyDown = onRadioGroupKeyDown;
  protected readonly session = this.attempt.current;
  protected readonly rubric = computed(() => this.attempt.kit().rubric);
  protected readonly rated = computed(() => this.rubric().filter((dimension) => this.session().ratings[dimension.id]).length);
  protected readonly score = computed(() => rubricScore(this.session().ratings, this.rubric().length));
  protected readonly status = computed(() => problemStatus(this.progress.progress(), this.attempt.topic(), this.attempt.slug()));
  /** References opened for a phase whose draft was still empty. */
  protected readonly revealedBeforeDraft = computed(() => {
    const { revealed, drafts } = this.session();
    const guide = this.attempt.kit().guide;
    return Object.keys(revealed).filter((key) => Object.hasOwn(guide, key) && !(drafts[key] ?? '').trim()).length;
  });
  protected readonly timings = computed(() => {
    const kit = this.attempt.kit();
    const budgets = kit.budgets[this.session().minutes];
    return kit.phases
      .filter((phase) => phase.id !== 'evaluation')
      .map((phase) => {
        const spent = this.attempt.phaseElapsed(phase.id);
        return { id: phase.id, short: phase.short, time: formatClock(spent), budget: budgets[phase.id], over: spent > budgets[phase.id] * 60_000 };
      });
  });
  protected readonly checklist = computed(
    (): ChecklistWidget => ({ type: 'checklist', title: this.attempt.kit().checklistTitle, items: this.checklistItems() }),
  );
  /** Ticks are shared with the checklist on the problem's breakdown. */
  protected readonly checklistPage = computed((): BodyPage => ({ track: this.attempt.topic(), kind: 'problem', slug: this.attempt.slug() }));
  /** HLD breakdowns end with follow-up questions to practise. */
  protected readonly followUps = computed(() =>
    this.attempt.topic() === 'hld' ? this.attempt.script().sections['Interviewer follow-up questions'] || undefined : undefined,
  );

  protected clock(ms: number) {
    return formatClock(ms);
  }
}
