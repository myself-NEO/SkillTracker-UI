import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import type { MockInterview } from '../../../types';
import { formatDay, INTERVIEW_TYPES, typeLabel, typeTopic, whenKey } from './interview-format';
import { errorMessage, InterviewService, type InterviewType } from './interview.service';

/** How long the first load may take before the page explains that the server is waking up (Render free tier). */
const SLOW_AFTER_MS = 3000;

/**
 * SkillTracker's mock-interview scheduler, moved here from the old dashboard: book a session, see
 * what's coming up, then score it 1–5 with notes, which moves it to the history.
 */
@Component({
  selector: 'app-interview-scheduler',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './interview-scheduler.component.html',
})
export class InterviewSchedulerComponent implements OnInit {
  private readonly service = inject(InterviewService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('feedbackDialog');

  protected readonly types = INTERVIEW_TYPES;
  protected readonly typeLabel = typeLabel;
  protected readonly typeTopic = typeTopic;
  protected readonly formatDay = formatDay;
  protected readonly stars = [1, 2, 3, 4, 5];

  /** null until the list arrives. */
  protected readonly interviews = signal<MockInterview[] | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly slow = signal(false);

  protected readonly upcoming = computed(() =>
    (this.interviews() ?? [])
      .filter((interview) => interview.status === 'Scheduled')
      .sort((a, b) => whenKey(a).localeCompare(whenKey(b))),
  );
  protected readonly past = computed(() =>
    (this.interviews() ?? [])
      .filter((interview) => interview.status === 'Completed')
      .sort((a, b) => whenKey(b).localeCompare(whenKey(a))),
  );

  // The booking form.
  protected readonly type = signal<InterviewType>('DSA');
  protected readonly date = signal('');
  protected readonly time = signal('');
  protected readonly interviewer = signal('');
  protected readonly notes = signal('');
  protected readonly booking = signal(false);
  protected readonly bookError = signal<string | null>(null);
  /** Read out after a booking succeeds. */
  protected readonly bookedMessage = signal('');

  // The feedback dialog.
  protected readonly feedbackFor = signal<MockInterview | null>(null);
  protected readonly score = signal(5);
  protected readonly feedback = signal('');
  protected readonly savingFeedback = signal(false);
  protected readonly feedbackError = signal<string | null>(null);

  private slowTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.slowTimer));
  }

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loadError.set(null);
    this.slow.set(false);
    clearTimeout(this.slowTimer);
    this.slowTimer = setTimeout(() => this.slow.set(true), SLOW_AFTER_MS);
    try {
      this.interviews.set(await this.service.list());
    } catch (error) {
      this.loadError.set(errorMessage(error, 'Your mock interviews couldn’t be loaded. Please try again.'));
    } finally {
      clearTimeout(this.slowTimer);
      this.slow.set(false);
    }
  }

  protected async book(event: Event): Promise<void> {
    event.preventDefault();
    if (this.booking()) return;
    this.booking.set(true);
    this.bookError.set(null);
    this.bookedMessage.set('');
    const request = {
      type: this.type(),
      date: this.date(),
      time: this.time(),
      interviewer: this.interviewer().trim(),
      notes: this.notes().trim() || undefined,
    };
    try {
      this.interviews.set(await this.service.book(request));
      this.bookedMessage.set(
        `Booked: ${typeLabel(request.type)} with ${request.interviewer} on ${formatDay(request.date)} at ${request.time}.`,
      );
      this.date.set('');
      this.time.set('');
      this.interviewer.set('');
      this.notes.set('');
    } catch (error) {
      this.bookError.set(errorMessage(error, 'The interview couldn’t be booked. Please try again.'));
    } finally {
      this.booking.set(false);
    }
  }

  protected openFeedback(interview: MockInterview): void {
    this.feedbackFor.set(interview);
    this.score.set(5);
    this.feedback.set('');
    this.feedbackError.set(null);
    // Once the form is in the dialog: open it, starting on the score.
    afterNextRender(
      () => {
        const dialog = this.dialog().nativeElement;
        dialog.showModal();
        dialog.querySelector<HTMLInputElement>('input[name="score"]:checked')?.focus();
      },
      { injector: this.injector },
    );
  }

  protected closeFeedback(): void {
    this.dialog().nativeElement.close();
  }

  /** The dialog closed, by its buttons or the Escape key. */
  protected onDialogClosed(): void {
    this.feedbackFor.set(null);
  }

  protected async saveFeedback(event: Event): Promise<void> {
    event.preventDefault();
    const interview = this.feedbackFor();
    if (!interview || this.savingFeedback()) return;
    this.savingFeedback.set(true);
    this.feedbackError.set(null);
    try {
      this.interviews.set(await this.service.saveFeedback(interview.id, this.score(), this.feedback().trim()));
      this.closeFeedback();
    } catch (error) {
      this.feedbackError.set(errorMessage(error, 'The feedback couldn’t be saved. Please try again.'));
    } finally {
      this.savingFeedback.set(false);
    }
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }
}
