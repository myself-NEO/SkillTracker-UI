import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { flattenLessons } from '@content/shared/curriculum';
import type { LessonMeta } from '@content/shared/types';
import { lessonNotePlaceholder } from '@lib/content/practice';
import { lessonPath } from '@lib/markdown/links';
import { TOPICS } from '@lib/topics';
import type { LessonData, PageResult } from '../../core/content.resolvers';
import { ProgressStore } from '../../core/progress.store';
import { NotesBoxComponent } from '../../notebook/notes-box.component';
import { LessonToolsComponent } from '../../notebook/revision-tools';
import { LevelBadgeComponent } from '../../ui/level-badge.component';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { lessonState, StatusIconComponent } from '../../ui/status-icon.component';
import { ArticleLayoutComponent } from '../article/article-layout.component';
import {
  BreadcrumbComponent,
  ClockGlyphComponent,
  CompleteButtonComponent,
  MetaPillComponent,
  type PageLink,
  PrevNextComponent,
  RailLinksComponent,
  StarGlyphComponent,
} from '../article/article-parts';
import { type BodyPage, LessonBodyComponent } from '../article/lesson-body.component';
import { CurriculumSidebarComponent } from '../article/sidebars.component';
import { NotFoundComponent } from '../not-found/not-found-page.component';
import { stageAnchor } from '../topic/stage-section.component';

/**
 * A lesson (/:topic/:lesson): the curriculum sidebar, the article with what it covers and what to
 * read first, "mark complete", and the previous and next lessons. Ported from TheSWEguide's
 * [topic]/[lesson]/page.tsx. Topics with a notebook add its tools: the bookmark and "difficult"
 * chips, bookmarks and Save buttons in the body, and "My notes".
 */
@Component({
  selector: 'app-lesson-page',
  imports: [
    RouterLink,
    ArticleLayoutComponent,
    CurriculumSidebarComponent,
    BreadcrumbComponent,
    MetaPillComponent,
    ClockGlyphComponent,
    StarGlyphComponent,
    LevelBadgeComponent,
    StatusIconComponent,
    LessonBodyComponent,
    CompleteButtonComponent,
    PrevNextComponent,
    RailLinksComponent,
    NotFoundComponent,
    LoadErrorComponent,
    LessonToolsComponent,
    NotesBoxComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-page.component.html',
})
export class LessonPageComponent {
  private readonly store = inject(ProgressStore);

  /** Resolved by the route (lessonResolver). */
  readonly page = input.required<PageResult<LessonData>>();

  protected readonly data = computed(() => {
    const page = this.page();
    return page.status === 'ok' ? page.value : null;
  });
  protected readonly lesson = computed(() => this.data()!.location.lesson);
  protected readonly info = computed(() => TOPICS.find((topic) => topic.id === this.data()!.track.id)!);
  protected readonly lessons = computed(() => flattenLessons(this.data()!.track));
  protected readonly resume = computed(() => ({ track: this.data()!.track.id, slug: this.lesson().slug }));
  protected readonly notePlaceholder = computed(() => lessonNotePlaceholder(this.data()!.track));

  /** The page the body's widgets and notebook tools record against. */
  protected readonly bodyPage = computed((): BodyPage => {
    const { track, location } = this.data()!;
    const lesson = location.lesson;
    return {
      track: track.id,
      kind: 'lesson',
      slug: lesson.slug,
      notebook: track.notebook
        ? { title: lesson.title, topic: location.stage.id, href: lessonPath(track.basePath, lesson.slug) }
        : undefined,
    };
  });

  protected readonly breadcrumb = computed(() => {
    const { track, location } = this.data()!;
    return [
      { title: this.info().shortTitle, href: track.basePath },
      { title: location.stage.title, href: track.basePath, fragment: stageAnchor(location.stage) },
      { title: location.moduleTitle },
    ];
  });

  private readonly bySlug = computed(() => new Map(this.lessons().map(({ lesson }) => [lesson.slug, lesson])));
  private readonly resolve = (slugs: readonly string[]) =>
    slugs.map((slug) => this.bySlug().get(slug)).filter((lesson): lesson is LessonMeta => Boolean(lesson));
  protected readonly prerequisites = computed(() => this.resolve(this.lesson().prerequisites));
  protected readonly related = computed(() => this.resolve(this.lesson().related).map((lesson) => this.link(lesson)));

  protected readonly previous = computed(() => this.neighbour(-1));
  protected readonly next = computed(() => this.neighbour(1));

  /** Shown when the lesson lists nothing to read first. */
  protected readonly assumed = computed(() => {
    const track = this.data()!.track;
    return track.assumedKnowledge ?? `Basic ${track.language ?? 'programming'} syntax is assumed.`;
  });

  protected link(lesson: LessonMeta): PageLink {
    return { href: lessonPath(this.data()!.track.basePath, lesson.slug), title: lesson.title };
  }

  protected lessonState(slug: string) {
    return lessonState(this.store.progress(), this.data()!.track.id, slug);
  }

  private neighbour(offset: number) {
    const other = this.lessons()[this.data()!.location.index + offset]?.lesson;
    return other && this.link(other);
  }
}
