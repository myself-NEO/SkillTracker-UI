import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DEFAULT_PROBLEM_STATUSES, type Level, type ProblemStatus } from '@content/shared/types';
import type { TrackFile } from '@lib/content/catalog';
import { LEVELS, practiceCopy } from '@lib/content/practice';
import { LEVEL_NAME } from '@lib/format';
import { problemPath } from '@lib/markdown/links';
import { problemStatus } from '@lib/progress/progress';
import { TOPICS, type TopicId } from '@lib/topics';
import { ProgressStore } from '../../core/progress.store';
import { LevelBadgeComponent } from '../../ui/level-badge.component';
import { LoadErrorComponent } from '../../ui/load-error.component';
import {
  BreadcrumbComponent,
  ProblemsProgressComponent,
  STATUS_LABEL,
  StatusBadgeComponent,
} from '../article/article-parts';
import { TopicTabsComponent } from '../topic/topic-tabs.component';

/** Every word of the query must appear in one of the fields (case-insensitive). */
const matches = (query: string, fields: readonly string[]) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = fields.join(' ').toLowerCase();
  return words.every((word) => text.includes(word));
};

/**
 * A topic's practice library (/:topic/problems, Java, LLD and HLD): every problem, grouped by level,
 * with search and filters by difficulty and by the learner's status. Ported from TheSWEguide's
 * problems/page.tsx and ProblemLibrary.
 */
@Component({
  selector: 'app-problem-library-page',
  imports: [
    RouterLink,
    TopicTabsComponent,
    BreadcrumbComponent,
    ProblemsProgressComponent,
    StatusBadgeComponent,
    LevelBadgeComponent,
    LoadErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './problem-library-page.component.html',
})
export class ProblemLibraryPageComponent {
  private readonly store = inject(ProgressStore);

  readonly topic = input.required<TopicId>();
  /** The topic's curriculum, resolved by the parent route. */
  readonly track = input<TrackFile | null>(null);

  protected readonly levelName = LEVEL_NAME;
  protected readonly levelOptions: { value: Level | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    ...LEVELS.map((level) => ({ value: level, label: LEVEL_NAME[level] })),
  ];
  protected readonly activeFilter = 'border-accent/50 bg-accent-soft text-accent';
  protected readonly idleFilter = 'border-border text-muted hover:border-border-strong hover:text-fg';
  protected readonly level = signal<Level | 'all'>('all');
  protected readonly status = signal<ProblemStatus | 'all'>('all');
  protected readonly query = signal('');

  protected readonly info = computed(() => TOPICS.find((topic) => topic.id === this.topic())!);
  protected readonly copy = computed(() => practiceCopy(this.track()!));
  protected readonly statusOptions = computed<{ value: ProblemStatus | 'all'; label: string }[]>(() => [
    { value: 'all', label: 'All' },
    ...(this.track()!.problemStatuses ?? DEFAULT_PROBLEM_STATUSES).map((status) => ({ value: status, label: STATUS_LABEL[status] })),
  ]);
  protected readonly slugs = computed(() => this.track()!.problems.map((problem) => problem.slug));
  protected readonly breadcrumb = computed(() => [
    { title: 'All topics', href: '/learn' },
    { title: this.info().shortTitle, href: this.track()!.basePath },
    { title: this.copy().groupTitle },
  ]);

  /** What the library holds, and how much of it is written (TheSWEguide's wording). */
  protected readonly introduction = computed(() => {
    const track = this.track()!;
    const total = track.problems.length;
    const written = track.writtenProblems.length;
    if (track.practice) {
      const pending =
        written < total
          ? ` They are being written stage by stage: ${written} of ${total} are available now; the rest are marked “coming soon” so you can see what's ahead.`
          : '';
      return `${track.practice.libraryIntro}${pending}`;
    }
    return written === total
      ? `${total} interview problems from simple to complex. Each has a full breakdown that walks from clarifying questions to a complete, tested Java 17 solution with hints, edge cases and follow-ups.`
      : `${total} interview problems from simple to complex. ${written} have full breakdowns that walk from clarifying questions to a complete, tested Java 17 solution with hints, edge cases and follow-ups; the rest are marked “breakdown coming soon” and can be practised from their statements.`;
  });
  protected readonly comingSoonLabel = computed(() => (this.track()!.practice ? 'Coming soon' : 'Breakdown soon'));

  protected readonly shown = computed(() => {
    const track = this.track()!;
    const progress = this.store.progress();
    const written = new Set(track.writtenProblems);
    return track.problems
      .filter(
        (problem) =>
          (this.level() === 'all' || problem.difficulty === this.level()) &&
          (this.status() === 'all' || problemStatus(progress, track.id, problem.slug) === this.status()) &&
          matches(this.query(), [problem.title, problem.summary, ...problem.patterns, ...problem.tags]),
      )
      .map((problem) => ({
        ...problem,
        href: problemPath(track.basePath, problem.slug),
        written: written.has(problem.slug),
        status: problemStatus(progress, track.id, problem.slug),
      }));
  });
  protected readonly groups = computed(() =>
    LEVELS.map((level) => ({ level, problems: this.shown().filter((problem) => problem.difficulty === level) })).filter(
      (group) => group.problems.length > 0,
    ),
  );
  protected readonly filtering = computed(
    () => this.level() !== 'all' || this.status() !== 'all' || this.query().trim() !== '',
  );

  protected clear() {
    this.level.set('all');
    this.status.set('all');
    this.query.set('');
  }

  protected value(event: Event) {
    return (event.target as HTMLInputElement).value;
  }
}
