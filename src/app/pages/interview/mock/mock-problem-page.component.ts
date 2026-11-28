import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MockInterviewData, PageResult } from '../../../core/content.resolvers';
import { LevelBadgeComponent } from '../../../ui/level-badge.component';
import { LoadErrorComponent } from '../../../ui/load-error.component';
import { SectionHeroComponent } from '../../../ui/section-hero.component';
import { ClockGlyphComponent, MetaPillComponent } from '../../article/article-parts';
import { NotFoundComponent } from '../../not-found/not-found-page.component';
import { TopicTabsComponent } from '../../topic/topic-tabs.component';
import { MockInterviewComponent } from './mock-interview.component';

/**
 * /lld/interview/:problem and /hld/interview/:problem: a practice problem as a timed mock
 * interview, or a note that it isn't available while its breakdown isn't written. Ported from
 * TheSWEguide's [topic]/interview/[slug]/page.tsx.
 */
@Component({
  selector: 'app-mock-problem-page',
  imports: [
    RouterLink,
    TopicTabsComponent,
    SectionHeroComponent,
    LevelBadgeComponent,
    MetaPillComponent,
    ClockGlyphComponent,
    MockInterviewComponent,
    NotFoundComponent,
    LoadErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (page().status) {
      @case ('missing') {
        <app-not-found />
      }
      @case ('error') {
        <app-load-error />
      }
      @default {
        @let view = data()!;
        <main id="main-content" [attr.data-track]="view.topic">
          <app-topic-tabs [topic]="view.topic" active="interview" />
          <app-section-hero [topic]="view.topic" section="Mock interviews" eyebrow="Mock interview" [title]="view.problem.title">
            <div class="flex flex-wrap items-center gap-2">
              <app-level-badge [level]="view.problem.difficulty" />
              <app-meta-pill><svg appClockGlyph></svg>{{ view.problem.minutes }} min interview</app-meta-pill>
              @for (pattern of view.problem.patterns; track pattern) {
                <app-meta-pill>{{ pattern }}</app-meta-pill>
              }
              <a [routerLink]="view.track.basePath + '/problems/' + view.problem.slug" class="ml-1 text-sm font-semibold text-accent hover:underline">
                Full breakdown →
              </a>
            </div>
          </app-section-hero>
          <div class="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 lg:py-10">
            <!-- One simulator per problem: moving to another problem starts a fresh one (and pauses this one's clock). -->
            @for (current of [view]; track current.problem.slug) {
              @if (current.script; as script) {
                <app-mock-interview
                  [topic]="current.topic"
                  [basePath]="current.track.basePath"
                  [problem]="current.problem"
                  [file]="script"
                />
              } @else {
                <div class="rounded-xl border border-dashed border-border-strong bg-surface p-6">
                  <p class="font-semibold text-fg">This mock interview isn’t available yet</p>
                  <p class="mt-2 text-sm text-fg-soft">
                    Mock interviews are built from a problem’s breakdown, which hasn’t been written for this one.
                  </p>
                  <a [routerLink]="current.track.basePath + '/interview'" class="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
                    See the mock interviews you can do now
                  </a>
                </div>
              }
            }
          </div>
        </main>
      }
    }
  `,
})
export class MockProblemPageComponent {
  /** Resolved by the route (mockInterviewResolver). */
  readonly page = input.required<PageResult<MockInterviewData>>();

  protected readonly data = computed(() => {
    const page = this.page();
    return page.status === 'ok' ? page.value : null;
  });
}
