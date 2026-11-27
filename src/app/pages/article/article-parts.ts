import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ProblemStatus, TrackId } from '@content/shared/types';
import { problemStatus, isLessonComplete } from '@lib/progress/progress';
import { ProgressStore } from '../../core/progress.store';

// Pieces shared by the lesson, problem and cheat sheet pages (ported from TheSWEguide's
// ArticleParts, ProgressBits and learn/ui).

export interface PageLink {
  href: string;
  title: string;
  /** Section on the page, e.g. a stage on a topic's roadmap. */
  fragment?: string;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Breadcrumb">
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        @for (item of items(); track $index) {
          <li class="flex min-w-0 items-center gap-2">
            @if ($index > 0) {
              <span aria-hidden="true" class="text-faint">/</span>
            }
            @if (item.href) {
              <a [routerLink]="item.href" [fragment]="item.fragment" class="truncate hover:text-fg">{{ item.title }}</a>
            } @else {
              <span class="truncate">{{ item.title }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class BreadcrumbComponent {
  readonly items = input.required<readonly { title: string; href?: string; fragment?: string }[]>();
}

/** A small label in the row of facts under an article's title. */
@Component({
  selector: 'app-meta-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold',
    '[class.border-accent/30]': "tone() === 'accent'",
    '[class.bg-accent-soft]': "tone() === 'accent'",
    '[class.text-accent]': "tone() === 'accent'",
    '[class.border-border]': "tone() === 'plain'",
    '[class.bg-surface]': "tone() === 'plain'",
    '[class.text-fg-soft]': "tone() === 'plain'",
  },
  template: `<ng-content />`,
})
export class MetaPillComponent {
  readonly tone = input<'plain' | 'accent'>('plain');
}

/** The previous and next pages, at the foot of an article. */
@Component({
  selector: 'app-prev-next',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (previous() || next()) {
      <nav aria-label="Previous and next" class="mt-8 grid gap-3 sm:grid-cols-2">
        @if (previous(); as link) {
          <a
            [routerLink]="link.href"
            class="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/60"
          >
            <span class="text-xs text-muted"><span aria-hidden="true">← </span>Previous</span>
            <span class="mt-1 block font-semibold text-fg group-hover:text-accent">{{ link.title }}</span>
          </a>
        }
        @if (next(); as link) {
          <a
            [routerLink]="link.href"
            class="group rounded-xl border border-border bg-surface p-4 text-right transition-colors hover:border-accent/60 sm:col-start-2"
          >
            <span class="text-xs text-muted">Next<span aria-hidden="true"> →</span></span>
            <span class="mt-1 block font-semibold text-fg group-hover:text-accent">{{ link.title }}</span>
          </a>
        }
      </nav>
    }
  `,
})
export class PrevNextComponent {
  readonly previous = input<PageLink | undefined>();
  readonly next = input<PageLink | undefined>();
}

/** A titled group of links in the contents rail, e.g. related lessons. */
@Component({
  selector: 'app-rail-links',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (links().length > 0) {
      <div>
        <p class="mb-3 text-xs font-semibold tracking-[0.14em] text-muted uppercase">{{ title() }}</p>
        <ul class="space-y-2 text-sm">
          @for (link of links(); track link.href) {
            <li>
              <a [routerLink]="link.href" class="leading-5 text-fg-soft hover:text-accent">{{ link.title }}</a>
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class RailLinksComponent {
  readonly title = input.required<string>();
  readonly links = input.required<readonly PageLink[]>();
}

/** Marks the lesson complete, or undoes it. */
@Component({
  selector: 'app-complete-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      [attr.aria-pressed]="done()"
      (click)="store.setLessonComplete(track(), slug(), !done())"
      class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors"
      [class]="done() ? 'border border-success/40 bg-success-soft text-success hover:border-success' : 'bg-accent text-accent-fg hover:opacity-90'"
    >
      @if (done()) {
        <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5l3.5 3.5 7.5-8" />
        </svg>
        Completed
      } @else {
        Mark as complete
      }
    </button>
  `,
})
export class CompleteButtonComponent {
  protected readonly store = inject(ProgressStore);
  readonly track = input.required<TrackId>();
  readonly slug = input.required<string>();
  protected readonly done = computed(() => isLessonComplete(this.store.progress(), this.track(), this.slug()));
}

export const STATUS_LABEL: Record<ProblemStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  attempted: 'Attempted',
  completed: 'Completed',
};

const STATUS_COLOR: Record<ProblemStatus, string> = {
  'not-started': 'text-faint',
  'in-progress': 'text-warning',
  attempted: 'text-insight',
  completed: 'text-success',
};

/** A problem status's icon: an empty ring, a half-filled one, a ring with a dot, or a tick. */
@Component({
  selector: 'svg[appProblemStatusIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '0 0 20 20', 'aria-hidden': 'true', '[class]': 'color()' },
  template: `
    @switch (status()) {
      @case ('completed') {
        <svg:path
          fill="currentColor"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        />
      }
      @case ('in-progress') {
        <svg:circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5" />
        <svg:path d="M10 2.75a7.25 7.25 0 010 14.5z" fill="currentColor" />
      }
      @case ('attempted') {
        <svg:circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5" />
        <svg:circle cx="10" cy="10" r="3.5" fill="currentColor" />
      }
      @default {
        <svg:circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5" />
      }
    }
  `,
})
export class ProblemStatusIconComponent {
  readonly status = input.required<ProblemStatus>({ alias: 'appProblemStatusIcon' });
  protected readonly color = computed(() => STATUS_COLOR[this.status()]);
}

const BADGE_CLASSES: Record<ProblemStatus, string> = {
  'not-started': 'text-muted bg-surface-2 border-border',
  'in-progress': 'text-warning bg-warning-soft border-warning/30',
  attempted: 'text-insight bg-insight-soft border-insight/30',
  completed: 'text-success bg-success-soft border-success/30',
};

/** A problem's status as a coloured badge. */
@Component({
  selector: 'app-status-badge',
  imports: [ProblemStatusIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `<svg [appProblemStatusIcon]="status()" class="size-3.5"></svg>{{ STATUS_LABEL[status()] }}`,
})
export class StatusBadgeComponent {
  readonly status = input.required<ProblemStatus>();
  protected readonly STATUS_LABEL = STATUS_LABEL;
  protected readonly classes = computed(
    () =>
      `inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${BADGE_CLASSES[this.status()]}`,
  );
}

/** The learner's status for a problem, as a row of radio buttons (ARIA radio pattern). */
@Component({
  selector: 'app-problem-status-picker',
  imports: [ProblemStatusIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="radiogroup"
      aria-label="Your status"
      (keydown)="onKeyDown($event)"
      class="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-bg p-1"
    >
      @for (option of statuses(); track option) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="option === status()"
          [tabIndex]="option === status() || (!anyChecked() && $first) ? 0 : -1"
          (click)="store.setProblemStatus(track(), slug(), option)"
          class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
          [class.bg-surface-3]="option === status()"
          [class.text-fg]="option === status()"
          [class.text-muted]="option !== status()"
          [class.hover:text-fg]="option !== status()"
        >
          <svg [appProblemStatusIcon]="option" class="size-3.5"></svg>
          {{ label[option] }}
        </button>
      }
    </div>
  `,
})
export class ProblemStatusPickerComponent {
  protected readonly store = inject(ProgressStore);
  readonly track = input.required<TrackId>();
  readonly slug = input.required<string>();
  readonly statuses = input.required<readonly ProblemStatus[]>();

  protected readonly label = STATUS_LABEL;
  protected readonly status = computed(() => problemStatus(this.store.progress(), this.track(), this.slug()));
  protected readonly anyChecked = computed(() => this.statuses().includes(this.status()));

  /** Arrow keys move to, and select, the next or previous status. */
  protected onKeyDown(event: KeyboardEvent) {
    const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[event.key];
    if (!step) return;
    const radios = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]'));
    const index = radios.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    event.preventDefault();
    const next = radios[(index + step + radios.length) % radios.length];
    next.focus();
    next.click();
  }
}

/** "3 of 26 problems completed" with a bar, for a practice library. */
@Component({
  selector: 'app-problems-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-baseline justify-between gap-3 text-sm">
      <span class="text-muted">
        <span class="font-semibold text-fg tabular-nums">{{ done() }}</span> of {{ slugs().length }} {{ noun() }} completed
      </span>
      <span class="text-xs text-muted tabular-nums">{{ percent() }}%</span>
    </div>
    <div
      class="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"
      role="progressbar"
      aria-valuemin="0"
      [attr.aria-valuenow]="done()"
      [attr.aria-valuemax]="slugs().length"
      [attr.aria-label]="noun() + ' completed'"
    >
      <div class="h-full rounded-full bg-accent transition-[width]" [style.width.%]="percent()"></div>
    </div>
  `,
})
export class ProblemsProgressComponent {
  private readonly store = inject(ProgressStore);
  readonly track = input.required<TrackId>();
  readonly slugs = input.required<readonly string[]>();
  readonly noun = input.required<string>();

  protected readonly done = computed(() => {
    const progress = this.store.progress();
    return this.slugs().filter((slug) => problemStatus(progress, this.track(), slug) === 'completed').length;
  });
  protected readonly percent = computed(() =>
    this.slugs().length ? Math.round((this.done() / this.slugs().length) * 100) : 0,
  );
}

/** The clock in "14 min read". */
@Component({
  selector: 'svg[appClockGlyph]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'size-3.5', viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'aria-hidden': 'true' },
  template: `<svg:circle cx="10" cy="10" r="7.25" /><svg:path stroke-linecap="round" d="M10 6v4.25l2.75 1.75" />`,
})
export class ClockGlyphComponent {}

/** The star in "Interview essential". */
@Component({
  selector: 'svg[appStarGlyph]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'size-3.5 text-accent', viewBox: '0 0 20 20', fill: 'currentColor', 'aria-hidden': 'true' },
  template: `<svg:path d="M10 2.5l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7.8l5-.7z" />`,
})
export class StarGlyphComponent {}
