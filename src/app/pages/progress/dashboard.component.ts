import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { TrackFile } from '@lib/content/catalog';
import { practiceCopy } from '@lib/content/practice';
import { pad2 } from '@lib/format';
import { revisionItems, type TopicIndex } from '@lib/notebook/revision';
import { isLessonComplete, isLessonVisited, isQuizPassed, problemStatus, trackAnswers } from '@lib/progress/progress';
import { InterviewsStore } from '../../core/interviews.store';
import { NotebookStore } from '../../core/notebook.store';
import { ProgressStore } from '../../core/progress.store';
import { CheckCircleIconComponent, HalfCircleIconComponent } from '../../ui/icons';
import { InlineCodeComponent } from '../../ui/inline-code.component';
import { ProgressBarComponent, StatTileComponent } from '../../ui/stat-parts';
import { ClockGlyphComponent } from '../article/article-parts';

interface Tile {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
}

const formatDate = (at: number) => new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * A topic's progress dashboard (/:topic/progress), ported from TheSWEguide's
 * components/progress/Dashboard.tsx: figure tiles, progress by stage and module, lessons in
 * progress, what to revise and what was completed lately. Every figure comes from the learner's
 * progress, notebook and interviews.
 */
@Component({
  selector: 'app-progress-dashboard',
  imports: [
    RouterLink,
    StatTileComponent,
    ProgressBarComponent,
    CheckCircleIconComponent,
    HalfCircleIconComponent,
    ClockGlyphComponent,
    InlineCodeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly progressStore = inject(ProgressStore);
  private readonly notebookStore = inject(NotebookStore);
  private readonly interviewsStore = inject(InterviewsStore);

  readonly track = input.required<TrackFile>();
  readonly index = input.required<TopicIndex>();
  /** DSA's coding questions: their refs and difficulty. */
  readonly coding = input<{ ref: string; difficulty: string }[]>();
  /** Java's interview question bank, by id. */
  readonly questionIds = input<string[]>();

  protected readonly pad2 = pad2;
  protected readonly date = formatDate;
  protected readonly basePath = computed(() => this.track().basePath);
  protected readonly notebook = computed(() => Boolean(this.track().notebook));

  private readonly progress = computed(() => this.progressStore.progress());

  protected readonly stages = computed(() =>
    this.track().stages.map((stage) => {
      const modules = stage.modules.map((module) => {
        const lessons = module.lessons.map((lesson) => lesson.slug);
        const done = lessons.filter((slug) => isLessonComplete(this.progress(), this.track().id, slug)).length;
        const next = lessons.find((slug) => !isLessonComplete(this.progress(), this.track().id, slug));
        return { id: module.id, title: module.title, lessons, done, next, nextTitle: next && this.index().lessons[next]?.title };
      });
      const total = modules.reduce((sum, module) => sum + module.lessons.length, 0);
      const done = modules.reduce((sum, module) => sum + module.done, 0);
      return { id: stage.id, number: stage.number, title: stage.title, modules, total, done };
    }),
  );

  private readonly slugs = computed(() => this.stages().flatMap((stage) => stage.modules.flatMap((module) => module.lessons)));

  protected readonly inProgress = computed(() => {
    const progress = this.progress();
    const track = this.track().id;
    return this.slugs()
      .filter((slug) => isLessonVisited(progress, track, slug) && !isLessonComplete(progress, track, slug))
      .sort((a, b) => (progress.visited[`${track}:${b}`] ?? 0) - (progress.visited[`${track}:${a}`] ?? 0))
      .map((slug) => ({ slug, title: this.index().lessons[slug]?.title ?? slug, at: progress.visited[`${track}:${slug}`] }));
  });

  protected readonly due = computed(() =>
    this.notebook()
      ? revisionItems(this.index(), this.notebookStore.notebook(), this.progress(), this.interviewsStore.state()).filter(
          (item) => item.due,
        )
      : [],
  );

  protected readonly recent = computed(() => {
    const track = this.track().id;
    return Object.entries(this.progress().lessons)
      .filter(([k]) => k.startsWith(`${track}:`) && this.index().lessons[k.slice(track.length + 1)])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([k, at]) => {
        const slug = k.slice(track.length + 1);
        return { slug, title: this.index().lessons[slug].title, at };
      });
  });

  protected readonly tiles = computed((): Tile[] => {
    const track = this.track();
    const progress = this.progress();
    const notes = this.notebookStore.notebook();
    const basePath = track.basePath;
    const stages = this.stages();
    const modules = stages.flatMap((stage) => stage.modules);
    const slugs = this.slugs();
    const done = slugs.filter((slug) => isLessonComplete(progress, track.id, slug)).length;
    const tiles: Tile[] = [
      { label: 'Modules completed', value: `${modules.filter((module) => module.done === module.lessons.length).length} / ${modules.length}`, detail: `across ${stages.length} stages` },
      { label: 'Lessons completed', value: `${done} / ${slugs.length}`, detail: `${this.inProgress().length} opened but not complete` },
    ];

    if (track.hasKnowledgeChecks) {
      const answers = trackAnswers(progress, track.id);
      const firstTry = answers.filter((answer) => answer.firstCorrect).length;
      const passed = slugs.filter((slug) => isQuizPassed(progress, track.id, slug)).length;
      tiles.push({
        label: 'Quiz accuracy',
        value: answers.length > 0 ? `${Math.round((firstTry / answers.length) * 100)}%` : '—',
        detail:
          answers.length > 0
            ? `${firstTry} of ${answers.length} right on the first try · ${passed} checks passed`
            : 'Answer a knowledge check to start',
      });
    }

    const problems = track.problems.map((problem) => problem.slug);
    if (problems.length > 0) {
      const count = (status: string) => problems.filter((slug) => problemStatus(progress, track.id, slug) === status).length;
      tiles.push({
        label: `${capitalise(practiceCopy(track).noun)} completed`,
        value: `${count('completed')} / ${problems.length}`,
        detail: `${count('attempted') + count('in-progress')} in progress or attempted`,
        href: `${basePath}/problems`,
      });
    }

    const coding = this.coding();
    if (coding) {
      const solved = coding.filter((problem) => problemStatus(progress, track.id, problem.ref) === 'completed');
      tiles.push({
        label: 'Coding questions solved',
        value: `${solved.length} / ${coding.length}`,
        detail: ['Easy', 'Medium', 'Hard']
          .map((difficulty) => `${difficulty} ${solved.filter((problem) => problem.difficulty === difficulty).length}`)
          .join(' · '),
        href: `${basePath}/problems`,
      });
    }

    if (track.id === 'lld' || track.id === 'hld') {
      const attempts = Object.entries(this.interviewsStore.state().history).filter(
        ([k, list]) => k.startsWith(`${track.id}:`) && Array.isArray(list) && list.length > 0,
      );
      const scores = attempts.map(([, list]) => list[list.length - 1]?.score).filter((score) => typeof score === 'number');
      tiles.push({
        label: 'Mock interviews',
        value: attempts.length,
        detail: scores.length
          ? `Average latest self-score ${Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)}%`
          : 'None finished yet',
        href: `${basePath}/interview`,
      });
    }

    const questionIds = this.questionIds();
    if (questionIds) {
      const states = questionIds.map((id) => notes.questions[`${track.id}:${id}`]);
      tiles.push({
        label: 'Interview questions practised',
        value: `${states.filter((state) => state?.revealedAt || state?.draft?.trim()).length} / ${questionIds.length}`,
        detail: `${states.filter((state) => state?.rating === 'got-it').length} got it · ${states.filter((state) => state?.rating === 'missed').length} missed`,
        href: `${basePath}/interview`,
      });
    }

    if (this.notebook()) {
      const saved = Object.values(notes.saved).filter((item) => item.track === track.id).length;
      const noteCount = Object.values(notes.notes).filter((note) => note.track === track.id).length;
      tiles.push(
        {
          label: 'Saved and noted',
          value: saved + noteCount,
          detail: `${saved} bookmark${saved === 1 ? '' : 's'} · ${noteCount} note${noteCount === 1 ? '' : 's'}`,
          href: `${basePath}/notebook`,
        },
        { label: 'Topics to revise', value: this.due().length, detail: 'Difficult lessons, flags, quiz misses', href: `${basePath}/notebook` },
      );
    }
    return tiles;
  });
}
