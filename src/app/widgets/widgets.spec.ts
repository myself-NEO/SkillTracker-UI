import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ChecklistWidget, DrillWidget, QuizWidget } from '@lib/content/doc';
import { questionHash } from '@lib/progress/hash';
import { InterviewsStore } from '../core/interviews.store';
import { StateSync } from '../core/state-sync.service';
import { ProgressStore } from '../core/progress.store';
import { AuthService } from '../services/auth.service';
import { ChecklistComponent } from './checklist.component';
import { DrillComponent } from './drill.component';
import { EstimatorComponent } from './estimator.component';
import type { BodyPage } from './page';
import { QuizComponent } from './quiz.component';


/** These tests are about the widgets, not about saving to the account. */
const NO_SYNC = { provide: StateSync, useValue: { register: () => {}, changed: () => {} } };
const text = (value: string) => ({ text: value, html: value });

const QUIZ: QuizWidget = {
  type: 'quiz',
  questions: [
    {
      prompt: text('Which is O(1)?'),
      options: [
        { text: text('Linear scan'), correct: false, reason: text('That is O(n).') },
        { text: text('Hash lookup'), correct: true },
      ],
      explanation: text('Hashing goes straight to the bucket.'),
    },
  ],
};

const DRILL: DrillWidget = {
  type: 'drill',
  errors: [],
  questions: [
    { prompt: text('Writes per second?'), answer: 1_000, answerText: '1K/s', kind: 'rate', tolerance: 2, solution: text('1K') },
  ],
};

const CHECKLIST: ChecklistWidget = { type: 'checklist', title: 'Before you submit', items: [text('Edge cases'), text('Tests')] };

const LESSON: BodyPage = { track: 'hld', kind: 'lesson', slug: 'caching' };

@Component({
  imports: [QuizComponent, DrillComponent, ChecklistComponent, EstimatorComponent],
  template: `
    @switch (kind()) {
      @case ('quiz') {
        <app-quiz [widget]="quiz" [page]="page()" />
      }
      @case ('drill') {
        <app-drill [widget]="drill" [page]="page()" />
      }
      @case ('checklist') {
        <app-checklist [widget]="checklist" [page]="page()" />
      }
      @case ('estimator') {
        <app-estimator title="Test" preset="requestsPerDay = 1M" />
      }
    }
  `,
})
class HostComponent {
  readonly kind = signal<'quiz' | 'drill' | 'checklist' | 'estimator'>('quiz');
  readonly page = signal<BodyPage>(LESSON);
  readonly quiz = QUIZ;
  readonly drill = DRILL;
  readonly checklist = CHECKLIST;
}

describe('lesson widgets', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: { userId: signal('user-1') } }, NO_SYNC] });
  });

  const render = async (kind: 'quiz' | 'drill' | 'checklist' | 'estimator', page: BodyPage = LESSON) => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.kind.set(kind);
    fixture.componentInstance.page.set(page);
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    await settle();
    return { fixture: { whenStable: settle }, element: fixture.nativeElement as HTMLElement };
  };

  const radios = (element: HTMLElement) => Array.from(element.querySelectorAll<HTMLInputElement>('input[type="radio"]'));

  it('quiz: explains a wrong answer, then records the pass on a lesson', async () => {
    const { fixture, element } = await render('quiz');
    radios(element)[0].click();
    await fixture.whenStable();
    expect(element.textContent).toContain('Why not: That is O(n).');

    radios(element)[1].click();
    await fixture.whenStable();
    expect(element.textContent).toContain('1 / 1 answered correctly');
    expect(element.textContent).toContain('Knowledge check passed');

    const progress = TestBed.inject(ProgressStore).progress();
    expect(progress.quizzes['hld:caching']).toBeTypeOf('number');
    const answer = progress.answers[`hld:caching:${questionHash('Which is O(1)?')}`];
    expect(answer).toMatchObject({ attempts: 2, firstCorrect: false, solved: true, lastWrong: 'Linear scan' });
  });

  it('quiz: is practice only outside lessons', async () => {
    const { fixture, element } = await render('quiz', { track: 'dsa', kind: 'cheatsheet', slug: 'core' });
    radios(element)[1].click();
    await fixture.whenStable();
    expect(element.textContent).toContain('1 / 1 answered correctly');
    expect(TestBed.inject(ProgressStore).progress().quizzes).toEqual({});
  });

  it('drill: reads quantities, says how far off an estimate is, and accepts one within the factor', async () => {
    const { fixture, element } = await render('drill');
    const input = element.querySelector<HTMLInputElement>('app-drill-item input')!;
    const check = async (value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();
      return element.querySelector('[aria-live] p')?.textContent ?? '';
    };
    expect(await check('lots')).toContain('isn’t a number I can read');
    expect(await check('100')).toContain('10× too low');
    expect(await check('1.2K')).toContain('Close enough');
    expect(input.disabled).toBe(true);
    const answers = Object.values(TestBed.inject(ProgressStore).progress().answers);
    expect(answers).toHaveLength(1);
    expect(answers[0]).toMatchObject({ attempts: 2, solved: true, lastWrong: '100' });
  });

  it('checklist: keeps ticks per page with the account', async () => {
    const page: BodyPage = { track: 'hld', kind: 'problem', slug: 'url-shortener' };
    const { fixture, element } = await render('checklist', page);
    element.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    await fixture.whenStable();
    expect(element.textContent).toContain('1 / 2 covered');
    const ticks = TestBed.inject(InterviewsStore).state().checklists['hld:problem:url-shortener'];
    expect(Object.keys(ticks)).toEqual([questionHash('Edge cases')]);
  });

  it('estimator: recomputes from the inputs, flags unreadable ones, and resets to the preset', async () => {
    const { fixture, element } = await render('estimator');
    const perDay = () => element.querySelector('[data-output="requests-per-day"] dd')?.textContent?.trim();
    expect(perDay()).toBe('1M');
    const input = element.querySelector<HTMLInputElement>('input[id$="-requestsPerDay"]')!;
    input.value = '5M';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(perDay()).toBe('5M');
    input.value = 'many';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    Array.from(element.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Reset'))!
      .click();
    await fixture.whenStable();
    expect(perDay()).toBe('1M');
  });
});
