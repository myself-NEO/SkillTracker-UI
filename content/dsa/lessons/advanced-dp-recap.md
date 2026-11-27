The advanced DP families each break a different assumption that 1-D and 2-D DP relied on. This recap gathers how to recognise them, the decision procedure, a quick reference, the edge cases, the mistakes and the practice, and closes with the whole DP toolkit end to end.

## Recognizing the pattern

Each family breaks one assumption:
- **[Interval DP](lesson:interval-dp)** breaks "`dp[i][j]` means two independent prefixes": here `i` and `j` are the two ends of one range, and a third loop tries every split point k.
- **[Bitmask DP](lesson:bitmask-dp)** breaks "the state is a few plain integers": part of the state is a whole subset, held in the bits of an int, which stays tractable only when n is small (about 20).
- **[Digit DP](lesson:digit-dp)** breaks "you index into the input": the input is a number, the state walks its digits, and a `tight` flag has no equivalent anywhere else.
- **[Tree DP](lesson:tree-dp)** breaks "there's an obvious loop order": the "index" is a node, and recursion (children before parents) provides the order.
- **[DP on graphs](lesson:dp-on-graphs)** breaks "the dependencies are obvious from the indexes": you must first convince yourself the transitions form a DAG, and sometimes add a budget dimension.

**Signal words:**

| Phrase in the problem | Family |
|---|---|
| the best way to parenthesise, order or merge a **sequence**, where the cost depends on the grouping | interval DP |
| "burst / remove / merge one at a time", reward depends on the current neighbours | interval DP (reason about the *last* removal) |
| small n (about ≤ 20), "visit every X exactly once", permutation-flavoured | bitmask DP |
| "partition into k groups", small n | bitmask DP |
| counting the integers up to N with a digit-level property | digit DP |
| a binary tree, "the maximum / minimum … path, sum or choice in a tree" | tree DP |
| a grid or graph where a strict ordering constrains movement | DP on a DAG |
| "at most k edges / stops / steps" on a shortest-path question | DP on a graph with a budget dimension |

## Decision procedure

1. **Name what a subproblem needs** to be fully specified: a range? a subset? a digit position with a tight flag? a subtree? a node plus a budget? That decides the family.
2. **Find the recurrence from the last decision:** the last split, the last element added to the set, the next digit, the children's results, the last edge.
3. **Pin down the base cases:** single-element ranges, the starting mask, the end of the digit string, `null` children, nodes with no successors.
4. **Choose an order that respects the dependencies:** by increasing range length, by increasing mask, by recursion over digits, in post-order, or in topological order.
5. **Ask "which snapshot am I reading?"** whenever an array is updated in place: it decides correctness in knapsack, coin change and step-budget graph DPs alike.

### Quick-reference table

| Problem | State | Core recurrence | Time |
|---|---|---|---|
| Matrix Chain Multiplication | `dp[i][j]` = cost to multiply matrices i..j | `min over k of dp[i][k] + dp[k+1][j] + dims[i-1]·dims[k]·dims[j]` | O(n³) |
| Burst Balloons | `dp[i][j]` = coins from balloons strictly between i and j | `max over k of dp[i][k] + dp[k][j] + b[i]·b[k]·b[j]` | O(n³) |
| Palindrome Partitioning II | `isPalin[i][j]`, then `cuts[i]` | an interval boolean table, then `min over j of cuts[j] + 1` | O(n²) |
| Travelling salesman | `dp[mask][i]` = min cost, visited mask, at i | extend to an unvisited j: `dp[mask][i] + cost[i][j]` | O(2ⁿ · n²) |
| Partition to K Equal Sum Subsets | `dp[mask]` = reachable? | add i if the current bucket doesn't overflow | O(2ⁿ · n) |
| Shortest Path Visiting All Nodes | `(mask, node)` states, BFS | each BFS layer is one more step | O(2ⁿ · n · degree) |
| Digit sum count | `dfs(pos, tight, remainingSum)` | branch on each digit `d ≤ limit` | O(digits · S · 10) |
| House Robber III | `{robThis, skipThis}` returned | `robThis = val + skip(l) + skip(r)`; `skipThis = max + max` | O(n) |
| Binary Tree Cameras | a three-way state returned | camera if a child is uncovered | O(n) |
| Longest Increasing Path in a Matrix | `dp[i][j]` = longest path starting at (i, j) | `1 + max over greater neighbours` | O(m · n) |
| Cheapest Flights Within K Stops | `dp[v]` after r rounds | `next[v] = min(next[v], dp[u] + w)`, previous round's snapshot | O(k · E) |

## Edge cases to test

- **Ranges of length 1** (interval DP): the base case, `dp[i][i]`.
- **n = 1** for bitmask DP: the full mask equals the start mask.
- **N = 0, and single-digit N** for digit DP; **counting from 1** when the problem excludes 0; leading zeros.
- **An empty tree, or a single node** for tree DP (Cameras: one node needs one camera).
- **Unreachable targets** in graph DPs: return −1, not the sentinel.
- **Large counts**: use `long` and the stated modulus.

## Common mistakes

- **Filling interval DP row by row.** The split loop needs shorter ranges first; Java silently reads zeros from uncomputed cells.
- **Off-by-one on mask sizes.** Masks run from 0 to 2ⁿ − 1: that's `1 << n` values.
- **Bitmask DP on inputs too large for it**: correct, but n much beyond 20 is hopeless.
- **Over-memoizing in digit DP**: caching tight states buys nothing and, with a `(pos, sum)` key, mixes bounded and free states. Memoize only non-tight states.
- **Confusing "returned upwards" with "the answer" in tree DP**: one branch goes up; the bending value is recorded on the side.
- **Memoizing over a cyclic transition structure**: prove it's a DAG first, or use a shortest-path algorithm.
- **"Which snapshot am I reading?"** This bug appears in three disguises: Coin Change II (forwards is correct, because reuse is wanted), 0/1 knapsack (backwards is required, because it isn't), and Cheapest Flights (read the previous round). Make the question a reflex whenever a DP updates an array in place.

## Practice ladder

Derive the state and recurrence yourself before writing code.

- **Interval:** Burst Balloons (312), Minimum Cost Tree From Leaf Values (1130), Guess Number Higher or Lower II (375)
- **Bitmask:** Partition to K Equal Sum Subsets (698), Shortest Path Visiting All Nodes (847), Smallest Sufficient Team (1125)
- **Digit:** Numbers At Most N Given Digit Set (902), Numbers With Repeated Digits (1012), Number of Digit One (233)
- **Tree:** House Robber III (337), Binary Tree Cameras (968), Sum of Distances in Tree (834)
- **Graph:** Longest Increasing Path in a Matrix (329), Number of Ways to Arrive at Destination (1976), Parallel Courses III (2050)

## The whole DP toolkit, end to end

One method, applied to every shape of state:
- **1-D:** `dp[i]`, one index ([foundations](lesson:dp-framework)).
- **2-D:** `dp[i][j]`, two independent indexes: a grid position, two string prefixes, or items and capacity ([2-D DP](lesson:two-dimensional-dp)).
- **Advanced:** `dp[i][j]` over a *range* (interval), `dp[mask][…]` over a *subset* (bitmask), `dp[pos][tight][…]` over a *number's digits* (digit), values returned through a *tree's recursion* (tree), and `dp` over *graph nodes*, with a budget when needed (graphs).

Every one is reached the same way: name what a subproblem needs, find the recurrence from the last decision, pin down the base cases, and choose an order that respects the dependencies. The three combinators (OR, MIN/MAX, SUM) appear unchanged in every family, because they're about the kind of question asked, not about arrays. New problems are new instances of the same five steps, not new things to learn from scratch.

## Key takeaways

- Each advanced family changes what a state is: a range, a subset, a digit position, a subtree, or a graph node with a budget.
- Interval DP adds a split-point loop and fills by increasing length.
- Bitmask DP needs small n; digit DP needs the tight flag; tree DP returns several values; graph DP needs a DAG.
- The fill order always follows the dependencies, whatever form it takes.
- "Which snapshot am I reading?" decides correctness wherever a DP updates an array in place.

## Knowledge check

```quiz
? "n ≤ 16 workers and n jobs; assign each worker one job at minimum total cost." Which family?
+ Bitmask DP: dp[mask] over the set of jobs already assigned
- Interval DP
! There's no range being split.
- Digit DP
! Nothing is counted up to N.
- Tree DP
! There's no tree.
> The worker index is bitCount(mask).

? "Count the integers up to 10¹⁸ whose digits never decrease." Which family?
+ Digit DP, with the previous digit as the extra state
- Bitmask DP over the digits
! The digits' order matters, not just which appear.
- Brute force
! 10¹⁸ numbers can't be enumerated.
- Interval DP
! There's no grouping to optimise.
> State: (pos, tight, previous digit).

? "Merge adjacent piles one pair at a time; each merge costs the merged pile's size. Minimise the total." Which family?
+ Interval DP: the last merge splits the range into two parts
- Greedy: always merge the two smallest piles
! That's for non-adjacent merges (Huffman); adjacency changes it.
- Bitmask DP
! The piles must stay in order.
- DP on a graph
! It's a range-splitting structure.
> Try every split point k, by increasing range length.

? Which question should you ask whenever a DP updates an array in place?
+ "Which snapshot am I reading: this round's values, or the previous round's?"
- "Is the array sorted?"
! Sorting isn't the issue.
- "Is the array big enough?"
! Size errors fail loudly; snapshot errors don't.
- "Should I use a HashMap instead?"
! The container doesn't change the hazard.
> It decides correctness in knapsack, coin change and step-budget DPs.
```
