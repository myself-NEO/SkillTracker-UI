import {
  afterRenderEffect,
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  createComponent,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injector,
  input,
  inputBinding,
  NgZone,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { copyText } from '@lib/clipboard';
import type { ContentDoc, Widget } from '@lib/content/doc';
import { ProgressStore } from '../../core/progress.store';
import { ChecklistComponent } from '../../widgets/checklist.component';
import { DrillComponent } from '../../widgets/drill.component';
import { EstimatorComponent } from '../../widgets/estimator.component';
import type { BodyPage } from '../../widgets/page';
import { QuizComponent } from '../../widgets/quiz.component';
import { MermaidDiagramComponent } from './mermaid-diagram.component';
import { WidgetSoonComponent } from './widget-soon.component';

export type { BodyPage };

/** Article typography (TheSWEguide's Markdown.tsx). Colours come from the theme tokens (.prose in styles.css). */
const PROSE = [
  'prose max-w-none [overflow-wrap:break-word]',
  'prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight',
  'prose-h1:mt-16 prose-h1:mb-6 prose-h1:text-3xl',
  'prose-h2:mt-14 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:text-[1.6rem]',
  'prose-h3:mt-10 prose-h3:text-xl prose-h4:text-base',
  'prose-strong:font-semibold',
  'prose-a:font-medium prose-a:decoration-accent/40 prose-a:underline-offset-[3px] hover:prose-a:decoration-accent',
  'prose-code:rounded-md prose-code:border prose-code:border-border prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-px prose-code:text-[0.86em] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none',
  'prose-thead:bg-surface-2 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-td:px-3 prose-td:py-2',
  'prose-blockquote:font-normal prose-blockquote:not-italic prose-img:rounded-xl',
].join(' ');

/**
 * The body of a lesson, problem or cheat sheet: the HTML the content build made (highlighted code,
 * callouts, diagrams, collapsed blocks), with the interactive parts mounted into its placeholders.
 *
 * The HTML is trusted: it is this app's own build output, served from this app's origin, never
 * anything a user typed. It is set as is, so Shiki's inline colours and the build's markup survive.
 *
 * Clicks are handled for the whole body at once: copy buttons, and links to pages of this app or to
 * sections of this page, which go through the router instead of reloading the app.
 */
@Component({
  selector: 'app-lesson-body',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `<div #body [class]="prose" (click)="onClick($event)"></div>`,
})
export class LessonBodyComponent {
  private readonly router = inject(Router);
  private readonly store = inject(ProgressStore);
  private readonly appRef = inject(ApplicationRef);
  private readonly environment = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');
  private widgets: ComponentRef<unknown>[] = [];
  private readonly copyTimers = new WeakMap<Element, ReturnType<typeof setTimeout>>();

  readonly doc = input.required<ContentDoc>();
  readonly page = input.required<BodyPage>();

  protected readonly prose = PROSE;

  constructor() {
    afterRenderEffect(() => {
      const doc = this.doc();
      untracked(() => this.render(doc));
    });

    // Hint and solution openings. `toggle` doesn't bubble, so it is caught on its way down.
    const zone = inject(NgZone);
    const onToggle = (event: Event) => {
      const details = event.target as HTMLDetailsElement;
      const kind = details.dataset?.['reveal'];
      const page = this.page();
      if (details.open && page.kind === 'problem' && (kind === 'hint' || kind === 'solution')) {
        zone.run(() => this.store.markProblemStarted(page.track, page.slug));
      }
    };
    let listening: HTMLElement | null = null;
    afterRenderEffect(() => {
      const element = this.body().nativeElement;
      if (listening === element) return;
      listening = element;
      zone.runOutsideAngular(() => element.addEventListener('toggle', onToggle, true));
    });

    inject(DestroyRef).onDestroy(() => {
      listening?.removeEventListener('toggle', onToggle, true);
      this.clearWidgets();
    });
  }

  private render(doc: ContentDoc) {
    this.clearWidgets();
    const root = this.body().nativeElement;
    root.innerHTML = doc.html;
    for (const host of Array.from(root.querySelectorAll<HTMLElement>('[data-w]'))) {
      const widget = doc.widgets[Number(host.dataset['w'])];
      if (!widget) continue;
      const ref = this.mount(widget, host);
      this.appRef.attachView(ref.hostView);
      this.widgets.push(ref);
    }
  }

  /** Creates the component of a widget in its placeholder (which becomes the component's host). */
  private mount(widget: Widget, hostElement: HTMLElement): ComponentRef<unknown> {
    const options = { environmentInjector: this.environment, elementInjector: this.injector, hostElement };
    const page = inputBinding('page', () => this.page());
    switch (widget.type) {
      case 'mermaid':
        return createComponent(MermaidDiagramComponent, {
          ...options,
          bindings: [inputBinding('source', () => widget.source), inputBinding('title', () => widget.title)],
        });
      case 'quiz':
        return createComponent(QuizComponent, { ...options, bindings: [inputBinding('widget', () => widget), page] });
      case 'drill':
        return createComponent(DrillComponent, { ...options, bindings: [inputBinding('widget', () => widget), page] });
      case 'checklist':
        return createComponent(ChecklistComponent, { ...options, bindings: [inputBinding('widget', () => widget), page] });
      case 'estimator':
        return createComponent(EstimatorComponent, {
          ...options,
          bindings: [inputBinding('title', () => widget.title), inputBinding('preset', () => widget.preset)],
        });
      default:
        // Animations arrive with the animation engine (docs/plan.md, Phase 4b).
        return createComponent(WidgetSoonComponent, { ...options, bindings: [inputBinding('kind', () => widget.type)] });
    }
  }

  private clearWidgets() {
    for (const ref of this.widgets) {
      this.appRef.detachView(ref.hostView);
      ref.destroy();
    }
    this.widgets = [];
  }

  protected onClick(event: MouseEvent) {
    const target = event.target as Element | null;
    const copy = target?.closest<HTMLButtonElement>('button[data-action="copy"]');
    if (copy) {
      void this.copyCode(copy);
      return;
    }
    const link = target?.closest<HTMLAnchorElement>('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (link.target && link.target !== '_self') return; // other sites open in a new tab
    const href = link.getAttribute('href') ?? '';
    if (href.startsWith('#') && href.length > 1) {
      // A section of this page. (With <base href="/">, the browser would otherwise leave the page.)
      event.preventDefault();
      const url = this.router.parseUrl(this.router.url);
      url.fragment = decodeURIComponent(href.slice(1));
      void this.router.navigateByUrl(url);
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      // Another page of this app.
      event.preventDefault();
      void this.router.navigateByUrl(href);
    }
  }

  /** Copies a code block's text; the button says how it went for two seconds. */
  private async copyCode(button: HTMLButtonElement) {
    const code = button.closest('[data-code]')?.querySelector('.code-block pre');
    const label = button.querySelector('[aria-live]');
    let outcome = 'Copied!';
    try {
      await copyText(code?.textContent ?? '');
      button.setAttribute('aria-label', 'Code copied');
    } catch {
      outcome = 'Copy failed';
    }
    if (label) label.textContent = outcome;
    clearTimeout(this.copyTimers.get(button));
    this.copyTimers.set(
      button,
      setTimeout(() => {
        if (label) label.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code');
      }, 2000),
    );
  }
}
