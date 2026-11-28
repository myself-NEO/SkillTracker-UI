import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanMatchFn, ResolveFn } from '@angular/router';
import type { Cheatsheet } from '@content/dsa/cheatsheets';
import { findLesson, flattenLessons, type LessonLocation } from '@content/shared/curriculum';
import type { ProblemMeta } from '@content/shared/types';
import type { InterviewTopic } from '@content/java/interview';
import type {
  ContentIndex,
  DsaPractice,
  JavaBankQuestion,
  JavaQuestionIndex,
  MockScriptFile,
  TrackFile,
  VisualizeIndex,
} from '@lib/content/catalog';
import type { ContentDoc } from '@lib/content/doc';
import type { MockTopic } from '@lib/interview/mock';
import { practiceCopy } from '@lib/content/practice';
import { RESERVED_SEGMENTS } from '@lib/routes';
import { TOPICS, type TopicId } from '@lib/topics';
import { ContentService } from './content.service';

// Route resolvers for the generated content files. A page opens once its file has arrived (a small
// static file from the CDN), so it renders complete and links to #sections land in the right place.
// A failed download resolves to null (catalogs) or { status: 'error' } (pages), and the page offers
// to try again.

export const contentIndexResolver: ResolveFn<ContentIndex | null> = () =>
  inject(ContentService)
    .index()
    .catch(() => null);

/** The topic named in the route's data (`data: { topic }`). */
export const trackResolver: ResolveFn<TrackFile | null> = (route) =>
  inject(ContentService)
    .track(route.data['topic'] as TopicId)
    .catch(() => null);

export const dsaPracticeResolver: ResolveFn<DsaPractice | null> = () =>
  inject(ContentService)
    .dsaPractice()
    .catch(() => null);

/** The Java question bank's titles, for the notebook; without them it shows what it saved. */
export const javaQuestionsResolver: ResolveFn<JavaQuestionIndex> = () =>
  inject(ContentService)
    .javaQuestions()
    .catch(() => ({}));

export const visualizeResolver: ResolveFn<VisualizeIndex | null> = () =>
  inject(ContentService)
    .visualize()
    .catch(() => null);

/** "Consistent hashing on a ring · Animations" */
export const sceneTitleResolver: ResolveFn<string> = async (route) => {
  try {
    const { scenes } = await inject(ContentService).visualize();
    const scene = scenes.find((candidate) => candidate.id === route.paramMap.get('scene'));
    return scene ? `${scene.title} · Animations` : 'Page not found';
  } catch {
    return 'Animations';
  }
};

/** What a page resolver found: the page, no such page (shown as a 404), or a failed download. */
export type PageResult<T> = { status: 'ok'; value: T } | { status: 'missing' } | { status: 'error' };

export interface LessonData {
  track: TrackFile;
  location: LessonLocation;
  /** null while the lesson isn't written ("coming soon"). */
  doc: ContentDoc | null;
}

export interface ProblemData {
  track: TrackFile;
  problem: ProblemMeta;
  /** null while the breakdown isn't written. */
  doc: ContentDoc | null;
}

export interface CheatsheetData {
  track: TrackFile;
  sheet: Cheatsheet;
  sheets: Cheatsheet[];
  doc: ContentDoc;
}

const missing = { status: 'missing' } as const;

/** A download that failed because the file isn't there is a missing page; anything else is an error. */
const failure = (error: unknown) =>
  error instanceof HttpErrorResponse && error.status === 404 ? missing : ({ status: 'error' } as const);

export interface JavaBankData {
  topic: InterviewTopic;
  questions: JavaBankQuestion[];
}

/** /java/interview/:bankTopic: one topic of the question bank, or its tricky questions ("tricky"). */
export const javaBankResolver: ResolveFn<PageResult<JavaBankData>> = async (route) => {
  try {
    const { topic, questions } = await inject(ContentService).javaBank(route.paramMap.get('bankTopic') ?? '');
    return { status: 'ok', value: { topic, questions } };
  } catch (error) {
    return failure(error);
  }
};

/** "Collections · Java interview questions" */
export const javaBankTitleResolver: ResolveFn<string> = async (route) => {
  try {
    const { topic } = await inject(ContentService).javaBank(route.paramMap.get('bankTopic') ?? '');
    return `${topic.title} · Java interview questions`;
  } catch (error) {
    return failure(error).status === 'missing' ? 'Page not found' : 'Java interview questions';
  }
};

export interface MockInterviewData {
  topic: MockTopic;
  track: TrackFile;
  problem: ProblemMeta;
  /** null while the problem's breakdown, which the interview is built from, isn't written. */
  script: MockScriptFile | null;
}

/** /lld/interview/:problem and /hld/interview/:problem: a practice problem as a mock interview. */
export const mockInterviewResolver: ResolveFn<PageResult<MockInterviewData>> = async (route) => {
  const content = inject(ContentService);
  const topic = route.data['topic'] as MockTopic;
  const slug = route.paramMap.get('problem') ?? '';
  try {
    const track = await content.track(topic);
    const problem = track.problems.find((candidate) => candidate.slug === slug);
    if (!problem) return missing;
    const script = track.writtenProblems.includes(slug) ? await content.mockScript(topic, slug) : null;
    return { status: 'ok', value: { topic, track, problem, script } };
  } catch (error) {
    return failure(error);
  }
};

/** /:topic/:lesson */
export const lessonResolver: ResolveFn<PageResult<LessonData>> = async (route) => {
  const content = inject(ContentService);
  const topic = route.data['topic'] as TopicId;
  const slug = route.paramMap.get('lesson') ?? '';
  try {
    const track = await content.track(topic);
    const location = findLesson(track, slug);
    if (!location) return missing;
    const doc = location.lesson.comingSoon ? null : await content.lesson(topic, slug);
    // The next lesson is the likeliest next page.
    const next = flattenLessons(track)[location.index + 1]?.lesson;
    if (next && !next.comingSoon) content.prefetchLesson(topic, next.slug);
    return { status: 'ok', value: { track, location, doc } };
  } catch (error) {
    return failure(error);
  }
};

/** /:topic/problems/:problem (Java, LLD and HLD; DSA's coding questions are a list of their own). */
export const problemResolver: ResolveFn<PageResult<ProblemData>> = async (route) => {
  const content = inject(ContentService);
  const topic = route.data['topic'] as TopicId;
  const slug = route.paramMap.get('problem') ?? '';
  try {
    const track = await content.track(topic);
    const problem = track.problems.find((candidate) => candidate.slug === slug);
    if (!problem) return missing;
    const doc = track.writtenProblems.includes(slug) ? await content.problem(topic, slug) : null;
    return { status: 'ok', value: { track, problem, doc } };
  } catch (error) {
    return failure(error);
  }
};

/** /dsa/cheatsheets/:slug */
export const cheatsheetResolver: ResolveFn<PageResult<CheatsheetData>> = async (route) => {
  const content = inject(ContentService);
  const slug = route.paramMap.get('slug') ?? '';
  try {
    const [track, practice] = await Promise.all([content.track('dsa'), content.dsaPractice()]);
    const sheet = practice.cheatsheets.find((candidate) => candidate.slug === slug);
    if (!sheet) return missing;
    return { status: 'ok', value: { track, sheet, sheets: practice.cheatsheets, doc: await content.cheatsheet(slug) } };
  } catch (error) {
    return failure(error);
  }
};

/**
 * Lessons live at /:topic/:lesson, so that route must not take the names of the topics' section
 * pages (/java/notebook, /dsa/problems, …): a section a topic doesn't have (/dsa/interview) is a
 * page that doesn't exist, not a lesson.
 */
export const lessonSlugMatch: CanMatchFn = (_route, segments) =>
  !(RESERVED_SEGMENTS as readonly string[]).includes(segments[0]?.path ?? '');

// Page titles ("Generics Basics · Java"), worked out from the cached catalog files; the title
// strategy adds " · NeoLevelUP".

export const lessonTitleResolver: ResolveFn<string> = async (route) => {
  const topic = route.data['topic'] as TopicId;
  try {
    const track = await inject(ContentService).track(topic);
    const location = findLesson(track, route.paramMap.get('lesson') ?? '');
    return location ? `${location.lesson.title} · ${track.shortTitle}` : 'Page not found';
  } catch {
    return track404Title(topic);
  }
};

export const problemTitleResolver: ResolveFn<string> = async (route) => {
  const topic = route.data['topic'] as TopicId;
  try {
    const track = await inject(ContentService).track(topic);
    const problem = track.problems.find((candidate) => candidate.slug === route.paramMap.get('problem'));
    return problem ? `${problem.title} · ${track.shortTitle}` : 'Page not found';
  } catch {
    return track404Title(topic);
  }
};

/** "Mock interview: URL Shortener · HLD" */
export const mockInterviewTitleResolver: ResolveFn<string> = async (route) => {
  const topic = route.data['topic'] as TopicId;
  try {
    const track = await inject(ContentService).track(topic);
    const problem = track.problems.find((candidate) => candidate.slug === route.paramMap.get('problem'));
    return problem ? `Mock interview: ${problem.title} · ${track.shortTitle}` : 'Page not found';
  } catch {
    return track404Title(topic);
  }
};

/** "Arrays & Hashing · Coding questions · DSA" */
export const codingTopicTitleResolver: ResolveFn<string> = async (route) => {
  try {
    const { topics } = await inject(ContentService).dsaPractice();
    const topic = topics.find((candidate) => candidate.id === route.paramMap.get('practiceTopic'));
    return topic ? `${topic.title} · Coding questions · DSA` : 'Page not found';
  } catch {
    return 'Coding questions · DSA';
  }
};

export const libraryTitleResolver: ResolveFn<string> = async (route) => {
  const topic = route.data['topic'] as TopicId;
  try {
    return practiceCopy(await inject(ContentService).track(topic)).libraryTitle;
  } catch {
    return track404Title(topic);
  }
};

export const cheatsheetTitleResolver: ResolveFn<string> = async (route) => {
  try {
    const { cheatsheets } = await inject(ContentService).dsaPractice();
    const sheet = cheatsheets.find((candidate) => candidate.slug === route.paramMap.get('slug'));
    return sheet ? `${sheet.title} · DSA` : 'Page not found';
  } catch {
    return 'DSA';
  }
};

/** The topic's name, when its catalog couldn't be read (the page itself says so). */
const track404Title = (topic: TopicId) => TOPICS.find((info) => info.id === topic)?.title ?? topic;
