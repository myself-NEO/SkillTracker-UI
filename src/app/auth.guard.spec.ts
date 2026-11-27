import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './services/auth.service';

describe('route guards', () => {
  let signedIn = false;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { ensureSession: async () => signedIn } }],
    });
  });

  const runAuthGuard = (url: string) =>
    TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));

  const runGuestGuard = (returnUrl?: string) =>
    TestBed.runInInjectionContext(() =>
      guestGuard(
        { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) } as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

  const serialize = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  it('lets a signed-in visitor through', async () => {
    signedIn = true;
    expect(await runAuthGuard('/java')).toBe(true);
  });

  it('sends a signed-out visitor to the login page, remembering where they were going', async () => {
    signedIn = false;
    expect(serialize(await runAuthGuard('/dsa?tab=1'))).toBe('/login?returnUrl=%2Fdsa%3Ftab%3D1');
    // The hub is where signing in lands anyway.
    expect(serialize(await runAuthGuard('/learn'))).toBe('/login');
  });

  it('shows the login page only when signed out', async () => {
    signedIn = false;
    expect(await runGuestGuard('/hld')).toBe(true);
  });

  it('sends a signed-in visitor on from the login page to their return URL, or the hub', async () => {
    signedIn = true;
    expect(serialize(await runGuestGuard('/hld'))).toBe('/hld');
    expect(serialize(await runGuestGuard('https://example.com'))).toBe('/learn');
    expect(serialize(await runGuestGuard())).toBe('/learn');
  });
});
