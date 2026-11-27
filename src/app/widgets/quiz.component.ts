import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import type { QuizWidget } from '@lib/content/doc';
import { isQuizPassed } from '@lib/progress/progress';
import { ProgressStore } from '../core/progress.store';
import { type BodyPage, uniqueId } from './page';

type Question = QuizWidget['questions'][number];
type OptionState = 'correct' | 'wrong' | 'idle';

const OPTION_CLASS: Record<OptionState, string> = {
  correct: 'border-success/60 bg-success-soft',
  wrong: 'border-danger/60 bg-danger-soft',
  idle: 'border-border hover:border-border-strong bg-bg',
};

/**
 * The knowledge check at the end of a lesson (```quiz blocks), ported from TheSWEguide's Quiz.tsx.
 * Pick an option; a wrong one says why and lets you try again or show the answer. On lesson pages
 * every choice is recorded (for revision), and answering all correctly marks the check passed.
 */
@Component({
  selector: 'app-quiz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section class="not-prose my-6 space-y-4" aria-label="Knowledge check">
      <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span class="text-muted">{{ correctCount() }} / {{ questions().length }} answered correctly</span>
        @if (allCorrect() || alreadyPassed()) {
          <span class="inline-flex items-center gap-1.5 font-semibold text-success">
            <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              />
            </svg>
            Knowledge check passed
          </span>
        }
      </div>

      @for (question of questions(); track $index; let i = $index) {
        @let chosen = selected()[i];
        @let solved = chosen !== undefined && question.options[chosen].correct;
        @let showAnswer = solved || !!revealed()[i];
        <div class="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <fieldset class="m-0 min-w-0 border-0 p-0">
            <legend class="mb-3 max-w-full font-semibold [overflow-wrap:anywhere] text-fg">
              <span class="mr-2 text-accent">Q{{ i + 1 }}.</span><span [innerHTML]="question.prompt.html"></span>
            </legend>
            <div class="space-y-2">
              @for (option of question.options; track $index; let o = $index) {
                @let state = optionState(showAnswer, option.correct, chosen === o);
                <label
                  class="flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm text-fg transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
                  [class]="optionClass[state]"
                  [class.cursor-pointer]="!solved"
                  [class.cursor-default]="solved"
                >
                  <input
                    type="radio"
                    [name]="name + '-' + i"
                    class="mt-0.5 accent-accent"
                    [checked]="chosen === o"
                    [disabled]="solved"
                    (change)="select(i, o)"
                  />
                  <span class="min-w-0 flex-1 [overflow-wrap:anywhere]" [innerHTML]="option.text.html"></span>
                  @if (state === 'correct') {
                    <span class="text-xs font-semibold text-success">Correct</span>
                  } @else if (state === 'wrong') {
                    <span class="text-xs font-semibold text-danger">Not quite</span>
                  }
                </label>
              }
            </div>

            <div aria-live="polite">
              @if (chosen !== undefined && !solved && !revealed()[i]) {
                <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  @if (question.options[chosen].reason; as reason) {
                    <span class="basis-full text-fg-soft">
                      <span class="font-semibold text-danger">Why not: </span><span [innerHTML]="reason.html"></span>
                    </span>
                  }
                  <span class="text-danger">Not quite — try another option.</span>
                  <button
                    type="button"
                    (click)="reveal(i)"
                    class="text-muted underline underline-offset-2 hover:text-fg"
                  >
                    Show answer
                  </button>
                </div>
              }
              @if (showAnswer && question.explanation.text) {
                <p class="mt-3 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg-soft">
                  <span class="font-semibold text-success">Why: </span><span [innerHTML]="question.explanation.html"></span>
                </p>
              }
              @if (showAnswer && otherReasons(question).length > 0) {
                <div class="mt-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg-soft">
                  <p class="mb-1 font-semibold text-fg">Why the other options are wrong</p>
                  <ul class="space-y-1.5">
                    @for (other of otherReasons(question); track $index) {
                      <li class="[overflow-wrap:anywhere]">
                        <span class="text-danger" [innerHTML]="other.text.html"></span> —
                        <span [innerHTML]="other.reason!.html"></span>
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>
          </fieldset>
        </div>
      }

      @if (answered()) {
        <button type="button" (click)="reset()" class="text-xs text-muted underline underline-offset-2 hover:text-fg">
          Reset answers
        </button>
      }
    </section>
  `,
})
export class QuizComponent {
  private readonly store = inject(ProgressStore);

  readonly widget = input.required<QuizWidget>();
  readonly page = input.required<BodyPage>();

  protected readonly name = uniqueId('quiz');
  protected readonly optionClass = OPTION_CLASS;
  /** question index → option index chosen */
  protected readonly selected = signal<Record<number, number>>({});
  /** question index → answer shown */
  protected readonly revealed = signal<Record<number, boolean>>({});

  protected readonly questions = computed(() => this.widget().questions);
  protected readonly correctCount = computed(
    () => this.questions().filter((question, i) => question.options[this.selected()[i]]?.correct).length,
  );
  protected readonly allCorrect = computed(
    () => this.questions().length > 0 && this.correctCount() === this.questions().length,
  );
  protected readonly answered = computed(() => Object.keys(this.selected()).length > 0);
  /** Only lessons have knowledge checks that count; quizzes elsewhere are practice. */
  private readonly lesson = computed(() => (this.page().kind === 'lesson' ? this.page() : null));
  protected readonly alreadyPassed = computed(() => {
    const lesson = this.lesson();
    return lesson ? isQuizPassed(this.store.progress(), lesson.track, lesson.slug) : false;
  });

  constructor() {
    effect(() => {
      const lesson = this.lesson();
      if (lesson && this.allCorrect()) untracked(() => this.store.markQuizPassed(lesson.track, lesson.slug));
    });
  }

  protected optionState(showAnswer: boolean, correct: boolean, chosen: boolean): OptionState {
    return showAnswer && correct ? 'correct' : chosen && !correct ? 'wrong' : 'idle';
  }

  protected otherReasons(question: Question) {
    return question.options.filter((option) => !option.correct && option.reason);
  }

  protected select(index: number, option: number) {
    this.selected.update((selected) => ({ ...selected, [index]: option }));
    const lesson = this.lesson();
    if (!lesson) return;
    const question = this.questions()[index];
    this.store.recordQuizAnswer(lesson.track, lesson.slug, {
      prompt: question.prompt.text,
      correct: question.options[option].correct,
      chosen: question.options[option].text.text,
      correctText: question.options
        .filter((candidate) => candidate.correct)
        .map((candidate) => candidate.text.text)
        .join(' / '),
      explanation: question.explanation.text,
    });
  }

  protected reveal(index: number) {
    this.revealed.update((revealed) => ({ ...revealed, [index]: true }));
  }

  protected reset() {
    this.selected.set({});
    this.revealed.set({});
  }
}
