import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterOutlet } from '@angular/router';
import { safeReturnUrl } from './core/return-url';
import { AuthService } from './services/auth.service';

/**
 * The app's root: each page brings its own frame (see app.routes.ts). Default change detection: the
 * pages from before the redesign (Snake, login, the old dashboard) update plain fields after async
 * work, which an OnPush ancestor would never show.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /** Back from Google and signed in: the loader stays up until the page the visitor wanted is open. */
  protected readonly redirecting = signal(this.authService.loading());

  async ngOnInit(): Promise<void> {
    // The backend sleeps when idle (Render free tier) and takes a while to boot. Wake it up as soon
    // as anyone opens the app, on any page, so it is ready by the time they log in. The answer
    // itself doesn't matter.
    this.http.get('/api/health').subscribe({ error: () => {} });

    await this.authService.ensureSession();

    // Back from Google (which returns to the site root, the Snake page): signed in -> on to the
    // page they were heading for; unsuccessful -> the login page shows why.
    const returnUrl = this.authService.takeGoogleReturnUrl();
    try {
      if (this.authService.takeGoogleSignInCompleted()) {
        await this.router.navigateByUrl(safeReturnUrl(returnUrl));
      } else if (this.authService.hasGoogleSignInError()) {
        await this.router.navigate(['/login'], { queryParams: returnUrl ? { returnUrl } : {} });
      }
    } finally {
      this.redirecting.set(false);
    }
  }
}
