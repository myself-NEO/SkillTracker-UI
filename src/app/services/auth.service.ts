import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from '../../types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  loading = signal<boolean>(true);

  private readonly TOKEN_KEY = 'sde_prep_token';
  private pendingCheck: Promise<User | null> | null = null;

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

  async getGoogleAuthUrl(state: string): Promise<string> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ url: string }>('/api/auth/google-url', { params: { state } })
      );
      return res.url;
    } catch (err: any) {
      if (err?.status === 501) {
        throw new Error("Google sign-in isn't configured on this server. Please use your email and password.");
      }
      throw new Error('Google sign-in is unavailable right now. Please try again or use your email and password.');
    }
  }
}
