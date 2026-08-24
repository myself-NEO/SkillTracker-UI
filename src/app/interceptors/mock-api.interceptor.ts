import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User, TechnicalModule, MockInterview, Milestone, StaticRoadmapItem } from '../../types';

/**
 * TOGGLE MOCK BACKEND
 * Set this to false when you connect your Spring Boot Backend!
 */
export const USE_MOCK_BACKEND = false;

const USERS_KEY = 'sde_prep_users';
const CURRENT_USER_KEY = 'sde_prep_current_user';

// Static Ideal SDE 2 Roadmap (10 Weeks)
const staticRoadmap: StaticRoadmapItem[] = [
  {
    week: "Weeks 1-2",
    title: "Advanced Coding & SDE 2 DSA Patterns",
    description: "Build exceptional proficiency in high-frequency DSA structures required for senior evaluations.",
    topics: ["Topological Sorting & Dijkstra", "Dynamic Programming (Interval & Matrix)", "Tries & Advanced Trees", "Sliding Window Optimization"]
  },
  {
    week: "Weeks 3-4",
    title: "Low-Level Design (LLD) & Concurrency",
    description: "Learn to model clean, thread-safe, and highly extensible components that adhere strictly to SOLID guidelines.",
    topics: ["SOLID Refactoring", "Creational, Structural & Behavioral Patterns", "Custom Thread Pools & Task Schedulers", "Blocking Queues & Read-Write Locks"]
  },
  {
    week: "Weeks 5-7",
    title: "High-Level Distributed System Design (HLD)",
    description: "Design production-grade backends that handle millions of requests while ensuring liveness and high durability.",
    topics: ["Consistent Hashing Rings", "Rate Limiters & API Gateways", "Distributed Caching (LRU, TTL)", "Kafka Event Streams & Pub-Sub Broker Design"]
  },
  {
    week: "Weeks 8-9",
    title: "Database Internals & Advanced Storage Systems",
    description: "Understand write paths, index layouts, transaction guarantees, and sharding layouts.",
    topics: ["B-Trees vs LSM Trees (Read/Write Amplification)", "Optimistic vs Pessimistic Locking", "Distributed Transactions (Two-Phase Commit)", "Sharding & Multi-Region Replication"]
  },
  {
    week: "Week 10",
    title: "Behavioral Prep & Mock Drills",
    description: "Craft clear behavioral stories under SDE 2 leadership metrics and practice high-pressure simulations.",
    topics: ["STAR Method Story Mapping", "System Design Mock Interviews", "DSA Speed Runs", "OOD Extensibility Drilldowns"]
  }
];

function getUsers(): Record<string, any> {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveUsers(users: Record<string, any>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getProgressKey(userId: string): string {
  return `sde_prep_progress_${userId}`;
}

function getDB(userId: string): any {
  const key = getProgressKey(userId);
  const raw = localStorage.getItem(key);
  if (!raw) {
    const defaultDB = seedDefaultProgress(userId);
    return defaultDB;
  }
  return JSON.parse(raw);
}

function saveDB(userId: string, data: any): void {
  const key = getProgressKey(userId);
  localStorage.setItem(key, JSON.stringify(data));
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  // If Mock Backend is disabled, let requests flow straight to Spring Boot
  if (!USE_MOCK_BACKEND || !req.url.startsWith('/api/')) {
    return next(req);
  }

  const { url, method, body } = req;
  const urlParts = url.split('?')[0];

  // Helper function to extract user ID from JWT token header
  const authHeader = req.headers.get('Authorization');
  let tokenUserId = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === 'mock-google-jwt-token-xyz') {
      tokenUserId = 'user-google-dev';
      // Auto-register Google Dev user if missing
      const users = getUsers();
      if (!users['keshavkumarjha643@gmail.com']) {
        users['keshavkumarjha643@gmail.com'] = {
          id: 'user-google-dev',
          email: 'keshavkumarjha643@gmail.com',
          fullName: 'Keshav Kumar Jha',
          createdAt: new Date().toISOString()
        };
        saveUsers(users);
      }
    } else if (token.startsWith('mock-jwt-token-')) {
      tokenUserId = token.replace('mock-jwt-token-', '');
    }
  }

  // Handle API routing
  try {
    // 1. AUTH REGISTER
    if (urlParts.endsWith('/api/auth/register') && method === 'POST') {
      const { email, password, fullName } = body as any;
      const users = getUsers();

      if (users[email]) {
        return throwError(() => new HttpErrorResponse({
          status: 400,
          error: { message: 'User already exists with this email' }
        })).pipe(delay(300));
      }

      const userId = 'user-' + Math.random().toString(36).substring(2, 10);
      users[email] = {
        id: userId,
        email,
        fullName,
        password,
        createdAt: new Date().toISOString()
      };

      saveUsers(users);
      // Seed default progress
      seedDefaultProgress(userId);

      return of(new HttpResponse({ status: 200, body: { success: true } })).pipe(delay(300));
    }

    // 2. AUTH LOGIN
    if (urlParts.endsWith('/api/auth/login') && method === 'POST') {
      const { email, password } = body as any;
      const users = getUsers();
      const user = users[email];

      if (!user || user.password !== password) {
        return throwError(() => new HttpErrorResponse({
          status: 401,
          error: { message: 'Invalid email or password' }
        })).pipe(delay(300));
      }

      const token = `mock-jwt-token-${user.id}`;
      return of(new HttpResponse({
        status: 200,
        body: {
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            createdAt: user.createdAt
          }
        }
      })).pipe(delay(300));
    }

    // 3. AUTH ME (Retrieved active user profile using JWT token)
    if (urlParts.endsWith('/api/auth/me') && method === 'GET') {
      if (!tokenUserId) {
        return throwError(() => new HttpErrorResponse({
          status: 401,
          error: { message: 'Unauthorized JWT Token' }
        })).pipe(delay(100));
      }

      const users = getUsers();
      // Find user by matching ID
      const matchedUser = Object.values(users).find((u: any) => u.id === tokenUserId);
      if (!matchedUser) {
        return throwError(() => new HttpErrorResponse({
          status: 404,
          error: { message: 'User not found' }
        })).pipe(delay(100));
      }

      return of(new HttpResponse({
        status: 200,
        body: {
          id: matchedUser.id,
          email: matchedUser.email,
          fullName: matchedUser.fullName,
          createdAt: matchedUser.createdAt
        }
      })).pipe(delay(100));
    }

    // 4. AUTH GOOGLE URL
    if (urlParts.endsWith('/api/auth/google-url') && method === 'GET') {
      return of(new HttpResponse({
        status: 200,
        body: { url: '/mock-google-login-oauth-url' } // In client, standard fallback gets called
      }));
    }

    // -- SECURE ENDPOINTS (Require active session tokenUserId) --
    if (!tokenUserId) {
      return throwError(() => new HttpErrorResponse({
        status: 401,
        error: { message: 'Unauthorized. Please login again.' }
      })).pipe(delay(100));
    }

    const db = getDB(tokenUserId);

    // 5. GET DASHBOARD
    if (urlParts.endsWith('/api/dashboard') && method === 'GET') {
      return of(new HttpResponse({
        status: 200,
        body: {
          modules: db.modules || [],
          interviews: db.interviews || []
        }
      })).pipe(delay(200));
    }

    // 6. TOGGLE TOPIC STATUS
    if (urlParts.endsWith('/api/dashboard/topic') && method === 'POST') {
      const { moduleId, topicId, status } = body as any;
      const mod = db.modules.find((m: any) => m.id === moduleId);
      if (mod) {
        const top = mod.topics.find((t: any) => t.id === topicId);
        if (top) {
          top.status = status;
        }
      }
      saveDB(tokenUserId, db);
      return of(new HttpResponse({ status: 200, body: { success: true, modules: db.modules } })).pipe(delay(200));
    }

    // 7. TOGGLE QUESTION COMPLETED
    if (urlParts.endsWith('/api/dashboard/question/toggle') && method === 'POST') {
      const { moduleId, topicId, questionId, completed } = body as any;
      const mod = db.modules.find((m: any) => m.id === moduleId);
      if (mod) {
        const top = mod.topics.find((t: any) => t.id === topicId);
        if (top) {
          const ques = top.questions.find((q: any) => q.id === questionId);
          if (ques) {
            ques.completed = completed;
          }
        }
      }
      saveDB(tokenUserId, db);
      return of(new HttpResponse({ status: 200, body: { success: true, modules: db.modules } })).pipe(delay(200));
    }

    // 8. ADD QUESTION
    if (urlParts.endsWith('/api/dashboard/question') && method === 'POST') {
      const { moduleId, topicId, title, difficulty } = body as any;
      const mod = db.modules.find((m: any) => m.id === moduleId);
      if (mod) {
        const top = mod.topics.find((t: any) => t.id === topicId);
        if (top) {
          const questionId = 'q-' + Math.random().toString(36).substring(2, 10);
          top.questions.push({
            id: questionId,
            title,
            completed: false,
            difficulty
          });
        }
      }
      saveDB(tokenUserId, db);
      return of(new HttpResponse({ status: 200, body: { success: true, modules: db.modules } })).pipe(delay(200));
    }

    // 9. SCHEDULE INTERVIEW
    if (urlParts.endsWith('/api/dashboard/interview') && method === 'POST') {
      const interview = body as any;
      const interviewId = 'mock-' + Math.random().toString(36).substring(2, 10);
      const newInterview: MockInterview = {
        id: interviewId,
        type: interview.type,
        date: interview.date,
        time: interview.time,
        interviewer: interview.interviewer,
        status: 'Scheduled',
        notes: interview.notes
      };
      if (!db.interviews) db.interviews = [];
      db.interviews.push(newInterview);
      saveDB(tokenUserId, db);
      return of(new HttpResponse({ status: 200, body: { success: true, interviews: db.interviews } })).pipe(delay(200));
    }

    // 10. SAVE INTERVIEW FEEDBACK
    if (urlParts.endsWith('/api/dashboard/interview/feedback') && method === 'POST') {
      const { interviewId, score, feedback } = body as any;
      const interview = db.interviews.find((i: any) => i.id === interviewId);
      if (interview) {
        interview.score = score;
        interview.feedback = feedback;
        interview.status = 'Completed';
      }
      saveDB(tokenUserId, db);
      return of(new HttpResponse({ status: 200, body: { success: true, interviews: db.interviews } })).pipe(delay(200));
    }

    // 11. GET ROADMAP DATA
    if (urlParts.endsWith('/api/roadmap') && method === 'GET') {
      return of(new HttpResponse({
        status: 200,
        body: {
          staticRoadmap,
          personalizedRoadmap: db.milestones || []
        }
      })).pipe(delay(200));
    }

    // 12. ADD ROADMAP MILESTONE
    if (urlParts.endsWith('/api/roadmap/milestone') && method === 'POST') {
      const ms = body as any;
      const newMs: Milestone = {
        id: 'ms-' + Math.random().toString(36).substring(2, 10),
        title: ms.title,
        description: ms.description || '',
        targetDate: ms.targetDate || '',
        completed: false,
        order: (db.milestones || []).length + 1
      };
      if (!db.milestones) db.milestones = [];
      db.milestones.push(newMs);
      saveDB(tokenUserId, db);
      return of(new HttpResponse({ status: 200, body: { success: true, milestones: db.milestones } })).pipe(delay(200));
    }

    // 13. UPDATE ROADMAP MILESTONE
    if (urlParts.endsWith('/api/roadmap/milestone') && method === 'PUT') {
      const ms = body as any;
      const found = (db.milestones || []).find((m: any) => m.id === ms.id);
      if (found) {
        if (ms.title !== undefined) found.title = ms.title;
        if (ms.description !== undefined) found.description = ms.description;
        if (ms.targetDate !== undefined) found.targetDate = ms.targetDate;
        if (ms.completed !== undefined) found.completed = ms.completed;
      }
      saveDB(tokenUserId, db);
      return of(new HttpResponse({ status: 200, body: { success: true, milestones: db.milestones } })).pipe(delay(200));
    }

    // 14. DELETE ROADMAP MILESTONE
    if (urlParts.endsWith('/api/roadmap/milestone') && method === 'DELETE') {
      const id = req.url.split('id=')[1];
      db.milestones = (db.milestones || []).filter((m: any) => m.id !== id);
      // Recalculate orders
      db.milestones.forEach((m: any, idx: number) => {
        m.order = idx + 1;
      });
      saveDB(tokenUserId, db);
      return of(new HttpResponse({ status: 200, body: { success: true, milestones: db.milestones } })).pipe(delay(200));
    }

    // 15. REORDER ROADMAP MILESTONES
    if (urlParts.endsWith('/api/roadmap/milestone/reorder') && method === 'POST') {
      const { milestoneIds } = body as any;
      if (Array.isArray(milestoneIds)) {
        const reordered: Milestone[] = [];
        milestoneIds.forEach((id, idx) => {
          const item = db.milestones.find((m: any) => m.id === id);
          if (item) {
            item.order = idx + 1;
            reordered.push(item);
          }
        });
        db.milestones = reordered;
      }
      saveDB(tokenUserId, db);
      return of(new HttpResponse({ status: 200, body: { success: true, milestones: db.milestones } })).pipe(delay(200));
    }

    // 16. PERSONALIZE GEMINI AI
    if (urlParts.endsWith('/api/roadmap/personalize') && method === 'POST') {
      const { targetCompany, timelineWeeks, currentLevel, weakAreas } = body as any;
      const lowercaseWeak = (weakAreas || '').toLowerCase();
      const company = targetCompany || 'FAANG';
      
      const generated: Milestone[] = [];
      let order = 1;

      // Milestone 1
      let ms1Title = `Master ${company} Core Technical Standards`;
      let ms1Desc = `Deep dive into standard ${company} architectural expectations. Focus on core SDE 2 expectations at ${currentLevel || 'Level 4'}.`;
      if (lowercaseWeak.includes('design') || lowercaseWeak.includes('system') || lowercaseWeak.includes('hld')) {
        ms1Title = `Advanced HLD & Microservices for ${company}`;
        ms1Desc = `Deep study of Load balancers, API gateways, and partition tolerance (CAP Theorem). Prepare architectural scenarios typical of the ${company} loop.`;
      } else if (lowercaseWeak.includes('concurrency') || lowercaseWeak.includes('thread') || lowercaseWeak.includes('async')) {
        ms1Title = `Concurrency & Async Task Executions`;
        ms1Desc = `Study high-performance blocking queues, custom thread pools, and race-condition resolutions under strict concurrency guidelines.`;
      }
      
      const now = new Date();
      const date1 = new Date();
      date1.setDate(now.getDate() + 5);
      
      generated.push({
        id: 'ms-ai-' + Math.random().toString(36).substring(2, 6),
        title: ms1Title,
        description: ms1Desc,
        targetDate: date1.toISOString().split('T')[0],
        completed: false,
        order: order++
      });

      // Milestone 2
      const date2 = new Date();
      date2.setDate(now.getDate() + 12);
      
      generated.push({
        id: 'ms-ai-' + Math.random().toString(36).substring(2, 6),
        title: `L4/L5 Mock Drills & Coding Standards`,
        description: `Participate in peer-to-peer simulated interviews targeting ${company} coding bars. Focus on modularity, clean code, and solid composition.`,
        targetDate: date2.toISOString().split('T')[0],
        completed: false,
        order: order++
      });

      // Milestone 3
      let ms3Title = `Behavioral Prep & STAR Story Mapping`;
      let ms3Desc = `Map projects to ${company}'s core leadership attributes (e.g. Amazon LPs, Google Googlyness, or Meta Core values). Prepare 4 comprehensive stories.`;
      if (company.toLowerCase().includes('amazon')) {
        ms3Title = `Amazon Leadership Principles Alignment`;
        ms3Desc = `Prepare 6 deeply detailed STAR stories matching "Ownership", "Dive Deep", and "Customer Obsession" for SDE 2 expectations.`;
      } else if (company.toLowerCase().includes('google')) {
        ms3Title = `Google Googlyness & Leadership Mapping`;
        ms3Desc = `Formulate stories detailing ambiguity resolution, peer mentorship, and architectural leadership under Google GCA metrics.`;
      }

      const date3 = new Date();
      date3.setDate(now.getDate() + Math.max(20, timelineWeeks * 7));
      
      generated.push({
        id: 'ms-ai-' + Math.random().toString(36).substring(2, 6),
        title: ms3Title,
        description: ms3Desc,
        targetDate: date3.toISOString().split('T')[0],
        completed: false,
        order: order++
      });

      db.milestones = generated;
      saveDB(tokenUserId, db);

      return of(new HttpResponse({ status: 200, body: { success: true, milestones: generated } })).pipe(delay(1200));
    }

    // Default 404 for unhandled /api requests
    return throwError(() => new HttpErrorResponse({
      status: 404,
      error: { message: `Backend endpoint ${url} not implemented` }
    }));

  } catch (err: any) {
    return throwError(() => new HttpErrorResponse({
      status: 500,
      error: { message: err.message || 'Internal Server Error' }
    }));
  }
};

function seedDefaultProgress(userId: string): any {
  const initialData = {
    modules: [
      {
        id: 'system-design',
        name: 'System Design (HLD)',
        icon: 'Network',
        description: 'Master high-level scalability, distributed architectures, database designs, and caching.',
        topics: [
          {
            id: 'sd-1',
            name: 'Load Balancing & API Gateways',
            status: 'NOT_STARTED',
            questions: [
              { id: 'sd-q1', title: 'Implement a Token Bucket Rate Limiter', completed: false, difficulty: 'Medium' },
              { id: 'sd-q2', title: 'Design a High-Throughput API Gateway', completed: false, difficulty: 'Hard' }
            ]
          },
          {
            id: 'sd-2',
            name: 'Database Partitioning & Sharding',
            status: 'NOT_STARTED',
            questions: [
              { id: 'sd-q3', title: 'Design a Consistent Hashing Ring', completed: false, difficulty: 'Medium' },
              { id: 'sd-q4', title: 'Design a Distributed ID Generator (Snowflake)', completed: false, difficulty: 'Hard' }
            ]
          },
          {
            id: 'sd-3',
            name: 'Caching Strategies & CDN',
            status: 'NOT_STARTED',
            questions: [
              { id: 'sd-q5', title: 'Design an LRU Cache with TTL support', completed: false, difficulty: 'Medium' },
              { id: 'sd-q6', title: 'Design a Distributed Cache cluster (Memcached)', completed: false, difficulty: 'Hard' }
            ]
          },
          {
            id: 'sd-4',
            name: 'Messaging & Event Streams',
            status: 'NOT_STARTED',
            questions: [
              { id: 'sd-q7', title: 'Design a Publish-Subscribe Message Queue', completed: false, difficulty: 'Medium' },
              { id: 'sd-q8', title: 'Design a Log-Structured Message Broker (Kafka)', completed: false, difficulty: 'Hard' }
            ]
          }
        ]
      },
      {
        id: 'dsa',
        name: 'Data Structures & Algorithms',
        icon: 'Code',
        description: 'Focus on SDE 2 interview patterns like Graphs, Dynamic Programming, and Sliding Windows.',
        topics: [
          {
            id: 'dsa-1',
            name: 'Graphs (Dijkstra, MST, Topological Sort)',
            status: 'NOT_STARTED',
            questions: [
              { id: 'dsa-q1', title: 'Network Delay Time (Dijkstra algorithm)', completed: false, difficulty: 'Medium' },
              { id: 'dsa-q2', title: 'Alien Dictionary (Topological Sort)', completed: false, difficulty: 'Hard' }
            ]
          },
          {
            id: 'dsa-2',
            name: 'Dynamic Programming (DP)',
            status: 'NOT_STARTED',
            questions: [
              { id: 'dsa-q3', title: 'Edit Distance (Levenshtein Distance)', completed: false, difficulty: 'Medium' },
              { id: 'dsa-q4', title: 'Burst Balloons (Interval DP)', completed: false, difficulty: 'Hard' }
            ]
          },
          {
            id: 'dsa-3',
            name: 'Trees & Tries',
            status: 'NOT_STARTED',
            questions: [
              { id: 'dsa-q5', title: 'Serialize and Deserialize Binary Tree', completed: false, difficulty: 'Hard' },
              { id: 'dsa-q6', title: 'Word Search II using Trie', completed: false, difficulty: 'Hard' }
            ]
          },
          {
            id: 'dsa-4',
            name: 'Sliding Window & Two Pointers',
            status: 'NOT_STARTED',
            questions: [
              { id: 'dsa-q7', title: 'Minimum Window Substring', completed: false, difficulty: 'Hard' },
              { id: 'dsa-q8', title: 'Sliding Window Maximum', completed: false, difficulty: 'Hard' }
            ]
          }
        ]
      },
      {
        id: 'concurrency',
        name: 'Concurrency & Threading',
        icon: 'Cpu',
        description: 'Thread synchronization, concurrent design patterns, locks, and async execution engines.',
        topics: [
          {
            id: 'cc-1',
            name: 'Locks, Semaphores & Barriers',
            status: 'NOT_STARTED',
            questions: [
              { id: 'cc-q1', title: 'Design a Custom Read-Write Lock', completed: false, difficulty: 'Medium' },
              { id: 'cc-q2', title: 'Implement a Thread-Safe Blocking Queue', completed: false, difficulty: 'Medium' }
            ]
          },
          {
            id: 'cc-2',
            name: 'Asynchronous Design Patterns',
            status: 'NOT_STARTED',
            questions: [
              { id: 'cc-q3', title: 'Implement a Custom Thread Pool', completed: false, difficulty: 'Hard' },
              { id: 'cc-q4', title: 'Design a Task Scheduler with Delay Support', completed: false, difficulty: 'Hard' }
            ]
          }
        ]
      },
      {
        id: 'ood',
        name: 'Object-Oriented Design (LLD)',
        icon: 'Layers',
        description: 'Apply SOLID principles and classic design patterns to write highly extensible mock services.',
        topics: [
          {
            id: 'ood-1',
            name: 'GoF Design Patterns',
            status: 'NOT_STARTED',
            questions: [
              { id: 'ood-q1', title: 'Design a Parking Lot system using SOLID', completed: false, difficulty: 'Medium' },
              { id: 'ood-q2', title: 'Design a Movie Ticket Booking System (BookMyShow)', completed: false, difficulty: 'Hard' }
            ]
          },
          {
            id: 'ood-2',
            name: 'SOLID Principles & Clean Code',
            status: 'NOT_STARTED',
            questions: [
              { id: 'ood-q3', title: 'Refactor Inheritance to Composition', completed: false, difficulty: 'Easy' },
              { id: 'ood-q4', title: 'Implement an Extensible Logging Library with Filters', completed: false, difficulty: 'Medium' }
            ]
          }
        ]
      },
      {
        id: 'databases',
        name: 'Database Systems',
        icon: 'Database',
        description: 'Transactions, composite indexing, replication architectures, and storage internals.',
        topics: [
          {
            id: 'db-1',
            name: 'Indexing, B-Trees & LSM Trees',
            status: 'NOT_STARTED',
            questions: [
              { id: 'db-q1', title: 'Analyze and Optimize composite indexes for query plans', completed: false, difficulty: 'Medium' },
              { id: 'db-q2', title: 'Explain write/read amplification in LSM vs B-Trees', completed: false, difficulty: 'Hard' }
            ]
          },
          {
            id: 'db-2',
            name: 'Transactions & Concurrency Control',
            status: 'NOT_STARTED',
            questions: [
              { id: 'db-q3', title: 'Simulate Optimistic Concurrency Control (OCC)', completed: false, difficulty: 'Medium' },
              { id: 'db-q4', title: 'Design a Distributed Transaction Coordinator (Two-Phase Commit)', completed: false, difficulty: 'Hard' }
            ]
          }
        ]
      }
    ],
    interviews: [
      {
        id: 'mock-1',
        type: 'System Design',
        date: '2026-07-20',
        time: '14:00',
        interviewer: 'Senior Staff Engineer (Amazon)',
        status: 'Scheduled',
        notes: 'Focusing on designing a globally scalable chat application with offline-first support.'
      }
    ],
    milestones: [
      { id: 'ms-1', title: 'Complete Graphs and Trees in DSA', description: 'Review Dijkstra, Topological Sort, and tree serializations.', targetDate: '2026-07-18', completed: false, order: 1 },
      { id: 'ms-2', title: 'Design Load Balancer and Cache Module', description: 'Implement rate limiter, consistent hashing, and LRU Cache LLD.', targetDate: '2026-07-25', completed: false, order: 2 },
      { id: 'ms-3', title: 'First Full Mock Interview', description: 'Scheduled system design mock interview with staff level peer.', targetDate: '2026-08-01', completed: false, order: 3 }
    ]
  };

  const key = getProgressKey(userId);
  localStorage.setItem(key, JSON.stringify(initialData));
  return initialData;
}
