import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { ContentDoc } from '@lib/content/doc';
import { ProgressStore } from '../../core/progress.store';
import { AuthService } from '../../services/auth.service';
import { type BodyPage, LessonBodyComponent } from './lesson-body.component';

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
      providers: [provideRouter([]), { provide: AuthService, useValue: { userId: signal('user-1') } }],
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
