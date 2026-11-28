import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { INTERVIEW_TOPICS } from '@content/java/interview';
import type { JavaQuestionIndex, TrackFile } from '@lib/content/catalog';
import { practiceCopy } from '@lib/content/practice';
import { pad2 } from '@lib/format';
import { NOTEBOOK_SETTINGS } from '@lib/notebook/settings';
import { topicIndex } from '@lib/notebook/topic-index';
import { TOPICS, type TopicId } from '@lib/topics';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { SectionHeroComponent } from '../../ui/section-hero.component';
import { TopicTabsComponent } from '../topic/topic-tabs.component';
import { BackupControlsComponent } from './backup-controls.component';
import { NotebookComponent } from './notebook.component';
import type { TopicOption } from './notebook-parts';

/**
 * /:topic/notebook (Java, LLD, HLD): the learner's revision notebook, with backup export and
 * import beside its title. Ported from TheSWEguide's [topic]/notebook/page.tsx.
 */
@Component({
  selector: 'app-notebook-page',
  imports: [TopicTabsComponent, SectionHeroComponent, BackupControlsComponent, NotebookComponent, LoadErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main-content" [attr.data-track]="topic()">
      <app-topic-tabs [topic]="topic()" active="notebook" />
      @if (track(); as track) {
        <app-section-hero
          [topic]="topic()"
          section="Notebook"
          eyebrow="Revision notebook"
          [title]="'My ' + info().shortTitle + ' notebook'"
          [hasAside]="true"
        >
          <p>{{ settings().intro }}</p>
          <div aside class="rounded-2xl border border-border bg-surface p-5">
            <p class="text-sm text-muted">Download a copy of everything you’ve saved, or bring in a backup from TheSWEguide.</p>
            <app-backup-controls class="mt-3" />
          </div>
        </app-section-hero>
        <div class="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:py-12">
          <app-notebook [index]="index()!" [topics]="topicOptions()!" [settings]="settings()" />
        </div>
      } @else {
        <app-load-error />
      }
    </main>
  `,
})
export class NotebookPageComponent {
  /** From the route: the topic, its curriculum, and for Java the question bank's titles. */
  readonly topic = input.required<TopicId>();
  readonly track = input<TrackFile | null>(null);
  readonly questions = input<JavaQuestionIndex | null>(null);

  protected readonly info = computed(() => TOPICS.find((topic) => topic.id === this.topic())!);
  protected readonly settings = computed(() => NOTEBOOK_SETTINGS[this.topic()]!);
  protected readonly index = computed(() => {
    const track = this.track();
    return track ? topicIndex(track, this.questions() ?? {}) : null;
  });
  /** The topic filter's choices: the curriculum's stages, Java's interview topics, practice, and "General". */
  protected readonly topicOptions = computed((): TopicOption[] | null => {
    const track = this.track();
    if (!track) return null;
    return [
      ...track.stages.map((stage) => ({ id: stage.id, label: `${pad2(stage.number)} · ${stage.title}`, group: 'Curriculum' })),
      ...(track.id === 'java'
        ? INTERVIEW_TOPICS.map((topic) => ({ id: topic.id, label: topic.title, group: 'Interview topics' }))
        : []),
      ...(track.problems.length > 0 ? [{ id: 'problems', label: practiceCopy(track).groupTitle, group: 'Practice' }] : []),
      { id: 'general', label: 'General', group: 'Other' },
    ];
  });
}
