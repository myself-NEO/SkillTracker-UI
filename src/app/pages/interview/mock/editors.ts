import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { appendLine, arrow, isFlowchart, nodeIds, nextId, PALETTE, type PaletteItem, STARTER_DIAGRAM } from '@lib/diagrams/flowchart';
import { MarkdownComponent } from '../../../ui/markdown.component';
import { uniqueId } from '../../../widgets/page';
import { MermaidDiagramComponent } from '../../article/mermaid-diagram.component';

// The diagram editors of the mock interviews, ported from TheSWEguide's DiagramEditor.tsx (HLD:
// a Mermaid flowchart, with a palette of components and a helper to connect two) and UmlEditor.tsx
// (LLD: a class diagram in the lessons' ```uml notation). The text is the diagram, previewed as the
// learner types. The parent keeps the text: `[value]` in, `(valueChange)` out.

/** The preview follows the text once typing pauses this long. */
const PREVIEW_DELAY_MS = 500;

/** A preview that follows `source`: at once the first time, then once it stops changing for `delay` ms. */
const debouncedPreview = (source: () => string, delay: number) => {
  const preview = signal('');
  let first = true;
  effect((onCleanup) => {
    const value = source();
    if (first) {
      first = false;
      preview.set(value);
      return;
    }
    const timer = setTimeout(() => preview.set(value), delay);
    onCleanup(() => clearTimeout(timer));
  });
  return preview.asReadonly();
};

const TOOL =
  'inline-flex items-center rounded-md border border-border px-2 py-1 text-[11px] font-medium text-fg-soft hover:border-accent/50 hover:text-fg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-soft';
const FIELD = 'rounded-md border border-border bg-bg px-2 py-1 text-xs text-fg focus:ring-2 focus:ring-accent focus:outline-hidden';

/** The HLD architecture diagram: Mermaid source with a component palette, a connect helper and a preview. */
@Component({
  selector: 'app-diagram-editor',
  imports: [MermaidDiagramComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid gap-4 lg:grid-cols-2' },
  template: `
    <div class="min-w-0 space-y-2">
      <label [for]="id + '-source'" class="block text-sm font-semibold text-fg">{{ label() }}</label>
      <div class="flex flex-wrap gap-1" role="group" aria-label="Insert a component">
        @for (item of palette; track item.label) {
          <button type="button" [class]="tool" (click)="insert(item)" [disabled]="!flowchart() && value().trim() !== ''">
            + {{ item.label }}
          </button>
        }
      </div>
      <textarea
        #source
        [id]="id + '-source'"
        [value]="value()"
        (input)="valueChange.emit($any($event.target).value)"
        [rows]="rows()"
        spellcheck="false"
        [placeholder]="starter"
        class="w-full rounded-lg border border-border bg-bg px-3 py-2.5 font-mono text-[13px] leading-relaxed text-fg placeholder:text-faint focus:ring-2 focus:ring-accent focus:outline-hidden"
      ></textarea>
      @if (flowchart() && ids().length >= 2) {
        <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Connect two components">
          <span class="text-[11px] font-semibold text-muted">Connect</span>
          <label class="sr-only" [for]="id + '-from'">From</label>
          <select [id]="id + '-from'" [value]="from()" (change)="from.set($any($event.target).value)" [class]="field">
            <option value="">from…</option>
            @for (node of ids(); track node) {
              <option [value]="node">{{ node }}</option>
            }
          </select>
          <span class="text-xs text-muted" aria-hidden="true">→</span>
          <label class="sr-only" [for]="id + '-to'">To</label>
          <select [id]="id + '-to'" [value]="to()" (change)="to.set($any($event.target).value)" [class]="field">
            <option value="">to…</option>
            @for (node of ids(); track node) {
              <option [value]="node">{{ node }}</option>
            }
          </select>
          <label class="sr-only" [for]="id + '-label'">Arrow label</label>
          <input
            [id]="id + '-label'"
            [value]="edgeLabel()"
            (input)="edgeLabel.set($any($event.target).value)"
            placeholder="label (optional)"
            [class]="field + ' w-36'"
          />
          <button type="button" [class]="tool" [disabled]="!from() || !to()" (click)="connect()">Add arrow</button>
        </div>
      }
      <p class="text-[11px] text-muted">
        Mermaid syntax: <code>A --&gt; B</code>, <code>A --&gt;|label| B</code>, shapes <code>[box]</code>
        <code>[(store)]</code> <code>[[queue]]</code>. A <code>sequenceDiagram</code> works too.
      </p>
    </div>
    <div class="min-w-0" aria-live="polite">
      <p class="mb-2 text-sm font-semibold text-fg">Preview</p>
      @if (preview().trim()) {
        <app-mermaid-diagram [source]="preview()" [compact]="true" (rendered)="error.set($event)" />
        @if (error()) {
          <p class="mt-2 text-xs text-warning">Fix the syntax and the preview updates.</p>
        }
      } @else {
        <div class="rounded-xl border border-dashed border-border px-4 py-10 text-center text-xs text-muted">
          Insert a component or type a diagram to see it here.
        </div>
      }
    </div>
  `,
})
export class DiagramEditorComponent {
  private readonly injector = inject(Injector);
  private readonly source = viewChild.required<ElementRef<HTMLTextAreaElement>>('source');

  readonly value = input.required<string>();
  readonly label = input.required<string>();
  readonly rows = input(12);
  readonly valueChange = output<string>();

  protected readonly id = uniqueId('diagram');
  protected readonly palette = PALETTE;
  protected readonly starter = STARTER_DIAGRAM;
  protected readonly tool = TOOL;
  protected readonly field = FIELD;
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly edgeLabel = signal('');
  /** Why the preview couldn't be drawn, if it couldn't. */
  protected readonly error = signal<string | null>(null);
  protected readonly ids = computed(() => nodeIds(this.value()));
  protected readonly flowchart = computed(() => isFlowchart(this.value()));
  protected readonly preview = debouncedPreview(() => this.value(), PREVIEW_DELAY_MS);

  protected insert(item: PaletteItem) {
    this.append(item.shape(nextId(this.value(), item.prefix), item.label));
  }

  protected connect() {
    this.append(arrow(this.from(), this.to(), this.edgeLabel()));
    this.edgeLabel.set('');
  }

  private append(line: string) {
    this.valueChange.emit(appendLine(this.value(), line));
    afterNextRender(() => this.source().nativeElement.focus(), { injector: this.injector });
  }
}

const UML_PLACEHOLDER = `class ParkingLot
  - levels: List<Level>
  + park(v: Vehicle): Ticket
interface PricingStrategy
  + fee(t: Ticket, exit: Instant): long
class HourlyPricing
HourlyPricing ..|> PricingStrategy
ParkingLot *-- "1..*" Level : owns
ParkingLot --> PricingStrategy : delegates fees`;

const UML_SYNTAX: [string, string][] = [
  ['class Name', 'also: abstract class, interface, enum, record'],
  ['  - field: Type', 'indented members; + public, - private, # protected'],
  ['  + method(arg: Type): Return', 'a member with ( ) is a method'],
  ['A --|> B', 'A extends B'],
  ['A ..|> B', 'A implements B'],
  ['A *-- "1..*" B : label', 'composition (A owns B), optional multiplicity and label'],
  ['A o-- B', 'aggregation (B can exist without A)'],
  ['A --> B', 'association (A holds a B)'],
  ['A ..> B', 'dependency (A uses B transiently)'],
];

/** A ```uml block of the source, its fence longer than any run of backticks in it. */
const umlBlock = (source: string) => {
  const longest = Math.max(0, ...(source.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(Math.max(3, longest + 1));
  return `${fence}uml title="Preview"\n${source}\n${fence}`;
};

/** The LLD class diagram: the lessons' class-diagram notation, previewed as the learner types. */
@Component({
  selector: 'app-uml-editor',
  imports: [MarkdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-xl border border-accent/30 bg-surface p-4' },
  template: `
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="min-w-0">
        <label [for]="id + '-source'" class="mb-1.5 block text-sm font-semibold text-fg">{{ label() }}</label>
        <textarea
          [id]="id + '-source'"
          [value]="value()"
          (input)="valueChange.emit($any($event.target).value)"
          [rows]="rows()"
          spellcheck="false"
          [placeholder]="placeholder"
          [attr.aria-describedby]="id + '-help'"
          class="w-full rounded-lg border border-border bg-bg px-3 py-2.5 font-mono text-[13px] leading-5 text-fg placeholder:text-faint focus:ring-2 focus:ring-accent focus:outline-hidden"
        ></textarea>
        <details [id]="id + '-help'" class="mt-2 text-xs text-muted">
          <summary
            class="cursor-pointer rounded font-semibold text-fg-soft hover:text-fg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
          >
            Diagram syntax
          </summary>
          <dl class="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
            @for (row of syntax; track row[0]) {
              <dt class="font-mono whitespace-pre text-accent">{{ row[0] }}</dt>
              <dd>{{ row[1] }}</dd>
            }
          </dl>
        </details>
      </div>
      <div class="min-w-0 [&_figure]:my-0!" aria-live="off">
        <!-- The diagram's own subheadings are h4s; this keeps the outline in order under the phase's h2. -->
        <h3 class="sr-only">Preview of your class diagram</h3>
        @if (preview().trim()) {
          <app-markdown [markdown]="previewMarkdown()" />
        } @else {
          <div
            class="flex h-full min-h-40 items-center justify-center rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted"
          >
            Your class diagram appears here as you type.
          </div>
        }
      </div>
    </div>
  `,
})
export class UmlEditorComponent {
  readonly value = input.required<string>();
  readonly label = input.required<string>();
  readonly rows = input(14);
  readonly valueChange = output<string>();

  protected readonly id = uniqueId('uml');
  protected readonly placeholder = UML_PLACEHOLDER;
  protected readonly syntax = UML_SYNTAX;
  protected readonly preview = debouncedPreview(() => this.value(), 400);
  protected readonly previewMarkdown = computed(() => umlBlock(this.preview()));
}
