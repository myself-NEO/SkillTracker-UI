import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { TrackId } from '@content/shared/types';
import { isSaved, itemKey, savedKey } from '@lib/progress/notebook';
import { NotebookStore } from '../core/notebook.store';
import type { BodyPage } from '../widgets/page';
import { BookmarkIconComponent, FlagIconComponent } from './icons';
import { ToggleChipComponent } from './toggle-chip.component';

// The revision tools on lesson and problem pages of topics with a notebook (Java, LLD, HLD),
// ported from TheSWEguide's components/notebook/RevisionTools.tsx: bookmarks for the lesson, its
// sections and its interview questions, the "difficult" and "revisit" flags. Everything goes to
// the notebook (NotebookStore), which is saved to the account. The section and question
// bookmarks sit inside the lesson's HTML: LessonBodyComponent mounts them there.

/** "Bookmark lesson" and "Mark as difficult", under a lesson's title. */
@Component({
  selector: 'app-lesson-tools',
  imports: [ToggleChipComponent, BookmarkIconComponent, FlagIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mt-4 flex flex-wrap gap-2' },
  template: `
    <button
      appToggleChip
      [pressed]="bookmarked()"
      (click)="toggleBookmark()"
      label="Bookmark lesson"
      pressedLabel="Bookmarked"
    >
      <svg appBookmarkIcon [filled]="bookmarked()" class="size-3.5"></svg>
    </button>
    <button
      appToggleChip
      [pressed]="difficult()"
      (click)="store.toggleDifficult(track(), slug())"
      label="Mark as difficult"
      pressedLabel="Marked as difficult"
      tone="warning"
    >
      <svg appFlagIcon [filled]="difficult()" class="size-3.5"></svg>
    </button>
  `,
})
export class LessonToolsComponent {
  protected readonly store = inject(NotebookStore);

  readonly track = input.required<TrackId>();
  readonly slug = input.required<string>();
  readonly title = input.required<string>();
  /** "Stage · Module", shown with the bookmark in the notebook. */
  readonly context = input.required<string>();
  /** The lesson's stage id. */
  readonly topic = input.required<string>();

  protected readonly bookmarked = computed(() => isSaved(this.store.notebook(), 'lesson', this.track(), this.slug()));
  protected readonly difficult = computed(() => Boolean(this.store.notebook().difficult[itemKey(this.track(), this.slug())]));

  protected toggleBookmark() {
    this.store.toggleSaved({
      kind: 'lesson',
      track: this.track(),
      ref: this.slug(),
      title: this.title(),
      context: this.context(),
      topic: this.topic(),
    });
  }
}

/** "Revisit later" on a problem page: puts the problem on the notebook's revision list. */
@Component({
  selector: 'app-revisit-toggle',
  imports: [ToggleChipComponent, FlagIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      appToggleChip
      [pressed]="revisit()"
      (click)="store.toggleRevise(track(), ref())"
      label="Revisit later"
      pressedLabel="On your revisit list"
      tone="warning"
    >
      <svg appFlagIcon [filled]="revisit()" class="size-3.5"></svg>
    </button>
  `,
})
export class RevisitToggleComponent {
  protected readonly store = inject(NotebookStore);

  readonly track = input.required<TrackId>();
  readonly slug = input.required<string>();

  protected readonly ref = computed(() => `problem:${this.slug()}`);
  protected readonly revisit = computed(() => Boolean(this.store.notebook().revise[itemKey(this.track(), this.ref())]));
}

/** The bookmark beside a section heading of a lesson (mounted into the heading). */
@Component({
  selector: 'app-section-bookmark',
  imports: [BookmarkIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="toggle()"
      [attr.aria-pressed]="saved()"
      [attr.aria-label]="saved() ? 'Remove “' + title() + '” from your notebook' : 'Bookmark “' + title() + '” in your notebook'"
      [title]="saved() ? 'Bookmarked section' : 'Bookmark this section'"
      class="ml-2 inline-grid size-7 translate-y-[-2px] place-items-center rounded-md align-middle transition-opacity hover:bg-surface-2 focus-visible:opacity-100"
      [class]="saved() ? 'text-accent' : 'text-faint opacity-0 group-hover:opacity-100 pointer-coarse:opacity-100 hover:text-fg'"
    >
      <svg appBookmarkIcon [filled]="saved()" class="size-4"></svg>
    </button>
  `,
})
export class SectionBookmarkComponent {
  private readonly store = inject(NotebookStore);

  /** The heading's id. */
  readonly id = input.required<string>();
  /** The heading's text. */
  readonly title = input.required<string>();
  readonly page = input.required<BodyPage>();

  private readonly ref = computed(() => `${this.page().slug}#${this.id()}`);
  protected readonly saved = computed(() => Boolean(this.store.notebook().saved[savedKey('section', this.page().track, this.ref())]));

  protected toggle() {
    const page = this.page();
    if (!page.notebook) return;
    this.store.toggleSaved({
      kind: 'section',
      track: page.track,
      ref: this.ref(),
      title: this.title(),
      context: page.notebook.title,
      topic: page.notebook.topic,
    });
  }
}

/** The bookmark on an interview-question block; its model answer is saved with it (mounted into the block's summary). */
@Component({
  selector: 'app-question-bookmark',
  imports: [BookmarkIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="toggle($event)"
      [attr.aria-pressed]="saved()"
      [attr.aria-label]="saved() ? 'Remove this question from your notebook' : 'Save this question to your notebook'"
      [title]="saved() ? 'Saved to your notebook' : 'Save to your notebook'"
      class="grid size-7 shrink-0 place-items-center rounded-md hover:bg-surface-2"
      [class]="saved() ? 'text-accent' : 'text-faint hover:text-fg'"
    >
      <svg appBookmarkIcon [filled]="saved()" class="size-4"></svg>
    </button>
  `,
})
export class QuestionBookmarkComponent {
  private readonly store = inject(NotebookStore);

  /** The question's id in the page (`q-<hash of its title>`). */
  readonly id = input.required<string>();
  readonly title = input.required<string>();
  /** The model answer, as Markdown. */
  readonly body = input.required<string>();
  readonly page = input.required<BodyPage>();

  private readonly ref = computed(() => `${this.page().kind}:${this.page().slug}#${this.id()}`);
  protected readonly saved = computed(() => Boolean(this.store.notebook().saved[savedKey('question', this.page().track, this.ref())]));

  protected toggle(event: MouseEvent) {
    // The button sits in the block's <summary>: don't open or close the block.
    event.preventDefault();
    event.stopPropagation();
    const page = this.page();
    if (!page.notebook) return;
    this.store.toggleSaved({
      kind: 'question',
      track: page.track,
      ref: this.ref(),
      title: this.title(),
      context: page.notebook.title,
      topic: page.notebook.topic,
      body: this.body(),
      href: page.notebook.href,
    });
  }
}
