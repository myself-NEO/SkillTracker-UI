import { Route, Routes } from '@angular/router';
import { hasSection } from '@lib/sections';
import { TOPIC_IDS, TOPICS, type TopicId } from '@lib/topics';
import { authGuard, guestGuard, signedInMatch } from './auth.guard';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import {
  cheatsheetResolver,
  cheatsheetTitleResolver,
  codingTopicTitleResolver,
  contentIndexResolver,
  dsaPracticeResolver,
  javaBankResolver,
  javaBankTitleResolver,
  javaQuestionsResolver,
  lessonResolver,
  lessonSlugMatch,
  lessonTitleResolver,
  libraryTitleResolver,
  mockHubResolver,
  mockInterviewResolver,
  mockInterviewTitleResolver,
  problemResolver,
  problemTitleResolver,
  sceneTitleResolver,
  trackResolver,
  visualizeResolver,
} from './core/content.resolvers';
import { GameLayoutComponent } from './layouts/game-layout.component';

/** The signed-in frame, loaded with the first page behind the login. */
const shell = () => import('./shell/shell.component').then((m) => m.ShellComponent);

// Three frames:
// - GameLayout: the public pages, Snake and the login. They load with the app, so the landing page
//   shows at once.
// - Shell: the signed-in app, with TheSWEguide's content at TheSWEguide's URLs (/java, /dsa/...), so
//   links inside lessons work unchanged.
// - LegacyLayout: the old Dashboard and Roadmaps, out of the navigation and removed in Phase 6.
// Everything behind the login is loaded on demand, which keeps the first download small.

const topicPage = () => import('./pages/topic/topic-page.component').then((m) => m.TopicPageComponent);
const lessonPage = () => import('./pages/lesson/lesson-page.component').then((m) => m.LessonPageComponent);
const problemPage = () => import('./pages/problems/problem-page.component').then((m) => m.ProblemPageComponent);
const libraryPage = () =>
  import('./pages/problems/problem-library-page.component').then((m) => m.ProblemLibraryPageComponent);
const cheatsheetPage = () => import('./pages/cheatsheet/cheatsheet-page.component').then((m) => m.CheatsheetPageComponent);
const estimatorPage = () => import('./pages/estimator/estimator-page.component').then((m) => m.EstimatorPageComponent);
const notebookPage = () => import('./pages/notebook/notebook-page.component').then((m) => m.NotebookPageComponent);
const progressPage = () => import('./pages/progress/progress-page.component').then((m) => m.ProgressPageComponent);
const codingPage = () => import('./pages/dsa/coding-questions-page.component').then((m) => m.CodingQuestionsPageComponent);
const dsaNotesPage = () => import('./pages/dsa/dsa-notes-page.component').then((m) => m.DsaNotesPageComponent);
const javaBankPage = () => import('./pages/interview/java-bank-page.component').then((m) => m.JavaBankPageComponent);
const javaBankTopicPage = () =>
  import('./pages/interview/java-bank-topic-page.component').then((m) => m.JavaBankTopicPageComponent);
const mockListPage = () => import('./pages/interview/mock/mock-list-page.component').then((m) => m.MockListPageComponent);
const mockProblemPage = () =>
  import('./pages/interview/mock/mock-problem-page.component').then((m) => m.MockProblemPageComponent);

/**
 * One topic's pages, e.g. /java. The topic is in the route data; its curriculum is resolved once for
 * all of them (and DSA's coding questions). Section pages come before /:lesson, which never takes a
 * section's name (lessonSlugMatch): a section the topic doesn't have is a page that doesn't exist.
 * DSA's practice is its coding-question list (/dsa/problems), and it has interview notes instead of
 * a notebook; Java's interview prep is a question bank, LLD's and HLD's are mock interviews.
 */
const topicRoute = (topic: TopicId): Route => ({
  path: topic,
  data: { topic },
  resolve: { track: trackResolver, ...(topic === 'dsa' ? { practice: dsaPracticeResolver } : {}) },
  children: [
    { path: '', title: TOPICS.find((info) => info.id === topic)!.title, loadComponent: topicPage },
    ...(topic === 'dsa'
      ? [
          {
            path: 'cheatsheets/:slug',
            title: cheatsheetTitleResolver,
            resolve: { page: cheatsheetResolver },
            loadComponent: cheatsheetPage,
          },
          { path: 'problems', title: 'Coding questions · DSA', loadComponent: codingPage },
          { path: 'problems/:practiceTopic', title: codingTopicTitleResolver, loadComponent: codingPage },
          { path: 'notes', title: 'DSA interview notes', loadComponent: dsaNotesPage },
        ]
      : [
          { path: 'problems', title: libraryTitleResolver, loadComponent: libraryPage },
          {
            path: 'problems/:problem',
            title: problemTitleResolver,
            resolve: { page: problemResolver },
            loadComponent: problemPage,
          },
        ]),
    ...(topic === 'hld' ? [{ path: 'estimator', title: 'Capacity estimator · HLD', loadComponent: estimatorPage }] : []),
    ...(topic === 'java'
      ? [
          {
            path: 'interview',
            title: 'Java interview questions',
            resolve: { questions: javaQuestionsResolver },
            loadComponent: javaBankPage,
          },
          {
            path: 'interview/:bankTopic',
            title: javaBankTitleResolver,
            resolve: { page: javaBankResolver },
            loadComponent: javaBankTopicPage,
          },
        ]
      : []),
    // LLD and HLD: every practice problem as a timed mock interview.
    ...(topic === 'lld' || topic === 'hld'
      ? [
          {
            path: 'interview',
            title: `${TOPICS.find((info) => info.id === topic)!.shortTitle} mock interviews`,
            loadComponent: mockListPage,
          },
          {
            path: 'interview/:problem',
            title: mockInterviewTitleResolver,
            resolve: { page: mockInterviewResolver },
            loadComponent: mockProblemPage,
          },
        ]
      : []),
    {
      path: 'progress',
      title: `Your ${TOPICS.find((info) => info.id === topic)!.shortTitle} progress`,
      resolve: topic === 'java' ? { questions: javaQuestionsResolver } : {},
      loadComponent: progressPage,
    },
    ...(hasSection(topic, 'notebook')
      ? [
          {
            path: 'notebook',
            title: `${TOPICS.find((info) => info.id === topic)!.shortTitle} revision notebook`,
            resolve: topic === 'java' ? { questions: javaQuestionsResolver } : {},
            loadComponent: notebookPage,
          },
        ]
      : []),
    {
      path: ':lesson',
      canMatch: [lessonSlugMatch],
      title: lessonTitleResolver,
      resolve: { page: lessonResolver },
      loadComponent: lessonPage,
    },
  ],
});

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: '',
    component: GameLayoutComponent,
    children: [
      // Everyone, signed in or not, can play; signed-in users get a link to their topics.
      { path: 'home', component: HomeComponent },
      { path: 'login', title: 'Log in', component: LoginComponent, canActivate: [guestGuard] },
    ],
  },
  {
    path: '',
    loadComponent: shell,
    canActivateChild: [authGuard],
    children: [
      {
        path: 'learn',
        title: 'All topics',
        resolve: { index: contentIndexResolver },
        loadComponent: () => import('./pages/learn/learn-page.component').then((m) => m.LearnPageComponent),
      },
      {
        path: 'visualize',
        title: 'Animations',
        resolve: { index: visualizeResolver },
        loadComponent: () => import('./pages/visualize/gallery-page.component').then((m) => m.GalleryPageComponent),
      },
      {
        path: 'visualize/:scene',
        title: sceneTitleResolver,
        resolve: { index: visualizeResolver },
        loadComponent: () => import('./pages/visualize/scene-page.component').then((m) => m.ScenePageComponent),
      },
      {
        path: 'mock-interview',
        title: 'Mock interviews',
        resolve: { hub: mockHubResolver },
        loadComponent: () =>
          import('./pages/mock-interview/mock-interview-page.component').then((m) => m.MockInterviewPageComponent),
      },
      ...TOPIC_IDS.map(topicRoute),
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layouts/legacy-layout.component').then((m) => m.LegacyLayoutComponent),
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'roadmaps',
        title: 'Roadmaps',
        loadComponent: () => import('./components/roadmaps/roadmaps.component').then((m) => m.RoadmapsComponent),
      },
    ],
  },
  {
    // Any other URL: the not-found page inside the app for members, the Snake page for everyone else.
    path: '',
    loadComponent: shell,
    canMatch: [signedInMatch],
    children: [
      {
        path: '**',
        title: 'Page not found',
        loadComponent: () => import('./pages/not-found/not-found-page.component').then((m) => m.NotFoundPageComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
