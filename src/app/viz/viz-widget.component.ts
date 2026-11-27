import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ScenePlayerComponent, type VizSpec } from './scene-player.component';

/**
 * An animation in a lesson (```viz and ````scrolly blocks). The player and the scenes are loaded
 * separately, right after the page is drawn, so lessons without animations don't download them.
 */
@Component({
  selector: 'app-viz-widget',
  imports: [ScenePlayerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @defer (on immediate) {
      <app-scene-player [viz]="viz()" />
    } @placeholder {
      <div class="not-prose my-8 h-72 animate-pulse rounded-xl border border-border bg-surface" aria-hidden="true"></div>
    }
  `,
})
export class VizWidgetComponent {
  readonly viz = input.required<VizSpec>();
}
