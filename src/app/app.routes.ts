import { Route, Routes } from '@angular/router';
import { TOPIC_IDS, TOPICS, type TopicId } from '@lib/topics';
import { authGuard, guestGuard, signedInMatch } from './auth.guard';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import {
  cheatsheetResolver,
  cheatsheetTitleResolver,
  contentIndexResolver,
  dsaPracticeResolver,
  lessonResolver,
  lessonSlugMatch,
  lessonTitleResolver,
  libraryTitleResolver,
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

/**
 * One topic's pages, e.g. /java. The topic is in the route data; its curriculum is resolved once for
 * all of them. Section pages come before /:lesson, which leaves the sections not ported yet
 * (lessonSlugMatch) to the not-found page. DSA's practice is its coding-question list (Phase 5).
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
