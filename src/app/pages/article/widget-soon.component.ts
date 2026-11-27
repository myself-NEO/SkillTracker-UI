import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Widget } from '@lib/content/doc';

const LABEL: Record<Widget['type'], string> = {
  quiz: 'Knowledge check',
  drill: 'Practice drill',
  checklist: 'Checklist',
  estimator: 'Estimator',
  mermaid: 'Diagram',
  viz: 'Animation',
};

/** Stands in for an interactive part of a page (so far, animations) until its component is ported (docs/plan.md, Phase 4b). */
@Component({
  selector: 'app-widget-soon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <p class="not-prose my-6 rounded-xl border border-dashed border-border-strong bg-surface px-4 py-3 text-sm text-muted">
      <span class="font-semibold text-fg-soft">{{ label() }}</span>
      <span aria-hidden="true"> · </span>
      Interactive, and on its way to this page.
    </p>
  `,
})
export class WidgetSoonComponent {
  readonly kind = input.required<Widget['type']>();
  protected readonly label = computed(() => LABEL[this.kind()]);
}
