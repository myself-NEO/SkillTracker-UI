import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { isLessonComplete } from '@lib/progress/progress';
import { AuthService } from '../services/auth.service';
import { ProgressStore } from './progress.store';
import { StateSync } from './state-sync.service';

describe('ProgressStore', () => {
  const userId = signal<string | null>(null);

  beforeEach(() => {
    localStorage.clear();
    userId.set(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { userId } },
        // Saving to the account is StateSync's own test.
        { provide: StateSync, useValue: { register: () => {}, changed: () => {} } },
      ],
    });
  });

  const create = () => {
    const store = TestBed.inject(ProgressStore);
    TestBed.tick();
    return store;
  };

  it("keeps each account's progress under its own key", () => {
    userId.set('user-1');
    const store = create();
    store.setLessonComplete('java', 'generics', true);
    expect(JSON.parse(localStorage.getItem('st:user-1:learning-progress-v1')!).lessons).toHaveProperty('java:generics');

    userId.set('user-2');
    TestBed.tick();
    expect(isLessonComplete(store.progress(), 'java', 'generics')).toBe(false);

    userId.set('user-1');
    TestBed.tick();
    expect(isLessonComplete(store.progress(), 'java', 'generics')).toBe(true);
  });

  it('keeps nothing while signed out', () => {
    const store = create();
    store.setLessonComplete('dsa', 'heaps', true);
    expect(localStorage.length).toBe(0);
  });

  it('starts empty when the stored progress is unreadable', () => {
    localStorage.setItem('st:user-1:learning-progress-v1', '{not json');
    userId.set('user-1');
    const store = create();
    expect(store.progress().lessons).toEqual({});
  });
});
