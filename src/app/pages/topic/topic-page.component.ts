import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { flattenLessons } from '@content/shared/curriculum';
import type { Track } from '@content/shared/types';
import type { DsaPractice } from '@lib/content/catalog';
import { practiceCopy } from '@lib/content/practice';
import { formatCount, pad2 } from '@lib/format';
import { TOPICS, type TopicId } from '@lib/topics';
import { ContinueLinkComponent } from '../../ui/continue-links.component';
import { LessonsProgressComponent } from '../../ui/lessons-progress.component';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { TopicGlyphComponent } from '../../ui/topic-glyph.component';
import { DsaPracticeTopicsComponent, ProblemsByLevelComponent } from './practice-overview.component';
import { RoadmapNavComponent, type RoadmapNavItem } from './roadmap-nav.component';
import { stageAnchor, StageSectionComponent } from './stage-section.component';
import { TopicTabsComponent } from './topic-tabs.component';

/**
 * A topic's home (/java, /dsa, /lld, /hld): what it covers, where to continue, the whole roadmap of
 * stages, modules and lessons, and its practice problems. Ported from TheSWEguide's [topic]/page.tsx.
 * The route provides the topic and its resolved curriculum (and DSA's coding questions).
 */
@Component({
  selector: 'app-topic-page',
  imports: [
    RouterLink,
    TopicTabsComponent,
    TopicGlyphComponent,
    ContinueLinkComponent,
    LessonsProgressComponent,
    RoadmapNavComponent,
    StageSectionComponent,
    ProblemsByLevelComponent,
    DsaPracticeTopicsComponent,
    LoadErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topic-page.component.html',
})
export class TopicPageComponent {
  readonly topic = input.required<TopicId>();
  readonly track = input<Track | null>(null);
  /** DSA only: its LeetCode list and cheat sheets. */
  readonly practice = input<DsaPractice | null>(null);

  protected readonly info = computed(() => TOPICS.find((topic) => topic.id === this.topic())!);
  protected readonly isDsa = computed(() => this.topic() === 'dsa');
  /** Everything the page needs arrived. */
  protected readonly ready = computed(() => !!this.track() && (!this.isDsa() || !!this.practice()));

  protected readonly lessons = computed(() => flattenLessons(this.track()!).map(({ lesson }) => lesson));
  protected readonly slugs = computed(() => this.lessons().map((lesson) => lesson.slug));
  protected readonly titles = computed(() =>
    Object.fromEntries(this.lessons().map((lesson) => [lesson.slug, lesson.title])),
  );

  protected readonly copy = computed(() => practiceCopy(this.track()!));
  protected readonly practiceTitle = computed(() => (this.isDsa() ? 'Coding questions' : this.copy().groupTitle));
  protected readonly practiceCount = computed(() =>
    this.isDsa() ? this.practice()!.problems.length : this.track()!.problems.length,
  );
  protected readonly practiceIntro = computed(() =>
    this.isDsa()
      ? `${formatCount(this.practiceCount())} LeetCode problems in ${this.practice()!.topics.length} topics, each a ladder from easy to hard. Every topic links to the lesson that teaches its pattern.`
      : this.copy().libraryIntro ||
        'Work through each problem on your own first; the hints and the reference design are there when you need them.',
  );
  protected readonly practiceLinkText = computed(() =>
    this.isDsa()
      ? `Track all ${this.practiceCount()} coding questions: status, notes and the ones to revisit`
      : `Search and filter all ${this.practiceCount()} ${this.copy().noun} in the practice library`,
  );

  protected readonly stats = computed(() => {
    const track = this.track()!;
    const minutes = this.lessons().reduce((n, lesson) => n + lesson.minutes, 0);
    return [
      { value: this.lessons().length, label: 'lessons' },
      { value: track.stages.reduce((n, stage) => n + stage.modules.length, 0), label: 'modules' },
      { value: this.practiceCount(), label: this.isDsa() ? 'coding questions' : this.copy().noun },
      { value: Math.round(minutes / 60), label: 'hours of reading' },
    ].map((stat) => ({ ...stat, value: formatCount(stat.value) }));
  });

  /** The cheat sheets' number follows the last stage's (DSA only). */
  protected readonly cheatsheetsMarker = computed(() => pad2(this.track()!.stages.length + 1));

  protected readonly navItems = computed<RoadmapNavItem[]>(() => {
    const track = this.track()!;
    return [
      ...track.stages.map((stage) => ({ id: stageAnchor(stage), label: stage.title, marker: pad2(stage.number) })),
      ...(this.isDsa() ? [{ id: 'cheatsheets', label: 'Cheat sheets', marker: this.cheatsheetsMarker() }] : []),
      { id: 'practice', label: this.practiceTitle(), marker: '→' },
    ];
  });
}
