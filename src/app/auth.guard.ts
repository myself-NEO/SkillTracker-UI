import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (await authService.ensureSession()) {
    return true;
  }

  router.navigate(['/home']);
  return false;
};

export const guestGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!(await authService.ensureSession())) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
