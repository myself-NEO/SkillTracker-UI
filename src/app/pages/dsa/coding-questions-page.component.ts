import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { LeetCodeDifficulty } from '@content/dsa/problems';
import { findLesson } from '@content/shared/curriculum';
import type { ProblemStatus } from '@content/shared/types';
import type { DsaPractice, TrackFile } from '@lib/content/catalog';
import {
  DSA_PROBLEMS,
  isRevisit,
  LEETCODE_DIFFICULTIES,
  noteOf,
  PRACTICE_STATUS_LABEL,
  PRACTICE_STATUSES,
  statusOf,
} from '@lib/dsa/practice';
import { NotebookStore } from '../../core/notebook.store';
import { ProgressStore } from '../../core/progress.store';
import { ArrowIconComponent, SearchIconComponent } from '../../ui/icons';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { ProgressBarComponent } from '../../ui/stat-parts';
import { BreadcrumbComponent } from '../article/article-parts';
import { NotFoundComponent } from '../not-found/not-found-page.component';
import { matches } from '../notebook/notebook-parts';
import { TopicTabsComponent } from '../topic/topic-tabs.component';
import { CodingQuestionComponent } from './coding-question.component';

const FILTER = 'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent';

/**
 * /dsa/problems and /dsa/problems/:practiceTopic: DSA's coding questions (the LeetCode list), with
 * the learner's status, revisit flag and notes on each, filters, and the lesson that teaches each
 * topic. Ported from TheSWEguide's components/dsa/ProblemList.tsx.
 */
@Component({
  selector: 'app-coding-questions-page',
  imports: [
    RouterLink,
    TopicTabsComponent,
    BreadcrumbComponent,
    ProgressBarComponent,
    SearchIconComponent,
    ArrowIconComponent,
    CodingQuestionComponent,
    NotFoundComponent,
    LoadErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coding-questions-page.component.html',
})
export class CodingQuestionsPageComponent {
  private readonly progress = inject(ProgressStore);
  private readonly notebook = inject(NotebookStore);

  /** From the route: DSA's practice list and curriculum, and the practice topic to show, if one. */
  readonly practice = input<DsaPractice | null>(null);
  readonly track = input<TrackFile | null>(null);
  readonly practiceTopic = input<string>();

  protected readonly difficulties = LEETCODE_DIFFICULTIES;
  protected readonly statuses = PRACTICE_STATUSES;
  protected readonly statusLabel = PRACTICE_STATUS_LABEL;

  protected readonly preset = computed(() => {
    const id = this.practiceTopic();
    return id ? this.practice()?.topics.find((topic) => topic.id === id) : undefined;
  });
  /** A practice topic that doesn't exist. */
  protected readonly missing = computed(() => Boolean(this.practiceTopic() && this.practice() && !this.preset()));

  // The filters start over on each practice topic's page.
  protected readonly query = linkedSignal({ source: this.practiceTopic, computation: () => '' });
  protected readonly topic = linkedSignal({ source: this.practiceTopic, computation: (id: string | undefined) => id ?? 'all' });
  protected readonly difficulty = linkedSignal<string | undefined, LeetCodeDifficulty | 'all'>({
    source: this.practiceTopic,
    computation: () => 'all',
  });
  protected readonly status = linkedSignal<string | undefined, ProblemStatus | 'all'>({
    source: this.practiceTopic,
    computation: () => 'all',
  });
  protected readonly revisitOnly = linkedSignal({ source: this.practiceTopic, computation: () => false });
  protected readonly notesOnly = linkedSignal({ source: this.practiceTopic, computation: () => false });

  private readonly problems = computed(() => this.practice()?.problems ?? []);
  protected readonly total = computed(() => this.problems().length);
  protected readonly topicCount = computed(() => this.practice()?.topics.length ?? 0);
  private readonly solved = computed(() => {
    const progress = this.progress.progress();
    return this.problems().filter((problem) => statusOf(progress, problem) === 'completed');
  });
  protected readonly solvedCount = computed(() => this.solved().length);
  protected readonly byDifficulty = computed(() =>
    LEETCODE_DIFFICULTIES.map((difficulty) => {
      const all = this.problems().filter((problem) => problem.difficulty === difficulty).length;
      const done = this.solved().filter((problem) => problem.difficulty === difficulty).length;
      return `${difficulty} ${done}/${all}`;
    }).join(' · '),
  );

  protected readonly filtered = computed(() => {
    const progress = this.progress.progress();
    const notebook = this.notebook.notebook();
    const topic = this.topic();
    const difficulty = this.difficulty();
    const status = this.status();
    return this.problems().filter(
      (problem) =>
        (topic === 'all' || problem.topic === topic) &&
        (difficulty === 'all' || problem.difficulty === difficulty) &&
        (status === 'all' || statusOf(progress, problem) === status) &&
        (!this.revisitOnly() || isRevisit(notebook, problem)) &&
        (!this.notesOnly() || Boolean(noteOf(notebook, problem))) &&
        matches(this.query(), String(problem.id), problem.title, ...problem.patterns),
    );
  });

  protected readonly hasFilters = computed(
    () =>
      this.topic() !== 'all' ||
      this.difficulty() !== 'all' ||
      this.status() !== 'all' ||
      this.revisitOnly() ||
      this.notesOnly() ||
      this.query().trim() !== '',
  );

  /** The lesson that teaches each practice topic. */
  private readonly guides = computed(() => {
    const track = this.track();
    const guides = new Map<string, { href: string; title: string }>();
    for (const topic of this.practice()?.topics ?? []) {
      const lesson = track && findLesson(track, topic.guide)?.lesson;
      if (lesson) guides.set(topic.id, { href: `${track.basePath}/${lesson.slug}`, title: lesson.title });
    }
    return guides;
  });

  /** The filtered questions by practice topic, with each topic's solved count and guide. */
  protected readonly sections = computed(() => {
    const progress = this.progress.progress();
    return (this.practice()?.topics ?? [])
      .map((topic) => {
        const all = this.problems().filter((problem) => problem.topic === topic.id);
        return {
          topic,
          items: this.filtered().filter((problem) => problem.topic === topic.id),
          total: all.length,
          done: all.filter((problem) => statusOf(progress, problem) === 'completed').length,
          guide: this.guides().get(topic.id),
        };
      })
      .filter((section) => section.items.length > 0);
  });

  protected readonly breadcrumb = computed(() => [
    { title: 'All topics', href: '/learn' },
    { title: 'DSA', href: '/dsa' },
    { title: 'Coding questions', href: this.preset() ? DSA_PROBLEMS : undefined },
    ...(this.preset() ? [{ title: this.preset()!.title }] : []),
  ]);

  protected filterClass(active: boolean) {
    return `${FILTER} ${active ? 'border-accent/50 bg-accent-soft text-accent' : 'border-border text-muted hover:border-border-strong hover:text-fg'}`;
  }

  protected clearFilters() {
    this.query.set('');
    this.topic.set('all');
    this.difficulty.set('all');
    this.status.set('all');
    this.revisitOnly.set(false);
    this.notesOnly.set(false);
  }
}
