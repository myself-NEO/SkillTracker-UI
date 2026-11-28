import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { CoverageItem, Matcher } from '@content/system-design/interviewScript';
import { unwrapSolution } from '@lib/interview/mock';
import { DebouncedSave } from '../../../notebook/debounced-save';
import { MarkdownComponent } from '../../../ui/markdown.component';
import { MockAttempt } from './mock-attempt';

// Building blocks of the mock-interview phases, shared by the HLD and LLD screens (ported from
// TheSWEguide's components/interview/mock/parts.tsx). They work on the attempt in progress
// (MockAttempt, provided by the simulator).

export const MOCK_BUTTON =
  'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-fg transition-colors hover:border-border-strong hover:text-fg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent';
export const MOCK_PRIMARY =
  'inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg hover:opacity-90 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

/** How long typing has to pause before a draft is saved. */
export const DRAFT_DELAY_MS = 500;

/** The learner's own answer for a phase, saved into the attempt as they type. */
@Component({
  selector: 'app-mock-draft',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <label [for]="id()" class="mb-1.5 block text-sm font-semibold text-fg">{{ label() }}</label>
    <textarea
      [id]="id()"
      [value]="text()"
      (input)="onInput($any($event.target).value)"
      [rows]="rows()"
      [placeholder]="placeholder()"
      spellcheck="false"
      class="w-full rounded-lg border border-border bg-bg px-3 py-2.5 font-mono text-sm text-fg placeholder:text-faint focus:ring-2 focus:ring-accent focus:outline-hidden"
    ></textarea>
    <p class="mt-1 text-[11px] text-muted">Saved to your account as you type.</p>
  `,
})
export class MockDraftComponent {
  private readonly attempt = inject(MockAttempt);
  private readonly saves = new DebouncedSave(DRAFT_DELAY_MS);

  /** The phase id, or e.g. `deep:2` for a deep dive. */
  readonly draftKey = input.required<string>();
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly rows = input(8);

  protected readonly id = computed(() => `draft-${this.draftKey().replace(/[^\w-]/g, '-')}`);
  /** What the learner typed; until they type, the box shows the saved draft. */
  private readonly typed = signal<string | null>(null);
  protected readonly text = computed(() => this.typed() ?? this.attempt.current().drafts[this.draftKey()] ?? '');

  protected onInput(value: string) {
    this.typed.set(value);
    const key = this.draftKey();
    this.saves.queue(key, () => this.attempt.setDraft(key, value));
  }
}

/** Hints shown one at a time: the breakdown's own for the phase when it has them, generic ones otherwise. */
@Component({
  selector: 'app-mock-hints',
  imports: [MarkdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block empty:hidden' },
  template: `
    @if (hints().length > 0) {
      <div class="space-y-2">
        @for (hint of hints().slice(0, shown()); track $index) {
          <div class="rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-fg">
            <p class="mb-1 text-xs font-semibold text-warning">Hint {{ $index + 1 }} of {{ hints().length }}</p>
            <app-markdown [markdown]="hint" [basePath]="attempt.basePath()" />
          </div>
        }
        @if (shown() < hints().length) {
          <button
            type="button"
            (click)="attempt.showHint(hintKey())"
            class="inline-flex items-center gap-1.5 rounded-lg border border-warning/40 px-3 py-1.5 text-sm font-semibold text-warning hover:bg-warning-soft focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
          >
            💡 Show hint {{ shown() + 1 }} of {{ hints().length }}
          </button>
        }
      </div>
    }
  `,
})
export class MockHintsComponent {
  protected readonly attempt = inject(MockAttempt);

  readonly hintKey = input.required<string>();
  readonly hints = input.required<readonly string[]>();

  protected readonly shown = computed(() => Math.min(this.attempt.current().hints[this.hintKey()] ?? 0, this.hints().length));
}

/** A reference answer that stays hidden until the learner asks for it; content projected into it follows the reference. */
@Component({
  selector: 'app-mock-reference',
  imports: [MarkdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block empty:hidden' },
  template: `
    @if (markdown().trim()) {
      @if (revealed()) {
        <section
          #panel
          tabindex="-1"
          [attr.aria-label]="label()"
          class="rounded-xl border border-success/30 bg-success-soft px-4 py-4 focus:outline-hidden sm:px-5"
        >
          <p class="mb-2 text-xs font-semibold tracking-wider text-success uppercase">Reference · {{ label() }}</p>
          <app-markdown [markdown]="body()" [basePath]="attempt.basePath()" />
          <ng-content />
        </section>
      } @else {
        <button
          type="button"
          (click)="reveal()"
          class="inline-flex items-center gap-2 rounded-lg border border-success/40 px-3 py-1.5 text-left text-sm font-semibold text-success hover:bg-success-soft focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
        >
          🔍 Reveal reference: {{ label() }}
        </button>
      }
    }
  `,
})
export class MockReferenceComponent {
  protected readonly attempt = inject(MockAttempt);
  private readonly injector = inject(Injector);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  readonly revealKey = input.required<string>();
  readonly label = input.required<string>();
  /** Shown once revealed. */
  readonly markdown = input.required<string>();

  protected readonly revealed = computed(() => Boolean(this.attempt.current().revealed[this.revealKey()]));
  protected readonly body = computed(() => unwrapSolution(this.markdown()));

  protected reveal() {
    this.attempt.reveal(this.revealKey());
    afterNextRender(() => this.panel()?.nativeElement.focus(), { injector: this.injector });
  }
}

/** Reference items the learner's draft should cover, with a keyword check and ticks for the rest. */
@Component({
  selector: 'app-mock-coverage',
  imports: [MarkdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block empty:hidden' },
  template: `
    @if (rows().length > 0) {
      <div class="mt-4 border-t border-border pt-3">
        <p class="mb-1 text-sm font-semibold text-fg">{{ title() }}: {{ covered() }} / {{ rows().length }} covered</p>
        <p class="mb-2 text-xs text-muted">“Looks mentioned” is a keyword check of your draft. Tick the ones you covered in other words.</p>
        <ul class="space-y-1">
          @for (row of rows(); track row.key) {
            <li>
              <label class="flex items-start gap-2 text-sm text-fg-soft">
                <input
                  type="checkbox"
                  [checked]="row.auto || row.ticked"
                  [disabled]="row.auto"
                  (change)="attempt.setCheck(row.key, $any($event.target).checked)"
                  class="mt-1 accent-success"
                />
                <span class="min-w-0 [overflow-wrap:anywhere]">
                  <app-markdown [markdown]="row.text" [basePath]="attempt.basePath()" />
                  @if (row.auto) {
                    <span class="ml-1 text-[11px] text-success">looks mentioned</span>
                  }
                </span>
              </label>
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class MockCoverageComponent {
  protected readonly attempt = inject(MockAttempt);

  readonly title = input.required<string>();
  /** Ticks are kept as `${prefix}:${index}`. */
  readonly prefix = input.required<string>();
  readonly items = input.required<readonly CoverageItem[]>();
  /** The draft the items are looked for in. */
  readonly text = input.required<string>();
  readonly mentions = input.required<Matcher['mentions']>();

  protected readonly rows = computed(() => {
    const checks = this.attempt.current().checks;
    return this.items().map((item, i) => {
      const key = `${this.prefix()}:${i}`;
      return { key, text: item.text, auto: this.mentions()(this.text(), item), ticked: Boolean(checks[key]) };
    });
  });
  protected readonly covered = computed(() => this.rows().filter((row) => row.auto || row.ticked).length);
}

/**
 * A phase answered in writing: the learner's draft, hints, then the reference. Content projected
 * into it comes first (e.g. the estimator); content marked `after` follows the revealed reference.
 */
@Component({
  selector: 'app-mock-written-phase',
  imports: [MockDraftComponent, MockHintsComponent, MockReferenceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block space-y-5' },
  template: `
    <ng-content />
    <app-mock-draft [draftKey]="draftKey()" [label]="label()" [placeholder]="placeholder()" [rows]="rows()" />
    <app-mock-hints [hintKey]="draftKey()" [hints]="hints()" />
    <app-mock-reference [revealKey]="draftKey()" [label]="referenceLabel()" [markdown]="reference()">
      <ng-content select="[after]" />
    </app-mock-reference>
  `,
})
export class MockWrittenPhaseComponent {
  readonly draftKey = input.required<string>();
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly rows = input(8);
  readonly hints = input.required<readonly string[]>();
  readonly referenceLabel = input.required<string>();
  readonly reference = input.required<string>();
}

export interface MockChoice {
  title: string;
  /** Under the title, e.g. the breakdown section a deep dive comes from. */
  detail?: string;
  /** The reference answer (Markdown). */
  body: string;
}

/**
 * Deep dives (HLD) or follow-ups (LLD) to choose from; each chosen one gets a draft and its
 * reference. The choice is kept with the attempt (indexes into the list).
 */
@Component({
  selector: 'app-mock-choices',
  imports: [MockDraftComponent, MockReferenceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block space-y-5' },
  template: `
    @if (choices().length > 0) {
      <fieldset class="rounded-xl border border-border bg-surface p-4">
        <legend class="px-1 text-sm font-semibold text-fg">{{ legend() }}</legend>
        <p class="mb-3 text-xs text-muted">{{ help() }}</p>
        <ul class="grid gap-2 sm:grid-cols-2">
          @for (choice of choices(); track $index) {
            <li>
              <label
                class="flex cursor-pointer items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm text-fg hover:border-border-strong has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
              >
                <input type="checkbox" [checked]="chosen().includes($index)" (change)="toggle($index)" class="mt-0.5 accent-accent" />
                <span>
                  {{ choice.title }}
                  @if (choice.detail) {
                    <span class="block text-[11px] text-muted">{{ choice.detail }}</span>
                  }
                </span>
              </label>
            </li>
          }
        </ul>
      </fieldset>
      @if (picked().length === 0) {
        <p class="text-sm text-muted">{{ emptyText() }}</p>
      }
      @for (item of picked(); track item.index) {
        <!-- A group, not a region: the revealed reference inside is already a region with this name. -->
        <div role="group" [attr.aria-label]="item.choice.title" class="space-y-4 rounded-xl border border-border bg-surface p-4">
          <h3 class="font-bold text-fg">{{ item.choice.title }}</h3>
          <app-mock-draft
            [draftKey]="keyPrefix() + ':' + item.index"
            [label]="draftLabel()"
            [placeholder]="draftPlaceholder()"
            [rows]="draftRows()"
          />
          <app-mock-reference [revealKey]="keyPrefix() + ':' + item.index" [label]="item.choice.title" [markdown]="item.choice.body" />
        </div>
      }
    }
  `,
})
export class MockChoicesComponent {
  private readonly attempt = inject(MockAttempt);

  readonly choices = input.required<readonly MockChoice[]>();
  readonly legend = input.required<string>();
  readonly help = input.required<string>();
  readonly emptyText = input.required<string>();
  /** Drafts and references are kept as `${keyPrefix}:${index}`. */
  readonly keyPrefix = input.required<string>();
  readonly draftLabel = input.required<string>();
  readonly draftPlaceholder = input('');
  readonly draftRows = input(6);

  protected readonly chosen = computed(() => this.attempt.current().deepDives ?? []);
  protected readonly picked = computed(() =>
    this.chosen().flatMap((index) => {
      const choice = this.choices()[index];
      return choice ? [{ index, choice }] : [];
    }),
  );

  protected toggle(index: number) {
    const chosen = this.chosen();
    this.attempt.setChosen(
      chosen.includes(index) ? chosen.filter((other) => other !== index) : [...chosen, index].sort((a, b) => a - b),
    );
  }
}
