import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { ThemeService } from '../core/theme.service';

/**
 * The original signed-in frame (dark, with the old navbar) for the Dashboard and Roadmaps pages.
 * They are no longer in the navigation and go away in Phase 6 of docs/plan.md. Default change
 * detection, like AppComponent, so their async updates show.
 */
@Component({
  selector: 'app-legacy-layout',
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-[#0c0d19] via-[#090a0f] to-black text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div class="absolute bottom-[-5%] right-[5%] w-[400px] h-[400px] bg-indigo-900 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
      <app-navbar />
      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <router-outlet />
      </main>
      <footer class="border-t border-white/10 bg-white/5 backdrop-blur-md py-6 text-center text-slate-400 text-[10px] uppercase font-bold tracking-wider z-10">
        <span>NeoLevelUP © 2026 • Made for YOU !</span>
      </footer>
    </div>
  `,
})
export class LegacyLayoutComponent {
  constructor() {
    inject(ThemeService).forceDark(true);
  }
}
