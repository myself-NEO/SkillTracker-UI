import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../config/api-base-url';
import { AuthService } from '../services/auth.service';
import { apiBaseUrlInterceptor } from './api-base-url.interceptor';
import { authInterceptor } from './auth.interceptor';
import { unauthorizedInterceptor } from './unauthorized.interceptor';

/** The three interceptors in app.config.ts order: every API call goes through them. */
describe('HTTP interceptors', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const navigate = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    navigate.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([unauthorizedInterceptor, authInterceptor, apiBaseUrlInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } }
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('sends /api calls to the backend origin', () => {
    http.get('/api/health').subscribe();
    backend.expectOne(`${API_BASE_URL}/api/health`).flush({ status: 'ok' });
  });

  it('leaves other URLs alone', () => {
    http.get('/assets/logo.svg').subscribe();
    backend.expectOne('/assets/logo.svg').flush('');
  });

  it('adds the saved token to /api calls only', () => {
    localStorage.setItem('sde_prep_token', 'abc.def.ghi');

    http.get('/api/state').subscribe();
    http.get('/assets/logo.svg').subscribe();

    expect(backend.expectOne(`${API_BASE_URL}/api/state`).request.headers.get('Authorization')).toBe('Bearer abc.def.ghi');
    expect(backend.expectOne('/assets/logo.svg').request.headers.has('Authorization')).toBe(false);
    backend.match(() => true).forEach((r) => r.flush({}));
  });

  it('sends no Authorization header when signed out', () => {
    http.get('/api/auth/me').subscribe({ error: () => {} });
    expect(backend.expectOne(`${API_BASE_URL}/api/auth/me`).request.headers.has('Authorization')).toBe(false);
  });

  it('logs out and goes home when the backend rejects the token', () => {
    localStorage.setItem('sde_prep_token', 'abc.def.ghi');
    const logout = vi.spyOn(TestBed.inject(AuthService), 'logout');

    http.get('/api/state').subscribe({ error: () => {} });
    backend.expectOne(`${API_BASE_URL}/api/state`).flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/home']);
  });

  it('treats a 401 from the login form as a wrong password, not an ended session', () => {
    localStorage.setItem('sde_prep_token', 'abc.def.ghi');
    const logout = vi.spyOn(TestBed.inject(AuthService), 'logout');

    http.post('/api/auth/login', {}).subscribe({ error: () => {} });
    backend.expectOne(`${API_BASE_URL}/api/auth/login`).flush({ message: 'Invalid email or password' }, { status: 401, statusText: 'Unauthorized' });

    expect(logout).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
