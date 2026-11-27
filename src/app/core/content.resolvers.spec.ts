import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Route, RouterStateSnapshot, UrlSegment } from '@angular/router';
import type { Track } from '@content/shared/types';
import type { TrackFile } from '@lib/content/catalog';
import type { ContentDoc } from '@lib/content/doc';
import { lessonResolver, lessonSlugMatch, problemResolver } from './content.resolvers';
import { ContentService } from './content.service';

const lesson = (slug: string, comingSoon = false) => ({
  slug,
  title: slug,
  summary: '',
  minutes: 5,
  level: 'beginner' as const,
  essential: true,
  objectives: [],
  prerequisites: [],
  related: [],
  ...(comingSoon && { comingSoon: true }),
});

const TRACK = {
  id: 'java',
  title: 'Java',
  shortTitle: 'Java',
  basePath: '/java',
  stages: [
    {
      id: 's1',
      number: 1,
      title: 'Basics',
      modules: [{ id: 'm1', title: 'Start', lessons: [lesson('intro'), lesson('later', true)] }],
    },
  ],
  problems: [{ slug: 'p1', title: 'P1' }, { slug: 'p2', title: 'P2' }],
  writtenProblems: ['p1'],
} as unknown as Track as TrackFile;

const DOC = { v: 1, toc: [], html: '<p>Hi</p>', widgets: [], questions: {} } as ContentDoc;

describe('content resolvers', () => {
  let failLesson = false;

  beforeEach(() => {
    failLesson = false;
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ContentService,
          useValue: {
            track: async () => TRACK,
            lesson: async () => {
              if (failLesson) throw new HttpErrorResponse({ status: 0 });
              return DOC;
            },
            problem: async () => DOC,
            prefetchLesson: () => {},
          },
        },
      ],
    });
  });

  const route = (params: Record<string, string>) =>
    ({ data: { topic: 'java' }, paramMap: convertToParamMap(params) }) as unknown as ActivatedRouteSnapshot;
  const run = <T>(resolver: (r: ActivatedRouteSnapshot, s: RouterStateSnapshot) => T, params: Record<string, string>) =>
    TestBed.runInInjectionContext(() => resolver(route(params), {} as RouterStateSnapshot));

  it('finds a written lesson with its body, and an unwritten one without', async () => {
    const written = await run(lessonResolver, { lesson: 'intro' });
    expect(written).toMatchObject({ status: 'ok', value: { doc: DOC, location: { index: 0 } } });
    const comingSoon = await run(lessonResolver, { lesson: 'later' });
    expect(comingSoon).toMatchObject({ status: 'ok', value: { doc: null } });
  });

  it('reports an unknown lesson as missing, and a failed download as an error', async () => {
    expect(await run(lessonResolver, { lesson: 'nope' })).toEqual({ status: 'missing' });
    failLesson = true;
    expect(await run(lessonResolver, { lesson: 'intro' })).toEqual({ status: 'error' });
  });

  it('loads a problem breakdown only when it is written', async () => {
    expect(await run(problemResolver, { problem: 'p1' })).toMatchObject({ status: 'ok', value: { doc: DOC } });
    expect(await run(problemResolver, { problem: 'p2' })).toMatchObject({ status: 'ok', value: { doc: null } });
    expect(await run(problemResolver, { problem: 'p3' })).toEqual({ status: 'missing' });
  });

  it("leaves a topic's section pages to their own routes", () => {
    const match = (path: string) => lessonSlugMatch({} as Route, [new UrlSegment(path, {})]);
    expect(match('generics')).toBe(true);
    for (const section of ['problems', 'notebook', 'interview', 'progress', 'notes', 'estimator', 'cheatsheets']) {
      expect(match(section)).toBe(false);
    }
  });
});
