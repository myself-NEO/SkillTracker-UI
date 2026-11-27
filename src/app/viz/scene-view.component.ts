import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ConsistentHashingViewComponent } from './scenes/consistent-hashing.view';
import { GcGenerationsViewComponent } from './scenes/gc-generations.view';
import { HashmapPutViewComponent } from './scenes/hashmap-put.view';
import { LoadBalancerViewComponent } from './scenes/load-balancer.view';
import { ObserverViewComponent } from './scenes/observer.view';
import { RequestJourneyViewComponent } from './scenes/request-journey.view';
import { SlidingWindowViewComponent } from './scenes/sliding-window.view';

/** Draws one frame of a scene: the scene's view for its id (lib/viz/registry.ts lists them). */
@Component({
  selector: 'app-scene-view',
  imports: [
    HashmapPutViewComponent,
    SlidingWindowViewComponent,
    ConsistentHashingViewComponent,
    LoadBalancerViewComponent,
    ObserverViewComponent,
    GcGenerationsViewComponent,
    RequestJourneyViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @switch (scene()) {
      @case ('hashmap-put') {
        <app-hashmap-put-view [state]="$any(state())" />
      }
      @case ('sliding-window') {
        <app-sliding-window-view [state]="$any(state())" />
      }
      @case ('consistent-hashing') {
        <app-consistent-hashing-view [state]="$any(state())" />
      }
      @case ('load-balancer') {
        <app-load-balancer-view [state]="$any(state())" />
      }
      @case ('observer') {
        <app-observer-view [state]="$any(state())" />
      }
      @case ('gc-generations') {
        <app-gc-generations-view [state]="$any(state())" />
      }
      @case ('request-journey') {
        <app-request-journey-view [state]="$any(state())" />
      }
    }
  `,
})
export class SceneViewComponent {
  readonly scene = input.required<string>();
  /** The frame's state, in the scene's own shape. */
  readonly state = input.required<unknown>();
}
