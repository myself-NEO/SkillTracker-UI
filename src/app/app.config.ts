import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAppScrolling } from './core/scrolling';
import { AppTitleStrategy } from './core/title.strategy';
import { AuthService } from './services/auth.service';
import { authInterceptor } from './interceptors/auth.interceptor';
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
    // Route data and resolved files reach the pages as inputs; #anchors scroll into view
    // (page-to-page scrolling is provideAppScrolling's).
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    provideAppScrolling(),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideHttpClient(withFetch(), withInterceptors([unauthorizedInterceptor, authInterceptor, apiBaseUrlInterceptor])),
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
