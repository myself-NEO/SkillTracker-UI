import { Route, Routes } from '@angular/router';
import { TOPIC_IDS, TOPICS, type TopicId } from '@lib/topics';
import { authGuard, guestGuard, signedInMatch } from './auth.guard';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { contentIndexResolver, dsaPracticeResolver, trackResolver } from './core/content.resolvers';
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

/** One topic's pages, e.g. /java. The topic is in the route data; its curriculum is resolved once for all of them. */
const topicRoute = (topic: TopicId): Route => ({
  path: topic,
  data: { topic },
  resolve: { track: trackResolver, ...(topic === 'dsa' ? { practice: dsaPracticeResolver } : {}) },
  children: [{ path: '', title: TOPICS.find((info) => info.id === topic)!.title, loadComponent: topicPage }],
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
