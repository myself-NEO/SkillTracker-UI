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
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { topicTitle } from '@content/java/interview';
import type { JavaBankQuestion } from '@lib/content/catalog';
import { type ContentDoc, fragmentDoc } from '@lib/content/doc';
import { bankProgress, kindLabel, LEVEL_TEXT, practised, RATING_LABEL } from '@lib/interview/java-bank';
import { isSaved, itemKey, type SelfRating } from '@lib/progress/notebook';
import { NotebookStore } from '../../core/notebook.store';
import { DebouncedSave } from '../../notebook/debounced-save';
import { ToggleChipComponent } from '../../notebook/toggle-chip.component';
import { BookmarkIconComponent, CheckCircleIconComponent, FlagIconComponent } from '../../ui/icons';
import { InlineCodeComponent } from '../../ui/inline-code.component';
import { LevelBadgeComponent } from '../../ui/level-badge.component';
import { ProgressBarComponent } from '../../ui/stat-parts';
import { type BodyPage, LessonBodyComponent } from '../article/lesson-body.component';

// The Java interview question bank's question card and its practice (TheSWEguide's JavaQuestions,
// QuestionPractice, QuestionStatus and BankProgress): write an answer, open hints one at a time,
// reveal the model answer, rate yourself. The learner's draft, hints, rating and flags are kept in
// the notebook (`java:<question id>`), so they reach the account.

const RATINGS: { id: SelfRating; label: string; classes: string }[] = [
  { id: 'got-it', label: 'Got it', classes: 'border-success/50 bg-success-soft text-success' },
  { id: 'partial', label: 'Partially', classes: 'border-warning/50 bg-warning-soft text-warning' },
  { id: 'missed', label: 'Missed it', classes: 'border-danger/50 bg-danger-soft text-danger' },
];

/** Typing pauses this long before the draft answer is saved. */
const DRAFT_DELAY_MS = 500;

const CHIP = 'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium';

/** How much of a set of questions the learner has practised, and how it went. */
@Component({
  selector: 'app-bank-progress',
  imports: [ProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-baseline justify-between gap-3 text-sm">
      <span class="text-muted">
        <span class="font-semibold text-fg tabular-nums">{{ figures().practised }}</span> of {{ ids().length }} questions practised
      </span>
      <span class="text-xs text-muted tabular-nums">{{ percent() }}%</span>
    </div>
    <app-progress-bar class="mt-2" [value]="figures().practised" [max]="ids().length" label="Questions practised" />
    <p class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      <span><span class="font-semibold text-success tabular-nums">{{ figures().gotIt }}</span> got it</span>
      <span><span class="font-semibold text-warning tabular-nums">{{ figures().partial }}</span> partly</span>
      <span><span class="font-semibold text-danger tabular-nums">{{ figures().missed }}</span> missed</span>
    </p>
  `,
})
export class BankProgressComponent {
  private readonly store = inject(NotebookStore);
  readonly ids = input.required<readonly string[]>();
  protected readonly figures = computed(() => bankProgress(this.store.notebook(), this.ids()));
  protected readonly percent = computed(() =>
    this.ids().length ? Math.round((this.figures().practised / this.ids().length) * 100) : 0,
  );
}

/** The marker before a question's title: its rating, or whether it was practised, and its flags. */
@Component({
  selector: 'app-question-status',
  imports: [CheckCircleIconComponent, BookmarkIconComponent, FlagIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex shrink-0 items-center gap-1.5 pt-0.5' },
  template: `
    <svg appCheckCircleIcon [filled]="rating() === 'got-it'" class="size-5" [class]="tone()"></svg>
    <span class="sr-only">{{ label() }}</span>
    @if (bookmarked()) {
      <svg appBookmarkIcon [filled]="true" class="size-3.5 text-accent"></svg>
    }
    @if (revise()) {
      <svg appFlagIcon [filled]="true" class="size-3.5 text-warning"></svg>
    }
  `,
})
export class QuestionStatusComponent {
  private readonly store = inject(NotebookStore);
  readonly id = input.required<string>();

  protected readonly rating = computed(() => this.store.notebook().questions[itemKey('java', this.id())]?.rating);
  private readonly attempted = computed(() => practised(this.store.notebook(), this.id()));
  protected readonly tone = computed(() => {
    const rating = this.rating();
    if (rating === 'got-it') return 'text-success';
    if (rating === 'missed') return 'text-danger';
    if (rating === 'partial') return 'text-warning';
    return this.attempted() ? 'text-accent' : 'text-faint';
  });
  protected readonly label = computed(() => {
    const rating = this.rating();
    return rating ? RATING_LABEL[rating] : this.attempted() ? 'Attempted' : 'Not practised';
  });
  protected readonly bookmarked = computed(() => isSaved(this.store.notebook(), 'question', 'java', this.id()));
  protected readonly revise = computed(() => Boolean(this.store.notebook().revise[itemKey('java', this.id())]));
}

/** A question's rendered parts, as documents for the body renderer. */
interface QuestionDocs {
  body?: ContentDoc;
  hints: ContentDoc[];
  answer: ContentDoc;
  whyNot?: ContentDoc;
  followUp?: ContentDoc;
}

/** Practising one question: a draft, hints, the model answer, a self-rating, a bookmark and a flag. */
@Component({
  selector: 'app-question-practice',
  imports: [RouterLink, LessonBodyComponent, ToggleChipComponent, BookmarkIconComponent, FlagIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block space-y-5' },
  template: `
    <div>
      <label [for]="'answer-' + question().id" class="block text-sm font-semibold text-fg">Your answer</label>
      <p class="mt-0.5 text-xs text-muted">Answer out loud or in writing before revealing. Your draft is saved to your account.</p>
      <textarea
        [id]="'answer-' + question().id"
        [value]="draft()"
        (input)="onDraft($any($event.target).value)"
        rows="4"
        placeholder="Explain it as you would to an interviewer: definition, how it works, trade-offs, an example…"
        class="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-fg placeholder:text-faint focus:ring-2 focus:ring-accent focus:outline-hidden"
      ></textarea>
    </div>

    @if (docs().hints.length > 0) {
      <div class="space-y-2">
        @for (hint of docs().hints.slice(0, hintsShown()); track $index) {
          <div class="rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm">
            <p class="text-xs font-semibold text-warning">Hint {{ $index + 1 }} of {{ docs().hints.length }}</p>
            <app-lesson-body class="mt-1 [&_.prose>*:first-child]:mt-0 [&_.prose>*:last-child]:mb-0" [doc]="hint" [page]="page()" />
          </div>
        }
        @if (hintsShown() < docs().hints.length) {
          <button
            type="button"
            (click)="showHint()"
            class="inline-flex items-center gap-1.5 rounded-lg border border-warning/40 px-3 py-1.5 text-sm font-semibold text-warning hover:bg-warning-soft"
          >
            Show hint {{ hintsShown() + 1 }} of {{ docs().hints.length }}
          </button>
        }
      </div>
    }

    @if (!revealed()) {
      <button
        type="button"
        (click)="reveal()"
        class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg hover:opacity-90"
      >
        Reveal the answer
      </button>
    } @else {
      <div #answer tabindex="-1" class="space-y-5 focus:outline-hidden">
        <section aria-label="Answer" class="rounded-xl border border-success/30 bg-surface px-4 py-4 sm:px-5">
          <h4 class="text-sm font-semibold text-success">Answer</h4>
          <app-lesson-body class="mt-2" [doc]="docs().answer" [page]="page()" />
        </section>
        @if (docs().whyNot; as whyNot) {
          <section aria-label="Why other answers fall short" class="rounded-xl border border-border bg-surface px-4 py-4 sm:px-5">
            <h4 class="text-sm font-semibold text-fg">Why other answers fall short</h4>
            <app-lesson-body class="mt-2" [doc]="whyNot" [page]="page()" />
          </section>
        }
        @if (docs().followUp; as followUp) {
          <details class="group rounded-xl border border-insight/30 bg-surface">
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-insight [&::-webkit-details-marker]:hidden"
            >
              Follow-up question
              <span class="text-xs font-medium text-muted group-open:hidden">Show</span>
              <span class="hidden text-xs font-medium text-muted group-open:inline">Hide</span>
            </summary>
            <div class="border-t border-border px-4 py-4 sm:px-5"><app-lesson-body [doc]="followUp" [page]="page()" /></div>
          </details>
        }
        <div role="group" aria-label="How did you do?" class="flex flex-wrap items-center gap-2">
          <span class="mr-1 text-sm text-fg-soft">How did you do?</span>
          @for (option of ratings; track option.id) {
            <button
              type="button"
              [attr.aria-pressed]="status().rating === option.id"
              (click)="store.rateQuestion('java', question().id, option.id)"
              class="rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors"
              [class]="status().rating === option.id ? option.classes : 'border-border text-fg-soft hover:border-border-strong hover:text-fg'"
            >
              {{ option.label }}
            </button>
          }
          @if (status().rating === 'missed') {
            <span class="text-xs text-warning">Added to your revision list.</span>
          }
        </div>
      </div>
    }

    <div class="flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <button appToggleChip [pressed]="bookmarked()" (click)="toggleBookmark()" label="Bookmark" pressedLabel="Bookmarked">
        <svg appBookmarkIcon [filled]="bookmarked()" class="size-3.5"></svg>
      </button>
      <button
        appToggleChip
        [pressed]="revise()"
        (click)="store.toggleRevise('java', question().id)"
        label="Mark for revision"
        pressedLabel="On revision list"
        tone="warning"
      >
        <svg appFlagIcon [filled]="revise()" class="size-3.5"></svg>
      </button>
      @if (question().lessons.length > 0) {
        <span class="ml-auto text-xs text-muted">
          Learn it:
          @for (lesson of question().lessons; track lesson.slug; let last = $last) {
            <a [routerLink]="'/java/' + lesson.slug" class="text-accent hover:underline">{{ lesson.title }}</a>{{ last ? '' : ', ' }}
          }
        </span>
      }
    </div>
  `,
})
export class QuestionPracticeComponent {
  protected readonly store = inject(NotebookStore);
  private readonly injector = inject(Injector);
  private readonly answer = viewChild<ElementRef<HTMLElement>>('answer');
  private readonly drafts = new DebouncedSave(DRAFT_DELAY_MS);

  readonly question = input.required<JavaBankQuestion>();
  readonly docs = input.required<QuestionDocs>();
  readonly page = input.required<BodyPage>();

  protected readonly ratings = RATINGS;
  private readonly key = computed(() => itemKey('java', this.question().id));
  protected readonly status = computed(() => this.store.notebook().questions[this.key()] ?? {});
  /** What the learner typed; until they type, the box shows the saved draft. */
  private readonly typed = signal<string | null>(null);
  protected readonly draft = computed(() => this.typed() ?? this.status().draft ?? '');
  private readonly justRevealed = signal(false);
  protected readonly revealed = computed(() => this.justRevealed() || Boolean(this.status().revealedAt));
  protected readonly hintsShown = computed(() => Math.min(this.status().hints ?? 0, this.question().hints.length));
  protected readonly bookmarked = computed(() => isSaved(this.store.notebook(), 'question', 'java', this.question().id));
  protected readonly revise = computed(() => Boolean(this.store.notebook().revise[this.key()]));

  protected onDraft(value: string) {
    this.typed.set(value);
    const id = this.question().id;
    this.drafts.queue(id, () => this.store.updateQuestion('java', id, { draft: value }));
  }

  protected showHint() {
    this.store.updateQuestion('java', this.question().id, { hints: this.hintsShown() + 1 });
  }

  protected reveal() {
    this.justRevealed.set(true);
    this.drafts.cancel(); // saved with the reveal
    this.store.updateQuestion('java', this.question().id, { draft: this.draft(), revealedAt: this.status().revealedAt ?? Date.now() });
    afterNextRender(() => this.answer()?.nativeElement.focus(), { injector: this.injector });
  }

  protected toggleBookmark() {
    const question = this.question();
    this.store.toggleSaved({
      kind: 'question',
      track: 'java',
      ref: question.id,
      title: question.title,
      context: topicTitle(question.topic),
      topic: question.topic,
      href: `/java/interview/${question.topic}#q-${question.id}`,
    });
  }
}

/** One question of the bank, a card that opens to practise it: `<li appJavaQuestion [question]="q">`. */
@Component({
  selector: 'li[appJavaQuestion]',
  imports: [InlineCodeComponent, LevelBadgeComponent, QuestionStatusComponent, QuestionPracticeComponent, LessonBodyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <details
      [id]="'q-' + question().id"
      class="group/question scroll-mt-28 rounded-xl border border-border bg-surface"
      [open]="open()"
      (toggle)="onToggle($event)"
    >
      <summary
        class="flex cursor-pointer list-none items-start gap-3 rounded-xl px-4 py-3.5 transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden"
      >
        <app-question-status [id]="question().id" />
        <span class="min-w-0 flex-1">
          <span class="block leading-snug font-semibold text-fg" appInlineCode [text]="question().title"></span>
          <span class="mt-2 flex flex-wrap items-center gap-1.5">
            <app-level-badge [level]="question().level" [label]="levelText[question().level]" />
            <span [class]="chip + ' border-border bg-surface-2 text-fg-soft'">{{ kind() }}</span>
            @if (showTopic()) {
              <span [class]="chip + ' border-border bg-surface-2 text-fg-soft'">{{ topic() }}</span>
            }
            @if (question().tricky) {
              <span [class]="chip + ' border-insight/30 bg-insight-soft text-insight'">Tricky</span>
            }
          </span>
        </span>
        <svg
          class="mt-1 size-4 shrink-0 text-faint transition-transform group-open/question:rotate-180"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          />
        </svg>
      </summary>
      @if (opened()) {
        <div class="space-y-5 border-t border-border px-4 pt-4 pb-5 sm:px-5">
          @if (docs().body; as body) {
            <app-lesson-body [doc]="body" [page]="page()" />
          }
          <app-question-practice [question]="question()" [docs]="docs()" [page]="page()" />
        </div>
      }
    </details>
  `,
})
export class JavaQuestionComponent {
  readonly question = input.required<JavaBankQuestion>();
  /** Show the question's topic (on the tricky questions' page, which mixes them). */
  readonly showTopic = input(false);
  /** Open from the start (the page's #q-… link points at it). */
  readonly open = input(false);

  protected readonly chip = CHIP;
  protected readonly levelText = LEVEL_TEXT;
  protected readonly kind = computed(() => kindLabel(this.question().kind));
  protected readonly topic = computed(() => topicTitle(this.question().topic));
  /** Its parts are rendered when it is first opened. */
  protected readonly opened = linkedSignal(() => this.open());
  protected readonly page = computed((): BodyPage => ({ track: 'java', kind: 'interview', slug: this.question().id }));
  protected readonly docs = computed((): QuestionDocs => {
    const question = this.question();
    return {
      body: question.body && fragmentDoc(question.body),
      hints: question.hints.map(fragmentDoc),
      answer: fragmentDoc(question.answer),
      whyNot: question.whyNot && fragmentDoc(question.whyNot),
      followUp: question.followUp && fragmentDoc(question.followUp),
    };
  });

  protected onToggle(event: Event) {
    if ((event.target as HTMLDetailsElement).open) this.opened.set(true);
  }
}
