import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

/** A JWT whose payload is {"sub":"u1","exp":<expSeconds>}; the signature isn't checked client-side. */
function token(expSeconds: number): string {
  const payload = btoa(JSON.stringify({ sub: 'u1', exp: expSeconds })).replace(/=+$/, '');
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`;
}

describe('AuthService.ensureSession', () => {
  let auth: AuthService;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    auth = TestBed.inject(AuthService);
    backend = TestBed.inject(HttpTestingController);
  });

  it('is signed out without a token', async () => {
    expect(await auth.ensureSession()).toBe(false);
    expect(auth.signedIn()).toBe(false);
  });

  it('drops an expired token without asking the backend', async () => {
    localStorage.setItem('sde_prep_token', token(Math.floor(Date.now() / 1000) - 60));

    expect(await auth.ensureSession()).toBe(false);
    expect(localStorage.getItem('sde_prep_token')).toBeNull();
    backend.expectNone('/api/auth/me');
  });

  it('is signed in at once with a valid token, and loads the profile in the background', async () => {
    localStorage.setItem('sde_prep_token', token(Math.floor(Date.now() / 1000) + 3600));

    expect(await auth.ensureSession()).toBe(true);
    expect(auth.signedIn()).toBe(true);

    backend.expectOne('/api/auth/me').flush({ id: 'u1', email: 'ann@example.com', fullName: 'Ann' });
    await Promise.resolve();
    expect(auth.currentUser()?.email).toBe('ann@example.com');
  });

  it('keeps the session when the backend is still waking up', async () => {
    localStorage.setItem('sde_prep_token', token(Math.floor(Date.now() / 1000) + 3600));
    await auth.ensureSession();

    backend.expectOne('/api/auth/me').flush('', { status: 503, statusText: 'Service Unavailable' });
    await Promise.resolve();

    expect(auth.signedIn()).toBe(true);
    expect(localStorage.getItem('sde_prep_token')).not.toBeNull();
  });
});
