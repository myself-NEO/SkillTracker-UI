import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../core/theme.service';
import { AuthService } from '../services/auth.service';

/** The signed-in person's avatar, opening a small menu: who is signed in, the theme (phones), the Snake game, sign out. */
@Component({
  selector: 'app-account-menu',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative',
    '(document:click)': 'closeIfOutside($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
  template: `
    <button
      type="button"
      (click)="open.set(!open())"
      [attr.aria-expanded]="open()"
      aria-haspopup="menu"
      aria-label="Account"
      class="grid size-9 place-items-center overflow-hidden rounded-full border border-border bg-surface-2 text-sm font-semibold text-fg transition-colors hover:border-border-strong"
    >
      @if (user()?.picture; as picture) {
        <img [src]="picture" alt="" class="size-full object-cover" referrerpolicy="no-referrer" />
      } @else {
        {{ initial() }}
      }
    </button>
    @if (open()) {
      <div role="menu" class="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
        <div class="border-b border-border px-4 py-3">
          <p class="truncate text-sm font-semibold text-fg">{{ user()?.fullName || 'Signed in' }}</p>
          @if (user()?.email; as email) {
            <p class="truncate text-xs text-muted">{{ email }}</p>
          }
        </div>
        <button
          type="button"
          role="menuitem"
          (click)="theme.toggle()"
          class="block w-full px-4 py-2.5 text-left text-sm text-fg-soft hover:bg-surface-2 hover:text-fg sm:hidden"
        >
          {{ theme.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme' }}
        </button>
        <a role="menuitem" routerLink="/home" (click)="open.set(false)" class="block px-4 py-2.5 text-sm text-fg-soft hover:bg-surface-2 hover:text-fg">
          Play Snake
        </a>
        <button
          type="button"
          role="menuitem"
          (click)="signOut()"
          class="block w-full border-t border-border px-4 py-2.5 text-left text-sm text-danger hover:bg-danger-soft"
        >
          Sign out
        </button>
      </div>
    }
  `,
})
export class AccountMenuComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly element = inject(ElementRef<HTMLElement>);
  /** The menu also switches the theme on phones, where the header has no room for the toggle. */
  protected readonly theme = inject(ThemeService);

  protected readonly open = signal(false);
  protected readonly user = this.auth.currentUser;
  protected readonly initial = computed(() => (this.user()?.fullName || this.user()?.email || '?').trim().charAt(0).toUpperCase());

  protected closeIfOutside(event: Event) {
    if (this.open() && !this.element.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  protected async signOut() {
    this.open.set(false);
    await this.auth.logout();
    await this.router.navigate(['/home']);
  }
}
