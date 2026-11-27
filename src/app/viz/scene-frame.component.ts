import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { Frame } from '@lib/viz/types';
import { FlipScopeDirective } from './motion';
import { SceneViewComponent } from './scene-view.component';

/**
 * The frame being shown, kept as tall as the scene's tallest frame, so that changing frames never
 * moves the controls under the reader's pointer or the text around the scene. To find that height,
 * every frame is also drawn once, invisibly and at the same width, after the first render.
 *
 * Each frame is a size container, so a scene lays itself out for the space it gets (`@lg:` and
 * friends) rather than for the viewport: the same scene is narrow beside scroll-driven text.
 */
@Component({
  selector: 'app-scene-frame',
  imports: [SceneViewComponent, FlipScopeDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="relative">
      <div class="@container" [style.min-height.px]="height()" appFlipScope #scope="flipScope">
        <app-scene-view [scene]="scene()" [state]="frame().state" />
      </div>
      @if (mounted()) {
        <div
          #sizer
          class="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden"
          aria-hidden="true"
          inert
        >
          @for (copy of frames(); track $index) {
            <div class="@container" appFlipScope>
              <app-scene-view [scene]="scene()" [state]="copy.state" />
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SceneFrameComponent {
  readonly scene = input.required<string>();
  readonly frames = input.required<readonly Frame<unknown>[]>();
  readonly frame = input.required<Frame<unknown>>();

  private readonly scope = viewChild.required<FlipScopeDirective>('scope');
  private readonly sizer = viewChild<ElementRef<HTMLElement>>('sizer');
  protected readonly mounted = signal(false);
  protected readonly height = signal<number | undefined>(undefined);

  constructor() {
    afterNextRender(() => this.mounted.set(true));
    // Measure the invisible copies (again when the frames change, e.g. the learner's own input).
    afterRenderEffect((onCleanup) => {
      this.frames();
      const sizer = this.sizer()?.nativeElement;
      if (!sizer || typeof ResizeObserver === 'undefined') return;
      const copies = Array.from(sizer.children);
      const measure = () => this.height.set(Math.max(0, ...copies.map((copy) => copy.getBoundingClientRect().height)));
      measure();
      const observer = new ResizeObserver(measure);
      for (const copy of copies) observer.observe(copy);
      onCleanup(() => observer.disconnect());
    });
  }

  /** Before changing frames: remember where the moving elements are. */
  capture() {
    this.scope().capture();
  }

  /** After the new frame is drawn: move them from there. */
  play() {
    this.scope().play();
  }
}
