// Shapes of what the backend (SkillTracker-Srcv) answers.

/** The signed-in account (`/api/auth/me`, and the login's answer). */
export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  picture?: string;
}

/** A mock interview with another person, from the scheduler (`/api/interviews`). */
export interface MockInterview {
  id: string;
  type: 'System Design' | 'DSA' | 'Behavioral' | 'OOD';
  /** yyyy-mm-dd */
  date: string;
  /** hh:mm */
  time: string;
  interviewer: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  /** 1–5 stars, once scored. */
  score?: number;
  feedback?: string;
  notes?: string;
}
