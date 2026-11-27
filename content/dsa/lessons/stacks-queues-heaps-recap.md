This recap covers three modules at once: stacks, queues and heaps all answer "which element do I process next?", and the hard part in an interview is telling which one a problem wants.

## Recognizing the pattern

**Step 1: what am I repeatedly asking for?**

| Question being asked repeatedly | Structure |
|---|---|
| "the most recent unresolved thing" | **[stack](lesson:stack-basics)** |
| "the oldest pending thing" | **[queue](lesson:queue-basics)** |
| "the best/extreme thing" | **[heap](lesson:heap-basics)** |
| "the extreme thing *within a window*" | **[monotonic deque](lesson:monotonic-deque)** |
| "the extreme thing, plus arbitrary removal" | **[TreeMap](lesson:java-priorityqueue#patterns)** |

### Stacks

| You see… | Reach for |
|---|---|
| brackets, tags, nesting, "valid" | [matching stack](lesson:matching-and-simulation) |
| "next/previous greater/smaller" | [monotonic stack](lesson:monotonic-stack) |
| "how many days/steps until…" | monotonic stack, store indexes |
| histogram, rectangle, area, span | monotonic stack + width formula |
| "sum over all subarrays of min/max" | monotonic stack + contribution counting |
| infix expression, `(`, precedence | [calculator stack](lesson:expression-parsing) (save/restore context) |
| "design a stack with O(1) getMin/getMax" | [augmented stack](lesson:augmented-and-explicit-stacks) (pair values) |
| adjacent elements cancel/merge | collapse stack |
| "lexicographically smallest after removing k" | greedy monotonic stack |
| "do it iteratively", "no recursion" | explicit stack holding frame state |
| undo/redo, backtrack, browser history | two stacks |

### Queues

| You see… | Reach for |
|---|---|
| "minimum steps/moves", unweighted | [BFS](lesson:breadth-first-search) with level counting |
| "level order", "by depth" | BFS with a `levelSize` snapshot |
| "all sources spread at once", "nearest X for every cell" | [multi-source BFS](lesson:multi-source-and-0-1-bfs) |
| "max/min of every window of size k" | [monotonic deque](lesson:monotonic-deque) |
| "longest window where max − min ≤ limit" | two monotonic deques + two pointers |
| "prerequisites", "build order", "cycle in a DAG" | [Kahn's algorithm](lesson:topological-sort) (queue + in-degree) |
| edge weights are only 0 and 1 | 0-1 BFS (deque) |
| arbitrary positive edge weights | [Dijkstra](lesson:shortest-paths) (heap) |
| "process in order received", producer/consumer | plain queue / blocking queue |

### Heaps

| You see… | Reach for |
|---|---|
| "top k", "k largest/smallest/closest/most frequent" | [heap of size k](lesson:top-k-and-two-heaps) (**inverted** type) |
| "kth ..." with a stream or unbounded input | heap of size k |
| "kth ..." with a fixed in-memory array | [quickselect](lesson:quicksort-and-quickselect) (mention the heap too) |
| "merge k sorted ..." | [k-way merge](lesson:k-way-merge) heap |
| "median of a stream" | two heaps |
| "minimum rooms/platforms/CPUs" | [sort by start + min-heap of ends](lesson:meeting-rooms) |
| "combine the two cheapest, repeatedly" | min-heap (Huffman) |
| "no two adjacent equal", "cooldown" | [max-heap by count + cooldown queue](lesson:partition-labels-and-task-scheduler) |
| shortest path, weighted, non-negative | Dijkstra (heap) |
| minimum spanning tree | [Prim (heap) or Kruskal (sort + DSU)](lesson:minimum-spanning-trees) |
| "schedule to maximise/minimise X, choices change" | [greedy + heap](lesson:greedy-with-a-heap) |

## Decision procedure

Run this in order when a problem lands in front of you.

**Step 1: what am I repeatedly asking for?** Use the first table above.

**Step 2: check the trigger vocabulary.**

- *nested, balanced, valid, matching, undo, backtrack* → stack
- *next/previous greater/smaller, span, histogram, warmer* → monotonic stack
- *shortest, minimum steps, level, nearest, spread* → BFS queue
- *prerequisite, dependency, build order* → Kahn's queue
- *top k, kth, median, merge k, minimum rooms, cooldown* → heap

**Step 3: sanity-check the target complexity against the constraints.** If `n = 10⁵` and you're heading toward O(n²), a monotonic stack or a heap is probably the intended escape. (The full constraint table is in [the problem-solving framework](lesson:problem-solving-framework).)

**Step 4: state the brute force, then improve it.** Always. Interviewers want to see the baseline and the reasoning that beats it, not a memorised optimum with no derivation.

**Step 5: write the invariant as a comment before you write the loop.**

```java
// stack holds indices whose next-greater element is not yet known, values decreasing
// low holds the smaller half (max at top); high holds the larger half (min at top)
// q holds all cells at the current distance from the source
```

If you can't write that sentence, you don't yet understand the solution, and the code will come out wrong. If you can, the code usually writes itself. This one habit is worth more than any number of extra problems.

**Step 6: walk your own code on a 3–5 element example, out loud, before saying "done".**

### Choosing between a heap, quickselect, a TreeMap and sorting

| Need | Best tool | Cost |
|---|---|---|
| Full sorted order | sort | O(n log n) |
| Kth largest, data in memory, mutable | Quickselect | O(n) avg |
| Kth largest, streaming / immutable | min-heap of size k | O(n log k) |
| Repeatedly extract the min, set changes | heap | O(log n) per op |
| Extract min **and** max | two heaps, or `TreeMap` | O(log n) |
| Remove arbitrary elements | `TreeMap` / indexed heap | O(log n) |
| Keys in a small bounded range | bucket / counting sort | O(n) |
| Top k by frequency, freq ≤ n | bucket sort | O(n) |

**How to answer "why a heap?":** *"I need the extreme element repeatedly from a set that keeps changing, and I don't need full sorted order, so I pay O(log n) per update instead of O(n log n) up front. And it works on a stream."*

### Deriving a monotonic stack on the spot

You will meet a monotonic-stack problem you've never seen. Here's the derivation, not the memorisation:

1. Write the brute force: for each `i`, scan right until the condition holds. O(n²).
2. Ask: **"when I scan for `i`, what work am I repeating from `i-1`?"**
3. Notice that if `nums[j] < nums[i]` and `j < i`, then `j` can never be anyone's answer once `i` exists: `i` is both bigger *and* closer. So `j` is **dominated** and can be discarded.
4. The undominated elements form a monotonic sequence. Keep exactly those, in a stack.
5. Now decide what to record on pop: the value (next greater), the index difference (days to wait), or the width between boundaries (histogram).

**Steps 3 and 4 are the whole pattern.** "Element j is dominated by element i, so drop it" is the idea; everything else is bookkeeping.

## Edge cases to test

**Stacks**
- `isEmpty()` before every `peek()`/`pop()`: a closer first, an empty input.
- Leftovers after the loop: brackets left open, or monotonic-stack elements that need a sentinel or flush loop.
- Duplicates: strict `<` or non-strict `<=`?
- The output order: `ArrayDeque` iterates top-first when used with `push`.

**Queues and BFS**
- The start equals the target; empty input; an unreachable target (is the answer −1, 0 or partial?).
- Bounds checks before every array access in a grid.
- `steps++` sits **outside** the inner level loop.
- Nothing to do at all (no fresh oranges: 0 minutes, not −1).

**Heaps**
- An empty heap before `peek()`/`poll()`.
- `k = 0`, `k = n`, and `k` larger than the number of distinct elements.
- All values equal, and very large or very negative values in comparators.
- Stale entries surfacing after updates (lazy deletion).

## Common mistakes

**Stacks**
1. Using `java.util.Stack`, a synchronized legacy class that iterates bottom to top. Use `ArrayDeque`.
2. `peek()`/`pop()` without an `isEmpty()` check.
3. Forgetting the leftover check after the loop (`stack.isEmpty()` at the end of bracket matching; the flush loop or sentinel in monotonic stacks).
4. Storing values when you needed indexes, then discovering you can't compute widths.
5. Getting `<` vs `<=` wrong with duplicates, and double counting.
6. The wrong operand order in RPN subtraction and division.

**Queues**
7. Not snapshotting `q.size()` before the level loop: levels blend, and distances are wrong.
8. Marking `visited` on dequeue instead of enqueue: duplicates, and a possible O(V²) blow-up.
9. Missing bounds checks in grid BFS.
10. `steps++` inside the inner loop instead of outside.
11. Using BFS for a weighted graph (it should be Dijkstra), or Dijkstra where weights are 0/1 (it could be 0-1 BFS): correct but suboptimal, and interviewers notice.
12. Forgetting `tail = null` when a linked queue empties.

**Heaps**
13. Forgetting that Java's `PriorityQueue` is a **min**-heap by default.
14. Using a max-heap for "k largest" (its size grows to n instead of staying at k).
15. `(a, b) -> b - a`: integer overflow.
16. Assuming a heap is sorted, or that iterating it gives sorted order.
17. Using `remove(Object)` in a loop: O(n²) without realising it.
18. Mutating an object that's already inside the heap.
19. Missing the lazy-deletion guard in Dijkstra.

**Universal**
20. Coding before stating the approach and the complexity.
21. Not testing on an empty input, a single element, or all-equal elements.
22. Silence. Narrate. A correct solution delivered mutely scores worse than a good solution reasoned aloud.

## Practice ladder

Do these in order. Don't skip levels. **Rule: implement each one yourself before looking at a solution, and re-solve anything you needed help with three days later.**

### Stacks

**Foundation**
- Valid Parentheses
- Min Stack
- Baseball Game
- Remove All Adjacent Duplicates In String
- Implement Queue using Stacks
- Implement Stack using Queues
- Backspace String Compare

**Monotonic stack: do all of these, they're the core**
- Next Greater Element I
- Next Greater Element II (circular)
- Daily Temperatures
- Online Stock Span
- Remove K Digits
- 132 Pattern
- Sum of Subarray Minimums
- Remove Duplicate Letters / Smallest Subsequence of Distinct Characters
- Largest Rectangle in Histogram ⭐
- Maximal Rectangle ⭐
- Trapping Rain Water (stack + two pointers)

**Parsing and simulation**
- Evaluate Reverse Polish Notation
- Basic Calculator II
- Basic Calculator (parentheses)
- Decode String
- Simplify Path
- Asteroid Collision
- Exclusive Time of Functions
- Number of Atoms (hard parsing)

**Recursion → iteration**
- Binary Tree Inorder / Preorder / Postorder Traversal, iteratively
- Flatten Nested List Iterator
- BST Iterator

### Queues

**Foundation**
- Design Circular Queue
- Design Circular Deque
- Number of Recent Calls
- Moving Average from Data Stream

**BFS core**
- Binary Tree Level Order Traversal
- Binary Tree Right Side View
- Number of Islands (BFS version)
- Rotting Oranges ⭐
- 01 Matrix ⭐
- Walls and Gates
- Open the Lock
- Word Ladder ⭐
- Shortest Path in Binary Matrix
- Snakes and Ladders
- Shortest Bridge
- Minimum Knight Moves
- Sliding Puzzle (hard, state encoding)

**Topological sort**
- Course Schedule
- Course Schedule II
- Alien Dictionary ⭐
- Minimum Height Trees
- Parallel Courses

**Monotonic deque**
- Sliding Window Maximum ⭐
- Longest Continuous Subarray With Absolute Diff ≤ Limit
- Shortest Subarray with Sum at Least K (hard)
- Constrained Subsequence Sum (hard)
- Jump Game VI

**0-1 BFS**
- Minimum Obstacle Removal to Reach Corner
- Minimum Cost to Make at Least One Valid Path in a Grid

### Heaps

**Foundation**
- Kth Largest Element in a Stream
- Last Stone Weight
- Kth Largest Element in an Array ⭐ (heap + quickselect)
- Top K Frequent Elements ⭐ (heap + buckets)
- K Closest Points to Origin
- Sort Characters By Frequency
- Minimum Cost to Connect Sticks

**K-way merge**
- Merge k Sorted Lists ⭐
- Kth Smallest Element in a Sorted Matrix
- Find K Pairs with Smallest Sums
- Smallest Range Covering Elements from K Lists (hard)
- Ugly Number II

**Two heaps**
- Find Median from Data Stream ⭐
- Sliding Window Median (hard: lazy deletion)
- IPO (hard)

**Scheduling**
- Meeting Rooms II ⭐
- Task Scheduler ⭐
- Car Pooling
- Single-Threaded CPU
- Reorganize String
- Minimum Number of Refueling Stops
- Process Tasks Using Servers

**Graph + heap**
- Network Delay Time (Dijkstra)
- Path with Maximum Probability
- Cheapest Flights Within K Stops (Dijkstra variant / Bellman-Ford)
- Swim in Rising Water
- Min Cost to Connect All Points (Prim)

### Combination problems (do these last: they mix all three)

- LRU Cache (HashMap + doubly linked list)
- LFU Cache (HashMap + frequency buckets)
- Design Twitter (hash map + k-way merge heap)
- Maximum Frequency Stack (stack of stacks + frequency map)
- Design Hit Counter
- The Skyline Problem (heap + sweep line, hard)
- Basic Calculator III (stack + recursion, hard)

### A four-week plan

A realistic order, rather than a "do 200 problems" instruction:

**Week 1: mechanics.** Implement `ArrayStack`, `LinkedStack`, `CircularQueue`, `LinkedQueue` and `MinHeap` from scratch, from memory, twice. Then do the Foundation lists. The goal is that `siftUp`/`siftDown` and the BFS template come out of your fingers without thinking.

**Week 2: the three big patterns.** Monotonic stack, BFS, top-k heap. Do every problem in those three sections. These three alone cover most stack, queue and heap interview questions.

**Week 3: the rest.** Parsing, topological sort, the monotonic deque, two heaps, scheduling.

**Week 4: hard and mixed.** Largest Rectangle, Word Ladder, Sliding Window Median, Alien Dictionary, The Skyline Problem. Then the combination problems.

**Throughout:** for every problem, before coding, write down (a) the invariant, (b) the time and space complexity you're targeting, and (c) the edge cases. After coding, write one line in a notebook: *"trigger phrase → pattern"*. That notebook is what you re-read the night before the interview, not the problems themselves.

## The one-page summary

```
STACK   → LIFO, O(1) all ops, ArrayDeque
          nesting/pending → matching, calculators, iterative DFS
          "next/prev greater/smaller" → MONOTONIC STACK, store indices, O(n)
          invariant: stack holds elements whose answer isn't known yet

QUEUE   → FIFO, O(1) all ops, ArrayDeque
          waves/levels → BFS = shortest path on unweighted graphs
          snapshot q.size() per level; mark visited at ENQUEUE
          all sources at once → multi-source BFS
          in-degree 0 → Kahn's topological sort
          max/min per window → MONOTONIC DEQUE, O(n)
          0/1 weights → 0-1 BFS with a deque

HEAP    → partial order, peek O(1), offer/poll O(log n), build O(n)
          PriorityQueue is MIN by default; Integer.compare, never a-b
          k largest → MIN-heap of size k  (and vice versa)
          merge k sorted → heap of the k frontiers
          streaming median → two heaps, max-heap low + min-heap high
          intervals → sort by start + min-heap of ends
          weighted shortest path → Dijkstra + lazy deletion guard
```

Print that block. Read it before every mock interview.

## Key takeaways

- Ask what you need next: the most recent unresolved thing (stack), the oldest pending thing (queue), or the extreme thing (heap).
- Monotonic stacks and deques turn "nearest greater" and "window maximum" questions into O(n).
- BFS is shortest path on unweighted graphs: mark on enqueue and snapshot each level.
- For the K largest, keep a min-heap of size K; for a running median, two heaps.
- Write the invariant before the loop, and test the empty, single-element and all-equal cases.

## Knowledge check

```quiz
? "For each day, how many days until a warmer temperature?" Which structure?
+ A monotonic stack of indexes
- A min-heap of temperatures
! A heap finds extremes, not the nearest warmer day to the right.
- A queue processed level by level
! There are no levels or distances in a graph here.
- A sliding window of fixed size
! The distance to the warmer day varies.
> Each day waits on the stack until a warmer day resolves it.

? "The minimum number of moves for a knight to reach a square." Which structure?
+ A queue, for breadth-first search
- A stack, for depth-first search
! DFS doesn't find shortest paths.
- A max-heap of distances
! Every move costs the same, so plain BFS suffices.
- A monotonic deque
! There's no sliding window.
> Unweighted shortest path is BFS.

? "Return the k most frequent words from a huge stream." Which structure?
+ A min-heap of size k, ordered by frequency
- A max-heap holding every word
! That's O(n) space and O(n log n) time.
- Sorting all the words by frequency
! That needs the whole stream in memory at once.
- A monotonic stack
! There's no "nearest greater" structure here.
> The heap's root is the weakest of the k best, the one to evict.

? "Design a structure that returns the minimum element and supports removing any element, in O(log n)." Which fits?
+ A TreeMap (or TreeSet)
- A PriorityQueue
! Removing an arbitrary element is O(n).
- A stack with a running minimum
! A stack can only remove from the top.
- A queue
! A queue can only remove from the front.
> Heaps are for removing the extreme only.
```
