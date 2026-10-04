import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from '../../types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  loading = signal<boolean>(true);

  private readonly TOKEN_KEY = 'sde_prep_token';

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  async checkSession(): Promise<User | null> {
    this.loading.set(true);
    const token = this.getToken();
    if (!token) {
      this.currentUser.set(null);
      this.loading.set(false);
      return null;
    }

    try {
      const user = await firstValueFrom(this.http.get<User>('/api/auth/me'));
      this.currentUser.set(user);
      return user;
    } catch {
      await this.logout();
      return null;
    } finally {
      this.loading.set(false);
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
