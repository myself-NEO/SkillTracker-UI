import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Level } from '@content/shared/types';
import { LEVEL_NAME } from '@lib/format';

const LEVEL_CLASSES: Record<Level, string> = {
  beginner: 'bg-success-soft text-success border-success/30',
  intermediate: 'bg-warning-soft text-warning border-warning/30',
  advanced: 'bg-danger-soft text-danger border-danger/30',
};

/** A difficulty level as a coloured badge; `label` overrides the name, e.g. LeetCode's Easy / Medium / Hard. */
@Component({
  selector: 'app-level-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `{{ label() ?? levelName() }}`,
})
export class LevelBadgeComponent {
  readonly level = input.required<Level>();
  readonly label = input<string>();

  protected readonly levelName = computed(() => LEVEL_NAME[this.level()]);
  protected readonly classes = computed(
    () => `inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${LEVEL_CLASSES[this.level()]}`,
  );
}
