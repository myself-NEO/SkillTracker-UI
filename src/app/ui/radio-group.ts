const STEPS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * Keyboard support for a `role="radiogroup"` of buttons (ARIA radio pattern): the arrow keys move
 * to, and select, the next or previous radio. Bind it to the group's (keydown).
 */
export function onRadioGroupKeyDown(event: KeyboardEvent) {
  const step = STEPS[event.key];
  if (!step) return;
  const radios = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]'));
  const index = radios.indexOf(document.activeElement as HTMLElement);
  if (index < 0) return;
  event.preventDefault();
  const next = radios[(index + step + radios.length) % radios.length];
  next.focus();
  next.click();
}
