import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { MockInterview } from '../../../types';

export type InterviewType = MockInterview['type'];

export interface BookingRequest {
  type: InterviewType;
  /** yyyy-mm-dd */
  date: string;
  /** hh:mm */
  time: string;
  interviewer: string;
  notes?: string;
}

interface InterviewList {
  interviews?: MockInterview[];
}

/**
 * The learner's scheduled and past mock interviews, kept on the server (`/api/interviews`). Each
 * call answers with the whole list, soonest first.
 */
@Injectable({ providedIn: 'root' })
export class InterviewService {
  private readonly http = inject(HttpClient);

  async list(): Promise<MockInterview[]> {
    return (await firstValueFrom(this.http.get<InterviewList>('/api/interviews'))).interviews ?? [];
  }

  async book(request: BookingRequest): Promise<MockInterview[]> {
    return (await firstValueFrom(this.http.post<InterviewList>('/api/interviews', request))).interviews ?? [];
  }

  /** Scores an interview 1–5 with notes, which completes it. */
  async saveFeedback(interviewId: string, score: number, feedback: string): Promise<MockInterview[]> {
    const path = `/api/interviews/${encodeURIComponent(interviewId)}/feedback`;
    return (await firstValueFrom(this.http.put<InterviewList>(path, { score, feedback }))).interviews ?? [];
  }
}

/** The server's explanation of a failed request, or a generic one when it couldn't be reached. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Couldn’t reach the server. Check your connection and try again.';
    const message = (error.error as { message?: unknown } | null)?.message;
    if (typeof message === 'string' && message && error.status < 500) return message;
  }
  return fallback;
}
