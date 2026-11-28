import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { type RevisionItem, revisionItems, type TopicIndex } from '@lib/notebook/revision';
import type { NotebookSettings } from '@lib/notebook/settings';
import type { SavedItem } from '@lib/progress/notebook';
import { InterviewsStore } from '../../core/interviews.store';
import { NotebookStore } from '../../core/notebook.store';
import { ProgressStore } from '../../core/progress.store';
import { BookmarkIconComponent, SearchIconComponent } from '../../ui/icons';
import { AppHrefDirective } from '../../ui/app-href.directive';
import {
  BUTTON,
  DiagramCardComponent,
  DiagramFormComponent,
  formatDate,
  INPUT,
  matches,
  NoteCardComponent,
  NoteFormComponent,
  PRIMARY,
  QuestionCardComponent,
  SnippetCardComponent,
  type TopicOption,
  TopicSelectComponent,
} from './notebook-parts';

type Tab = 'revision' | 'saved' | 'questions' | 'notes' | 'code' | 'diagrams';

const REVISION_KIND: Record<RevisionItem['kind'], { label: string; classes: string }> = {
  lesson: { label: 'Difficult lesson', classes: 'border-warning/30 bg-warning-soft text-warning' },
  problem: { label: 'Problem to revisit', classes: 'border-insight/30 bg-insight-soft text-insight' },
  question: { label: 'Interview question', classes: 'border-info/30 bg-info-soft text-info' },
  quiz: { label: 'Quiz mistake', classes: 'border-danger/30 bg-danger-soft text-danger' },
  mock: { label: 'Mock interview gap', classes: 'border-info/30 bg-info-soft text-info' },
};

/**
 * A topic's revision notebook: the revision list, saved lessons, sections and questions, notes,
 * code snippets and diagrams, with search and a topic filter. Ported from TheSWEguide's
 * components/notebook/Notebook.tsx; it reads the notebook, progress and interviews stores.
 */
@Component({
  selector: 'app-notebook',
  imports: [
    AppHrefDirective,
    BookmarkIconComponent,
    SearchIconComponent,
    TopicSelectComponent,
    QuestionCardComponent,
    NoteFormComponent,
    NoteCardComponent,
    SnippetCardComponent,
    DiagramFormComponent,
    DiagramCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './notebook.component.html',
})
export class NotebookComponent {
  protected readonly store = inject(NotebookStore);
  private readonly progress = inject(ProgressStore);
  private readonly interviews = inject(InterviewsStore);

  readonly index = input.required<TopicIndex>();
  readonly topics = input.required<TopicOption[]>();
  readonly settings = input.required<NotebookSettings>();

  protected readonly tab = signal<Tab>('revision');
  protected readonly query = signal('');
  protected readonly topic = signal('all');
  protected readonly showReviewed = signal(false);
  protected readonly composing = signal(false);

  protected readonly button = BUTTON;
  protected readonly inputClass = INPUT;
  protected readonly primary = PRIMARY;
  protected readonly kinds = REVISION_KIND;
  protected readonly date = formatDate;

  protected readonly filtered = computed(() => this.query() !== '' || this.topic() !== 'all');

  private topicOk(id: string | undefined) {
    const topic = this.topic();
    return topic === 'all' || id === topic || (topic === 'general' && !id);
  }

  private mine<T extends { track: string }>(values: T[]) {
    return values.filter((value) => value.track === this.index().track);
  }

  protected readonly revision = computed(() =>
    revisionItems(this.index(), this.store.notebook(), this.progress.progress(), this.interviews.state()).filter(
      (item) => this.topicOk(item.topic) && matches(this.query(), item.title, item.context),
    ),
  );
  protected readonly revisionShown = computed(() => this.revision().filter((item) => this.showReviewed() || item.due));
  protected readonly saved = computed(() =>
    this.mine(Object.values(this.store.notebook().saved))
      .filter((item) => item.kind !== 'question' && this.topicOk(item.topic) && matches(this.query(), item.title, item.context))
      .sort((a, b) => b.at - a.at),
  );
  protected readonly questions = computed(() =>
    this.mine(Object.values(this.store.notebook().saved))
      .filter(
        (item) =>
          item.kind === 'question' && this.topicOk(item.topic) && matches(this.query(), item.title, item.context, item.body),
      )
      .sort((a, b) => b.at - a.at),
  );
  protected readonly notes = computed(() =>
    this.mine(Object.values(this.store.notebook().notes))
      .filter((note) => this.topicOk(note.topic) && matches(this.query(), note.title, note.body))
      .sort((a, b) => b.updatedAt - a.updatedAt),
  );
  private readonly snippets = computed(() =>
    this.mine(Object.values(this.store.notebook().snippets)).filter(
      (snippet) => this.topicOk(snippet.topic) && matches(this.query(), snippet.title, snippet.code),
    ),
  );
  protected readonly code = computed(() =>
    this.snippets()
      .filter((snippet) => snippet.language !== 'mermaid')
      .sort((a, b) => b.createdAt - a.createdAt),
  );
  protected readonly diagrams = computed(() =>
    this.snippets()
      .filter((snippet) => snippet.language === 'mermaid')
      .sort((a, b) => b.createdAt - a.createdAt),
  );

  protected readonly tabs = computed(() => {
    const tabs: { id: Tab; label: string; count: number }[] = [
      { id: 'revision', label: 'Revision list', count: this.revision().filter((item) => item.due).length },
      { id: 'saved', label: 'Saved', count: this.saved().length },
      { id: 'questions', label: 'Questions', count: this.questions().length },
      { id: 'notes', label: this.settings().noteKinds.length > 1 ? 'Notes & trade-offs' : 'Notes', count: this.notes().length },
      { id: 'code', label: 'Code', count: this.code().length },
    ];
    if (this.settings().diagrams || this.diagrams().length > 0) {
      tabs.push({ id: 'diagrams', label: 'Diagrams', count: this.diagrams().length });
    }
    return tabs;
  });

  protected topicLabel(id: string | undefined) {
    return this.topics().find((option) => option.id === id)?.label ?? 'General';
  }

  protected select(next: Tab) {
    this.tab.set(next);
    this.composing.set(false);
  }

  /** Arrow keys, Home and End move between tabs (ARIA tabs pattern). */
  protected onTabKeys(event: KeyboardEvent) {
    const tabs = this.tabs();
    const at = tabs.findIndex((item) => item.id === this.tab());
    const to = ({ ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 } as Record<string, number | undefined>)[
      event.key
    ];
    if (to === undefined) return;
    event.preventDefault();
    const next = tabs[(to + tabs.length) % tabs.length].id;
    this.select(next);
    document.getElementById(`notebook-tab-${next}`)?.focus();
  }

  protected savedHref(item: SavedItem) {
    return item.href ?? `${this.index().basePath}/${item.ref}`;
  }

  protected removeFlag(item: RevisionItem) {
    if (!item.flag) return;
    const track = this.index().track;
    if (item.flag.type === 'difficult') this.store.toggleDifficult(track, item.flag.ref, false);
    else this.store.toggleRevise(track, item.flag.ref, false);
  }
}
