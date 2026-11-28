import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { TrackFile } from '@lib/content/catalog';
import { LEVELS } from '@lib/content/practice';
import { LEVEL_NAME } from '@lib/format';
import { MOCK_KITS, type MockTopic } from '@lib/interview/mock';
import { sessionKey } from '@lib/progress/interviews';
import { problemStatus } from '@lib/progress/progress';
import { InterviewsStore } from '../../../core/interviews.store';
import { ProgressStore } from '../../../core/progress.store';
import { LevelBadgeComponent } from '../../../ui/level-badge.component';
import { LoadErrorComponent } from '../../../ui/load-error.component';
import { SectionHeroComponent } from '../../../ui/section-hero.component';
import { ClockGlyphComponent, MetaPillComponent, StatusBadgeComponent } from '../../article/article-parts';
import { TopicTabsComponent } from '../../topic/topic-tabs.component';

/**
 * /lld/interview and /hld/interview: every practice problem as a mock interview, by level, with the
 * learner's status, an attempt in progress and their best self-score. Ported from TheSWEguide's
 * [topic]/interview/page.tsx and InterviewList.tsx.
 */
@Component({
  selector: 'app-mock-list-page',
  imports: [
    RouterLink,
    TopicTabsComponent,
    SectionHeroComponent,
    LevelBadgeComponent,
    MetaPillComponent,
    ClockGlyphComponent,
    StatusBadgeComponent,
    LoadErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (track(); as track) {
      <main id="main-content" [attr.data-track]="topic()">
        <app-topic-tabs [topic]="topic()" active="interview" />
        <app-section-hero [topic]="topic()" section="Mock interviews" eyebrow="Guided practice" title="Mock interviews">
          <p>{{ intro() }}</p>
        </app-section-hero>
        <div class="mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:py-12">
          @for (group of groups(); track group.level) {
            <section [attr.aria-labelledby]="'mock-' + group.level" class="mt-10 first:mt-0">
              <h2 [id]="'mock-' + group.level" class="font-display text-2xl font-semibold tracking-tight">{{ group.title }}</h2>
              <ul class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                @for (item of group.items; track item.slug) {
                  <li
                    class="flex flex-col rounded-xl border bg-surface p-4"
                    [class]="item.ready ? 'border-border' : 'border-dashed border-border-strong'"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <h3 class="font-semibold" [class]="item.ready ? 'text-fg' : 'text-muted'">{{ item.title }}</h3>
                      <app-status-badge [status]="item.status" />
                    </div>
                    <p class="mt-2 flex-1 text-sm leading-6 text-muted">{{ item.summary }}</p>
                    <div class="mt-3 flex flex-wrap items-center gap-1.5">
                      <app-level-badge [level]="item.difficulty" />
                      <app-meta-pill><svg appClockGlyph></svg>{{ item.minutes }} min</app-meta-pill>
                      @if (item.attempts > 0) {
                        <app-meta-pill>{{ item.attempts }} attempt{{ item.attempts === 1 ? '' : 's' }} · best {{ item.best }}%</app-meta-pill>
                      }
                    </div>
                    <div class="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                      @if (item.ready) {
                        <a [routerLink]="item.href" class="text-accent hover:underline">{{ item.action }}<span aria-hidden="true"> →</span></a>
                      } @else {
                        <span class="text-[11px] tracking-wider text-warning uppercase">Coming soon</span>
                      }
                      <a [routerLink]="item.problemHref" class="text-muted hover:text-fg">{{ item.ready ? 'Breakdown' : 'Problem page' }}</a>
                    </div>
                  </li>
                }
              </ul>
            </section>
          }
        </div>
      </main>
    } @else {
      <app-load-error />
    }
  `,
})
export class MockListPageComponent {
  private readonly progress = inject(ProgressStore);
  private readonly interviews = inject(InterviewsStore);

  readonly topic = input.required<MockTopic>();
  /** The topic's curriculum, resolved by the parent route. */
  readonly track = input<TrackFile | null>(null);

  protected readonly intro = computed(() => {
    const { problems, writtenProblems } = this.track()!;
    const ready = problems.filter((problem) => writtenProblems.includes(problem.slug)).length;
    const availability =
      ready === problems.length
        ? `All ${problems.length} problems are available, grouped by difficulty.`
        : `${ready} of ${problems.length} are available now; the rest open as their breakdowns are written.`;
    return `${MOCK_KITS[this.topic()].intro} ${availability}`;
  });

  protected readonly groups = computed(() => {
    const track = this.track()!;
    const progress = this.progress.progress();
    const { sessions, history } = this.interviews.state();
    const written = new Set(track.writtenProblems);
    return LEVELS.map((level) => ({
      level,
      title: LEVEL_NAME[level],
      items: track.problems
        .filter((problem) => problem.difficulty === level)
        .map((problem) => {
          const key = sessionKey(track.id, problem.slug);
          const attempts = history[key] ?? [];
          return {
            slug: problem.slug,
            title: problem.title,
            summary: problem.summary,
            difficulty: problem.difficulty,
            minutes: problem.minutes,
            ready: written.has(problem.slug),
            status: problemStatus(progress, track.id, problem.slug),
            attempts: attempts.length,
            best: attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0),
            action: sessions[key] ? 'Resume interview' : attempts.length > 0 ? 'Try again' : 'Start interview',
            href: `${track.basePath}/interview/${problem.slug}`,
            problemHref: `${track.basePath}/problems/${problem.slug}`,
          };
        }),
    })).filter((group) => group.items.length > 0);
  });
}
