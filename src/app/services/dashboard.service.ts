import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TechnicalModule, MockInterview } from '../../types';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  async getDashboardData(): Promise<{ modules: TechnicalModule[], interviews: MockInterview[] }> {
    try {
      return await firstValueFrom(
        this.http.get<{ modules: TechnicalModule[], interviews: MockInterview[] }>('/api/dashboard')
      );
    } catch (err: any) {
      throw err.error || err;
    }
  }

  async toggleTopic(moduleId: string, topicId: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>('/api/dashboard/topic', { moduleId, topicId, status })
      );
    } catch (err: any) {
      throw err.error || err;
    }
  }

  async toggleQuestion(moduleId: string, topicId: string, questionId: string, completed: boolean): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>('/api/dashboard/question/toggle', { moduleId, topicId, questionId, completed })
      );
    } catch (err: any) {
      throw err.error || err;
    }
  }

  async addQuestion(moduleId: string, topicId: string, title: string, difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>('/api/dashboard/question', { moduleId, topicId, title, difficulty })
      );
    } catch (err: any) {
      throw err.error || err;
    }
  }

  async scheduleInterview(interview: { type: string, date: string, time: string, interviewer: string, notes?: string }): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>('/api/dashboard/interview', interview)
      );
    } catch (err: any) {
      throw err.error || err;
    }
  }

  async saveInterviewFeedback(interviewId: string, score: number, feedback: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>('/api/dashboard/interview/feedback', { interviewId, score, feedback })
      );
    } catch (err: any) {
      throw err.error || err;
    }
  }
}
