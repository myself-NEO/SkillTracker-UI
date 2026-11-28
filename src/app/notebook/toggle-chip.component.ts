import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const ON = {
  accent: 'border-accent/50 bg-accent-soft text-accent',
  warning: 'border-warning/50 bg-warning-soft text-warning',
  insight: 'border-insight/50 bg-insight-soft text-insight',
};

/**
 * The small toggle of the bookmark, "difficult" and "revisit" flags (TheSWEguide's ToggleChip):
 * `<button appToggleChip [pressed]="on" label="Bookmark lesson" pressedLabel="Bookmarked">`, with
 * the icon as its content.
 */
@Component({
  selector: 'button[appToggleChip]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { type: 'button', '[attr.aria-pressed]': 'pressed()', '[class]': 'classes()' },
  template: `<ng-content />{{ pressed() ? pressedLabel() : label() }}`,
})
export class ToggleChipComponent {
  readonly pressed = input.required<boolean>();
  readonly label = input.required<string>();
  readonly pressedLabel = input.required<string>();
  readonly tone = input<keyof typeof ON>('accent');

  protected readonly classes = computed(
    () =>
      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ' +
      'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ' +
      (this.pressed() ? ON[this.tone()] : 'border-border text-fg-soft hover:border-border-strong hover:text-fg'),
  );
}
