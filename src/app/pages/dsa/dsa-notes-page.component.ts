import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DsaPractice } from '@lib/content/catalog';
import { DIFFICULTY_LEVEL, DSA, dsaProblemsHref, leetCodeUrl, PRACTICE_STATUS_LABEL, problemRef, statusOf } from '@lib/dsa/practice';
import type { Note } from '@lib/progress/notebook';
import { NotebookStore } from '../../core/notebook.store';
import { ProgressStore } from '../../core/progress.store';
import { ExternalLinkIconComponent, NoteIconComponent, SearchIconComponent } from '../../ui/icons';
import { LevelBadgeComponent } from '../../ui/level-badge.component';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { MarkdownComponent } from '../../ui/markdown.component';
import { BreadcrumbComponent, StatusBadgeComponent } from '../article/article-parts';
import { BackupControlsComponent } from '../notebook/backup-controls.component';
import { BUTTON, formatDate, INPUT, matches, PRIMARY } from '../notebook/notebook-parts';
import { TopicTabsComponent } from '../topic/topic-tabs.component';

// DSA's interview notes (/dsa/notes), ported from TheSWEguide's components/dsa/InterviewNotes.tsx:
// the learner's own notes on patterns, templates and mistakes, and every note kept on a coding
// question. Only DSA has this page; the other topics have a notebook.

type Kind = 'all' | 'mine' | 'problems';

/** The practice topics to file a note under, and "General". */
@Component({
  selector: 'app-dsa-topic-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label [for]="selectId()" class="sr-only">{{ label() }}</label>
    <select [id]="selectId()" (change)="changed.emit($any($event.target).value)" [class]="classes">
      @if (includeAll()) {
        <option value="all" [selected]="value() === 'all'">All topics</option>
      }
      @for (topic of topics(); track topic.id) {
        <option [value]="topic.id" [selected]="value() === topic.id">{{ topic.title }}</option>
      }
      <option value="general" [selected]="value() === 'general'">General</option>
    </select>
  `,
})
export class DsaTopicSelectComponent {
  readonly topics = input.required<DsaPractice['topics']>();
  readonly value = input.required<string>();
  readonly selectId = input.required<string>();
  readonly label = input.required<string>();
  readonly includeAll = input(false);
  readonly changed = output<string>();
  protected readonly classes = `${INPUT} sm:w-auto`;
}

/** Writes a note, or edits any note; a coding question's note keeps its title and topic. */
@Component({
  selector: 'app-dsa-note-editor',
  imports: [DsaTopicSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <form (submit)="submit($event)" class="space-y-3 rounded-xl border border-accent/30 bg-surface p-4">
      @if (forProblem()) {
        <p class="text-sm font-semibold text-fg">{{ note()!.title }}</p>
      } @else {
        <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <label [for]="'note-title-' + idBase()" class="mb-1 block text-xs font-semibold text-muted">Title</label>
            <input
              #first
              [id]="'note-title-' + idBase()"
              [value]="title()"
              (input)="title.set($any($event.target).value)"
              [class]="inputClass"
              placeholder="e.g. When to reach for a monotonic stack"
            />
          </div>
          <div>
            <span class="mb-1 block text-xs font-semibold text-muted" aria-hidden="true">Topic</span>
            <app-dsa-topic-select
              [topics]="topics()"
              [value]="topic()"
              (changed)="topic.set($event)"
              [selectId]="'note-topic-' + idBase()"
              label="Note topic"
            />
          </div>
        </div>
      }
      <div>
        <label [for]="'note-body-' + idBase()" class="mb-1 block text-xs font-semibold text-muted">
          Note (Markdown supported, including \`\`\`java code blocks)
        </label>
        <textarea
          #body
          [id]="'note-body-' + idBase()"
          [value]="text()"
          (input)="text.set($any($event.target).value)"
          rows="7"
          [class]="inputClass + ' font-mono'"
        ></textarea>
      </div>
      <div class="flex gap-2">
        <button type="submit" [class]="primary">Save note</button>
        <button type="button" (click)="done.emit()" [class]="button">Cancel</button>
      </div>
    </form>
  `,
})
export class DsaNoteEditorComponent {
  private readonly store = inject(NotebookStore);
  private readonly firstField = viewChild<ElementRef<HTMLInputElement>>('first');
  private readonly bodyField = viewChild<ElementRef<HTMLTextAreaElement>>('body');

  readonly topics = input.required<DsaPractice['topics']>();
  /** The note to edit; without it, a new note. */
  readonly note = input<Note>();
  readonly done = output<void>();

  protected readonly forProblem = computed(() => Boolean(this.note()?.problem));
  protected readonly idBase = computed(() => this.note()?.id ?? 'new');
  protected readonly title = linkedSignal(() => this.note()?.title ?? '');
  protected readonly text = linkedSignal(() => this.note()?.body ?? '');
  protected readonly topic = linkedSignal(() => this.note()?.topic || 'general');
  protected readonly inputClass = INPUT;
  protected readonly primary = PRIMARY;
  protected readonly button = BUTTON;

  constructor() {
    afterNextRender(() => (this.firstField() ?? this.bodyField())?.nativeElement.focus());
  }

  protected submit(event: Event) {
    event.preventDefault();
    const note = this.note();
    const body = this.text();
    if (note?.problem) {
      // An emptied note on a coding question is removed, as it is from the list of questions.
      if (body.trim()) this.store.saveNote({ ...note, body });
      else this.store.deleteNote(note.id);
    } else {
      if (!this.title().trim() && !body.trim()) return;
      this.store.saveNote({
        id: note?.id,
        track: DSA,
        title: this.title().trim() || 'Untitled note',
        body,
        topic: this.topic(),
        ...(note?.kind && { kind: note.kind }),
      });
    }
    this.done.emit();
  }
}

/** A note, with its coding question's difficulty and status when it is one's. */
@Component({
  selector: 'app-dsa-note-card',
  imports: [RouterLink, DsaNoteEditorComponent, MarkdownComponent, LevelBadgeComponent, StatusBadgeComponent, ExternalLinkIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (editing()) {
      <app-dsa-note-editor [topics]="practice().topics" [note]="note()" (done)="editing.set(false)" />
    } @else {
      <article class="rounded-xl border border-border bg-surface p-4 sm:p-5" [attr.data-note]="note().problem ? 'problem' : 'mine'">
        <div class="mb-2 flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            @if (problem(); as question) {
              <a
                [href]="url(question)"
                target="_blank"
                rel="noopener noreferrer"
                class="group inline-flex items-baseline gap-1.5 font-semibold text-fg hover:text-accent"
              >
                {{ note().title }}
                <svg appExternalLinkIcon class="size-3.5 shrink-0 text-muted group-hover:text-accent"></svg>
                <span class="sr-only">(opens LeetCode in a new tab)</span>
              </a>
            } @else {
              <h3 class="font-semibold text-fg">{{ note().title }}</h3>
            }
            <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              @if (problem(); as question) {
                <app-level-badge [level]="level(question)" [label]="question.difficulty" />
                <app-status-badge [status]="status(question)" [label]="statusLabel[status(question)]" />
              }
              <span>{{ topicLabel() }} · edited {{ date(note().updatedAt) }}</span>
              @if (problem(); as question) {
                <a [routerLink]="problemsHref(question.topic)" class="text-accent hover:underline">in coding questions</a>
              }
            </div>
          </div>
          <div class="flex gap-2">
            <button type="button" (click)="editing.set(true)" [class]="button">Edit</button>
            <button type="button" (click)="remove()" [class]="button + ' hover:border-danger/50! hover:text-danger!'">Delete</button>
          </div>
        </div>
        <app-markdown [markdown]="note().body || '_Empty note_'" basePath="/dsa" />
      </article>
    }
  `,
})
export class DsaNoteCardComponent {
  private readonly store = inject(NotebookStore);
  private readonly progress = inject(ProgressStore);

  readonly note = input.required<Note>();
  readonly practice = input.required<DsaPractice>();

  protected readonly editing = signal(false);
  protected readonly button = BUTTON;
  protected readonly statusLabel = PRACTICE_STATUS_LABEL;
  protected readonly date = formatDate;
  protected readonly url = leetCodeUrl;
  protected readonly problemsHref = dsaProblemsHref;
  /** The coding question the note is on, if it is one's. */
  protected readonly problem = computed(() => {
    const ref = this.note().problem;
    return ref ? this.practice().problems.find((problem) => problemRef(problem) === ref) : undefined;
  });
  protected readonly topicLabel = computed(
    () => this.practice().topics.find((topic) => topic.id === this.note().topic)?.title ?? 'General',
  );

  protected level(problem: { difficulty: keyof typeof DIFFICULTY_LEVEL }) {
    return DIFFICULTY_LEVEL[problem.difficulty];
  }

  protected status(problem: Parameters<typeof statusOf>[1]) {
    return statusOf(this.progress.progress(), problem);
  }

  protected remove() {
    if (window.confirm(`Delete the note “${this.note().title}”?`)) this.store.deleteNote(this.note().id);
  }
}

/** /dsa/notes */
@Component({
  selector: 'app-dsa-notes-page',
  imports: [
    RouterLink,
    TopicTabsComponent,
    BreadcrumbComponent,
    BackupControlsComponent,
    SearchIconComponent,
    NoteIconComponent,
    DsaTopicSelectComponent,
    DsaNoteEditorComponent,
    DsaNoteCardComponent,
    LoadErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main-content" data-track="dsa">
      <app-topic-tabs topic="dsa" active="notes" />
      @if (practice(); as practice) {
        <div class="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <app-breadcrumb [items]="breadcrumb" />
          <header class="mt-6 mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p class="mb-2 text-sm font-semibold text-accent">Interview notes</p>
              <h1 class="mb-3 font-display text-4xl leading-tight font-bold tracking-tight text-fg sm:text-5xl">My DSA interview notes</h1>
              <p class="max-w-2xl text-muted">
                Your own notes for interview day: patterns in your words, templates you keep re-deriving, mistakes not to repeat.
                Notes you write on a coding question are collected here too. Everything is saved to your account.
              </p>
            </div>
            <app-backup-controls class="shrink-0 md:max-w-xs" />
          </header>

          <div class="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row">
            <label class="relative block flex-1">
              <span class="sr-only">Search your notes</span>
              <svg appSearchIcon class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"></svg>
              <input
                type="search"
                [value]="query()"
                (input)="query.set($any($event.target).value)"
                placeholder="Search your notes"
                [class]="inputClass + ' pl-9'"
              />
            </label>
            <app-dsa-topic-select
              [topics]="practice.topics"
              [value]="topic()"
              (changed)="topic.set($event)"
              selectId="notes-topic"
              label="Filter by topic"
              [includeAll]="true"
            />
          </div>

          <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Which notes" class="flex flex-wrap gap-1.5">
              @for (option of kinds(); track option.id) {
                <button
                  type="button"
                  (click)="kind.set(option.id)"
                  [attr.aria-pressed]="kind() === option.id"
                  class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  [class]="kind() === option.id ? 'border-accent/50 bg-accent-soft text-accent' : 'border-border text-muted hover:border-border-strong hover:text-fg'"
                >
                  {{ option.label }} <span class="text-muted">{{ option.count }}</span>
                </button>
              }
            </div>
            @if (!composing()) {
              <button
                type="button"
                (click)="composing.set(true)"
                class="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg hover:opacity-90 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <svg appNoteIcon class="size-4"></svg> New note
              </button>
            }
          </div>

          @if (composing()) {
            <app-dsa-note-editor class="mb-6" [topics]="practice.topics" (done)="composing.set(false)" />
          }

          @if (shown().length === 0) {
            <div class="rounded-xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted">
              @if (all().length === 0) {
                No notes yet. Write one with <strong class="text-fg">New note</strong>, or open <strong class="text-fg">Notes</strong> on
                any of the <a [routerLink]="problemsHref" class="text-accent hover:underline">coding questions</a>.
              } @else {
                No notes match the search or topic.
              }
            </div>
          } @else {
            <ul class="space-y-4">
              @for (note of shown(); track note.id) {
                <li><app-dsa-note-card [note]="note" [practice]="practice" /></li>
              }
            </ul>
          }
        </div>
      } @else {
        <app-load-error />
      }
    </main>
  `,
})
export class DsaNotesPageComponent {
  private readonly store = inject(NotebookStore);

  /** From the route: DSA's practice topics and coding questions. */
  readonly practice = input<DsaPractice | null>(null);

  protected readonly query = signal('');
  protected readonly topic = signal('all');
  protected readonly kind = signal<Kind>('all');
  protected readonly composing = signal(false);
  protected readonly inputClass = INPUT;
  protected readonly problemsHref = dsaProblemsHref();
  protected readonly breadcrumb = [{ title: 'All topics', href: '/learn' }, { title: 'DSA', href: '/dsa' }, { title: 'Interview notes' }];

  protected readonly all = computed(() => Object.values(this.store.notebook().notes).filter((note) => note.track === DSA));
  private readonly matching = computed(() => {
    const topic = this.topic();
    const known = new Set((this.practice()?.topics ?? []).map((option) => option.id));
    return this.all().filter(
      (note) =>
        (topic === 'all' || note.topic === topic || (topic === 'general' && !known.has(note.topic))) &&
        matches(this.query(), note.title, note.body),
    );
  });
  private readonly mine = computed(() => this.matching().filter((note) => !note.problem));
  private readonly onProblems = computed(() => this.matching().filter((note) => note.problem));

  protected readonly kinds = computed((): { id: Kind; label: string; count: number }[] => [
    { id: 'all', label: 'All notes', count: this.matching().length },
    { id: 'mine', label: 'My notes', count: this.mine().length },
    { id: 'problems', label: 'Problem notes', count: this.onProblems().length },
  ]);

  protected readonly shown = computed(() => {
    const kind = this.kind();
    const list = kind === 'mine' ? this.mine() : kind === 'problems' ? this.onProblems() : this.matching();
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  });
}
