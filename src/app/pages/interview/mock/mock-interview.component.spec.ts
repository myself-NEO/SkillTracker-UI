import { Component, NgZone, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { parseInterviewScript } from '@content/hld/interview';
import type { ProblemMeta } from '@content/shared/types';
import type { MockScriptFile } from '@lib/content/catalog';
import { problemStatus } from '@lib/progress/progress';
import { InterviewsStore } from '../../../core/interviews.store';
import { ProgressStore } from '../../../core/progress.store';
import { StateSync } from '../../../core/state-sync.service';
import { AuthService } from '../../../services/auth.service';
import { MockInterviewComponent } from './mock-interview.component';

const BREAKDOWN = `## Problem statement

Design a URL shortener.

## Clarifying questions

- **Q:** How many links are created per day? <!-- match: scale, links, per day -->
  - **A:** About 100 million a month.
- **Q:** Do links expire? <!-- match: expire, expiry, ttl -->
  - **A:** Only when the user sets an expiry.

## Functional requirements

- Users can **create a short link**.

## Non-functional requirements

- **Low latency** redirects.

## API design

POST /urls

## Scaling strategy

### How do we generate unique codes?

Use a counter.
`;

const FILE: MockScriptFile = {
  script: parseInterviewScript(BREAKDOWN),
  checklist: [{ text: 'Asked about scale', html: 'Asked about scale' }],
};

const PROBLEM: ProblemMeta = {
  slug: 'url-shortener',
  title: 'URL Shortener',
  difficulty: 'beginner',
  summary: 'Short links.',
  minutes: 45,
  patterns: [],
  concepts: [],
  tags: [],
};

@Component({
  imports: [MockInterviewComponent],
  template: `<app-mock-interview topic="hld" basePath="/hld" [problem]="problem" [file]="file" />`,
})
class HostComponent {
  readonly problem = PROBLEM;
  readonly file = FILE;
}

describe('MockInterviewComponent', () => {
  let exitHooks: (() => void)[];

  beforeEach(() => {
    vi.useFakeTimers({ now: 1_000_000 });
    localStorage.clear();
    exitHooks = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { userId: signal('user-1') } },
        // Saving to the account is StateSync's own test; the page closing is simulated with its exit hooks.
        {
          provide: StateSync,
          useValue: {
            register: () => {},
            changed: () => {},
            beforeExit: (hook: () => void) => {
              exitHooks.push(hook);
              return () => (exitHooks = exitHooks.filter((other) => other !== hook));
            },
          },
        },
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  const render = () => {
    const interviews = TestBed.inject(InterviewsStore);
    const progress = TestBed.inject(ProgressStore);
    TestBed.tick(); // the stores load the signed-in learner's state
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const button = (text: string) => [...element.querySelectorAll('button')].find((candidate) => candidate.textContent!.trim().startsWith(text));
    const session = () => interviews.state().sessions['hld:url-shortener'];
    // Inside the zone, as the app ticks: the clock's effect runs in the zone, and leaving it from
    // outside would start a second tick inside this one.
    const zone = TestBed.inject(NgZone);
    const update = () => {
      zone.run(() => TestBed.tick());
      fixture.detectChanges();
    };
    return { fixture, element, button, session, update, interviews, progress };
  };

  it('starts an attempt from the brief, and marks the problem started', () => {
    const { element, button, session, update, progress } = render();
    expect(element.textContent).toContain('How this works');
    expect(button('Start the interview')).toBeTruthy();

    button('Start the interview')!.click();
    update();
    expect(session()).toMatchObject({ minutes: 45, phase: 'clarify', runningSince: 1_000_000 });
    expect(problemStatus(progress.progress(), 'hld', 'url-shortener')).toBe('in-progress');
    expect(element.querySelector('h2')?.textContent).toContain('Clarify the problem');
  });

  it('answers clarifying questions from the script, or says what to do instead', () => {
    const { element, button, session, update } = render();
    button('Start the interview')!.click();
    update();

    const ask = (text: string) => {
      const input = element.querySelector<HTMLInputElement>('#clarify-input')!;
      input.value = text;
      input.dispatchEvent(new Event('input'));
      update();
      element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      update();
    };
    ask('How many links per day?');
    ask('Which database should I use?');
    expect(session()!.asked.map((asked) => asked.matched)).toEqual([0, null]);
    const labels = [...element.querySelectorAll('ol[aria-label="Conversation"] li span')].map((span) => span.textContent!.trim());
    expect(labels).toEqual(['Interviewer · scripted answer to “How many links are created per day?”', 'Interviewer · no scripted answer']);
    expect(element.textContent).toContain('You have asked about 1 of the 2 topics');
  });

  it('runs the clock while the page is open, per phase, and stops it when the page is hidden', () => {
    const { element, button, session, update } = render();
    button('Start the interview')!.click();
    update();

    vi.advanceTimersByTime(65_000);
    update();
    expect(element.querySelector('aside p.font-mono')?.textContent).toContain('1:05');

    button('Next: Requirements')!.click();
    update();
    expect(session()!.timeInPhase).toEqual({ clarify: 65_000 });
    expect(element.textContent).toContain('Step 2 of 10');

    for (const hook of exitHooks) hook();
    update();
    expect(session()!.runningSince).toBeUndefined();
    expect(element.textContent).toContain('Timer paused.');
  });

  it('saves drafts as the learner types, and stops the clock when they leave', () => {
    const { fixture, element, button, session, update } = render();
    button('Start the interview')!.click();
    update();
    button('Next: Requirements')!.click();
    update();

    const draft = element.querySelector<HTMLTextAreaElement>('#draft-requirements')!;
    draft.value = 'Users can create a short link';
    draft.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(500);
    expect(session()!.drafts).toEqual({ requirements: 'Users can create a short link' });

    fixture.destroy();
    expect(session()!.runningSince).toBeUndefined();
  });

  it('finishes once every rubric dimension is rated: the attempt goes into the history and the problem is Attempted', () => {
    const { element, button, session, update, interviews, progress } = render();
    button('Start the interview')!.click();
    update();
    [...element.querySelectorAll<HTMLButtonElement>('nav[aria-label="Interview phases"] button')].at(-1)!.click();
    update();
    expect(element.querySelector('h2')?.textContent).toContain('Self-evaluation');
    expect(button('Finish interview')!.disabled).toBe(true);

    for (const group of element.querySelectorAll('[role="radiogroup"]')) {
      if (group.getAttribute('aria-label') !== 'Interview length') group.querySelector<HTMLButtonElement>('[role="radio"]')!.click();
    }
    update();
    expect(element.textContent).toContain('Self-score: 100%');
    button('Finish interview')!.click();
    update();

    expect(session()).toBeUndefined();
    expect(interviews.state().history['hld:url-shortener']).toMatchObject([{ score: 100, minutes: 45, clarifyCoverage: 0 }]);
    expect(problemStatus(progress.progress(), 'hld', 'url-shortener')).toBe('attempted');
    expect(element.textContent).toContain('Attempt saved.');
    expect(element.textContent).toContain('Your attempts');
    expect(button('Start a new attempt')).toBeTruthy();
  });
});
