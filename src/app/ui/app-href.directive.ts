import { Directive, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { routeLinkClick } from './app-links';

/**
 * A link to a page of this app given as one string, which may end in a #section
 * (`<a [appHref]="'/java/generics#wildcards'">`). Clicking it routes within the app; opening it in a
 * new tab works as with any link. (routerLink would treat the # as part of the path.)
 */
@Directive({
  selector: 'a[appHref]',
  host: { '[attr.href]': 'appHref()', '(click)': 'onClick($event)' },
})
export class AppHrefDirective {
  private readonly router = inject(Router);
  readonly appHref = input.required<string>();

  protected onClick(event: MouseEvent) {
    routeLinkClick(event, this.router);
  }
}
