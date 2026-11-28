import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { ContentDoc } from '@lib/content/doc';
import { NotebookStore } from '../../core/notebook.store';
import { ProgressStore } from '../../core/progress.store';
import { StateSync } from '../../core/state-sync.service';
import { AuthService } from '../../services/auth.service';
import { type BodyPage, LessonBodyComponent } from './lesson-body.component';


/** These tests are about the widgets, not about saving to the account. */
const NO_SYNC = { provide: StateSync, useValue: { register: () => {}, changed: () => {} } };
const DOC: ContentDoc = {
  v: 1,
  toc: [{ id: 'intro', text: 'Intro', depth: 2 }],
  html:
    '<h2 id="intro">Intro</h2>' +
    '<p><a href="/java/records">Records</a> and <a href="#intro">this section</a> and ' +
    '<a href="https://example.com" target="_blank" rel="noopener noreferrer">elsewhere</a></p>' +
    '<div data-code="java"><div><button type="button" data-action="copy" aria-label="Copy code"><span aria-live="polite">Copy</span></button></div>' +
    '<div class="code-block"><pre><code>int x = 1;</code></pre></div></div>' +
    '<details data-reveal="hint"><summary>Hint</summary><div>Try a map.</div></details>' +
    '<div data-w="0"></div>',
  widgets: [{ type: 'checklist', title: 'Before you submit', items: [{ text: 'Tests', html: 'Tests' }] }],
  questions: {},
};

@Component({
  imports: [LessonBodyComponent],
  template: `<app-lesson-body [doc]="doc()" [page]="page()" />`,
})
class HostComponent {
  readonly doc = signal(DOC);
  readonly page = signal<BodyPage>({ track: 'java', kind: 'problem', slug: 'immutable-class' });
}

describe('LessonBodyComponent', () => {
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { userId: signal('user-1') } }, NO_SYNC],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  const render = async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('shows the built HTML and mounts the widgets in their placeholders', async () => {
    const element = await render();
    expect(element.querySelector('h2#intro')?.textContent).toBe('Intro');
    expect(element.querySelector('[data-w="0"]')?.textContent).toContain('0 / 1 covered');
  });

  it('opens links to this app through the router, and leaves other sites alone', async () => {
    const element = await render();
    const links = element.querySelectorAll<HTMLAnchorElement>('a');

    links[0].click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/java/records');

    links[1].click();
    const toSection = vi.mocked(router.navigateByUrl).mock.calls.at(-1)![0];
    expect(router.serializeUrl(toSection as never)).toBe('/#intro');

    const calls = vi.mocked(router.navigateByUrl).mock.calls.length;
    links[2].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(router.navigateByUrl).toHaveBeenCalledTimes(calls);
  });

  it('copies a code block and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const element = await render();
    const button = element.querySelector<HTMLButtonElement>('button[data-action="copy"]')!;
    button.click();
    await vi.waitFor(() => expect(button.textContent).toBe('Copied!'));
    expect(writeText).toHaveBeenCalledWith('int x = 1;');
    vi.unstubAllGlobals();
  });

  it('marks a problem started when its hint is opened', async () => {
    const element = await render();
    const details = element.querySelector('details')!;
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
    const progress = TestBed.inject(ProgressStore).progress();
    expect(progress.problems['java:immutable-class']).toBe('in-progress');
  });
});

/** A lesson of a topic with a notebook: a section, a code block and an interview question. */
const NOTEBOOK_DOC: ContentDoc = {
  v: 1,
  toc: [{ id: 'trade-offs', text: 'Trade-offs', depth: 2 }],
  html:
    '<h2 id="trade-offs">Trade-offs</h2>' +
    '<div data-code="java" data-label="Cache.java"><div>' +
    '<button type="button" hidden data-action="save-snippet" aria-label="Save snippet to your notebook"><span aria-live="polite">Save</span></button>' +
    '</div><div class="code-block"><pre><code>cache.get(key);</code></pre></div></div>' +
    '<details data-reveal="question" data-question="q-abc"><summary>Why cache?<span data-slot="question-bookmark"></span></summary>' +
    '<div>To cut latency.</div></details>',
  widgets: [],
  questions: { 'q-abc': { title: 'Why cache?', body: 'To cut **latency**.' } },
};

const NOTEBOOK_PAGE: BodyPage = {
  track: 'hld',
  kind: 'lesson',
  slug: 'caching',
  notebook: { title: 'Caching', topic: 'storage', href: '/hld/caching' },
};

describe('LessonBodyComponent: the notebook tools', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { userId: signal('user-1') } }, NO_SYNC],
    });
  });

  const render = async (page: BodyPage) => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.doc.set(NOTEBOOK_DOC);
    fixture.componentInstance.page.set(page);
    await fixture.whenStable();
    fixture.detectChanges();
    return { element: fixture.nativeElement as HTMLElement, fixture };
  };

  it('adds them where the topic has a notebook, and saves what each one is for', async () => {
    const { element, fixture } = await render(NOTEBOOK_PAGE);
    const store = TestBed.inject(NotebookStore);

    const section = element.querySelector<HTMLButtonElement>('h2 button')!;
    expect(section.getAttribute('aria-label')).toBe('Bookmark “Trade-offs” in your notebook');
    section.click();
    expect(store.notebook().saved['section:hld:caching#trade-offs']).toMatchObject({ title: 'Trade-offs', context: 'Caching', topic: 'storage' });

    const question = element.querySelector<HTMLButtonElement>('summary button')!;
    const details = element.querySelector('details')!;
    question.click();
    expect(details.open).toBe(false); // the bookmark doesn't open the block
    expect(store.notebook().saved['question:hld:lesson:caching#q-abc']).toMatchObject({
      title: 'Why cache?',
      body: 'To cut **latency**.',
      href: '/hld/caching',
    });

    const save = element.querySelector<HTMLButtonElement>('button[data-action="save-snippet"]')!;
    expect(save.hidden).toBe(false);
    save.click();
    expect(Object.values(store.notebook().snippets)).toEqual([
      expect.objectContaining({ title: 'Cache.java (Caching)', code: 'cache.get(key);', language: 'java', lesson: 'caching' }),
    ]);
    expect(save.textContent).toBe('Saved');

    fixture.detectChanges();
    expect(section.getAttribute('aria-pressed')).toBe('true');
  });

  it('adds none of them where the topic has no notebook', async () => {
    const { element } = await render({ track: 'dsa', kind: 'lesson', slug: 'heaps' });
    expect(element.querySelector('h2 button')).toBeNull();
    expect(element.querySelector('summary button')).toBeNull();
    expect(element.querySelector<HTMLButtonElement>('button[data-action="save-snippet"]')!.hidden).toBe(true);
  });
});
