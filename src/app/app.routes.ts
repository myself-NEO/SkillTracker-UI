import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard, guestGuard } from './auth.guard';

// Snake and the login page load with the app, so the landing page shows at once. Everything behind
// the login is loaded on demand, which keeps the first download small.
export const routes: Routes = [
  {
    // Everyone, signed in or not, lands on the Snake page; signed-in users get a link to the dashboard.
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'roadmaps',
    loadComponent: () => import('./components/roadmaps/roadmaps.component').then(m => m.RoadmapsComponent),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
