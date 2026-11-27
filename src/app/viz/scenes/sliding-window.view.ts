import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core';
import type { SlidingWindowParams, SlidingWindowState } from '@lib/viz/scenes/sliding-window/logic';

// The array as a row of cells, with the window as a band that slides over them.

/** Cell width including the gap, in rem. */
const CELL = 3;

@Component({
  selector: 'app-sliding-window-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="relative w-fit">
        @if (hasWindow()) {
          <div
            class="absolute -inset-y-1.5 rounded-xl border-2 border-accent bg-accent-soft transition-[left,width] duration-300 ease-out motion-reduce:transition-none"
            [style.left.rem]="state().left * cell - 0.25"
            [style.width.rem]="(state().right - state().left + 1) * cell + 0.1"
            aria-hidden="true"
          ></div>
        }
        <ol class="relative flex gap-2" aria-label="Array">
          @for (value of state().array; track $index; let index = $index) {
            <li class="flex w-10 flex-col items-center gap-1">
              <span
                class="grid size-10 place-items-center rounded-lg border font-mono text-sm font-semibold transition-colors"
                [class]="cellClass(index)"
              >
                {{ value }}
              </span>
              <span class="font-mono text-[10px] text-faint">{{ index }}</span>
              <span class="h-3 text-[10px] font-semibold text-muted">{{ marker(index) }}</span>
            </li>
          }
        </ol>
      </div>
      <dl class="flex flex-wrap gap-2 text-xs">
        <div class="rounded-lg border border-border bg-bg px-3 py-1.5">
          <dt class="inline text-muted">windowSum </dt>
          <dd class="inline font-mono font-semibold text-fg tabular-nums">{{ state().windowSum }}</dd>
        </div>
        <div class="rounded-lg border border-border bg-bg px-3 py-1.5">
          <dt class="inline text-muted">best </dt>
          <dd class="inline font-mono font-semibold text-fg tabular-nums">{{ state().best ?? '—' }}</dd>
        </div>
      </dl>
    </div>
  `,
})
export class SlidingWindowViewComponent {
  readonly state = input.required<SlidingWindowState>();
  protected readonly cell = CELL;
  protected readonly hasWindow = computed(() => this.state().right >= this.state().left);

  protected cellClass(index: number) {
    const state = this.state();
    const inWindow = this.hasWindow() && index >= state.left && index <= state.right;
    const inBest = state.bestRange && index >= state.bestRange[0] && index <= state.bestRange[1];
    const base =
      index === state.adding
        ? 'border-success bg-success-soft text-success'
        : index === state.removing
          ? 'border-danger bg-danger-soft text-danger line-through'
          : inWindow
            ? 'border-accent/40 bg-surface text-fg'
            : 'border-border bg-bg text-muted';
    return state.done && inBest ? `${base} ring-2 ring-success ring-offset-2 ring-offset-surface` : base;
  }

  /** "L", "R" or "L·R" under the window's ends. */
  protected marker(index: number) {
    const { left, right } = this.state();
    if (!this.hasWindow()) return '';
    return `${index === left ? 'L' : ''}${index === right ? (index === left ? '·R' : 'R') : ''}`;
  }
}

const parseArray = (text: string) => {
  const values = text
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((part) => Number(part));
  return values.length >= 2 && values.length <= 12 && values.every((value) => Number.isInteger(value) && Math.abs(value) < 1000)
    ? values
    : null;
};

/** Lets the learner try their own array and window size. */
@Component({
  selector: 'app-sliding-window-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="flex flex-wrap items-end gap-3" (submit)="run($event)">
      <label class="flex min-w-48 flex-1 flex-col gap-1 text-xs font-semibold text-muted">
        Array
        <input
          [value]="arrayText()"
          (input)="arrayText.set($any($event.target).value)"
          class="rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:ring-2 focus:ring-accent focus:outline-hidden"
        />
      </label>
      <label class="flex w-20 flex-col gap-1 text-xs font-semibold text-muted">
        k
        <input
          [value]="kText()"
          (input)="kText.set($any($event.target).value)"
          inputmode="numeric"
          class="rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:ring-2 focus:ring-accent focus:outline-hidden"
        />
      </label>
      <button
        type="submit"
        [disabled]="!!error()"
        class="h-9 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50"
      >
        Run
      </button>
      @if (error(); as error) {
        <p class="basis-full text-xs text-danger">{{ error }}</p>
      }
    </form>
  `,
})
export class SlidingWindowEditorComponent {
  readonly params = input.required<SlidingWindowParams>();
  readonly changed = output<SlidingWindowParams>();

  protected readonly arrayText = linkedSignal(() => this.params().array.join(', '));
  protected readonly kText = linkedSignal(() => String(this.params().k));
  private readonly array = computed(() => parseArray(this.arrayText()));
  protected readonly error = computed(() => {
    const array = this.array();
    const k = Number(this.kText());
    if (!array) return 'Enter 2 to 12 whole numbers, separated by commas.';
    if (!Number.isInteger(k) || k < 1 || k > array.length) return `k must be a whole number from 1 to ${array.length}.`;
    return '';
  });

  protected run(event: Event) {
    event.preventDefault();
    const array = this.array();
    if (!this.error() && array) this.changed.emit({ array, k: Number(this.kText()) });
  }
}
