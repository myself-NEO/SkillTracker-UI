import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * The backend answers 401 when the token is no longer accepted. Since the session is only checked
 * once per page load (AuthService#ensureSession), this is where a session that ended in the
 * meantime gets noticed: sign out and go back to the home page.
 */
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      const sessionRejected =
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        req.url.startsWith('/api/') &&
        req.url !== '/api/auth/login' && // a wrong password is also a 401, but there is no session yet
        !!authService.getToken();
      if (sessionRejected) {
        authService.logout();
        router.navigate(['/home']);
      }
      return throwError(() => err);
    })
  );
};
