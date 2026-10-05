import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { authInterceptor } from './interceptors/auth.interceptor';
import { mockApiInterceptor } from './interceptors/mock-api.interceptor';
import { apiBaseUrlInterceptor } from './interceptors/api-base-url.interceptor';
import { unauthorizedInterceptor } from './interceptors/unauthorized.interceptor';
import { provideLucideIcons,
  LucideBookOpen,
  LucideCheck,
  LucideClock,
  LucideCode,
  LucideCompass,
  LucideShield,
  LucideSparkles,
  LucideStar,
  LucideTarget,
  LucideTrash2,
  LucideUser,
  LucideLogOut,
  LucideChevronRight,
  LucideMenu,
  LucidePlus,
  LucideCalendar,
  LucideCircle,
  LucideCheckCircle2,
  LucideCheckCircle,
  LucideHelpCircle,
  LucideUserCheck,
  LucideAward,
  LucideLock,
  LucideChevronDown,
  LucideLayoutDashboard,
  LucideMap,
  LucideCpu,
  LucideKeyRound
} from '@lucide/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([unauthorizedInterceptor, authInterceptor, mockApiInterceptor, apiBaseUrlInterceptor])),
    provideAnimations(),
    // Before the first navigation: pick up a Google sign-in result from the URL (AuthService).
    provideAppInitializer(() => inject(AuthService).captureGoogleRedirect()),
    
    // Modern provider registration for Lucide icons
    provideLucideIcons(
      LucideBookOpen,
      LucideCheck,
      LucideClock,
      LucideCode,
      LucideCompass,
      LucideShield,
      LucideSparkles,
      LucideStar,
      LucideTarget,
      LucideTrash2,
      LucideUser,
      LucideLogOut,
      LucideChevronRight,
      LucideMenu,
      LucidePlus,
      LucideCalendar,
      LucideCircle,
      LucideCheckCircle2,
      LucideCheckCircle,
      LucideHelpCircle,
      LucideUserCheck,
      LucideAward,
      LucideLock,
      LucideChevronDown,
      LucideLayoutDashboard,
      LucideMap,
      LucideCpu,
      LucideKeyRound
    )
  ]
};
