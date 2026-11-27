import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { VisualizeScene } from '@lib/content/catalog';
import { TOPICS } from '@lib/topics';
import type { VizMode } from '@lib/viz/types';

export const MODE_LABEL: Record<VizMode, string> = {
  stepper: 'Step-through',
  loop: 'Loop',
  scrolly: 'Scroll-driven',
};

/** A card in the animation gallery: the whole card opens the animation's page (TheSWEguide's SceneCard). */
@Component({
  selector: 'app-scene-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <article
      [attr.data-track]="scene().topic"
      class="group relative flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/60 sm:p-6"
    >
      <p class="font-mono text-xs font-semibold tracking-[0.16em] text-accent uppercase">{{ topic() }}</p>
      <h3 class="mt-2 font-display text-lg leading-snug font-semibold tracking-tight">
        <a [routerLink]="'/visualize/' + scene().id" class="after:absolute after:inset-0 after:rounded-2xl">{{
          scene().title
        }}</a>
      </h3>
      <p class="mt-2 text-sm leading-6 text-fg-soft">{{ scene().summary }}</p>
      <ul class="mt-4 flex flex-wrap gap-1.5" aria-label="Ways to play it">
        @for (mode of scene().modes; track mode) {
          <li class="rounded-md border border-border bg-bg px-2 py-0.5 text-xs font-semibold text-fg-soft">{{ modeLabel[mode] }}</li>
        }
      </ul>
      @if (scene().lesson; as lesson) {
        <p class="mt-auto pt-4 text-sm text-muted">
          From
          <a [routerLink]="lesson.href" class="relative z-10 font-semibold text-fg hover:text-accent">{{ lesson.title }}</a>
        </p>
      }
    </article>
  `,
})
export class SceneCardComponent {
  readonly scene = input.required<VisualizeScene>();
  protected readonly modeLabel = MODE_LABEL;
  protected readonly topic = computed(() => TOPICS.find((info) => info.id === this.scene().topic)?.shortTitle);
}
