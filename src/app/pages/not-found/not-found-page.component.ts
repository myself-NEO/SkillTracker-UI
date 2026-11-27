import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isTopicId, TOPICS } from '@lib/topics';
import { TopicGlyphComponent } from '../../ui/topic-glyph.component';

/** Unknown URLs inside the app (signed in). Ported from TheSWEguide's not-found page. */
@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, TopicGlyphComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main-content" class="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      @if (notMovedYet()) {
        <p class="font-mono text-sm font-semibold tracking-[0.18em] text-muted uppercase">Coming soon</p>
        <h1 class="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">This page is on its way</h1>
        <p class="mt-4 text-lg leading-8 text-muted">
          Lessons, practice problems and the other pages of each topic are being moved over from TheSWEguide, and this
          one isn’t here yet. The topic roadmaps are.
        </p>
      } @else {
        <p class="font-mono text-sm font-semibold tracking-[0.18em] text-muted">404</p>
        <h1 class="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">This page doesn’t exist</h1>
        <p class="mt-4 text-lg leading-8 text-muted">
          The link may be out of date, or the page may have moved. Pick a topic to find what you were looking for.
        </p>
      }
      <ul class="mt-10 grid gap-3 sm:grid-cols-2">
        @for (topic of topics; track topic.id) {
          <li [attr.data-track]="topic.id">
            <a
              [routerLink]="'/' + topic.id"
              class="group flex items-center gap-3.5 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/60"
            >
              <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                <svg [appTopicGlyph]="topic.id" class="size-5"></svg>
              </span>
              <span class="min-w-0">
                <span class="block font-semibold text-fg group-hover:text-accent">{{ topic.title }}</span>
                <span class="block text-sm text-muted">{{ topic.shortTitle }}</span>
              </span>
            </a>
          </li>
        }
      </ul>
      <a routerLink="/learn" class="mt-8 inline-block text-sm font-semibold text-accent hover:underline">
        Back to all topics
      </a>
    </main>
  `,
})
export class NotFoundPageComponent {
  private readonly url = toSignal(inject(ActivatedRoute).url, { requireSync: true });

  protected readonly topics = TOPICS;
  /**
   * A page under a topic (/java/...) that the port from TheSWEguide hasn't reached yet
   * (docs/plan.md, Phases 3b–6). Once every page exists, this goes and such URLs are plain 404s.
   */
  protected readonly notMovedYet = computed(() => isTopicId(this.url()[0]?.path ?? ''));
}
