Recursion and backtracking reward a fixed process more than memorised solutions. This recap gathers the signals, the checklist, the costs and the mistakes for the whole module.

## Recognizing the pattern

| The problem says… | Reach for |
|---|---|
| "all", "every", "generate", "list each" with a small n | [backtracking](lesson:backtracking-template) |
| arrangements, orderings, "all sequences" | permutations: scan from 0 with `visited[]` ([choices](lesson:backtracking-choices)) |
| subsets, combinations, subsequences | `start` index, recurse with `i + 1` |
| "each element may be used repeatedly" | recurse with the same `i` |
| duplicates in the input, unique results wanted | sort, skip `nums[i] == nums[i − 1]` when `i > start` |
| place items under constraints (queens, Sudoku) | backtracking with pruning sets |
| find a path in a grid while building state | backtracking on a grid (Word Search) |
| a structure defined by smaller copies of itself | [recursion](lesson:recursion-fundamentals) |
| "count the ways", with the same sub-states repeating | [dynamic programming](lesson:what-is-dynamic-programming) instead |

### Backtracking, recursion and DFS

These terms get used loosely, so it's worth being precise once:

- **All backtracking is recursion; not all recursion is backtracking.** Factorial is recursion, but not backtracking: there's no choice being explored and undone.
- **Backtracking is DFS over an implicit tree of choices**, where each node is a partial state and each edge is a decision. "Go deep, then back up and try the next branch" *is* depth-first search; backtracking is what we call it when it constructs candidate solutions, with pruning to skip branches that can't work.
- When someone asks you to run DFS on a grid or graph *and build up a path or state as you go* (like Word Search), you're writing backtracking, even if the problem never says so.

## Decision procedure

When a new backtracking problem shows up, work through this in order:

1. Restate out loud: what counts as one complete, valid solution?
2. Identify the choice made at each recursive step: what is a single "node" in the decision tree?
3. Identify the pruning conditions, and put the check as early as possible (before recursing, not after).
4. Write the base case first.
5. Write the loop: choose → recurse → un-choose. Say the "un-choose" line out loud as you write it: it's the one that gets skipped under pressure.
6. Before declaring done: confirm you copy the state into the results, and that the un-choose exactly reverses the choose.
7. For the complexity: count the leaves of the decision tree (roughly the number of solutions) and multiply by the cost of handling one leaf.

### The cost of backtracking

The general shape is **(branching factor) ^ (depth)**, but the actual running time is usually much better than the worst case, because pruning cuts off large parts of the tree before they're explored. For a rough bound to state in an interview, count leaves × cost per leaf:

| Problem | Results (leaves) | Extra cost per result | Rough total |
|---|---|---|---|
| Subsets | 2ⁿ | O(n) to copy | O(n · 2ⁿ) |
| Permutations | n! | O(n) to copy | O(n · n!) |
| Combination Sum | depends on the input | O(target / min) to copy | exponential, bounded by pruning on `remaining < 0` |
| N-Queens | varies (92 for n = 8) | O(n) per placement check | exponential in n, heavily reduced by the column/diagonal pruning |

**Space** is generally O(depth) for the recursion stack, plus O(depth) for the `current` state (often the same thing), plus whatever the accumulated `result` takes.

## Edge cases to test

- **Empty input:** Subsets of `[]` is `[[]]`, one empty subset, not an empty list.
- **One element**, and inputs where **every element is equal** (duplicate handling).
- **No solution at all:** N-Queens for n = 2 or 3 returns an empty list; Combination Sum with a target smaller than every candidate.
- **A target of 0** in sum problems: is the empty combination a valid answer?
- **The largest allowed n**: is the output size itself feasible (n! grows past 3 million at n = 10)?
- **Deep linear recursion** in Java: thousands of levels risk a `StackOverflowError`.

## Common mistakes

**Forgetting to copy the state before saving it: *the* classic Java bug.** `current` is one mutable object, reused and changed throughout the recursion. If you write `result.add(current)` instead of `result.add(new ArrayList<>(current))`, every entry in `result` is a *reference to the same list*, not a snapshot. By the time the recursion finishes and `current` is back to empty, every entry you "saved" shows empty too:

```
Correct (with copy):     [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
Buggy (no copy):          [[], [], [], [], [], [], [], []]
```

Both versions run identical logic and produce a `result` of the right *size* (8 entries), which is exactly what makes the bug sneaky: it doesn't crash, and `result.size()` looks fine.

**Forgetting to un-choose.** If you skip `current.remove(...)`, or don't reset a `used[]`/visited flag after the recursive call returns, the state leaks into sibling branches. It shows up as *wrong* results rather than a crash, so it's slower to notice.

**The wrong loop start index.** `i = 0` versus `i = start` is the difference between permutations and combinations. Getting it backwards silently produces duplicate combinations in different orders, or misses valid orderings. Always ask: *does this problem care about order?*

**Not pruning early enough.** Code that checks validity too late (after recursing several levels into a dead branch) still gets the right answer; it just times out on larger inputs. Check before you choose.

**A missing base case, or a path that doesn't shrink the problem**, which recurses until the stack overflows.

## Practice ladder

**Foundation**
- Subsets (78)
- Permutations (46)
- Combination Sum (39)
- Letter Combinations of a Phone Number (17): choices are the letters of the current digit; the base case is "all digits used"
- Generate Parentheses (22): choices are `(` or `)`; prune on the open/close counts

**Core**
- Subsets II (90) and Permutations II (47): the same templates, plus skipping duplicate choices at the same depth
- Combination Sum II (40)
- Word Search (79): choices are the four directions; prune on bounds, visited and letter mismatch; un-choose by unmarking the cell
- Palindrome Partitioning (131): choices are "where does the next piece end"; prune with "is this piece a palindrome"

**Hard**
- N-Queens (51) and N-Queens II (52)
- Sudoku Solver (37): choices are the digits 1–9 for the next empty cell; prune with the row, column and box constraints
- Word Search II (212): backtracking over a grid with a [trie](lesson:tries-with-backtracking-and-dp) of the words

For each one, answer the four questions (complete solution, choices, invalid choices, choose/undo) before writing any code.

## The one-page summary

**Recursion, in one line:** base case + trust the smaller call + combine.

**Recursion complexity:** draw the call tree. Time = total nodes. Space = depth of the deepest path (not total nodes).

**Backtracking, in one line:** choose → explore → un-choose, with pruning to skip dead branches early.

**The four questions for any backtracking problem:**
1. What's a complete solution?
2. What are the choices at each step?
3. What makes a choice invalid?
4. How do you choose, and how do you exactly undo it?

**Before you call it done:** did you copy the state before adding it to the results? Did you undo every choice, on every path, including early returns?

**Order matters vs doesn't:**
- Combinations/subsets → move the start index forward (`i+1`), never revisit earlier indexes.
- Permutations → track a `used[]` set instead, since any unused element can go next regardless of position.
- Reuse allowed (unlimited use of the same element) → recurse with the same index (`i`, not `i+1`).

## Key takeaways

- Backtracking is DFS over a tree of choices: choose, explore, un-choose, and prune early.
- Two questions (does order matter? is reuse allowed?) pick the loop shape.
- Copy the state into the results; un-choose on every path.
- Cost ≈ number of results × cost per result; space ≈ depth.
- If the problem only counts and sub-states repeat, switch to dynamic programming.

## Knowledge check

```quiz
? "Return all ways to write n as an ordered sum of 1s and 2s" (so 1+2 and 2+1 differ). Which loop shape?
+ Scan the choices {1, 2} from the start in every call, with no visited[], since order matters and reuse is allowed
- A start index that moves forward
! That would treat 1+2 and 2+1 as the same.
- A used[] array over {1, 2}
! Each value can be used many times.
- Sort and skip duplicates
! There are no duplicate inputs to skip.
> Order matters and reuse is allowed: the fourth row of the table.

? Your backtracking returns the right number of results, but every result is empty. What's the likely bug?
+ The live `current` list was added to the results instead of a copy
- The base case is wrong
! A wrong base case usually changes the count.
- The un-choose step is missing
! That leaks choices into siblings, giving wrong non-empty results.
- The loop starts at the wrong index
! That produces wrong or missing results, not empty ones.
> Add new ArrayList<>(current).

? Which statement about backtracking and DFS is accurate?
+ Backtracking is a depth-first search over an implicit tree of partial solutions, with pruning
- Backtracking is breadth-first
! It goes deep first, then backs up.
- DFS and backtracking are unrelated
! Backtracking is a use of DFS.
- All recursion is backtracking
! Factorial is recursion with no choices to undo.
> Word Search is backtracking even though it's often called DFS.

? Why is the rough cost of generating all subsets O(n · 2ⁿ)?
+ There are 2ⁿ subsets, and copying each into the results takes O(n)
- Because each element is visited 2ⁿ times
! The count is of results, not of visits per element.
- Because the recursion is n levels deep
! Depth gives the space, not the time.
- Because of the sort at the start
! Subsets needs no sort without duplicates.
> Leaves × cost per leaf.
```
