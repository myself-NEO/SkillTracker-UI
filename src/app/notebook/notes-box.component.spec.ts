import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { lessonNote } from '@lib/progress/notebook';
import { NotebookStore } from '../core/notebook.store';
import { StateSync } from '../core/state-sync.service';
import { AuthService } from '../services/auth.service';
import { NotesBoxComponent } from './notes-box.component';

@Component({
  imports: [NotesBoxComponent],
  template: `<app-notes-box
    track="java"
    kind="lesson"
    [slug]="slug()"
    [title]="title()"
    topic="basics"
    placeholder="e.g. …"
    notebookHref="/java/notebook"
  />`,
})
class HostComponent {
  readonly slug = signal('generics');
  readonly title = signal('Generics');
}

describe('NotesBoxComponent', () => {
  let exitHooks: (() => void)[] = [];

  beforeEach(() => {
    exitHooks = [];
    vi.useFakeTimers();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { userId: signal('user-1') } },
        // Saving to the account is StateSync's own test; its exit hook is called by hand here.
        {
          provide: StateSync,
          useValue: {
            register: () => {},
            changed: () => {},
            beforeExit: (flush: () => void) => {
              exitHooks.push(flush);
              return () => exitHooks.splice(exitHooks.indexOf(flush), 1);
            },
          },
        },
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  const setup = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const textarea = (fixture.nativeElement as HTMLElement).querySelector('textarea')!;
    const type = (text: string) => {
      textarea.value = text;
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    return { fixture, textarea, type, store: TestBed.inject(NotebookStore) };
  };

  it('saves the note once typing pauses, and removes it when emptied', () => {
    const { fixture, type, store } = setup();
    type('Type erasure!');
    expect(lessonNote(store.notebook(), 'java', 'generics')).toBeUndefined();
    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    expect(lessonNote(store.notebook(), 'java', 'generics')).toMatchObject({ title: 'Generics', body: 'Type erasure!', topic: 'basics' });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Saved to your notebook');

    type('');
    vi.advanceTimersByTime(600);
    expect(lessonNote(store.notebook(), 'java', 'generics')).toBeUndefined();
  });

  it('saves what was typed on one lesson when the box moves to the next', () => {
    const { fixture, textarea, type, store } = setup();
    type('Wildcards');
    fixture.componentInstance.slug.set('records');
    fixture.componentInstance.title.set('Records');
    fixture.detectChanges();
    expect(lessonNote(store.notebook(), 'java', 'generics')?.body).toBe('Wildcards');
    expect(lessonNote(store.notebook(), 'java', 'records')).toBeUndefined();
    expect(textarea.value).toBe('');
    vi.advanceTimersByTime(600); // the earlier timer doesn't save anything twice
    expect(Object.keys(store.notebook().notes)).toHaveLength(1);
  });

  it('saves a note still waiting for the pause when the page closes', () => {
    const { type, store } = setup();
    type('Bounded wildcards');
    expect(exitHooks).toHaveLength(1);
    exitHooks[0](); // StateSync, as the page closes, just before its last save
    expect(lessonNote(store.notebook(), 'java', 'generics')?.body).toBe('Bounded wildcards');
  });
});
