import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { safeReturnUrl, SIGNED_IN_HOME } from './core/return-url';
import { AuthService } from './services/auth.service';

/**
 * Pages behind the login. Signed-out visitors go to the login page, which brings them back here
 * afterwards. Used as `canActivateChild`, so it runs on every navigation inside the app: the token's
 * expiry is checked locally, so this never waits for the backend.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  if (await inject(AuthService).ensureSession()) {
    return true;
  }
  return router.createUrlTree(['/login'], {
    queryParams: state.url === SIGNED_IN_HOME ? {} : { returnUrl: state.url },
  });
};

/** The login page: a visitor who is already signed in goes on to where they were heading. */
export const guestGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  if (!(await inject(AuthService).ensureSession())) {
    return true;
  }
  return router.parseUrl(safeReturnUrl(route.queryParamMap.get('returnUrl')));
};

/** Matches only while signed in, so unknown URLs show the app's not-found page to members and the Snake page to everyone else. */
export const signedInMatch: CanMatchFn = () => inject(AuthService).ensureSession();
