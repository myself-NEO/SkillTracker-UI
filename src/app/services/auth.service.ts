import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from '../../types';

const GOOGLE_SIGN_IN_ERRORS: Record<string, string> = {
  cancelled: 'Google sign-in was cancelled.',
  email_unverified: "Your Google account's email address isn't verified, so it can't be used to sign in.",
  failed: 'Google sign-in failed. Please try again.'
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  loading = signal<boolean>(true);

  private readonly TOKEN_KEY = 'sde_prep_token';
  // The OAuth state of the Google sign-in this tab started. sessionStorage is per tab and survives
  // the round trip to Google and back.
  private readonly OAUTH_STATE_KEY = 'sde_prep_oauth_state';
  private pendingCheck: Promise<User | null> | null = null;
  private googleSignIn: Promise<void> | null = null;
  private googleSignInError: string | null = null;

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * The signed-in user, asking the backend only when it isn't known yet. Route guards call this on
   * every navigation, so after the first check switching pages costs no request. The token's expiry
   * is checked locally each time; any other problem with it (e.g. revoked or tampered) shows up as
   * a 401 on the next API call, which unauthorizedInterceptor turns into a logout.
   */
  async ensureSession(): Promise<User | null> {
    if (this.googleSignIn) {
      await this.googleSignIn;
    }
    const token = this.getToken();
    if (!token || this.isExpired(token)) {
      await this.logout();
      this.loading.set(false);
      return null;
    }
    return this.currentUser() ?? this.checkSession();
  }

  /** Always asks the backend (e.g. right after Google sign-in). Concurrent calls share one request. */
  checkSession(): Promise<User | null> {
    this.pendingCheck ??= this.fetchCurrentUser().finally(() => (this.pendingCheck = null));
    return this.pendingCheck;
  }

  private async fetchCurrentUser(): Promise<User | null> {
    if (!this.getToken()) {
      this.currentUser.set(null);
      this.loading.set(false);
      return null;
    }

    // The full-screen loader only covers the very first check, never a re-check.
    if (!this.currentUser()) {
      this.loading.set(true);
    }
    try {
      const user = await firstValueFrom(this.http.get<User>('/api/auth/me'));
      this.currentUser.set(user);
      return user;
    } catch (err) {
      // Only the backend rejecting the token ends the session. A timeout or network error (e.g. the
      // backend still waking up) keeps it, so the next navigation can simply try again.
      if (err instanceof HttpErrorResponse && err.status === 401) {
        await this.logout();
      }
      return this.currentUser();
    } finally {
      this.loading.set(false);
    }
  }

  /** Reads the JWT's `exp` claim without calling the backend. Undecodable → let the backend decide. */
  private isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
    } catch {
      return false;
    }
  }

  async login(payload: any): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.post<any>('/api/auth/login', payload));
      if (res && res.token) {
        this.setToken(res.token);
        this.currentUser.set(res.user);
      }
      return res;
    } catch (err: any) {
      throw err.error || err;
    }
  }

  async register(payload: any): Promise<any> {
    try {
      return await firstValueFrom(this.http.post<any>('/api/auth/register', payload));
    } catch (err: any) {
      throw err.error || err;
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
  }

  /**
   * Google sign-in, step 1: remember a fresh one-time state in this tab, then send the whole tab to
   * Google (a redirect, not a popup, so mobile browsers can't block it). The backend brings the
   * browser back to this site's root with the result in the URL fragment - see
   * captureGoogleRedirect.
   */
  async startGoogleSignIn(): Promise<void> {
    const state = this.newOAuthState();
    this.storeOAuthState(state);
    try {
      window.location.assign(await this.getGoogleAuthUrl(state));
    } catch (err) {
      this.storeOAuthState(null);
      throw err;
    }
  }

  /**
   * Google sign-in, step 2. Runs once at startup, before the first navigation (see app.config.ts):
   * picks up `#oauth_code=...&state=...` or `#oauth_error=...&state=...`, removes it from the
   * address bar, and accepts it only if the state is the one this tab stored before leaving - a
   * result for a sign-in someone else started (login CSRF) is dropped. The code is then traded for
   * the JWT; ensureSession waits for that, so the route guards see the signed-in user.
   */
  captureGoogleRedirect(): void {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const code = params.get('oauth_code');
    const error = params.get('oauth_error');
    if (!code && !error) {
      return;
    }
    history.replaceState(history.state, '', window.location.pathname + window.location.search);

    const expectedState = this.storedOAuthState();
    this.storeOAuthState(null);
    const state = params.get('state');
    if (!expectedState || state !== expectedState) {
      this.googleSignInError = "That Google sign-in wasn't started from this tab. Please try again.";
      return;
    }
    if (error || !code) {
      this.googleSignInError = GOOGLE_SIGN_IN_ERRORS[error ?? 'failed'] ?? GOOGLE_SIGN_IN_ERRORS['failed'];
      return;
    }
    this.googleSignIn = this.completeGoogleSignIn(code, state).finally(() => (this.googleSignIn = null));
  }

  hasGoogleSignInError(): boolean {
    return this.googleSignInError !== null;
  }

  /** The message for a Google sign-in that just came back unsuccessfully, shown once. */
  takeGoogleSignInError(): string | null {
    const message = this.googleSignInError;
    this.googleSignInError = null;
    return message;
  }

  private async completeGoogleSignIn(code: string, state: string): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ token: string; user: User }>('/api/auth/google/exchange', { code, state })
      );
      this.setToken(res.token);
      this.currentUser.set(res.user);
    } catch {
      this.googleSignInError = 'Google sign-in could not be completed. Please try again.';
    } finally {
      this.loading.set(false);
    }
  }

  private async getGoogleAuthUrl(state: string): Promise<string> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ url: string }>('/api/auth/google-url', { params: { state } })
      );
      return res.url;
    } catch (err: any) {
      if (err?.status === 429 && err.error?.message) {
        throw new Error(err.error.message);
      }
      if (err?.status === 501) {
        throw new Error("Google sign-in isn't configured on this server. Please use your email and password.");
      }
      throw new Error('Google sign-in is unavailable right now. Please try again or use your email and password.');
    }
  }

  /** 32 random bytes, base64url-encoded (43 characters, URL-safe). */
  private newOAuthState(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private storedOAuthState(): string | null {
    try {
      return sessionStorage.getItem(this.OAUTH_STATE_KEY);
    } catch {
      return null;
    }
  }

  private storeOAuthState(state: string | null): void {
    try {
      if (state) {
        sessionStorage.setItem(this.OAUTH_STATE_KEY, state);
      } else {
        sessionStorage.removeItem(this.OAUTH_STATE_KEY);
      }
    } catch {
      // Storage unavailable: the returning sign-in will fail the state check and ask to retry.
    }
  }
}
