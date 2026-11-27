import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '../core/theme.service';

/**
 * Full-screen dark frame of the public pages: the Snake game and the login page. Default change
 * detection, like AppComponent, so their async updates show.
 */
@Component({
  selector: 'app-game-layout',
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-[#0c0d19] via-[#090a0f] to-black text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] opacity-25 pointer-events-none"></div>
      <div class="absolute bottom-[-5%] right-[5%] w-[400px] h-[400px] bg-indigo-900 rounded-full blur-[100px] opacity-25 pointer-events-none"></div>
      <main class="flex-1 z-10 flex items-center justify-center">
        <router-outlet />
      </main>
    </div>
  `,
})
export class GameLayoutComponent {
  constructor() {
    inject(ThemeService).forceDark(true);
  }
}
