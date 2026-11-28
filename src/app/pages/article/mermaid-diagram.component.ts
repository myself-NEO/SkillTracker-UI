import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { copyText } from '@lib/clipboard';
import { diagramType, MERMAID_STEP_COLOR, MERMAID_THEME_VARIABLES, prepareSource, type Theme } from '@lib/diagrams/mermaid';
import { ThemeService } from '../../core/theme.service';

// Mermaid diagrams (```mermaid title="…" in lessons and notes), ported from TheSWEguide's MermaidDiagram.tsx.
// Mermaid is a large library and drawing a diagram takes a while, so it is imported on first use,
// and each diagram is drawn only once it comes within 1,200 pixels of the viewport. Diagrams are
// drawn again in the other theme's colours when the reader switches.
// Sequence diagrams (and flowcharts whose edge labels start with "1.", "2." …) can be stepped
// through one message at a time.

type MermaidApi = (typeof import('mermaid'))['default'];

let mermaidPromise: Promise<MermaidApi> | null = null;

const loadMermaid = () => {
  mermaidPromise ??= import('mermaid')
    .then(({ default: mermaid }) => mermaid)
    .catch((error: unknown) => {
      mermaidPromise = null; // let a later diagram try again
      throw error;
    });
  return mermaidPromise;
};

/** Renders one diagram in the given theme. Mermaid's configuration is global, so it is set before every render. */
const renderDiagram = async (id: string, source: string, theme: Theme) => {
  const mermaid = await loadMermaid();
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: 'Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif',
    themeVariables: { ...MERMAID_THEME_VARIABLES[theme], fontSize: '14px' },
    flowchart: { curve: 'basis', padding: 12 },
    sequence: { mirrorActors: false, showSequenceNumbers: false },
  });
  await mermaid.parse(source);
  return (await mermaid.render(id, source)).svg;
};

interface Step {
  elements: Element[];
  label: string;
}

/** The message-by-message walk through a rendered diagram, when its structure allows one. */
const collectSteps = (svg: SVGSVGElement, type: string): Step[] => {
  if (type === 'sequenceDiagram') {
    const texts = Array.from(svg.querySelectorAll('.messageText'));
    const lines = Array.from(svg.querySelectorAll('.messageLine0, .messageLine1'));
    if (texts.length < 2 || texts.length !== lines.length) return [];
    const numbers = Array.from(svg.querySelectorAll('.sequenceNumber'));
    return texts.map((text, i) => ({
      elements: [text, lines[i], ...(numbers.length === texts.length ? [numbers[i]] : [])],
      label: (text.textContent ?? '').trim(),
    }));
  }
  if (type === 'flowchart' || type === 'graph') {
    const labels = Array.from(svg.querySelectorAll('.edgeLabels .edgeLabel'));
    const paths = Array.from(new Set(svg.querySelectorAll('.edgePaths path, path.flowchart-link')));
    if (labels.length === 0 || labels.length !== paths.length) return [];
    const numbered = labels
      .map((label, i) => ({ text: (label.textContent ?? '').trim(), i }))
      .map((label) => ({ ...label, n: Number(label.text.match(/^(\d+)[.)]?\s/)?.[1]) }))
      .filter((label) => Number.isFinite(label.n))
      .sort((a, b) => a.n - b.n);
    if (numbered.length < 2) return [];
    return numbered.map((label) => ({ elements: [labels[label.i], paths[label.i]], label: label.text }));
  }
  return [];
};

let renderCounter = 0;

type RenderState = { status: 'loading' } | { status: 'ready'; svg: string } | { status: 'error'; message: string };

@Component({
  selector: 'app-mermaid-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './mermaid-diagram.component.html',
})
export class MermaidDiagramComponent {
  private readonly theme = inject(ThemeService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly holder = viewChild.required<ElementRef<HTMLElement>>('holder');
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly dialogHolder = viewChild.required<ElementRef<HTMLElement>>('dialogHolder');

  readonly source = input.required<string>();
  readonly title = input<string>();
  /** Without the toolbar, e.g. a preview beside the editor. */
  readonly compact = input(false);
  /** Saves the diagram to the learner's notebook; without it there is no Save button. */
  readonly save = input<(source: string, title: string | undefined) => void>();

  protected readonly type = computed(() => diagramType(this.source()));
  protected readonly label = computed(
    () => this.title() ?? (this.type() === 'sequenceDiagram' ? 'Request flow' : 'Architecture diagram'),
  );
  protected readonly state = signal<RenderState>({ status: 'loading' });
  protected readonly showText = signal(false);
  protected readonly copied = signal(false);
  protected readonly saved = signal(false);
  protected readonly steps = signal<Step[]>([]);
  protected readonly current = signal(-1);
  protected readonly zoom = signal(1);
  protected readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));
  protected readonly trimmed = computed(() => this.source().trim());
  private readonly near = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Draw only once the diagram comes within 1,200px of the viewport.
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        this.near.set(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.near.set(true);
            observer.disconnect();
          }
        },
        { rootMargin: '1200px 0px' },
      );
      observer.observe(this.host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });

    effect((onCleanup) => {
      if (!this.near()) return;
      const source = this.trimmed();
      const theme = this.theme.theme();
      let cancelled = false;
      onCleanup(() => (cancelled = true));
      const id = `mmd-${++renderCounter}`;
      renderDiagram(id, prepareSource(source, theme), theme)
        .then((svg) => {
          if (!cancelled) this.state.set({ status: 'ready', svg });
        })
        .catch((error: unknown) => {
          // A failed render can leave Mermaid's scratch element behind.
          document.getElementById(id)?.remove();
          document.getElementById(`d${id}`)?.remove();
          if (!cancelled) this.state.set({ status: 'error', message: error instanceof Error ? error.message : String(error) });
        });
    });

    // Put the SVG in place, and work out the steps once it is in the document.
    afterRenderEffect(() => {
      const state = this.state();
      if (state.status !== 'ready') return;
      const holder = this.holder().nativeElement;
      holder.innerHTML = state.svg; // Mermaid's own output, sanitized by it (securityLevel: 'strict')
      const svg = holder.querySelector('svg');
      if (!svg) return;
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', untracked(() => this.label()));
      // Keep text readable on small screens: scroll sideways rather than shrink below ~560px.
      const natural = svg.viewBox.baseVal?.width ?? 0;
      if (natural > 0) svg.style.minWidth = `${Math.min(natural, 560)}px`;
      const steps = collectSteps(svg, untracked(() => this.type()));
      untracked(() => {
        this.steps.set(steps);
        this.current.set(-1);
      });
    });

    // Highlight the step being shown, and fade the ones after it.
    afterRenderEffect(() => {
      const steps = this.steps();
      const current = this.current();
      const color = MERMAID_STEP_COLOR[this.theme.theme()];
      steps.forEach((step, i) => {
        for (const element of step.elements) {
          const node = element as SVGElement | HTMLElement;
          node.style.transition = 'opacity 150ms';
          node.style.opacity = current < 0 || i <= current ? '1' : '0.12';
          if (node instanceof SVGElement && node.tagName !== 'text' && node.tagName !== 'g') {
            node.style.stroke = current >= 0 && i === current ? color : '';
            node.style.strokeWidth = current >= 0 && i === current ? '2.5px' : '';
          } else {
            node.style.fontWeight = current >= 0 && i === current ? '700' : '';
          }
        }
      });
    });

    // The expanded view's zoom.
    afterRenderEffect(() => {
      const zoom = this.zoom();
      const svg = this.dialogHolder().nativeElement.querySelector('svg');
      if (!svg) return;
      const natural = svg.viewBox.baseVal?.width ?? 0;
      svg.style.maxWidth = 'none';
      svg.style.width = natural > 0 ? `${natural * zoom}px` : `${zoom * 100}%`;
    });
  }

  protected step(offset: number) {
    this.current.update((current) => Math.min(this.steps().length - 1, Math.max(0, current + offset)));
  }

  protected openExpanded() {
    const state = this.state();
    if (state.status !== 'ready') return;
    this.zoom.set(1);
    this.dialog().nativeElement.showModal();
    const holder = this.dialogHolder().nativeElement;
    holder.innerHTML = state.svg;
    const svg = holder.querySelector('svg');
    if (svg) {
      svg.removeAttribute('role');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.maxWidth = 'none';
    }
  }

  protected closeExpanded() {
    this.dialog().nativeElement.close();
  }

  /** A click on the backdrop (the dialog element itself, outside its content) closes it. */
  protected onDialogClick(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement) this.closeExpanded();
  }

  protected saveDiagram() {
    const save = this.save();
    if (!save) return;
    save(this.trimmed(), this.title());
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }

  protected async copySource() {
    try {
      await copyText(this.trimmed());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.copied.set(false);
    }
  }
}
