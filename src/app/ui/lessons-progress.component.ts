import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { TrackId } from '@content/shared/types';
import { isLessonComplete } from '@lib/progress/progress';
import { ProgressStore } from '../core/progress.store';

/** "12 of 140 lessons complete" with a bar, for a topic, a stage or a module; `compact` shows "12/140". */
@Component({
  selector: 'app-lessons-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.block]': '!compact()' },
  template: `
    @if (compact()) {
      <span class="text-xs text-muted tabular-nums">{{ done() }}/{{ slugs().length }}</span>
    } @else {
      <div class="flex items-baseline justify-between gap-3 text-sm">
        <span class="text-muted">
          <span class="font-semibold text-fg tabular-nums">{{ done() }}</span> of {{ slugs().length }} lessons complete
        </span>
        <span class="text-xs text-muted tabular-nums">{{ percent() }}%</span>
      </div>
      <div
        class="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuemin="0"
        aria-label="Lessons complete"
        [attr.aria-valuenow]="done()"
        [attr.aria-valuemax]="slugs().length"
      >
        <div class="h-full rounded-full bg-accent transition-[width]" [style.width.%]="percent()"></div>
      </div>
    }
  `,
})
export class LessonsProgressComponent {
  private readonly store = inject(ProgressStore);

  readonly track = input.required<TrackId>();
  readonly slugs = input.required<readonly string[]>();
  readonly compact = input(false);

  protected readonly done = computed(() => {
    const progress = this.store.progress();
    const track = this.track();
    return this.slugs().filter((slug) => isLessonComplete(progress, track, slug)).length;
  });
  protected readonly percent = computed(() =>
    this.slugs().length ? Math.round((this.done() / this.slugs().length) * 100) : 0,
  );
}
