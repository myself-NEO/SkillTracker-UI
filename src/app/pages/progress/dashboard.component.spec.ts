import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { TrackFile } from '@lib/content/catalog';
import { topicIndex } from '@lib/notebook/topic-index';
import { NotebookStore } from '../../core/notebook.store';
import { ProgressStore } from '../../core/progress.store';
import { StateSync } from '../../core/state-sync.service';
import { AuthService } from '../../services/auth.service';
import { DashboardComponent } from './dashboard.component';

const lesson = (slug: string) => ({ slug, title: slug.toUpperCase(), minutes: 10 });

/** Just what the dashboard reads of a curriculum. */
const TRACK = {
  id: 'lld',
  basePath: '/lld',
  hasKnowledgeChecks: true,
  notebook: true,
  stages: [
    {
      id: 'basics',
      number: 1,
      title: 'Basics',
      modules: [
        { id: 'm1', title: 'Objects', lessons: [lesson('a'), lesson('b')] },
        { id: 'm2', title: 'Patterns', lessons: [lesson('c')] },
      ],
    },
  ],
  problems: [{ slug: 'atm', title: 'ATM' }],
  writtenProblems: [],
} as unknown as TrackFile;

@Component({
  imports: [DashboardComponent],
  template: `<app-progress-dashboard [track]="track" [index]="index" />`,
})
class HostComponent {
  readonly track = TRACK;
  readonly index = topicIndex(TRACK);
}

describe('DashboardComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { userId: signal('user-1') } },
        { provide: StateSync, useValue: { register: () => {}, changed: () => {}, beforeExit: () => () => {} } },
      ],
    });
  });

  it('counts what the learner has done', () => {
    const progress = TestBed.inject(ProgressStore);
    const notebook = TestBed.inject(NotebookStore);
    TestBed.tick(); // the stores load the signed-in account's state first
    progress.setLessonComplete('lld', 'c', true);
    progress.markLessonVisited('lld', 'a');
    progress.recordQuizAnswer('lld', 'a', { prompt: 'Q1', correct: true, chosen: 'x', correctText: 'x', explanation: '' });
    progress.setProblemStatus('lld', 'atm', 'completed');
    notebook.toggleDifficult('lld', 'b', true);

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    // Each tile as "label | figure | detail".
    const tiles = [...element.querySelectorAll('app-stat-tile')].map((tile) =>
      [...tile.querySelectorAll('p')].map((line) => line.textContent!.trim()).join(' | '),
    );

    expect(tiles).toContain('Modules completed | 1 / 2 | across 1 stages');
    expect(tiles).toContain('Lessons completed | 1 / 3 | 1 opened but not complete');
    expect(tiles.find((tile) => tile.startsWith('Quiz accuracy'))).toContain('| 100% |');
    expect(tiles).toContain('Problems completed | 1 / 1 | 0 in progress or attempted');
    expect(tiles).toContain('Topics to revise | 1 | Difficult lessons, flags, quiz misses');
    // The module with nothing done says what to read next.
    expect(element.textContent).toContain('Next: A');
    // Opened but not complete, and to revise.
    const aside = element.querySelector('aside')!.textContent!;
    expect(aside).toContain('A');
    expect(aside).toContain('B');
  });
});
