import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { VisualizeIndex } from '@lib/content/catalog';
import { TOPICS } from '@lib/topics';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { ScenePlayerComponent, type VizSpec } from '../../viz/scene-player.component';
import { BreadcrumbComponent } from '../article/article-parts';
import { NotFoundComponent } from '../not-found/not-found-page.component';
import { MODE_LABEL, SceneCardComponent } from './scene-card.component';

const ELSEWHERE: Partial<Record<string, string>> = {
  loop: 'In the lesson it plays on a loop while it is on screen.',
  scrolly: 'In the lesson it is a scroll-driven explainer: each step of the text shows the matching frame.',
};

/** /visualize/:scene: one animation on its own, in step-through mode, with more to explore. */
@Component({
  selector: 'app-scene-page',
  imports: [RouterLink, BreadcrumbComponent, ScenePlayerComponent, SceneCardComponent, NotFoundComponent, LoadErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!index()) {
      <app-load-error />
    } @else if (current(); as scene) {
      <main id="main-content" [attr.data-track]="scene.topic">
        <section class="relative overflow-hidden border-b border-border">
          <div class="dot-grid pointer-events-none absolute inset-0" aria-hidden="true"></div>
          <div class="relative mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:py-12">
            <app-breadcrumb [items]="breadcrumb()" />
            <p class="mt-6 text-sm font-semibold text-accent">{{ topic() }} · Animation</p>
            <h1 class="mt-2 max-w-3xl font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{{ scene.title }}</h1>
            <p class="mt-4 max-w-2xl text-lg leading-8 text-muted">{{ scene.summary }}</p>
            <ul class="mt-4 flex flex-wrap gap-1.5" aria-label="Ways to play it">
              @for (mode of scene.modes; track mode) {
                <li class="rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-semibold text-fg-soft">
                  {{ modeLabel[mode] }}
                </li>
              }
            </ul>
          </div>
        </section>
        <div class="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
          <app-scene-player [viz]="viz()!" />
          <p class="text-sm leading-6 text-muted">
            {{ note() }} Use Space to play or pause and the arrow keys to step, once the animation has focus.
          </p>
          @if (scene.lesson; as lesson) {
            <p class="mt-4">
              <a
                [routerLink]="lesson.href"
                class="font-semibold text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
              >
                Read the lesson: {{ lesson.title }}<span aria-hidden="true"> →</span>
              </a>
            </p>
          }
        </div>
        @if (more().length > 0) {
          <section aria-labelledby="more-animations" class="border-t border-border bg-surface-2/40">
            <div class="mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:py-12">
              <div class="flex flex-wrap items-baseline justify-between gap-3">
                <h2 id="more-animations" class="font-display text-2xl font-semibold tracking-tight">More animations</h2>
                <a routerLink="/visualize" class="text-sm font-semibold text-accent hover:underline">
                  All {{ index()!.scenes.length }} animations
                </a>
              </div>
              <ul class="mt-5 grid gap-5 md:grid-cols-3">
                @for (other of more(); track other.id) {
                  <li><app-scene-card [scene]="other" /></li>
                }
              </ul>
            </div>
          </section>
        }
      </main>
    } @else {
      <app-not-found />
    }
  `,
})
export class ScenePageComponent {
  /** The route's :scene. */
  readonly scene = input.required<string>();
  /** Resolved by the route; null when it didn't download. */
  readonly index = input<VisualizeIndex | null>(null);

  protected readonly modeLabel = MODE_LABEL;
  protected readonly current = computed(() => this.index()?.scenes.find((scene) => scene.id === this.scene()));
  protected readonly topic = computed(() => TOPICS.find((info) => info.id === this.current()?.topic)?.shortTitle);
  protected readonly breadcrumb = computed(() => [
    { title: 'All topics', href: '/learn' },
    { title: 'Animations', href: '/visualize' },
    { title: this.current()?.title ?? '' },
  ]);
  /** Played here step by step, whatever its lesson does. */
  protected readonly viz = computed<VizSpec | undefined>(() => {
    const scene = this.current();
    return scene && { scene: scene.id, title: scene.title, mode: 'stepper', params: scene.params, code: scene.code };
  });
  protected readonly note = computed(() => {
    const first = this.current()?.modes[0];
    return first && first !== 'stepper' ? (ELSEWHERE[first] ?? '') : '';
  });
  /** Up to three others, the same topic's first. */
  protected readonly more = computed(() => {
    const scene = this.current();
    const others = (this.index()?.scenes ?? []).filter((other) => other.id !== scene?.id);
    return [...others.filter((other) => other.topic === scene?.topic), ...others.filter((other) => other.topic !== scene?.topic)].slice(0, 3);
  });
}
