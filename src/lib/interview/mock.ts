import * as hld from '@content/hld/interview';
import { PHASE_BUDGETS as HLD_BUDGETS, RUBRIC as HLD_RUBRIC } from '@content/hld/landing';
import * as lld from '@content/lld/interview';
import { PHASE_BUDGETS as LLD_BUDGETS, RUBRIC as LLD_RUBRIC } from '@content/lld/landing';
import type { RubricId } from '@content/shared/rubric';
import type { BaseScript, Matcher } from '@content/system-design/interviewScript';
import type { PhaseId } from '@lib/progress/interviews';

// The timed LLD and HLD mock interviews (/lld/interview/:problem): each topic's kit (its phases,
// time budgets, guidance, rubric, keyword matcher and interviewer replies) and the helpers the
// phase screens share. Ported from TheSWEguide's components/interview/mock/{kit,hldKit,lldKit,parts};
// the screens themselves are Angular components (pages/interview/mock).

export type MockTopic = 'lld' | 'hld';
export type HldScript = hld.InterviewScript;
export type LldScript = lld.LldInterviewScript;
export type MockScript = HldScript | LldScript;

export interface PhaseDef {
  id: PhaseId;
  label: string;
  short: string;
}

export interface PhaseGuide {
  goal: string;
  say: string;
  /** Generic hints, used when the breakdown has none for the phase. */
  hints: string[];
}

export interface RubricDimension {
  id: RubricId;
  label: string;
  strong: string;
  weak: string;
}

export interface MockKit<S extends BaseScript = BaseScript> {
  /** Phases in order, starting with 'clarify' and ending with 'evaluation'. */
  phases: PhaseDef[];
  /** Suggested minutes per phase, for a 45- and a 60-minute interview. */
  budgets: Record<45 | 60, Record<string, number>>;
  guide: Partial<Record<PhaseId, PhaseGuide>>;
  rubric: RubricDimension[];
  matcher: Matcher;
  /** The list page's introduction. */
  intro: string;
  /** "How this works" steps on the brief. */
  howItWorks: string[];
  clarifyPlaceholder: string;
  /** Reply when no scripted answer matches. */
  noMatchAnswer: string;
  /** Questions that ask the interviewer to make a design decision, and the reply to them. */
  designChoice: RegExp;
  designChoiceAnswer: string;
  /** Shown under the full list of clarifying questions (e.g. scope and exclusions). */
  clarifyAppendix?: (script: S) => { title: string; markdown: string } | undefined;
  checklistTitle: string;
}

const DESIGN_CHOICE_ANSWER =
  'That’s your call — it’s part of what is being evaluated. Pick an option, give the reason tied to the requirements, and I’ll push back if I disagree.';

// --- HLD -----------------------------------------------------------------------------------------

export const HLD_PHASES: PhaseDef[] = [
  { id: 'clarify', label: 'Clarify the problem', short: 'Clarify' },
  { id: 'requirements', label: 'Define requirements', short: 'Requirements' },
  { id: 'estimation', label: 'Estimate capacity', short: 'Estimate' },
  { id: 'api', label: 'Define the APIs', short: 'APIs' },
  { id: 'data-model', label: 'Model the data', short: 'Data model' },
  { id: 'architecture', label: 'High-level architecture', short: 'Architecture' },
  { id: 'deep-dives', label: 'Deep dives', short: 'Deep dives' },
  { id: 'bottlenecks', label: 'Bottlenecks & failures', short: 'Failures' },
  { id: 'tradeoffs', label: 'Trade-offs & wrap-up', short: 'Trade-offs' },
  { id: 'evaluation', label: 'Self-evaluation', short: 'Evaluate' },
];

export const HLD_GUIDE: Record<hld.ScriptPhase, PhaseGuide> = {
  clarify: {
    goal: 'Clarify the use case, the users and the scope. Ask the questions whose answers change the design.',
    say: '“Before I design anything, I’d like to confirm a few things about scale and scope…”',
    hints: [
      'Ask about scale: users, requests per day, data volume, growth.',
      'Ask what matters most: latency, availability or consistency — and for which operation.',
      'Ask what is explicitly out of scope: accounts, analytics, admin tools, multi-region.',
    ],
  },
  requirements: {
    goal: 'Write 3–5 functional requirements (what users can do) and quantified non-functional requirements.',
    say: '“So the core features are… and the system must… Let me prioritise these.”',
    hints: [
      'Phrase functional requirements as user capabilities: “Users can …”.',
      'Give numbers for non-functional requirements: p99 latency, availability nines, durability, scale.',
      'Say which consistency each core operation needs — it is rarely the same for all of them.',
    ],
  },
  estimation: {
    goal: 'Estimate only the numbers that change the design, out loud, in two or three minutes — and say what each implies.',
    say: '“That’s about N requests per second at peak, which means…”',
    hints: [
      'Convert per-day numbers to per-second: divide by ~100,000 (86,400 rounded).',
      'Split reads from writes — the ratio usually decides whether caching is central.',
      'Storage = writes/day × bytes × days kept × replication factor.',
    ],
  },
  api: {
    goal: 'One endpoint per functional requirement: method, path, request, response and status codes; auth, pagination and idempotency.',
    say: '“For creating X, I’d expose POST /x returning 201 with…”',
    hints: [
      'Use plural resource nouns and the right HTTP method for each action.',
      'Take the user’s identity from the auth token, not from the request body.',
      'Any list endpoint needs pagination; any non-idempotent write may need an idempotency key.',
    ],
  },
  'data-model': {
    goal: 'Name the core entities, keys and relationships; choose a store for each from its access pattern; note indexes and partition keys.',
    say: '“The main entities are… I’ll keep X in Postgres because… and partition by…”',
    hints: [
      'List the access patterns your APIs need, then design keys and indexes to serve them.',
      'Choose the store per entity — not one database for everything by default.',
      'Name the partition key and check it doesn’t create a hot spot.',
    ],
  },
  architecture: {
    goal: 'Draw a working design that satisfies every functional requirement — build it one endpoint at a time and narrate the flow.',
    say: '“A request to shorten comes through the load balancer to the write service, which…”',
    hints: [
      'Start with client → load balancer → stateless service → database, then add only what a requirement needs.',
      'Trace each API call through the diagram; every box should be on at least one path.',
      'Mark where caches and queues will go, but defer optimisation to the deep dives.',
    ],
  },
  'deep-dives': {
    goal: 'Pick the two or three hardest parts — usually where the non-functional requirements bite — and go deep with options and trade-offs.',
    say: '“The hardest part here is… there are three ways to handle it…”',
    hints: [
      'Go from simplest to most sophisticated option and say why each falls short.',
      'Tie every option back to a number from your estimate or a non-functional requirement.',
      'At senior level, choose the deep dives yourself before the interviewer does.',
    ],
  },
  bottlenecks: {
    goal: 'Stress the design: single points of failure, hot partitions, cache failures, backlogs, network failures and races.',
    say: '“If the cache cluster fails, all reads hit the database, so…”',
    hints: [
      'Walk every box in the diagram and ask: what happens if this is slow, or gone?',
      'Look for hot keys and hot partitions in your data model.',
      'For each failure: how is it detected, how is it mitigated, what does the user see?',
    ],
  },
  tradeoffs: {
    goal: 'Summarise the design, the alternatives you rejected and why, and what you would build or monitor next.',
    say: '“To summarise… I chose X over Y because… if requirements changed to Z, I’d…”',
    hints: [
      'Give a 30-second summary of the final design first.',
      'Name the two or three biggest trade-offs and the alternative for each.',
      'Close with monitoring, security and how the design would evolve.',
    ],
  },
};

export const HLD_KIT: MockKit<HldScript> = {
  phases: HLD_PHASES,
  budgets: HLD_BUDGETS,
  guide: HLD_GUIDE,
  rubric: HLD_RUBRIC,
  matcher: { keywords: hld.keywords, matchClarification: hld.matchClarification, mentions: hld.mentions },
  intro:
    'Each mock interview walks you through the nine steps against the clock: ask the interviewer clarifying questions, write requirements and APIs, estimate with the calculator, draw your design in Mermaid, pick deep dives, then compare with the reference and rate yourself. Answers are scripted per problem and matched to your questions by keywords; scores are your own self-assessment.',
  howItWorks: [
    'Ask clarifying questions; the interviewer answers from this problem’s script.',
    'Write your requirements, estimate, APIs and data model; draw the architecture.',
    'Choose deep dives, then stress the design for failures and trade-offs.',
    'Hints and the reference design stay hidden until you open them.',
    'Finish by rating yourself on the interview rubric.',
  ],
  clarifyPlaceholder: 'Ask a clarifying question, e.g. “How many new links per day?”',
  noMatchAnswer:
    'No scripted answer for that one. In a real interview, state a reasonable assumption out loud (“I’ll assume …”) and move on — or rephrase if you meant scale, scope, latency, consistency or data size.',
  designChoice:
    /\b(which|what)\s+(database|db|datastore|store|queue|cache|broker|language|framework|cloud)\b|\b(should|can|could|may)\s+(i|we)\s+use\b/i,
  designChoiceAnswer: DESIGN_CHOICE_ANSWER,
  clarifyAppendix: (script) =>
    script.sections['Scope and exclusions'] ? { title: 'Scope and exclusions', markdown: script.sections['Scope and exclusions'] } : undefined,
  checklistTitle: 'Evaluation checklist',
};

/** The breakdown sections answering an HLD phase, joined into one Markdown document. */
export const hldPhaseReference = (script: HldScript, phase: hld.ScriptPhase) => joinSections(script.sections, hld.PHASE_SECTIONS[phase]);

/** The titles of those sections that the breakdown has, e.g. "API design". */
export const hldPhaseLabel = (script: HldScript, phase: hld.ScriptPhase) =>
  hld.PHASE_SECTIONS[phase].filter((title) => script.sections[title]).join(' · ');

// --- LLD -----------------------------------------------------------------------------------------

export const LLD_PHASES: PhaseDef[] = [
  { id: 'clarify', label: 'Clarify the problem', short: 'Clarify' },
  { id: 'requirements', label: 'Define requirements', short: 'Requirements' },
  { id: 'entities', label: 'Identify entities and responsibilities', short: 'Entities' },
  { id: 'class-design', label: 'Design the classes', short: 'Class design' },
  { id: 'implementation', label: 'Implement the core flow', short: 'Implementation' },
  { id: 'edge-cases', label: 'Edge cases & concurrency', short: 'Edge cases' },
  { id: 'extensibility', label: 'Follow-ups & extensions', short: 'Follow-ups' },
  { id: 'evaluation', label: 'Self-evaluation', short: 'Evaluate' },
];

export const LLD_GUIDE: Record<lld.LldScriptPhase, PhaseGuide> = {
  clarify: {
    goal: 'Pin down what the system must do, the rules it enforces, how it fails, what is out of scope and whether calls run concurrently.',
    say: '“Before I model anything, let me check the rules and the scope…”',
    hints: [
      'Ask about capabilities: what can each actor do, and which variants exist (types, sizes, tiers)?',
      'Ask about rules and errors: what is allowed, what is rejected, and what happens on failure?',
      'Ask whether several threads or users act at once — it decides how much of the design is about concurrency.',
    ],
  },
  requirements: {
    goal: 'Write the functional requirements as operations, and the non-functional ones that shape the classes: thread safety, swappable policies, efficiency.',
    say: '“So the core operations are… it must be thread-safe, and pricing should be swappable. Is that the right scope?”',
    hints: [
      'Phrase each functional requirement as an operation the API will expose: “park a vehicle and issue a ticket”.',
      'Non-functional requirements in LLD are about the code: thread safety, extensibility, testability, time complexity.',
      'Say what is out of scope (persistence, UI, payments) so you don’t design it.',
    ],
  },
  entities: {
    goal: 'List the core entities and give each one responsibility. Decide which are value objects, which are enums and which own state.',
    say: '“The nouns are… the ones with behaviour are… Ticket is a value object, so a record.”',
    hints: [
      'Underline the nouns in the requirements, then drop the ones with no state or behaviour you need.',
      'Give each entity one sentence of responsibility; if you need “and”, it may be two classes.',
      'Fixed sets (types, sizes, states) are enums; immutable data carriers are records.',
    ],
  },
  'class-design': {
    goal: 'Draw the classes, interfaces and relationships. Put each rule in the class that owns the data, and an interface wherever behaviour varies.',
    say: '“ParkingLot orchestrates; each Level owns its spots and allocates them; pricing sits behind an interface so it can change.”',
    hints: [
      'Put behaviour where the data lives (information expert) instead of in a central manager.',
      'Introduce an interface only where a requirement says the behaviour varies or will change.',
      'Prefer composition: the whole owns its parts; inheritance only for a true is-a with shared behaviour.',
    ],
  },
  implementation: {
    goal: 'Write the core flow in Java: the main entry points, the invariants they check and the exceptions they throw. Skip getters and boilerplate.',
    say: '“Let me code park() first — it’s the flow everything else depends on…”',
    hints: [
      'Start with the method that carries the main requirement, then the one that undoes it.',
      'Validate at the boundary and throw a specific exception; keep the rest of the code free of defensive checks.',
      'Inject time, IDs and policies through constructors so the code is testable.',
    ],
  },
  'edge-cases': {
    goal: 'Walk the edge cases — invalid input, empty, full, duplicates, repeated calls — then find the shared state and make every check-then-act atomic.',
    say: '“Two gates could claim the same spot at once, so the claim has to be atomic…”',
    hints: [
      'For each operation ask: what if it’s called twice, with bad input, or when there’s nothing left?',
      'List the shared mutable state; every read-decide-write on it needs a lock, an atomic or a concurrent collection.',
      'Say how you would test it: unit tests with an injected clock, plus one test that runs callers in parallel.',
    ],
  },
  extensibility: {
    goal: 'Take the follow-ups: show that each one is a new class or a local change, and state the complexity of the key operations.',
    say: '“Weekend pricing is a new strategy that wraps the hourly one — nothing else changes.”',
    hints: [
      'Answer a follow-up by naming what you add and what stays untouched.',
      'Decorator, Strategy and Observer turn most follow-ups into new classes.',
      'If a follow-up forces edits everywhere, say which earlier decision you would revisit.',
    ],
  },
};

export const LLD_KIT: MockKit<LldScript> = {
  phases: LLD_PHASES,
  budgets: LLD_BUDGETS,
  guide: LLD_GUIDE,
  rubric: LLD_RUBRIC,
  matcher: { keywords: lld.keywords, matchClarification: lld.matchClarification, mentions: lld.mentions },
  intro:
    'Each mock interview walks you through the seven steps against the clock: ask the interviewer clarifying questions, write requirements, pick the entities, draw the class diagram, code the core flow, cover edge cases and concurrency, then take on follow-ups and rate yourself. Answers are scripted per problem and matched to your questions by keywords; scores are your own self-assessment.',
  howItWorks: [
    'Ask clarifying questions; the interviewer answers from this problem’s script.',
    'Write the requirements, list the entities and draw the class diagram.',
    'Code the core flow in Java, then cover edge cases and concurrency.',
    'Take on a follow-up; hints and the reference solution stay hidden until you open them.',
    'Finish by rating yourself on the interview rubric.',
  ],
  clarifyPlaceholder: 'Ask a clarifying question, e.g. “Can several gates park cars at the same time?”',
  noMatchAnswer:
    'No scripted answer for that one. In a real interview, state a reasonable assumption out loud (“I’ll assume …”) and move on — or rephrase if you meant the rules, errors, scope or concurrency.',
  designChoice:
    /\b(which|what)\s+(pattern|design pattern|class|classes|interface|data structure|collection|language|framework|database|db)\b|\b(should|can|could|may)\s+(i|we)\s+use\b/i,
  designChoiceAnswer: DESIGN_CHOICE_ANSWER,
  checklistTitle: 'Interviewer checklist',
};

export const mentionsType = lld.mentionsType;

/** The LLD steps' sections (and extra sections the breakdown has), joined into one Markdown document. */
export const lldSectionsMarkdown = (script: LldScript, steps: lld.Section[], extra: string[] = []) =>
  joinSections(script.sections, [...steps.map((step) => step.title), ...extra]);

export const lldSectionsLabel = (script: LldScript, steps: lld.Section[], extra: string[] = []) =>
  [...steps.map((step) => step.title), ...extra.filter((title) => script.sections[title]?.trim())].join(' · ');

/** The types of the reference class diagram, as coverage items for the entities phase. */
export const lldTypeItems = (script: LldScript) => script.types.map((type) => ({ text: `\`${type.name}\` · ${type.kind}`, terms: [type.name] }));

/** The implementation step (without its hints) and the example execution flow, as one reference. */
export const lldImplementationReference = (script: LldScript) => {
  const step = script.implementation;
  const flow = script.sections['Example execution flow'];
  return {
    label: [step?.title, flow ? 'Example execution flow' : ''].filter(Boolean).join(' · '),
    markdown: [step ? `### ${step.title}\n\n${step.body.replace(/^(#{3,5}) /gm, '#$1 ')}` : '', joinSections(script.sections, ['Example execution flow'])]
      .filter(Boolean)
      .join('\n\n'),
  };
};

export const MOCK_KITS: { hld: MockKit<HldScript>; lld: MockKit<LldScript> } = { hld: HLD_KIT, lld: LLD_KIT };

// --- Shared helpers --------------------------------------------------------------------------

/** Breakdown sections joined into one Markdown document, each under its own `###` heading. */
export const joinSections = (sections: Record<string, string>, titles: string[]) =>
  titles
    .filter((title) => sections[title]?.trim())
    // Inner ### headings drop a level, so each section title stays above its own subsections.
    .map((title) => `### ${title}\n\n${sections[title].replace(/^(#{3,5}) /gm, '#$1 ')}`)
    .join('\n\n');

/** Drops a ````solution wrapper, so a revealed reference doesn't need a second click. */
export const unwrapSolution = (markdown: string) => markdown.replace(/^(`{4,})solution[^\n]*\n([\s\S]*?)\n\1[ \t]*$/m, '$2');

/** "4:05" */
export const formatClock = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
