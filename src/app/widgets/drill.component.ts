import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import type { DrillWidget } from '@lib/content/doc';
import type { QuizAnswer } from '@lib/progress/progress';
import { formatQuantity, parseQuantity, type QuantityKind, ratio } from '@lib/widgets/numbers';
import { ProgressStore } from '../core/progress.store';
import { type BodyPage, uniqueId } from './page';

// Estimation drills (```drill blocks), ported from TheSWEguide's Drill.tsx: type an estimate such
// as 1.2K/s or 40 GB; answers within the stated factor of the reference count.

type DrillQuestion = DrillWidget['questions'][number];
type Verdict = { ok: boolean; message: string } | null;

const NEEDS_UNIT: QuantityKind[] = ['bytes', 'bitrate', 'duration'];

const judge = (question: DrillQuestion, input: string): Verdict => {
  const parsed = parseQuantity(input);
  if (!parsed) return { ok: false, message: 'That isn’t a number I can read — try forms like 1200, 1.2K, 3M, 40 GB or 12 ms.' };
  if (NEEDS_UNIT.includes(question.kind) && parsed.kind === 'count') {
    return { ok: false, message: 'Add a unit (for example KB, GB, TB, Gbps or ms) so the size is unambiguous.' };
  }
  const off = ratio(parsed.value, question.answer);
  const shown = formatQuantity(question.answer, question.kind);
  if (off <= question.tolerance) {
    return {
      ok: true,
      message:
        off < 1.15
          ? `Spot on — the reference is ${shown}.`
          : `Close enough (within ×${question.tolerance}) — the reference is ${shown}.`,
    };
  }
  const direction = parsed.value > question.answer ? 'high' : 'low';
  return {
    ok: false,
    message: `About ${off >= 10 ? Math.round(off) : off.toFixed(1)}× too ${direction}. Check units and the per-day → per-second step, then try again.`,
  };
};

@Component({
  selector: 'app-drill-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-xl border border-border bg-surface p-4 sm:p-5' },
  template: `
    <p class="mb-3 font-semibold [overflow-wrap:anywhere] text-fg">
      <span class="mr-2 text-accent">E{{ index() + 1 }}.</span><span [innerHTML]="question().prompt.html"></span>
    </p>
    <form class="flex flex-wrap items-center gap-2" (submit)="check($event)">
      <label [for]="id" class="sr-only">Your estimate</label>
      <input
        [id]="id"
        [value]="entry()"
        (input)="entry.set($any($event.target).value)"
        [disabled]="solved()"
        placeholder="Your estimate, e.g. 1.2K/s or 40 GB"
        autocomplete="off"
        spellcheck="false"
        class="w-56 max-w-full rounded-lg border border-border bg-bg px-3 py-1.5 font-mono text-sm text-fg placeholder:text-faint focus:ring-2 focus:ring-accent focus:outline-hidden disabled:opacity-70"
      />
      <button
        type="submit"
        [disabled]="solved() || !entry().trim()"
        class="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg hover:opacity-90 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:bg-surface-3 disabled:text-muted"
      >
        Check
      </button>
      @if (!solved()) {
        <button
          type="button"
          (click)="showSolution.set(!showSolution())"
          class="text-xs text-muted underline underline-offset-2 hover:text-fg"
        >
          {{ showSolution() ? 'Hide solution' : 'Show solution' }}
        </button>
      }
    </form>
    <div aria-live="polite">
      @if (verdict(); as verdict) {
        <p class="mt-2 text-sm" [class.text-success]="verdict.ok" [class.text-danger]="!verdict.ok">
          {{ verdict.ok ? '✓ ' : '✗ ' }}{{ verdict.message }}
        </p>
      }
      @if ((solved() || showSolution()) && question().solution.text) {
        <p class="mt-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg-soft">
          <span class="font-semibold text-success">Working: </span><span [innerHTML]="question().solution.html"></span>
        </p>
      }
    </div>
  `,
})
export class DrillItemComponent {
  readonly question = input.required<DrillQuestion>();
  readonly index = input.required<number>();
  /** Each readable attempt (an unreadable entry isn't one). */
  readonly answered = output<QuizAnswer>();

  protected readonly id = uniqueId('drill');
  protected readonly entry = signal('');
  protected readonly verdict = signal<Verdict>(null);
  protected readonly showSolution = signal(false);
  protected readonly solved = computed(() => this.verdict()?.ok ?? false);

  protected check(event: Event) {
    event.preventDefault();
    const question = this.question();
    const entry = this.entry();
    const verdict = judge(question, entry);
    this.verdict.set(verdict);
    if (verdict && parseQuantity(entry)) {
      this.answered.emit({
        prompt: question.prompt.text,
        correct: verdict.ok,
        chosen: entry.trim(),
        correctText: `≈ ${formatQuantity(question.answer, question.kind)}`,
        explanation: question.solution.text,
      });
    }
  }
}

/** A drill block. On lesson pages, answers are recorded with the lesson's knowledge-check answers. */
@Component({
  selector: 'app-drill',
  imports: [DrillItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (widget().questions.length > 0) {
      <section class="not-prose my-6 space-y-3" aria-label="Estimation drill">
        <p class="text-xs font-semibold tracking-wider text-warning uppercase">
          🧠 Estimation drill · answers within the stated factor count
        </p>
        @for (question of widget().questions; track question.prompt.text; let i = $index) {
          <app-drill-item [question]="question" [index]="i" (answered)="record($event)" />
        }
      </section>
    }
  `,
})
export class DrillComponent {
  private readonly store = inject(ProgressStore);

  readonly widget = input.required<DrillWidget>();
  readonly page = input.required<BodyPage>();

  protected record(answer: QuizAnswer) {
    const page = this.page();
    if (page.kind === 'lesson') this.store.recordQuizAnswer(page.track, page.slug, answer);
  }
}
