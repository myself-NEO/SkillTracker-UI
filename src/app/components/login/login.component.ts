import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { API_BASE_URL } from '../../config/api-base-url';
import { LucideLock, LucideShield, LucideUser, LucideSparkles, LucideUserCheck } from '@lucide/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideLock, LucideShield, LucideUser, LucideSparkles, LucideUserCheck],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  isRegister = false;
  email = '';
  password = '';
  fullName = '';
  error: string | null = null;
  loading = false;
  successMsg: string | null = null;

  private messageListener!: (e: MessageEvent) => void;

  // The Google callback page is served by the backend itself (see AuthController#googleCallback),
  // so the popup's postMessage originates from the API's origin, not this app's.
  private readonly backendOrigin = new URL(API_BASE_URL, window.location.origin).origin;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Setup message listener for Google OAuth login success inside popup window
    this.messageListener = async (e: MessageEvent) => {
      if (e.origin !== this.backendOrigin && e.origin !== window.location.origin) {
        return;
      }

      if (e.data?.type === 'OAUTH_AUTH_SUCCESS') {
        try {
          const user = await this.authService.checkSession();
          if (user) {
            this.router.navigate(['/dashboard']);
          } else {
            this.error = 'Failed to fetch user session details.';
          }
        } catch {
          this.error = 'Session retrieval failed.';
        }
      }
    };
    window.addEventListener('message', this.messageListener);
  }

  ngOnDestroy(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
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
        this.router.navigate(['/dashboard']);
      }
    } catch (err: any) {
      this.error = err.error || err.message || 'Something went wrong. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  async handleGoogleLogin(): Promise<void> {
    this.error = null;
    try {
      const url = await this.authService.getGoogleAuthUrl();

      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authWindow = window.open(
        url,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );

      if (!authWindow) {
        this.error = 'Popup blocked! Please allow popups for this site to log in with Google.';
      }
    } catch (err: any) {
      this.error = err.error || err.message || 'Failed to initialize Google Authentication';
    }
  }
}
