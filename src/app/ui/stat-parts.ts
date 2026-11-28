import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

// The progress pages' building blocks, from TheSWEguide's components/learn/ui.tsx: a progress bar
// and a figure tile.

/** A thin bar: `value` of `max` done. */
@Component({
  selector: 'app-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    'aria-valuemin': '0',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuetext]': "value() + ' of ' + max()",
    class: 'block h-1.5 w-full overflow-hidden rounded-full bg-surface-3',
  },
  template: `<div class="h-full rounded-full bg-accent transition-[width] duration-300" [style.width.%]="percent()"></div>`,
})
export class ProgressBarComponent {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly label = input.required<string>();

  protected readonly percent = computed(() => (this.max() === 0 ? 0 : Math.round((this.value() / this.max()) * 100)));
}

/** A figure with its label and a line of detail; a link when `href` is set. */
@Component({
  selector: 'app-stat-tile',
  imports: [RouterLink, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    @if (href(); as link) {
      <a
        [routerLink]="link"
        class="block h-full rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <ng-container [ngTemplateOutlet]="body" />
      </a>
    } @else {
      <div class="block h-full rounded-2xl border border-border bg-surface p-4">
        <ng-container [ngTemplateOutlet]="body" />
      </div>
    }
    <ng-template #body>
      <p class="text-sm text-muted">{{ label() }}</p>
      <p class="mt-1 text-2xl font-semibold text-fg">{{ value() }}</p>
      @if (detail()) {
        <p class="mt-1 text-xs text-faint">{{ detail() }}</p>
      }
    </ng-template>
  `,
})
export class StatTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly detail = input<string>();
  readonly href = input<string>();
}
