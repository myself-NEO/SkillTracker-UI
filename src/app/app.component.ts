import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  /** The Snake home page keeps its full-screen layout (no navbar) even for signed-in users. */
  onHome = signal(AppComponent.isHomeUrl(window.location.pathname));

  constructor(public authService: AuthService, private http: HttpClient, private router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((e) => this.onHome.set(AppComponent.isHomeUrl(e.urlAfterRedirects)));
  }

  private static isHomeUrl(url: string): boolean {
    const path = url.split(/[?#]/)[0];
    return path === '/' || path === '/home';
  }

  async ngOnInit(): Promise<void> {
    // The backend sleeps when idle (Render free tier) and takes a while to boot. Wake it up as soon
    // as anyone opens the app, on any page, so it is ready by the time they log in. The answer
    // itself doesn't matter.
    this.http.get('/api/health').subscribe({ error: () => {} });

    await this.authService.ensureSession();

    // Back from Google: signed in -> straight to the dashboard (Google returns to the site root,
    // which is the Snake page); unsuccessful -> the login page shows why.
    if (this.authService.takeGoogleSignInCompleted()) {
      this.router.navigate(['/dashboard']);
    } else if (this.authService.hasGoogleSignInError()) {
      this.router.navigate(['/login']);
    }
  }
}
