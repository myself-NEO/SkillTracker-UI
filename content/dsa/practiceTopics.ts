// Topics of the DSA "Coding questions" list. Kept apart from the problem list itself so the
// router can validate #dsa/problems/<topic> without loading every problem.

export interface PracticeTopic {
  id: string;
  title: string;
  /** DSA guide (lesson slug) that teaches this topic */
  guide: string;
}

export const PRACTICE_TOPICS: PracticeTopic[] = [
  { id: 'arrays-hashing', title: 'Arrays & Hashing', guide: 'hashing-techniques' },
  { id: 'two-pointers', title: 'Two Pointers', guide: 'two-pointers' },
  { id: 'sliding-window', title: 'Sliding Window', guide: 'sliding-window' },
  { id: 'linked-list', title: 'Linked List', guide: 'linked-list-basics' },
  { id: 'stack', title: 'Stacks & Monotonic Stacks', guide: 'stack-basics' },
  { id: 'heap', title: 'Heaps & Priority Queues', guide: 'heap-basics' },
  { id: 'binary-search', title: 'Binary Search & Sorting', guide: 'binary-search-template' },
  { id: 'backtracking', title: 'Backtracking', guide: 'backtracking-template' },
  { id: 'trees', title: 'Trees & BSTs', guide: 'tree-basics' },
  { id: 'tries', title: 'Tries', guide: 'trie-basics' },
  { id: 'graphs', title: 'Graphs', guide: 'graph-basics' },
  { id: 'dp', title: 'Dynamic Programming', guide: 'what-is-dynamic-programming' },
  { id: 'greedy-intervals', title: 'Greedy & Intervals', guide: 'greedy-fundamentals' },
  { id: 'strings', title: 'String Algorithms', guide: 'string-algorithms-basics' },
  { id: 'math', title: 'Math & Randomized', guide: 'math-basics' },
  { id: 'bits', title: 'Bit Manipulation', guide: 'binary-and-twos-complement' },
];

export const practiceTopic = (id: string) => PRACTICE_TOPICS.find((t) => t.id === id);
