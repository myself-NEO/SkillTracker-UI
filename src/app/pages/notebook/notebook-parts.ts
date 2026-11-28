import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, model, output, signal } from '@angular/core';
import { copyText } from '@lib/clipboard';
import type { NotebookSettings } from '@lib/notebook/settings';
import type { TopicIndex } from '@lib/notebook/revision';
import type { Note, NoteKind, SavedItem, Snippet } from '@lib/progress/notebook';
import { NotebookStore } from '../../core/notebook.store';
import { NoteIconComponent } from '../../notebook/icons';
import { AppHrefDirective } from '../../ui/app-href.directive';
import { MarkdownComponent } from '../../ui/markdown.component';
import { MermaidDiagramComponent } from '../article/mermaid-diagram.component';

// The pieces of the revision notebook (NotebookComponent), ported from TheSWEguide's
// components/notebook/Notebook.tsx: the topic filter, saved questions, notes, code and diagrams,
// with their forms.

export interface TopicOption {
  id: string;
  label: string;
  group: string;
}

export const BUTTON =
  'inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-fg-soft transition-colors hover:border-border-strong hover:text-fg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent';
export const INPUT =
  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-faint focus:ring-2 focus:ring-accent focus:outline-hidden';
export const PRIMARY =
  'rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:opacity-90 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

export const formatDate = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** Every word of the query appears in one of the fields. */
export const matches = (query: string, ...fields: (string | undefined)[]) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = fields.join(' ').toLowerCase();
  return words.every((word) => text.includes(word));
};

const NOTE_KIND_CLASSES: Record<NoteKind, string> = {
  note: 'border-border bg-surface-2 text-fg-soft',
  tradeoff: 'border-info/30 bg-info-soft text-info',
  formula: 'border-success/30 bg-success-soft text-success',
  pattern: 'border-insight/30 bg-insight-soft text-insight',
  mistake: 'border-danger/30 bg-danger-soft text-danger',
};

/** A topic picker, grouped (curriculum stages, interview topics, practice, other). */
@Component({
  selector: 'app-topic-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label [for]="selectId()" class="sr-only">{{ label() }}</label>
    <select [id]="selectId()" [value]="value()" (change)="value.set($any($event.target).value)" [class]="classes">
      @if (includeAll()) {
        <option value="all" [selected]="value() === 'all'">All topics</option>
      }
      @for (group of groups(); track group) {
        <optgroup [label]="group">
          @for (topic of inGroup(group); track topic.id) {
            <option [value]="topic.id" [selected]="value() === topic.id">{{ topic.label }}</option>
          }
        </optgroup>
      }
    </select>
  `,
})
export class TopicSelectComponent {
  readonly topics = input.required<TopicOption[]>();
  readonly value = model.required<string>();
  readonly selectId = input.required<string>();
  readonly label = input.required<string>();
  readonly includeAll = input(false);

  protected readonly classes = `${INPUT} sm:w-64`;
  protected readonly groups = computed(() => [...new Set(this.topics().map((topic) => topic.group))]);
  protected inGroup(group: string) {
    return this.topics().filter((topic) => topic.group === group);
  }
}

/** "Copy" on a saved snippet. */
@Component({
  selector: 'app-copy-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="copy()"
      class="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-3 hover:text-fg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
      [attr.aria-label]="state() === 'copied' ? 'Code copied' : 'Copy code'"
    >
      <svg class="size-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z"
        />
        <path
          d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z"
        />
      </svg>
      <span aria-live="polite">{{ state() === 'copied' ? 'Copied!' : state() === 'failed' ? 'Copy failed' : 'Copy' }}</span>
    </button>
  `,
})
export class CopyButtonComponent {
  readonly text = input.required<string>();
  protected readonly state = signal<'idle' | 'copied' | 'failed'>('idle');
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected async copy() {
    try {
      await copyText(this.text());
      this.state.set('copied');
    } catch {
      this.state.set('failed');
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.state.set('idle'), 2000);
  }
}

/** A saved interview question; its model answer opens below it. */
@Component({
  selector: 'app-question-card',
  imports: [AppHrefDirective, MarkdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-xl border border-border bg-surface' },
  template: `
    <details class="group" (toggle)="onToggle($event)">
      <summary class="flex cursor-pointer list-none items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span class="min-w-0">
          <span class="block font-medium text-fg">{{ item().title }}</span>
          <span class="mt-0.5 block text-xs text-muted">
            From
            @if (item().href; as href) {
              <a [appHref]="href" class="text-accent hover:underline">{{ item().context }}</a>
            } @else {
              {{ item().context }}
            }
            · saved {{ date(item().at) }}
          </span>
        </span>
        <span class="shrink-0 text-xs font-medium text-muted group-open:hidden">Show answer</span>
        <span class="hidden shrink-0 text-xs font-medium text-muted group-open:inline">Hide</span>
      </summary>
      <div class="border-t border-border px-4 py-4">
        @if (opened()) {
          @if (item().body) {
            <app-markdown [markdown]="item().body!" [basePath]="basePath()" />
          } @else {
            <p class="text-sm text-muted">No answer was saved with this question.</p>
          }
        }
        <button type="button" [class]="button + ' mt-4'" (click)="store.toggleSaved(item(), false)">Remove from notebook</button>
      </div>
    </details>
  `,
})
export class QuestionCardComponent {
  protected readonly store = inject(NotebookStore);
  readonly item = input.required<SavedItem>();
  readonly basePath = input.required<string>();
  /** The answer is rendered when it is first opened. */
  protected readonly opened = signal(false);
  protected readonly button = BUTTON;
  protected readonly date = formatDate;

  protected onToggle(event: Event) {
    if ((event.target as HTMLDetailsElement).open) this.opened.set(true);
  }
}

/** Writes or edits a note. */
@Component({
  selector: 'app-note-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TopicSelectComponent],
  host: { class: 'block' },
  template: `
    <form (submit)="submit($event)" class="space-y-3 rounded-xl border border-accent/40 bg-surface p-4">
      <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <label [for]="'note-title-' + formId()" class="mb-1 block text-xs font-semibold text-muted">Title</label>
          <input
            [id]="'note-title-' + formId()"
            [value]="title()"
            (input)="title.set($any($event.target).value)"
            [placeholder]="settings().noteTitlePlaceholder"
            [class]="inputClass"
          />
        </div>
        <div>
          <span class="mb-1 block text-xs font-semibold text-muted" aria-hidden="true">Topic</span>
          <app-topic-select [topics]="topics()" [(value)]="topic" [selectId]="'note-topic-' + formId()" label="Note topic" />
        </div>
      </div>
      @if (settings().noteKinds.length > 1) {
        <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Kind of note">
          @for (option of settings().noteKinds; track option.id) {
            <button
              type="button"
              [attr.aria-pressed]="kind() === option.id"
              (click)="chooseKind(option.id, option.template)"
              class="rounded-lg border px-2.5 py-1 text-xs font-semibold"
              [class]="kind() === option.id ? 'border-accent/50 bg-accent-soft text-accent' : 'border-border text-muted hover:text-fg'"
            >
              {{ option.label }}
            </button>
          }
        </div>
      }
      <div>
        <label [for]="'note-body-' + formId()" class="mb-1 block text-xs font-semibold text-muted">{{ settings().noteBodyLabel }}</label>
        <textarea
          [id]="'note-body-' + formId()"
          [value]="body()"
          (input)="body.set($any($event.target).value)"
          rows="8"
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
export class NoteFormComponent {
  private readonly store = inject(NotebookStore);
  readonly index = input.required<TopicIndex>();
  readonly topics = input.required<TopicOption[]>();
  readonly settings = input.required<NotebookSettings>();
  /** The note to edit; without it, a new note. */
  readonly note = input<Note>();
  readonly done = output<void>();

  protected readonly formId = computed(() => this.note()?.id ?? 'new');
  protected readonly kind = linkedSignal<NoteKind>(() => this.note()?.kind ?? 'note');
  protected readonly title = linkedSignal(() => this.note()?.title ?? '');
  protected readonly body = linkedSignal(() => this.note()?.body ?? '');
  protected readonly topic = linkedSignal(() => this.note()?.topic ?? 'general');
  protected readonly inputClass = INPUT;
  protected readonly primary = PRIMARY;
  protected readonly button = BUTTON;

  protected chooseKind(kind: NoteKind, template: string | undefined) {
    this.kind.set(kind);
    if (!this.body().trim() && template) this.body.set(template);
  }

  protected submit(event: Event) {
    event.preventDefault();
    if (!this.body().trim()) return;
    const note = this.note();
    this.store.saveNote({
      id: note?.id,
      track: this.index().track,
      title: this.title().trim() || 'Untitled note',
      body: this.body(),
      topic: this.topic(),
      kind: this.kind(),
      lesson: note?.lesson,
      problem: note?.problem,
    });
    this.done.emit();
  }
}

/** A note, with Edit and Delete. */
@Component({
  selector: 'app-note-card',
  imports: [NoteFormComponent, NoteIconComponent, AppHrefDirective, MarkdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (editing()) {
      <app-note-form [index]="index()" [topics]="topics()" [settings]="settings()" [note]="note()" (done)="editing.set(false)" />
    } @else {
      <div class="rounded-xl border border-border bg-surface p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <svg appNoteIcon class="size-4 text-accent"></svg>
              <h3 class="font-semibold text-fg">{{ note().title }}</h3>
              @if (kindLabel(); as label) {
                <span class="inline-flex rounded-md border px-1.5 py-px text-[11px] font-semibold" [class]="kindClasses()">{{ label }}</span>
              }
            </div>
            <p class="mt-0.5 text-xs text-muted">
              {{ topicLabel() }} · edited {{ date(note().updatedAt) }}
              @if (source(); as from) {
                · <a [appHref]="from.href" class="text-accent hover:underline">{{ from.label }}</a>
              }
            </p>
          </div>
          <div class="flex gap-2">
            <button type="button" [class]="button" (click)="editing.set(true)">Edit</button>
            <button type="button" [class]="button" (click)="remove()">Delete</button>
          </div>
        </div>
        <app-markdown class="mt-3" [markdown]="note().body" [basePath]="index().basePath" />
      </div>
    }
  `,
})
export class NoteCardComponent {
  private readonly store = inject(NotebookStore);
  readonly note = input.required<Note>();
  readonly index = input.required<TopicIndex>();
  readonly topics = input.required<TopicOption[]>();
  readonly settings = input.required<NotebookSettings>();
  readonly topicLabel = input.required<string>();

  protected readonly editing = signal(false);
  protected readonly button = BUTTON;
  protected readonly date = formatDate;
  protected readonly kindLabel = computed(() => {
    const kind = this.note().kind ?? 'note';
    return kind === 'note' ? null : (this.settings().noteKinds.find((option) => option.id === kind)?.label ?? kind);
  });
  protected readonly kindClasses = computed(() => NOTE_KIND_CLASSES[this.note().kind ?? 'note']);
  /** The lesson or problem the note was written on. */
  protected readonly source = computed(() => {
    const { lesson, problem } = this.note();
    const index = this.index();
    if (lesson) return { href: `${index.basePath}/${lesson}`, label: index.lessons[lesson]?.title ?? lesson };
    if (problem) return { href: `${index.basePath}/problems/${problem}`, label: index.problems[problem] ?? problem };
    return null;
  });

  protected remove() {
    if (window.confirm(`Delete the note “${this.note().title}”?`)) this.store.deleteNote(this.note().id);
  }
}

/** Saved code, with Copy and Delete. */
@Component({
  selector: 'app-snippet-card',
  imports: [CopyButtonComponent, AppHrefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block overflow-hidden rounded-xl border border-border bg-code' },
  template: `
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2">
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-fg">{{ snippet().title }}</p>
        <p class="text-xs text-muted">
          {{ snippet().language }} · {{ topicLabel() }} · saved {{ date(snippet().createdAt) }}
          @if (href(); as link) {
            · <a [appHref]="link" class="text-accent hover:underline">source</a>
          }
        </p>
      </div>
      <span class="flex items-center gap-1">
        <app-copy-button [text]="snippet().code" />
        <button
          type="button"
          class="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface-3 hover:text-danger"
          (click)="remove()"
        >
          Delete
        </button>
      </span>
    </div>
    <pre class="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed text-fg" tabindex="0"><code>{{ snippet().code }}</code></pre>
  `,
})
export class SnippetCardComponent {
  private readonly store = inject(NotebookStore);
  readonly snippet = input.required<Snippet>();
  readonly index = input.required<TopicIndex>();
  readonly topicLabel = input.required<string>();

  protected readonly date = formatDate;
  protected readonly href = computed(
    () => this.snippet().href ?? (this.snippet().lesson ? `${this.index().basePath}/${this.snippet().lesson}` : null),
  );

  protected remove() {
    if (window.confirm(`Delete the snippet “${this.snippet().title}”?`)) this.store.deleteSnippet(this.snippet().id);
  }
}

const STARTER_DIAGRAM = `flowchart LR
  A[Client]:::client --> B[Load balancer]:::lb
  B --> C[Service]:::svc
  C --> D[(Database)]:::db`;

/** Draws or edits a Mermaid diagram, with a preview. */
@Component({
  selector: 'app-diagram-form',
  imports: [TopicSelectComponent, MermaidDiagramComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <form (submit)="submit($event)" class="space-y-3 rounded-xl border border-accent/40 bg-surface p-4">
      <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <label [for]="'diagram-title-' + formId()" class="mb-1 block text-xs font-semibold text-muted">Title</label>
          <input
            [id]="'diagram-title-' + formId()"
            [value]="title()"
            (input)="title.set($any($event.target).value)"
            placeholder="e.g. Cache-aside read path"
            [class]="inputClass"
          />
        </div>
        <div>
          <span class="mb-1 block text-xs font-semibold text-muted" aria-hidden="true">Topic</span>
          <app-topic-select [topics]="topics()" [(value)]="topic" [selectId]="'diagram-topic-' + formId()" label="Diagram topic" />
        </div>
      </div>
      <div class="grid gap-3 lg:grid-cols-2">
        <div>
          <label [for]="'diagram-code-' + formId()" class="mb-1 block text-xs font-semibold text-muted">Diagram (Mermaid)</label>
          <textarea
            [id]="'diagram-code-' + formId()"
            [value]="code()"
            (input)="code.set($any($event.target).value)"
            rows="12"
            spellcheck="false"
            [class]="inputClass + ' font-mono'"
          ></textarea>
        </div>
        <div>
          <p class="mb-1 text-xs font-semibold text-muted">Preview</p>
          <app-mermaid-diagram [source]="preview()" [compact]="true" />
        </div>
      </div>
      <div class="flex gap-2">
        <button type="submit" [class]="primary">Save diagram</button>
        <button type="button" (click)="done.emit()" [class]="button">Cancel</button>
      </div>
    </form>
  `,
})
export class DiagramFormComponent {
  private readonly store = inject(NotebookStore);
  readonly index = input.required<TopicIndex>();
  readonly topics = input.required<TopicOption[]>();
  /** The diagram to edit; without it, a new one. */
  readonly snippet = input<Snippet>();
  readonly done = output<void>();

  protected readonly formId = computed(() => this.snippet()?.id ?? 'new');
  protected readonly title = linkedSignal(() => this.snippet()?.title ?? '');
  protected readonly code = linkedSignal(() => this.snippet()?.code ?? STARTER_DIAGRAM);
  protected readonly topic = linkedSignal(() => this.snippet()?.topic ?? 'general');
  /** The preview redraws once typing pauses. */
  protected readonly preview = linkedSignal(() => this.snippet()?.code ?? STARTER_DIAGRAM);
  protected readonly inputClass = INPUT;
  protected readonly primary = PRIMARY;
  protected readonly button = BUTTON;

  constructor() {
    effect((onCleanup) => {
      const code = this.code();
      const timer = setTimeout(() => this.preview.set(code), 500);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected submit(event: Event) {
    event.preventDefault();
    const code = this.code();
    if (!code.trim()) return;
    const title = this.title().trim() || 'Untitled diagram';
    const existing = this.snippet();
    if (existing) this.store.updateSnippet(existing.id, { title, code, topic: this.topic() });
    else this.store.addSnippet({ track: this.index().track, title, code, language: 'mermaid', topic: this.topic() });
    this.done.emit();
  }
}

/** A saved diagram, drawn, with Edit and Delete. */
@Component({
  selector: 'app-diagram-card',
  imports: [DiagramFormComponent, MermaidDiagramComponent, AppHrefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (editing()) {
      <app-diagram-form [index]="index()" [topics]="topics()" [snippet]="snippet()" (done)="editing.set(false)" />
    } @else {
      <div class="rounded-xl border border-border bg-surface p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <h3 class="font-semibold text-fg">{{ snippet().title }}</h3>
            <p class="text-xs text-muted">
              {{ topicLabel() }} · saved {{ date(snippet().createdAt) }}
              @if (href(); as link) {
                · <a [appHref]="link" class="text-accent hover:underline">source</a>
              }
            </p>
          </div>
          <div class="flex gap-2">
            <button type="button" [class]="button" (click)="editing.set(true)">Edit</button>
            <button type="button" [class]="button" (click)="remove()">Delete</button>
          </div>
        </div>
        <app-mermaid-diagram [source]="snippet().code" [title]="snippet().title" />
      </div>
    }
  `,
})
export class DiagramCardComponent {
  private readonly store = inject(NotebookStore);
  readonly snippet = input.required<Snippet>();
  readonly index = input.required<TopicIndex>();
  readonly topics = input.required<TopicOption[]>();
  readonly topicLabel = input.required<string>();

  protected readonly editing = signal(false);
  protected readonly button = BUTTON;
  protected readonly date = formatDate;
  protected readonly href = computed(
    () => this.snippet().href ?? (this.snippet().lesson ? `${this.index().basePath}/${this.snippet().lesson}` : null),
  );

  protected remove() {
    if (window.confirm(`Delete the diagram “${this.snippet().title}”?`)) this.store.deleteSnippet(this.snippet().id);
  }
}
