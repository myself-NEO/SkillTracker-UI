import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { flattenLessons } from '@content/shared/curriculum';
import type { DsaPractice, JavaQuestionIndex, TrackFile } from '@lib/content/catalog';
import { problemRef } from '@lib/dsa/practice';
import { topicIndex } from '@lib/notebook/topic-index';
import { isLessonComplete } from '@lib/progress/progress';
import { TOPICS, type TopicId } from '@lib/topics';
import { ProgressStore } from '../../core/progress.store';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { SectionHeroComponent } from '../../ui/section-hero.component';
import { ProgressBarComponent } from '../../ui/stat-parts';
import { BackupControlsComponent } from '../notebook/backup-controls.component';
import { TopicTabsComponent } from '../topic/topic-tabs.component';
import { DashboardComponent } from './dashboard.component';

/** The overall figure beside the page title: lessons completed, and the hours left. */
@Component({
  selector: 'app-overall-progress',
  imports: [ProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <p class="text-sm text-muted">Overall completion</p>
    <p class="mt-1 font-display text-5xl font-semibold tabular-nums">{{ percent() }}%</p>
    <app-progress-bar class="mt-3" [value]="done()" [max]="lessons().length" label="Lessons completed overall" />
    <p class="mt-2 text-xs text-muted">{{ done() }} of {{ lessons().length }} lessons · about {{ hoursLeft() }} h left</p>
  `,
})
export class OverallProgressComponent {
  private readonly store = inject(ProgressStore);
  readonly track = input.required<TrackFile>();

  protected readonly lessons = computed(() => flattenLessons(this.track()).map(({ lesson }) => lesson));
  private readonly complete = computed(() =>
    this.lessons().filter((lesson) => isLessonComplete(this.store.progress(), this.track().id, lesson.slug)),
  );
  protected readonly done = computed(() => this.complete().length);
  protected readonly percent = computed(() => (this.lessons().length ? Math.round((this.done() / this.lessons().length) * 100) : 0));
  protected readonly hoursLeft = computed(() => {
    const done = new Set(this.complete().map((lesson) => lesson.slug));
    const minutes = this.lessons()
      .filter((lesson) => !done.has(lesson.slug))
      .reduce((sum, lesson) => sum + lesson.minutes, 0);
    return Math.round(minutes / 60);
  });
}

/**
 * /:topic/progress: a topic's progress dashboard, with the overall figure and backups beside the
 * title. Ported from TheSWEguide's [topic]/progress/page.tsx.
 */
@Component({
  selector: 'app-progress-page',
  imports: [TopicTabsComponent, SectionHeroComponent, OverallProgressComponent, BackupControlsComponent, DashboardComponent, LoadErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main-content" [attr.data-track]="topic()">
      <app-topic-tabs [topic]="topic()" active="progress" />
      @if (ready()) {
        @let view = track()!;
        <app-section-hero
          [topic]="topic()"
          section="Progress"
          eyebrow="Learning progress"
          [title]="'Your ' + info().shortTitle + ' progress'"
          [hasAside]="true"
        >
          <p>
            Every figure here comes from what you have done: lessons completed and opened, knowledge-check answers, practice
            status{{ view.notebook ? ', and what you saved or flagged in your notebook' : '' }}. It’s all saved to your account;
            export a backup to keep a copy.
          </p>
          <div aside class="space-y-4 rounded-2xl border border-border bg-surface p-5">
            <app-overall-progress [track]="view" />
            <div class="border-t border-border pt-4"><app-backup-controls /></div>
          </div>
        </app-section-hero>
        <div class="mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:py-12">
          <app-progress-dashboard [track]="view" [index]="index()!" [coding]="coding()" [questionIds]="questionIds()" />
        </div>
      } @else {
        <app-load-error />
      }
    </main>
  `,
})
export class ProgressPageComponent {
  /** From the route: the topic, its curriculum, DSA's coding questions, Java's question bank. */
  readonly topic = input.required<TopicId>();
  readonly track = input<TrackFile | null>(null);
  readonly practice = input<DsaPractice | null>(null);
  readonly questions = input<JavaQuestionIndex | null>(null);

  protected readonly info = computed(() => TOPICS.find((topic) => topic.id === this.topic())!);
  /** DSA's page needs its coding questions too. */
  protected readonly ready = computed(() => Boolean(this.track()) && (this.topic() !== 'dsa' || Boolean(this.practice())));
  protected readonly index = computed(() => {
    const track = this.track();
    return track ? topicIndex(track, this.questions() ?? {}) : null;
  });
  protected readonly coding = computed(() =>
    this.topic() === 'dsa'
      ? this.practice()?.problems.map((problem) => ({ ref: problemRef(problem), difficulty: problem.difficulty }))
      : undefined,
  );
  protected readonly questionIds = computed(() => (this.topic() === 'java' ? Object.keys(this.questions() ?? {}) : undefined));
}
