import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { JavaBankQuestion } from '@lib/content/catalog';
import { NotebookStore } from '../../core/notebook.store';
import { StateSync } from '../../core/state-sync.service';
import { AuthService } from '../../services/auth.service';
import { JavaQuestionComponent } from './java-question.component';

const part = (html: string) => ({ html, widgets: [] });

const QUESTION: JavaBankQuestion = {
  id: 'string-immutable',
  topic: 'strings',
  title: 'Why is `String` immutable?',
  level: 'beginner',
  kind: 'concept',
  tricky: true,
  lessons: [{ slug: 'string-immutability', title: 'String Immutability' }],
  hints: [part('<p>Think of the pool.</p>'), part('<p>And of hash keys.</p>')],
  answer: part('<p>Security, the pool, hash caching and thread safety.</p>'),
  whyNot: part('<p>Not just performance.</p>'),
};

@Component({
  imports: [JavaQuestionComponent],
  template: `<ol><li appJavaQuestion [question]="question" [open]="open"></li></ol>`,
})
class HostComponent {
  readonly question = QUESTION;
  open = false;
}

describe('JavaQuestionComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { userId: signal('user-1') } },
        // Saving to the account is StateSync's own test.
        { provide: StateSync, useValue: { register: () => {}, changed: () => {}, beforeExit: () => () => {} } },
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  const render = (open = false) => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open = open;
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const button = (text: string) => [...element.querySelectorAll('button')].find((candidate) => candidate.textContent!.includes(text));
    return { fixture, element, button, store: TestBed.inject(NotebookStore) };
  };

  it('shows the title with its code, and renders the practice only once opened', () => {
    const { element } = render();
    expect(element.querySelector('summary code')?.textContent).toBe('String');
    expect(element.querySelector('textarea')).toBeNull();
  });

  it('keeps the draft, shows hints one at a time, reveals the answer and records the rating', () => {
    const { element, button, store } = render(true);
    const state = () => store.notebook().questions['java:string-immutable'];

    const textarea = element.querySelector('textarea')!;
    textarea.value = 'Because of the pool';
    textarea.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(500);
    expect(state()?.draft).toBe('Because of the pool');

    button('Show hint 1 of 2')!.click();
    TestBed.tick(); // renders, including the answer's HTML (set after rendering)
    expect(element.textContent).toContain('Think of the pool.');
    expect(element.textContent).not.toContain('And of hash keys.');
    expect(state()?.hints).toBe(1);

    button('Reveal the answer')!.click();
    TestBed.tick();
    expect(element.textContent).toContain('Security, the pool, hash caching and thread safety.');
    expect(element.textContent).toContain('Not just performance.');
    expect(state()?.revealedAt).toBeTypeOf('number');

    button('Missed it')!.click();
    TestBed.tick();
    expect(state()?.rating).toBe('missed');
    expect(store.notebook().revise['java:string-immutable']).toBeTypeOf('number');
    expect(element.textContent).toContain('Added to your revision list.');

    button('Bookmark')!.click();
    expect(store.notebook().saved['question:java:string-immutable']).toMatchObject({
      context: 'Strings',
      href: '/java/interview/strings#q-string-immutable',
    });
  });
});
