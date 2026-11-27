import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const SITE_NAME = 'NeoLevelUP';

/** Page titles read "Java · NeoLevelUP"; a route without a title shows the site name alone. */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    this.title.setTitle(title ? `${title} · ${SITE_NAME}` : SITE_NAME);
  }
}
