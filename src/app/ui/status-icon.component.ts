import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ProblemStatus, TrackId } from '@content/shared/types';
import { isLessonComplete, isLessonVisited, problemStatus, type ProgressState } from '@lib/progress/progress';

// The learner's progress on one lesson or problem, as a small circle: filled with a tick when done,
// half filled when started, empty when not, dashed when the lesson isn't written yet.

export type StatusState = 'done' | 'started' | 'todo' | 'soon';

const STATE_LABEL: Record<StatusState, string> = {
  done: 'Completed',
  started: 'In progress',
  todo: 'Not started',
  soon: 'Coming soon',
};

export const lessonState = (progress: ProgressState, track: TrackId, slug: string, comingSoon?: boolean): StatusState =>
  comingSoon
    ? 'soon'
    : isLessonComplete(progress, track, slug)
      ? 'done'
      : isLessonVisited(progress, track, slug)
        ? 'started'
        : 'todo';

const PROBLEM_STATE: Record<ProblemStatus, StatusState> = {
  completed: 'done',
  attempted: 'started',
  'in-progress': 'started',
  'not-started': 'todo',
};

/** A problem's state, and its status in words ("in progress", "attempted") for the icon's label. */
export const problemState = (progress: ProgressState, track: TrackId, slug: string) => {
  const status = problemStatus(progress, track, slug);
  return { state: PROBLEM_STATE[status], label: status.replace('-', ' ') };
};

@Component({
  selector: 'app-status-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0', '[attr.title]': 'text()' },
  template: `
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      [class]="iconClass()"
      [class.text-accent]="state() === 'done' || state() === 'started'"
      [class.text-faint]="state() === 'todo' || state() === 'soon'"
    >
      @switch (state()) {
        @case ('done') {
          <svg:circle cx="8" cy="8" r="7" fill="currentColor" />
          <svg:path
            d="M5 8.2 7 10.2 11 6"
            fill="none"
            stroke="var(--surface)"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        }
        @case ('started') {
          <svg:circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5" />
          <svg:path d="M8 1.75a6.25 6.25 0 010 12.5z" fill="currentColor" />
        }
        @default {
          <svg:circle
            cx="8"
            cy="8"
            r="6.25"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            [attr.stroke-dasharray]="state() === 'soon' ? '2 2.2' : null"
          />
        }
      }
    </svg>
    <span class="sr-only">{{ text() }}</span>
  `,
})
export class StatusIconComponent {
  readonly state = input.required<StatusState>();
  /** Overrides the state's name, e.g. a problem's "attempted". */
  readonly label = input<string>();
  /** Size and spacing of the icon, e.g. "mt-0.5 size-4". */
  readonly iconClass = input('size-4');

  protected readonly text = computed(() => this.label() ?? STATE_LABEL[this.state()]);
}
