import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideCompass, LucideMap } from '@lucide/angular';
import { RoadmapService } from '../../services/roadmap.service';
import { Milestone, StaticRoadmapItem } from '../../../types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-roadmaps',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideCompass, LucideMap],
  templateUrl: './roadmaps.component.html',
  styleUrls: ['./roadmaps.component.scss']
})
export class RoadmapsComponent implements OnInit {
  staticRoadmap: StaticRoadmapItem[] = [];
  personalizedRoadmap: Milestone[] = [];
  loading = true;
  activeTab: 'ideal' | 'personalised' = 'ideal';

  // Custom Milestone Manual Form States
  showAddForm = false;
  newTitle = '';
  newDesc = '';
  newTargetDate = '';
  addingMilestone = false;

  // Gemini Personalizer States
  targetCompany = 'Google';
  timelineWeeks = '8';
  currentLevel = 'SDE 1 (2.5 years experience)';
  weakAreas = 'HLD Distributed Systems, Concurrency lock paradigms';
  generatingAI = false;
  aiError: string | null = null;

  constructor(private roadmapService: RoadmapService) {}

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const data = await this.roadmapService.getRoadmapData();
      this.staticRoadmap = data.staticRoadmap;
      this.personalizedRoadmap = data.personalizedRoadmap;
    } catch (err) {
      console.error('Failed to load roadmap data:', err);
    } finally {
      this.loading = false;
    }
  }

  async handleToggleMilestone(milestone: Milestone): Promise<void> {
    try {
      const data = await this.roadmapService.updateMilestone({
        id: milestone.id,
        completed: !milestone.completed
      });
      if (data && data.milestones) {
        this.personalizedRoadmap = data.milestones;
      }
    } catch (err) {
      console.error('Failed to toggle milestone:', err);
    }
  }

  async handleDeleteMilestone(id: string): Promise<void> {
    try {
      const data = await this.roadmapService.deleteMilestone(id);
      if (data && data.milestones) {
        this.personalizedRoadmap = data.milestones;
      }
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    }
  }

  async handleManualAddMilestone(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.newTitle.trim()) return;

    this.addingMilestone = true;
    try {
      const data = await this.roadmapService.addMilestone({
        title: this.newTitle,
        description: this.newDesc,
        targetDate: this.newTargetDate
      });
      if (data && data.milestones) {
        this.personalizedRoadmap = data.milestones;
        this.newTitle = '';
        this.newDesc = '';
        this.newTargetDate = '';
        this.showAddForm = false;
      }
    } catch (err) {
      console.error('Failed to add milestone:', err);
    } finally {
      this.addingMilestone = false;
    }
  }

  async handleAIPersonalize(): Promise<void> {
    this.generatingAI = true;
    this.aiError = null;

    try {
      const data = await this.roadmapService.personalizeGemini({
        targetCompany: this.targetCompany,
        timelineWeeks: parseInt(this.timelineWeeks, 10),
        currentLevel: this.currentLevel,
        weakAreas: this.weakAreas
      });
      if (data && data.milestones) {
        this.personalizedRoadmap = data.milestones;
        this.activeTab = 'personalised';
      }
    } catch (err: any) {
      this.aiError = err.error || err.message || 'Gemini Generation failed. Ensure GEMINI_API_KEY is configured.';
    } finally {
      this.generatingAI = false;
    }
  }
}
