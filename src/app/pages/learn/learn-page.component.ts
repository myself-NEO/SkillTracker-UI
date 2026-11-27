import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ContentIndex } from '@lib/content/catalog';
import { formatCount } from '@lib/format';
import { ContinueAnywhereComponent } from '../../ui/continue-links.component';
import { LearningMapComponent } from '../../ui/learning-map.component';
import { LessonsProgressComponent } from '../../ui/lessons-progress.component';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { TopicGlyphComponent } from '../../ui/topic-glyph.component';

/** The hub's headline (TheSWEguide's). */
const HEADLINE = 'Java, algorithms and system design, one concept at a time';

const STEPS = [
  {
    title: 'Learn',
    body: 'Short lessons, one concept each, with diagrams, runnable Java and a knowledge check at the end.',
    icon: 'M4 5.5h7a2 2 0 012 2V20a2 2 0 00-2-2H4zM20 5.5h-7a2 2 0 00-2 2V20a2 2 0 012-2h7z',
  },
  {
    title: 'Practice',
    body: 'Problems broken down step by step, with hints to open only when you are stuck and a reference solution to compare.',
    icon: 'M8 7 3 12l5 5M16 7l5 5-5 5M14 4l-4 16',
  },
  {
    title: 'Revise',
    body: 'Cheat sheets for the week before an interview, and progress that remembers the lesson and section you stopped at.',
    icon: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4M12 8v4l3 2',
  },
];

/**
 * /learn, where signing in lands: the four topics with their size and the learner's progress, and
 * a link back to the lesson they last read. Ported from TheSWEguide's homepage; its animation
 * showcase follows with the animations (docs/plan.md, Phase 4).
 */
@Component({
  selector: 'app-learn-page',
  imports: [
    RouterLink,
    TopicGlyphComponent,
    LessonsProgressComponent,
    ContinueAnywhereComponent,
    LearningMapComponent,
    LoadErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learn-page.component.html',
})
export class LearnPageComponent {
  /** Resolved by the route; null when it didn't download. */
  readonly index = input<ContentIndex | null>(null);

  protected readonly headline = HEADLINE;
  protected readonly steps = STEPS;
  protected readonly topics = computed(() => this.index()?.topics ?? []);
  protected readonly totals = computed(() =>
    this.topics().reduce(
      (sum, { stats }) => ({
        lessons: sum.lessons + stats.lessons,
        problems: sum.problems + stats.problems,
        hours: sum.hours + stats.hours,
      }),
      { lessons: 0, problems: 0, hours: 0 },
    ),
  );
  protected readonly heroStats = computed(() => [
    { value: formatCount(this.totals().lessons), label: 'lessons' },
    { value: formatCount(this.totals().problems), label: 'practice problems' },
    { value: `${formatCount(this.totals().hours)} h`, label: 'of reading' },
  ]);
  protected readonly formatCount = formatCount;
}
