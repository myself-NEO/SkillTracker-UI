import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAward, LucideStar, LucideCode, LucideLayoutDashboard, LucideCpu, LucideShield, LucideMap, LucideCircleQuestionMark, LucideChevronDown, LucideClock, LucidePlus, LucideCheck, LucideCircle, LucideCalendar } from '@lucide/angular';
import { DashboardService } from '../../services/dashboard.service';
import { TechnicalModule, MockInterview } from '../../../types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAward, LucideCode, LucideStar, LucideLayoutDashboard, LucideCpu, LucideShield, LucideMap, LucideCircleQuestionMark, LucideChevronDown, LucideClock, LucidePlus, LucideCheck, LucideCircle, LucideCalendar],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  modules: TechnicalModule[] = [];
  interviews: MockInterview[] = [];
  loading = true;

  expandedModule: string | null = 'system-design';

  // Interview Form States
  showScheduleForm = false;
  interviewType: 'System Design' | 'DSA' | 'Behavioral' | 'OOD' = 'System Design';
  interviewDate = '';
  interviewTime = '';
  interviewer = '';
  interviewNotes = '';
  submittingInterview = false;

  // Custom Question Form States
  activeTopicForQuestion: { mId: string, tId: string } | null = null;
  newQuestionTitle = '';
  newQuestionDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';

  // Record Feedback Modal State
  recordingFeedbackId: string | null = null;
  feedbackText = '';
  feedbackScore = 5;

  // Stats computed on data update
  totalTopics = 0;
  completedTopics = 0;
  inProgressTopics = 0;
  totalQuestions = 0;
  completedQuestions = 0;
  progressPercentage = 0;
  topicCompletionPercentage = 0;

  upcomingMocks: MockInterview[] = [];
  pastMocks: MockInterview[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const data = await this.dashboardService.getDashboardData();
      this.modules = data.modules;
      this.interviews = data.interviews;
      this.computeStats();
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      this.loading = false;
    }
  }

  computeStats(): void {
    this.totalTopics = 0;
    this.completedTopics = 0;
    this.inProgressTopics = 0;
    this.totalQuestions = 0;
    this.completedQuestions = 0;

    this.modules.forEach(m => {
      m.topics.forEach(t => {
        this.totalTopics++;
        if (t.status === 'COMPLETED') this.completedTopics++;
        else if (t.status === 'IN_PROGRESS') this.inProgressTopics++;
        
        t.questions.forEach(q => {
          this.totalQuestions++;
          if (q.completed) this.completedQuestions++;
        });
      });
    });

    this.progressPercentage = this.totalQuestions > 0 ? Math.round((this.completedQuestions / this.totalQuestions) * 100) : 0;
    this.topicCompletionPercentage = this.totalTopics > 0 ? Math.round((this.completedTopics / this.totalTopics) * 100) : 0;

    this.upcomingMocks = this.interviews.filter(i => i.status === 'Scheduled');
    this.pastMocks = this.interviews.filter(i => i.status === 'Completed');
  }

  toggleModule(id: string): void {
    this.expandedModule = this.expandedModule === id ? null : id;
  }

  async handleToggleQuestion(moduleId: string, topicId: string, questionId: string, currentCompleted: boolean): Promise<void> {
    try {
      const data = await this.dashboardService.toggleQuestion(moduleId, topicId, questionId, currentCompleted);
      if (data && data.modules) {
        this.modules = data.modules;
        this.computeStats();
      }
    } catch (err) {
      console.error('Failed to toggle question status:', err);
    }
  }

  async handleToggleTopicStatus(moduleId: string, topicId: string, currentStatus: string): Promise<void> {
    const nextStatusMap: { [key: string]: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' } = {
      'NOT_STARTED': 'IN_PROGRESS',
      'IN_PROGRESS': 'COMPLETED',
      'COMPLETED': 'NOT_STARTED'
    };
    const nextStatus = nextStatusMap[currentStatus];

    try {
      const data = await this.dashboardService.toggleTopic(moduleId, topicId, nextStatus);
      if (data && data.modules) {
        this.modules = data.modules;
        this.computeStats();
      }
    } catch (err) {
      console.error('Failed to toggle topic status:', err);
    }
  }

  async handleAddQuestionSubmit(e: Event, moduleId: string, topicId: string): Promise<void> {
    e.preventDefault();
    if (!this.newQuestionTitle.trim()) return;

    try {
      const data = await this.dashboardService.addQuestion(moduleId, topicId, this.newQuestionTitle, this.newQuestionDifficulty);
      if (data && data.modules) {
        this.modules = data.modules;
        this.computeStats();
        this.newQuestionTitle = '';
        this.activeTopicForQuestion = null;
      }
    } catch (err) {
      console.error('Failed to add custom practice question:', err);
    }
  }

  async handleScheduleInterview(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.interviewDate || !this.interviewTime || !this.interviewer) return;

    this.submittingInterview = true;
    try {
      const data = await this.dashboardService.scheduleInterview({
        type: this.interviewType,
        date: this.interviewDate,
        time: this.interviewTime,
        interviewer: this.interviewer,
        notes: this.interviewNotes
      });
      if (data && data.interviews) {
        this.interviews = data.interviews;
        this.computeStats();
        this.interviewDate = '';
        this.interviewTime = '';
        this.interviewer = '';
        this.interviewNotes = '';
        this.showScheduleForm = false;
      }
    } catch (err) {
      console.error('Failed to schedule interview:', err);
    } finally {
      this.submittingInterview = false;
    }
  }

  async handleSaveFeedback(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.recordingFeedbackId) return;

    try {
      const data = await this.dashboardService.saveInterviewFeedback(this.recordingFeedbackId, this.feedbackScore, this.feedbackText);
      if (data && data.interviews) {
        this.interviews = data.interviews;
        this.computeStats();
        this.recordingFeedbackId = null;
        this.feedbackText = '';
        this.feedbackScore = 5;
      }
    } catch (err) {
      console.error('Failed to save feedback:', err);
    }
  }

  startRecordingFeedback(interviewId: string): void {
    this.recordingFeedbackId = interviewId;
    this.feedbackText = '';
    this.feedbackScore = 5;
  }

  cancelRecordingFeedback(): void {
    this.recordingFeedbackId = null;
  }

  toggleQuestionForm(moduleId: string, topicId: string): void {
    if (this.activeTopicForQuestion?.tId === topicId) {
      this.activeTopicForQuestion = null;
    } else {
      this.activeTopicForQuestion = { mId: moduleId, tId: topicId };
    }
  }

  getModuleProgress(module: TechnicalModule): number {
    let modQuestions = 0;
    let modCompletedQuestions = 0;
    module.topics.forEach(t => {
      t.questions.forEach(q => {
        modQuestions++;
        if (q.completed) modCompletedQuestions++;
      });
    });
    return modQuestions > 0 ? Math.round((modCompletedQuestions / modQuestions) * 100) : 0;
  }
}
