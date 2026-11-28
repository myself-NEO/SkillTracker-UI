import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { JavaQuestionIndex, TrackFile } from '@lib/content/catalog';
import { interviewUpdates } from '@lib/progress/interviews';
import { InterviewsStore } from '../../core/interviews.store';
import { StateSync } from '../../core/state-sync.service';
import { AuthService } from '../../services/auth.service';
import type { MockInterview } from '../../../types';
import { InterviewService } from './interview.service';
import { PracticeOverviewComponent } from './practice-overview.component';

const QUESTIONS: JavaQuestionIndex = {
  'string-immutable': { title: 'Why is `String` immutable?', topic: 'strings' },
  'hashmap-internals': { title: 'How does HashMap work?', topic: 'collections', tricky: true },
};

const track = (id: 'lld' | 'hld', slugs: string[]) =>
  ({
    id,
    problems: slugs.map((slug) => ({ slug, title: slug.replace(/-/g, ' ') })),
    writtenProblems: slugs,
  }) as unknown as TrackFile;

@Component({
  imports: [PracticeOverviewComponent],
  template: `<app-practice-overview [questions]="questions" [lld]="lld" [hld]="hld" />`,
})
class HostComponent {
  readonly questions = QUESTIONS;
  readonly lld = track('lld', ['elevator', 'parking-lot']);
  readonly hld = track('hld', ['url-shortener', 'pastebin', 'youtube']);
}

describe('the Mock Interview tab', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { userId: signal('user-1') } },
        { provide: StateSync, useValue: { register: () => {}, changed: () => {}, beforeExit: () => () => {} } },
      ],
    });
  });

  it('counts the practice of each kind, and lists the mock interviews left unfinished', () => {
    const store = TestBed.inject(InterviewsStore);
    TestBed.tick(); // the store loads the signed-in learner's state
    let state = interviewUpdates.start(store.state(), 'hld', 'url-shortener', 45, 1_000);
    state = interviewUpdates.rate(state, 'hld', 'url-shortener', 'requirements', 'got-it', 2_000);
    state = interviewUpdates.finish(state, 'hld', 'url-shortener', { score: 80, clarifyCoverage: 1, hintsUsed: 0 }, 61_000);
    state = interviewUpdates.start(state, 'hld', 'pastebin', 60, 70_000);
    state = interviewUpdates.setPhase(state, 'hld', 'pastebin', 'api', 130_000);
    state = interviewUpdates.setTimerRunning(state, 'hld', 'pastebin', false, 130_000);
    store.replace(state);

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const card = (topic: string) => element.querySelector(`li[data-track="${topic}"]`)!.textContent!.replace(/\s+/g, ' ');

    expect(card('java')).toContain('2 questions in 2 topics.');
    expect(card('java')).toContain('0 of 2 questions practised');
    expect(card('lld')).toContain('0 of 2 problems interviewed');
    expect(card('hld')).toContain('1 of 3 problems interviewed');
    expect(card('hld')).toContain('1 attempt');
    expect(card('hld')).toContain('best 80%');
    expect(card('hld')).toContain('1 in progress');

    const resume = [...element.querySelectorAll<HTMLAnchorElement>('h3 + ul a')];
    expect(resume.map((link) => link.getAttribute('href'))).toEqual(['/hld/interview/pastebin']);
    expect(resume[0].textContent!.replace(/\s+/g, ' ')).toContain('HLD · APIs · 1:00 of 60 min');
  });

  it('books and scores mock interviews through /api/interviews', async () => {
    const service = TestBed.inject(InterviewService);
    const http = TestBed.inject(HttpTestingController);
    const booked: MockInterview = { id: 'a b', type: 'OOD', date: '2026-12-04', time: '09:30', interviewer: 'Sam', status: 'Scheduled' };

    const listed = service.list();
    http.expectOne({ method: 'GET', url: '/api/interviews' }).flush({ interviews: [booked] });
    expect(await listed).toEqual([booked]);

    const booking = service.book({ type: 'OOD', date: '2026-12-04', time: '09:30', interviewer: 'Sam' });
    const post = http.expectOne({ method: 'POST', url: '/api/interviews' });
    expect(post.request.body).toEqual({ type: 'OOD', date: '2026-12-04', time: '09:30', interviewer: 'Sam' });
    post.flush({ interviews: [booked] });
    expect(await booking).toEqual([booked]);

    const scoring = service.saveFeedback('a b', 4, 'Good');
    const put = http.expectOne({ method: 'PUT', url: '/api/interviews/a%20b/feedback' });
    expect(put.request.body).toEqual({ score: 4, feedback: 'Good' });
    put.flush({ interviews: [{ ...booked, status: 'Completed', score: 4, feedback: 'Good' }] });
    expect((await scoring)[0].status).toBe('Completed');
    http.verify();
  });
});
