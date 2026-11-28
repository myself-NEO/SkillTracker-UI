import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { LeetCodeProblem } from '@content/dsa/problems';
import { noteOf, statusOf } from '@lib/dsa/practice';
import { NotebookStore } from '../../core/notebook.store';
import { ProgressStore } from '../../core/progress.store';
import { StateSync } from '../../core/state-sync.service';
import { AuthService } from '../../services/auth.service';
import { CodingQuestionComponent } from './coding-question.component';

const TWO_SUM: LeetCodeProblem = { id: 1, title: 'Two Sum', slug: 'two-sum', difficulty: 'Easy', topic: 'arrays-hashing', patterns: ['Hash map'] };

@Component({
  imports: [CodingQuestionComponent],
  template: `<ol><li appCodingQuestion [problem]="problem"></li></ol>`,
})
class HostComponent {
  readonly problem = TWO_SUM;
}

describe('CodingQuestionComponent', () => {
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

  const render = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, row: (fixture.nativeElement as HTMLElement).querySelector('li')! };
  };

  it('links to LeetCode and can be found by its ref', () => {
    const { row } = render();
    expect(row.id).toBe('lc-1');
    expect(row.querySelector('a')?.getAttribute('href')).toBe('https://leetcode.com/problems/two-sum/');
    expect(row.textContent).toContain('Easy');
  });

  it('records the status and the revisit flag', () => {
    const { fixture, row } = render();
    const select = row.querySelector('select')!;
    select.value = 'completed';
    select.dispatchEvent(new Event('change'));
    expect(statusOf(TestBed.inject(ProgressStore).progress(), TWO_SUM)).toBe('completed');

    const revisit = [...row.querySelectorAll('button')].find((button) => button.textContent!.includes('Revisit'))!;
    revisit.click();
    fixture.detectChanges();
    expect(revisit.getAttribute('aria-pressed')).toBe('true');
    expect(TestBed.inject(NotebookStore).notebook().revise['dsa:lc-1']).toBeTypeOf('number');
  });

  it('keeps a note on the question once typing pauses', () => {
    const { fixture, row } = render();
    const notes = [...row.querySelectorAll('button')].find((button) => button.textContent!.includes('Notes'))!;
    notes.click();
    fixture.detectChanges();
    const textarea = row.querySelector('textarea')!;
    textarea.value = 'One pass with a map';
    textarea.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    expect(noteOf(TestBed.inject(NotebookStore).notebook(), TWO_SUM)).toMatchObject({
      title: '1. Two Sum',
      body: 'One pass with a map',
      topic: 'arrays-hashing',
      problem: 'lc-1',
    });
    expect(notes.textContent).toContain('Notes ✓');
  });
});
