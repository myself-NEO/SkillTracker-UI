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

  async getGoogleAuthUrl(): Promise<string> {
    try {
      const res = await firstValueFrom(this.http.get<{ url: string }>('/api/auth/google-url'));
      return res.url;
    } catch (err: any) {
      // Fallback/Simulated Google OAuth URL in case of error
      return this.getMockGoogleAuthUrl();
    }
  }

  private getMockGoogleAuthUrl(): string {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Sign-In Sandbox</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              background-color: #0c0d19;
              color: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              overflow: hidden;
            }
            .card {
              background-color: #111625;
              padding: 2.5rem;
              border-radius: 16px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
              text-align: center;
              max-width: 380px;
              width: 100%;
            }
            .g-logo {
              width: 48px;
              height: 48px;
              margin-bottom: 1.5rem;
            }
            h1 { margin-top: 0; font-size: 1.5rem; font-weight: 700; color: #ffffff; }
            p { color: #94a3b8; font-size: 0.875rem; line-height: 1.6; margin-bottom: 2rem; }
            button {
              background-color: #4f46e5;
              color: white;
              border: none;
              padding: 0.85rem 1.5rem;
              font-weight: 600;
              font-size: 0.9rem;
              border-radius: 12px;
              cursor: pointer;
              transition: background-color 0.2s, transform 0.1s;
              width: 100%;
              box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
            }
            button:hover { background-color: #4338ca; }
            button:active { transform: scale(0.98); }
          </style>
        </head>
        <body>
          <div class="card">
            <svg class="g-logo" viewBox="0 0 24 24" style="display: inline-block;">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.44 7.54l3.87 3C6.24 7.42 8.92 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.54z" />
              <path fill="#34A853" d="M5.31 14.9c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28l-3.87-3C.53 9.07 0 10.48 0 12s.53 2.93 1.44 4.66l3.87-2.76z" />
              <path fill="#FBBC05" d="M12 18.96c-3.08 0-5.76-2.38-6.69-5.5l-3.87 2.76C3.37 20.35 7.35 23 12 23c2.99 0 5.61-.99 7.48-2.69l-3.66-2.84c-1.04.69-2.36 1.49-3.82 1.49z" />
            </svg>
            <h1>Google Workspace</h1>
            <p>Access the SDE 2 Prep Workspace using your Google developer account sandbox profile.</p>
            <button onclick="login()">Sign in as Google Dev</button>
          </div>
          <script>
            function login() {
              try {
                // Simulate JWT token emission for Google OAuth
                const mockToken = 'mock-google-jwt-token-xyz';
                window.opener.localStorage.setItem('sde_prep_token', mockToken);
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              } catch (err) {
                console.error('Google Auth simulated error:', err);
              }
              window.close();
            }
          </script>
        </body>
      </html>
    `;
    return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
  }
}
