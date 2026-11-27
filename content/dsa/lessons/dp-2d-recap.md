Two-dimensional DP is the five steps you already know, applied to two indexes: the work is naming the family, defining both indexes, and filling the table in a safe order. This recap gathers the signals, the edge cases, the mistakes and the practice for the module.

## Recognizing the pattern

| Phrase in the problem | Likely family |
|---|---|
| "grid", "matrix", "robot", "paths from the top-left to the bottom-right" | [grid DP](lesson:grid-dp) |
| "two strings", "convert word1 into word2", "common subsequence", "interleaving" | [two-string DP](lesson:two-string-dp) |
| one string, asking about palindromes over a **range** of it | a two-string-shaped table with a range fill order ([palindromic subsequence](lesson:two-string-dp)) |
| "items with weights and values", maximise value within a capacity | [0/1 knapsack](lesson:knapsack-dp) |
| "partition into two subsets", "two groups with equal (or closest) sums" | subset sum → 0/1 knapsack, target = total / 2 |
| "assign + or − to each number", reach an exact target | Target Sum's algebraic reduction → 0/1 knapsack |
| items or coins reusable **without limit** | often collapses back to 1-D ([Coin Change](lesson:coin-change)); check before adding a dimension |
| items usable **at most once** | genuinely 2-D (or 1-D with backward iteration) |

## Decision procedure

1. **Name the family**, which fixes what `i` and `j` mean: see [2-D DP](lesson:two-dimensional-dp).
2. **Write the state sentence** with both indexes.
3. **Derive the recurrence from the last decision:** which move, which characters, which item?
4. **Set the base row and column**, usually with a `(m + 1) × (n + 1)` table where index 0 means "nothing yet".
5. **Pick the fill order from the dependencies:** row by row, by increasing range length, or backwards from the destination.
6. **Shrink to one row** if the recurrence reads only the previous row, and choose the iteration direction by reuse: forwards when items are reusable, backwards when they're single-use.

### Quick-reference table

| Problem | State | Core recurrence | Time | Space (optimised) |
|---|---|---|---|---|
| Unique Paths | `dp[i][j]` = paths to (i, j) | `dp[i-1][j] + dp[i][j-1]` | O(mn) | O(n) |
| Unique Paths II | the same, with an obstacle override | 0 if obstacle, else as above | O(mn) | O(n) |
| Minimum Path Sum | `dp[i][j]` = min cost to (i, j) | `grid[i][j] + min(dp[i-1][j], dp[i][j-1])` | O(mn) | O(n) |
| Maximal Square | `dp[i][j]` = side of the square ending at (i, j) | `1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])` | O(mn) | O(n) |
| Dungeon Game | `dp[i][j]` = min health entering (i, j) | `max(1, min(dp[i+1][j], dp[i][j+1]) - dungeon[i][j])`, backwards | O(mn) | O(n) |
| Longest Common Subsequence | `dp[i][j]` = LCS of prefixes i, j | match → `dp[i-1][j-1]+1`, else `max(dp[i-1][j], dp[i][j-1])` | O(mn) | O(min(m, n)) |
| Edit Distance | `dp[i][j]` = min edits, prefixes i, j | match → `dp[i-1][j-1]`, else `1 + min(3 neighbours)` | O(mn) | O(min(m, n)) |
| Longest Palindromic Subsequence | `dp[i][j]` = LPS in `s[i..j]` | match → `dp[i+1][j-1]+2`, else `max(dp[i+1][j], dp[i][j-1])` | O(n²) | O(n²) |
| Distinct Subsequences | `dp[i][j]` = ways to form `t[0, j)` from `s[0, i)` | match → `dp[i-1][j-1]+dp[i-1][j]`, else `dp[i-1][j]` | O(mn) | O(n) |
| Interleaving String | `dp[i][j]` = can form `s3[0, i+j)` | `(dp[i-1][j] ∧ match) ∨ (dp[i][j-1] ∧ match)` | O(mn) | O(n) |
| 0/1 Knapsack | `dp[i][w]` = max value, first i items, capacity w | `max(dp[i-1][w], dp[i-1][w-wt]+val)` | O(n·W) | O(W), backwards |
| Partition Equal Subset Sum | `dp[s]` = can a subset sum to s | `dp[s] ∨ dp[s-num]` | O(n·total) | O(total), backwards |
| Target Sum | `dp[s]` = ways to sum to s | `dp[s] += dp[s-num]` | O(n·P) | O(P), backwards |

## Edge cases to test

- **Empty strings**, or a grid with one row or one column.
- **An obstacle at the start or the end** (Unique Paths II): the answer is 0.
- **A target of 0** in subset sums: the empty subset counts.
- **An odd total** (Partition), or an odd `S + total` or `|S| > total` (Target Sum): 0 or false.
- **Negative cells** in Dungeon Game, and the floor of 1 health.
- **Rectangular inputs**, which expose swapped indexes that square inputs hide.

## Common mistakes

- **Off-by-one in two dimensions at once.** If `dp[0][*]` and `dp[*][0]` mean "nothing yet", the table is `(m + 1) × (n + 1)`. Check both dimensions explicitly.
- **Swapping which index is which.** Code can look correct on square inputs and fail on the first rectangular one. Trace a rectangular case.
- **Assuming row by row always works.** Longest Palindromic Subsequence needs increasing range length; Dungeon Game fills backwards. Check the dependencies first.
- **Iterating forwards in a one-row 0/1 knapsack.** No crash, just a plausible wrong number, because it silently solves the unbounded version. Ask: "can this item be reused?" Reusable → forwards; single-use → backwards.
- **Missing a reduction.** Target Sum isn't visibly subset sum until the `P = (S + total) / 2` algebra; Partition isn't visibly knapsack until `target = total / 2`. When a direct recurrence feels awkward, look for a reduction to a shape you know.

## Practice ladder

Derive the state and recurrence yourself before writing code.

**Grid family**
- Unique Paths (62), Unique Paths II (63), Minimum Path Sum (64)
- Triangle (120): which cells in the next row neighbour (i, j)?
- Maximal Square (221), Dungeon Game (174)

**Two-string family**
- Longest Common Subsequence (1143), Edit Distance (72)
- Minimum ASCII Delete Sum for Two Strings (712): Edit Distance with character costs
- Maximum Length of Repeated Subarray (718): LCS, but contiguous
- Distinct Subsequences (115), Interleaving String (97)

**Knapsack family**
- Partition Equal Subset Sum (416), Target Sum (494)
- Last Stone Weight II (1049): minimise the difference of two group sums
- Ones and Zeroes (474): two capacities

**Next:** when `dp[i][j]` is a range split at a point k, a subset of items, the digits of a number, a tree, or a DAG, move on to [interval DP](lesson:interval-dp), [bitmask DP](lesson:bitmask-dp), [digit DP](lesson:digit-dp), [tree DP](lesson:tree-dp) and [DP on graphs](lesson:dp-on-graphs). The same five steps apply throughout.

## Key takeaways

- Name the family first: grid, two strings, or knapsack. It tells you what `i` and `j` mean.
- Size the table `(m + 1) × (n + 1)` when index 0 means "nothing yet".
- Derive the fill order from the dependencies; row by row is a default, not a law.
- In one-row knapsack, reuse decides the direction: forwards for unlimited, backwards for once.
- Many "different" problems are knapsack after a reduction: look for the hidden target sum.

## Knowledge check

```quiz
? "Split the array into two groups whose sums differ as little as possible." Which family?
+ Knapsack: find the subset sum closest to total / 2
- Grid DP
! There's no grid.
- Two-string DP
! There's only one array.
- Greedy: sort and alternate
! Alternating can miss the best split.
> Last Stone Weight II is this problem in disguise.

? "Convert word1 into word2 with the fewest insertions, deletions and replacements." Which family?
+ Two-string DP: Edit Distance
- Knapsack
! There are no capacities.
- Grid DP
! The table looks like a grid, but the indexes are prefix lengths.
- Interval DP
! There's no split point inside one range.
> dp[i][j] over prefixes of both words.

? A 2-D DP passes every hand-traced example, all of them square. What should you test next?
+ A rectangular input, to catch swapped i and j
- A larger square input
! Square inputs hide swapped indexes.
- An input with all zeros
! That's a useful edge case, but not for this bug.
- Nothing; it's correct
! Square-only testing misses a classic bug.
> Swapped indexes look fine when m == n.

? A one-row 0/1 knapsack returns values that are too high. What's the likely bug?
+ Capacity is iterated forwards, so items are being reused
- Capacity is iterated backwards
! Backwards is correct for single-use items.
- dp[0] is 0
! 0 is right for "best value".
- The items aren't sorted
! Order doesn't matter in knapsack.
> Forwards solves the unbounded version.
```
