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

/**
 * The learner's scheduled and past mock interviews, kept on the server. Until the interview
 * endpoints get their own path (/api/interviews, docs/plan.md Phase 6), they live under the old
 * dashboard's; each call answers with the whole updated list.
 */
@Injectable({ providedIn: 'root' })
export class InterviewService {
  private readonly http = inject(HttpClient);

  async list(): Promise<MockInterview[]> {
    const response = await firstValueFrom(this.http.get<{ interviews?: MockInterview[] }>('/api/dashboard'));
    return response.interviews ?? [];
  }

  async book(request: BookingRequest): Promise<MockInterview[]> {
    const response = await firstValueFrom(
      this.http.post<{ interviews: MockInterview[] }>('/api/dashboard/interview', request),
    );
    return response.interviews;
  }

  async saveFeedback(interviewId: string, score: number, feedback: string): Promise<MockInterview[]> {
    const response = await firstValueFrom(
      this.http.post<{ interviews: MockInterview[] }>('/api/dashboard/interview/feedback', { interviewId, score, feedback }),
    );
    return response.interviews;
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
