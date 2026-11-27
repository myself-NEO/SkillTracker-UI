// Owned by TheSWEguide: the content import never overwrites this file.
// In the portfolio this type lived in components/learn/interviews.ts. The LLD and HLD landing
// data need it, so it lives with the content, and the interview store imports it from here.

/** Self-evaluation dimensions of the mock interviews: HLD's rubric, then LLD's (shared ids mean the same skill). */
export type RubricId =
  | 'requirements'
  | 'api'
  | 'data-model'
  | 'architecture'
  | 'scalability'
  | 'reliability'
  | 'tradeoffs'
  | 'communication'
  | 'object-model'
  | 'class-design'
  | 'principles'
  | 'implementation'
  | 'edge-cases'
  | 'extensibility';
