import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RoadmapsComponent } from './components/roadmaps/roadmaps.component';
import { authGuard, guestGuard } from './auth.guard';

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
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'roadmaps',
    component: RoadmapsComponent,
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
