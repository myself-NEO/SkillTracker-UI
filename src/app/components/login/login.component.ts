import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { safeReturnUrl } from '../../core/return-url';
import { AuthService } from '../../services/auth.service';
import { LucideLock, LucideShield, LucideUser, LucideSparkles, LucideUserCheck } from '@lucide/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideLock, LucideShield, LucideUser, LucideSparkles, LucideUserCheck],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  isRegister = false;
  email = '';
  password = '';
  fullName = '';
  error: string | null = null;
  loading = false;
  successMsg: string | null = null;
  googleRedirecting = false;

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {}

  /** The page that sent the visitor here to sign in (authGuard adds it), opened afterwards. */
  private get returnUrl(): string | null {
    return this.route.snapshot.queryParamMap.get('returnUrl');
  }

  ngOnInit(): void {
    // A Google sign-in that just came back unsuccessfully (see AuthService#captureGoogleRedirect).
    this.error = this.authService.takeGoogleSignInError();
  }

  // Coming back with the browser's Back button can restore this page exactly as it was left,
  // button still disabled; re-enable it.
  @HostListener('window:pageshow', ['$event'])
  onPageShow(event: PageTransitionEvent): void {
    if (event.persisted) {
      this.googleRedirecting = false;
    }
  }

  toggleView(): void {
    this.isRegister = !this.isRegister;
    this.error = null;
    this.successMsg = null;
    this.email = '';
    this.password = '';
    this.fullName = '';
  }

  async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    this.error = null;
    this.successMsg = null;
    this.loading = true;

    try {
      if (this.isRegister) {
        await this.authService.register({
          email: this.email,
          password: this.password,
          fullName: this.fullName
        });
        this.successMsg = 'Account created! You can now log in using your credentials.';
        this.isRegister = false;
        this.password = '';
      } else {
        await this.authService.login({
          email: this.email,
          password: this.password
        });
        this.router.navigateByUrl(safeReturnUrl(this.returnUrl));
      }
    } catch (err: any) {
      this.error = err.error || err.message || 'Something went wrong. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  async handleGoogleLogin(): Promise<void> {
    this.error = null;
    this.googleRedirecting = true;
    try {
      // Leaves this page for Google; we come back to the site root once the user has signed in,
      // and AppComponent opens the page they were heading for.
      await this.authService.startGoogleSignIn(this.returnUrl);
    } catch (err: any) {
      this.googleRedirecting = false;
      this.error = err.error || err.message || 'Failed to initialize Google Authentication';
    }
  }
}
