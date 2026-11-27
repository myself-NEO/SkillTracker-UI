import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildLoadBalancer, LOAD_BALANCER_DEFAULTS } from '@lib/viz/scenes/load-balancer/logic';
import { buildSlidingWindow, SLIDING_WINDOW_DEFAULTS } from '@lib/viz/scenes/sliding-window/logic';
import { FlipDirective, FlipScopeDirective } from './motion';
import { ScenePlayerComponent, type VizSpec } from './scene-player.component';

@Component({
  imports: [ScenePlayerComponent],
  template: `<app-scene-player [viz]="viz()" />`,
})
class PlayerHostComponent {
  readonly viz = signal<VizSpec>({ scene: 'load-balancer', title: 'Round robin', mode: 'stepper', params: LOAD_BALANCER_DEFAULTS });
}

describe('ScenePlayerComponent', () => {
  const render = async (viz?: VizSpec) => {
    const fixture = TestBed.createComponent(PlayerHostComponent);
    if (viz) fixture.componentInstance.viz.set(viz);
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    await settle();
    return { settle, element: fixture.nativeElement as HTMLElement };
  };
  const button = (element: HTMLElement, label: string) => element.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const counter = (element: HTMLElement) => element.querySelector('figcaption span:last-child')?.textContent?.trim();
  const caption = (element: HTMLElement) => element.querySelector('p[aria-live]')?.textContent?.trim();

  it('steps through the frames, and back to the start', async () => {
    const frames = buildLoadBalancer(LOAD_BALANCER_DEFAULTS);
    const { element, settle } = await render();
    expect(counter(element)).toBe(`Step 1 of ${frames.length}`);
    expect(caption(element)).toBe(frames[0].caption);
    expect(button(element, 'Previous step').disabled).toBe(true);

    button(element, 'Next step').click();
    await settle();
    expect(counter(element)).toBe(`Step 2 of ${frames.length}`);
    expect(caption(element)).toBe(frames[1].caption);

    const figure = element.querySelector<HTMLElement>('figure[data-viz="stepper"]')!;
    figure.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await settle();
    expect(counter(element)).toBe(`Step 1 of ${frames.length}`);
  });

  it('plays a scene with its code beside it, highlighting the current line', async () => {
    const frames = buildSlidingWindow(SLIDING_WINDOW_DEFAULTS);
    const code = { label: 'maxSumSubarray (Java)', lines: Array.from({ length: 10 }, (_, i) => [{ content: `line ${i + 1}` }]) };
    const { element } = await render({ scene: 'sliding-window', title: 'Sliding window', mode: 'stepper', params: SLIDING_WINDOW_DEFAULTS, code });
    expect(element.querySelector('app-code-panel [aria-current="step"]')?.textContent).toContain(`line ${frames[0].line}`);
  });

  it('runs the learner’s own input in the sliding window', async () => {
    const { element, settle } = await render({
      scene: 'sliding-window',
      title: 'Sliding window',
      mode: 'stepper',
      params: SLIDING_WINDOW_DEFAULTS,
    });
    const [array, k] = Array.from(element.querySelectorAll<HTMLInputElement>('app-sliding-window-editor input'));
    k.value = '9';
    k.dispatchEvent(new Event('input'));
    await settle();
    expect(element.textContent).toContain('k must be a whole number from 1 to 6.');

    array.value = '4, 2, 9, 1';
    array.dispatchEvent(new Event('input'));
    k.value = '2';
    k.dispatchEvent(new Event('input'));
    await settle();
    element.querySelector<HTMLButtonElement>('app-sliding-window-editor button[type="submit"]')!.click();
    await settle();
    expect(counter(element)).toBe(`Step 1 of ${buildSlidingWindow({ array: [4, 2, 9, 1], k: 2 }).length}`);
  });

  it('loops while on screen, and can be paused', async () => {
    const { element, settle } = await render({ scene: 'load-balancer', title: 'Round robin', mode: 'loop', params: LOAD_BALANCER_DEFAULTS });
    const figure = element.querySelector<HTMLElement>('figure[data-viz="loop"]')!;
    expect(figure.dataset['playing']).toBe('true');
    element.querySelector<HTMLButtonElement>('figcaption button')!.click();
    await settle();
    expect(figure.dataset['playing']).toBe('false');
  });
});

@Component({
  imports: [FlipScopeDirective, FlipDirective],
  template: `
    <div appFlipScope #scope="flipScope">
      @if (left()) {
        <span appFlip="chip" class="left">r1</span>
      } @else {
        <span appFlip="chip" class="right">r1</span>
      }
    </div>
  `,
})
class FlipHostComponent {
  readonly left = signal(true);
}

describe('FLIP motion', () => {
  it('moves an element from where it was drawn in the previous frame', async () => {
    const animate = vi.fn();
    const rects = new Map<string, DOMRect>([
      ['left', new DOMRect(10, 20, 30, 20)],
      ['right', new DOMRect(110, 60, 30, 20)],
    ]);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return rects.get(this.className) ?? new DOMRect(0, 0, 500, 300);
    });
    (Element.prototype as unknown as { animate: unknown }).animate = animate;

    const fixture = TestBed.createComponent(FlipHostComponent);
    fixture.detectChanges();
    const scope = fixture.debugElement.children[0].injector.get(FlipScopeDirective);

    scope.capture();
    fixture.componentInstance.left.set(false);
    fixture.detectChanges();
    scope.play();

    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0][0][0]).toEqual({ transform: 'translate(-100px, -40px)' });
    vi.restoreAllMocks();
    delete (Element.prototype as unknown as { animate?: unknown }).animate;
  });
});
