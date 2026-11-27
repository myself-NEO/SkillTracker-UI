import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { VisualizeIndex } from '@lib/content/catalog';
import { TOPIC_IDS } from '@lib/topics';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { BreadcrumbComponent } from '../article/article-parts';
import { SceneCardComponent } from './scene-card.component';

/** /visualize: every animation in one grid, in topic order. Each card opens the scene's own page. */
@Component({
  selector: 'app-gallery-page',
  imports: [BreadcrumbComponent, SceneCardComponent, LoadErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (index()) {
      <main id="main-content">
        <section class="relative overflow-hidden border-b border-border">
          <div class="dot-grid pointer-events-none absolute inset-0" aria-hidden="true"></div>
          <div class="relative mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:py-12">
            <app-breadcrumb [items]="breadcrumb" />
            <p class="mt-6 text-sm font-semibold text-muted">Animations</p>
            <h1 class="mt-2 font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">See the concepts move</h1>
            <p class="mt-4 max-w-2xl text-lg leading-8 text-muted">
              Step through an algorithm one frame at a time, watch a system run on a loop, or scroll through an explainer
              beside the text. Each animation lives in the lesson it explains; open one here to play it on its own.
            </p>
          </div>
        </section>
        <div class="mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:py-12">
          <h2 class="sr-only">All animations</h2>
          <ul class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            @for (scene of scenes(); track scene.id) {
              <li><app-scene-card [scene]="scene" /></li>
            }
          </ul>
        </div>
      </main>
    } @else {
      <app-load-error />
    }
  `,
})
export class GalleryPageComponent {
  /** Resolved by the route; null when it didn't download. */
  readonly index = input<VisualizeIndex | null>(null);

  protected readonly breadcrumb = [{ title: 'All topics', href: '/learn' }, { title: 'Animations' }];
  protected readonly scenes = computed(() => {
    const scenes = this.index()?.scenes ?? [];
    return TOPIC_IDS.flatMap((topic) => scenes.filter((scene) => scene.topic === topic));
  });
}
