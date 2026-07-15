export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export type TopicStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Question {
  id: string;
  title: string;
  link?: string;
  completed: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Topic {
  id: string;
  name: string;
  status: TopicStatus;
  questions: Question[];
}

export interface TechnicalModule {
  id: string;
  name: string;
  icon: string;
  description: string;
  topics: Topic[];
}

export interface MockInterview {
  id: string;
  type: 'System Design' | 'DSA' | 'Behavioral' | 'OOD';
  date: string;
  time: string;
  interviewer: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  score?: number; // 1-5 stars
  feedback?: string;
  notes?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  completed: boolean;
  order: number;
}

export interface StaticRoadmapItem {
  week: string;
  title: string;
  description: string;
  topics: string[];
}

export interface DashboardData {
  modules: TechnicalModule[];
  interviews: MockInterview[];
  milestones: Milestone[];
}
