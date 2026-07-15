import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { StaticRoadmapItem, Milestone } from '../../types';

@Injectable({
  providedIn: 'root'
})
export class RoadmapService {
  constructor(private http: HttpClient) {}

  async getRoadmapData(): Promise<{ staticRoadmap: StaticRoadmapItem[], personalizedRoadmap: Milestone[] }> {
    try {
      return await firstValueFrom(
        this.http.get<{ staticRoadmap: StaticRoadmapItem[], personalizedRoadmap: Milestone[] }>('/api/roadmap')
      );
    } catch (err: any) {
      throw err.error || err;
    }
  }

  async addMilestone(milestone: { title: string; description?: string; targetDate?: string }): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>('/api/roadmap/milestone', milestone)
      );
    } catch (err: any) {
      throw err.error || err;
    }
  }

  async updateMilestone(milestone: { id: string; title?: string; description?: string; targetDate?: string; completed?: boolean }): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.put<any>('/api/roadmap/milestone', milestone)
      );
    } catch (err: any) {
      throw err.error || err;
    }
  }

  async deleteMilestone(id: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.delete<any>(`/api/roadmap/milestone?id=${id}`)
      );
    } catch (err: any) {
      throw err.error || err;
    }
  }

  async reorderMilestones(milestoneIds: string[]): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>('/api/roadmap/milestone/reorder', { milestoneIds })
      );
    } catch (err: any) {
      throw err.error || err;
    }
  }

  async personalizeGemini(params: { targetCompany: string; timelineWeeks: number; currentLevel?: string; weakAreas?: string }): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>('/api/roadmap/personalize', params)
      );
    } catch (err: any) {
      throw err.error || err;
    }
  }
}
