import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../services/auth.service';
import { StateSync } from './state-sync.service';
import { UserStorage } from './user-storage';

type Doc = { lessons: Record<string, number> };
const EMPTY: Doc = { lessons: {} };
const sanitize = (parsed: unknown): Doc => {
  const lessons = (parsed as Doc | null)?.lessons;
  return { lessons: typeof lessons === 'object' && lessons ? { ...lessons } : {} };
};

describe('StateSync', () => {
  const userId = signal<string | null>(null);
  let http: HttpTestingController;
  let sync: StateSync;
  let storage: UserStorage<Doc>;

  /** Runs timers and the promise callbacks they start. */
  const advance = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
  };

  const signIn = async () => {
    userId.set('user-1');
    TestBed.tick();
    await advance(0);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    userId.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { userId, getToken: () => 'token' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    sync = TestBed.inject(StateSync);
    storage = TestBed.runInInjectionContext(
      () => new UserStorage<Doc>({ key: 'learning-progress-v1', empty: EMPTY, sanitize, sync: 'progress' }),
    );
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  const answerRead = (data?: Doc) =>
    http
      .expectOne((request) => request.method === 'GET' && request.url === '/api/state')
      .flush({ documents: data ? { progress: { data, updatedAt: '2026-11-28T00:00:00Z' } } : {} });

  const expectSave = () => http.expectOne((request) => request.method === 'PATCH' && request.url === '/api/state/progress');

  it("reads the account's copy on sign-in, keeps this browser's changes on top, and sends them", async () => {
    localStorage.setItem('st:user-1:learning-progress-v1', JSON.stringify({ lessons: { 'java:a': 1 } }));
    await signIn();
    expect(storage.value()).toEqual({ lessons: { 'java:a': 1 } });

    answerRead({ lessons: { 'java:b': 2 } });
    await advance(0);
    expect(storage.value()).toEqual({ lessons: { 'java:a': 1, 'java:b': 2 } });

    const save = expectSave();
    expect(save.request.body).toEqual({ lessons: { 'java:a': 1 } });
    expect(save.request.headers.get('Content-Type')).toBe('application/merge-patch+json');
    save.flush({ data: { lessons: { 'java:a': 1, 'java:b': 2 } } });
    await advance(0);
    expect(sync.status()).toBe('saved');
    expect(sync.hasPending()).toBe(false);
  });

  it('sends changes together after a pause, with removed keys as null', async () => {
    await signIn();
    answerRead({ lessons: { 'java:a': 1 } });
    await advance(0);

    storage.update(() => ({ lessons: { 'java:c': 3 } }));
    storage.update((doc) => ({ lessons: { ...doc.lessons, 'java:d': 4 } }));
    expect(sync.status()).toBe('pending');
    await advance(2999);
    http.expectNone('/api/state/progress');

    await advance(1);
    const save = expectSave();
    expect(save.request.body).toEqual({ lessons: { 'java:a': null, 'java:c': 3, 'java:d': 4 } });
    save.flush({ data: { lessons: { 'java:c': 3, 'java:d': 4 } } });
    await advance(0);
    expect(sync.status()).toBe('saved');
  });

  it('keeps a change made while a save was on its way, and sends it next', async () => {
    await signIn();
    answerRead();
    await advance(0);

    storage.update(() => ({ lessons: { 'java:a': 1 } }));
    await advance(3000);
    const first = expectSave();
    storage.update((doc) => ({ lessons: { ...doc.lessons, 'java:b': 2 } }));
    first.flush({ data: { lessons: { 'java:a': 1 } } });
    await advance(0);
    expect(storage.value()).toEqual({ lessons: { 'java:a': 1, 'java:b': 2 } });

    await advance(3000);
    const second = expectSave();
    expect(second.request.body).toEqual({ lessons: { 'java:b': 2 } });
    second.flush({ data: { lessons: { 'java:a': 1, 'java:b': 2 } } });
    await advance(0);
    expect(sync.hasPending()).toBe(false);
  });

  it('retries with a growing delay while the server cannot be reached', async () => {
    await signIn();
    http.expectOne('/api/state').error(new ProgressEvent('error'), { status: 0 });
    await advance(0);
    expect(sync.status()).toBe('offline');

    await advance(3000);
    http.expectOne('/api/state').error(new ProgressEvent('error'), { status: 0 });
    await advance(5999);
    http.expectNone('/api/state');
    await advance(1);
    answerRead();
    await advance(0);
    // Back in touch, with nothing left to send.
    expect(sync.status()).toBe('saved');
  });

  it('says when changes could not be saved before signing out', async () => {
    await signIn();
    answerRead();
    await advance(0);
    storage.update(() => ({ lessons: { 'java:a': 1 } }));

    const settled = sync.settle(1000);
    await advance(0);
    expectSave().error(new ProgressEvent('error'), { status: 0 });
    await advance(1000);
    expect(await settled).toBe(false);
    // The change stays in this browser.
    expect(JSON.parse(localStorage.getItem('st:user-1:learning-progress-v1')!).lessons).toEqual({ 'java:a': 1 });

    userId.set(null);
    TestBed.tick();
    await advance(60_000);
    http.expectNone('/api/state/progress');
  });

  it('as the page closes, stores what is still waiting and sends it without waiting for the answer', async () => {
    await signIn();
    answerRead();
    await advance(0);
    const fetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetch);
    // e.g. a note still waiting for a pause in typing
    sync.beforeExit(() => storage.update((s) => ({ lessons: { ...s.lessons, 'java:late': 9 } })));

    window.dispatchEvent(new Event('pagehide'));
    vi.unstubAllGlobals();
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/state\/progress$/);
    expect(init).toMatchObject({ method: 'PATCH', keepalive: true });
    expect(JSON.parse(init.body as string)).toEqual({ lessons: { 'java:late': 9 } });

    // If that request is lost, the usual save sends the same change again.
    await advance(3000);
    expectSave().flush({ data: { lessons: { 'java:late': 9 } } });
    await advance(0);
  });
});
