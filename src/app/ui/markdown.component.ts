import {
  afterRenderEffect,
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  type ComponentRef,
  createComponent,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injector,
  input,
  inputBinding,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MermaidDiagramComponent } from '../pages/article/mermaid-diagram.component';
import { routeLinkClick } from './app-links';

type Renderer = typeof import('@lib/markdown/client');

let rendererPromise: Promise<Renderer> | null = null;

/** The Markdown parser is sizeable, so it loads with the first note shown. */
const loadRenderer = () => {
  rendererPromise ??= import('@lib/markdown/client').catch((error: unknown) => {
    rendererPromise = null; // let a later note try again
    throw error;
  });
  return rendererPromise;
};

/** TheSWEguide's ClientMarkdown typography. */
const PROSE =
  'prose prose-sm max-w-none [overflow-wrap:break-word] prose-code:rounded prose-code:bg-surface-2 prose-code:px-1 ' +
  'prose-code:py-px prose-code:font-normal prose-code:before:content-none prose-code:after:content-none';

/**
 * Markdown the learner wrote or saved (notes, model answers) in the lessons' dialect, with Mermaid
 * diagrams drawn. lib/markdown/client.ts builds the page elements, and never uses the text as HTML.
 * Links to pages of this app go through the router.
 */
@Component({
  selector: 'app-markdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `<div #body [class]="prose" (click)="onClick($event)"></div>`,
})
export class MarkdownComponent {
  private readonly router = inject(Router);
  private readonly appRef = inject(ApplicationRef);
  private readonly environment = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');
  private diagrams: ComponentRef<MermaidDiagramComponent>[] = [];
  private renders = 0;

  readonly markdown = input.required<string>();
  /** The track's route prefix (e.g. "/java"), for `lesson:` and `problem:` links. */
  readonly basePath = input('');

  protected readonly prose = PROSE;

  constructor() {
    afterRenderEffect(() => {
      const markdown = this.markdown();
      const basePath = this.basePath();
      untracked(() => void this.render(markdown, basePath));
    });
    inject(DestroyRef).onDestroy(() => {
      this.renders++;
      this.clearDiagrams();
    });
  }

  private async render(markdown: string, basePath: string) {
    const render = ++this.renders;
    const body = this.body().nativeElement;
    let renderer: Renderer | null = null;
    try {
      renderer = await loadRenderer();
    } catch {
      // Offline, or a new version was deployed: the text still shows.
    }
    if (render !== this.renders) return; // changed or destroyed meanwhile
    this.clearDiagrams();
    try {
      if (!renderer) throw new Error('The Markdown renderer did not load');
      body.replaceChildren(
        renderer.renderMarkdown(markdown, document, {
          basePath,
          mermaid: (host, source, title) => this.mountDiagram(host, source, title),
        }),
      );
    } catch {
      this.clearDiagrams();
      const plain = document.createElement('p');
      plain.className = 'whitespace-pre-wrap';
      plain.textContent = markdown;
      body.replaceChildren(plain);
    }
  }

  private mountDiagram(hostElement: HTMLElement, source: string, title: string | undefined) {
    const ref = createComponent(MermaidDiagramComponent, {
      environmentInjector: this.environment,
      elementInjector: this.injector,
      hostElement,
      bindings: [inputBinding('source', () => source), inputBinding('title', () => title)],
    });
    this.appRef.attachView(ref.hostView);
    this.diagrams.push(ref);
  }

  private clearDiagrams() {
    for (const ref of this.diagrams) {
      this.appRef.detachView(ref.hostView);
      ref.destroy();
    }
    this.diagrams = [];
  }

  protected onClick(event: MouseEvent) {
    routeLinkClick(event, this.router);
  }
}
