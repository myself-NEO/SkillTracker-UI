One-dimensional DP pinned every state down with a single number. Two-dimensional DP appears exactly when that stops working: when a subproblem needs **two independent** pieces of information before it's fully specified. Everything from [1-D DP](lesson:dp-framework) (the five steps, the combinators, top-down versus bottom-up, space optimisation) carries over; the new skill is thinking in two indexes at once.

## The steps

1. **Name the family**, which tells you what `i` and `j` mean (see the table below): two coordinates in a grid, two prefixes of two strings, or items-considered and capacity-left.
2. **Write the state sentence** with both indexes: "`dp[i][j]` = the [answer] for [the first i of A] and [the first j of B]", or "… for the cell (i, j)".
3. **Find the recurrence from the last decision**, in the family's vocabulary: did I just move down or right? Did the two current characters match, and if not, which string's pointer moves? Did I take this item or not?
4. **Set the base row and column.** With a size-`(m + 1) × (n + 1)` table, row 0 and column 0 usually mean "nothing yet" (an empty prefix, no items, zero capacity).
5. **Choose the fill order from the dependencies.** List exactly which cells `dp[i][j]` reads, then pick an order that computes them first.
6. **Shrink the table** to a rolling row when `dp[i][j]` only reads the previous row (and the current one).

## What's new: from one index to two

**Why did [Coin Change](lesson:coin-change) get away with a single index, `dp[amount]`, while 0/1 knapsack needs two, `dp[item][capacity]`?** The answer is reuse. Coin Change's coins are unlimited, so you never need to track *which* coins you've used, only how much is left: any coin is always available. 0/1 knapsack's items can each be used **at most once**, so the best value for capacity w depends on *which* items are still eligible, and the clean way to track that is to also index by how many items you've decided about. That second dimension exists for a reason, not by convention. Keep the question handy, "does going from unlimited use to single use turn this 1-D problem into a 2-D one?", and you'll predict the shape of many problems before deriving anything.

### Filling the table: order matters more now

- **The default, row by row:** in grid DP and prefix-based two-string DP, `dp[i][j]` depends on `dp[i−1][j]`, `dp[i][j−1]` and/or `dp[i−1][j−1]`, all filled earlier when you go row by row, left to right. That covers most 2-D DP.
- **Range-shaped DP, by increasing length:** when `i` and `j` are the two ends of a range in the *same* sequence, `dp[i][j]` depends on shorter ranges inside it (`dp[i+1][j−1]`, `dp[i+1][j]`, `dp[i][j−1]`), so fill by increasing range length (in practice, `i` from the end backwards and `j` forwards from `i`). [Longest Palindromic Subsequence](lesson:two-string-dp) is the first example; [interval DP](lesson:interval-dp) builds on it.
- **Backwards, from the destination:** sometimes `dp[i][j]` depends on what happens *after* `(i, j)`, because the quantity ("the minimum health needed to survive the rest of the journey") only makes sense read from the end. [Dungeon Game](lesson:grid-dp) is the clearest example.

The general rule: **before coding, identify exactly what `dp[i][j]` depends on, then choose an order that guarantees those values exist.** Row by row is the default because it's usually right, not because it's guaranteed.

## Reading the signals

| Family | What `i` means | What `j` means | Canonical example |
|---|---|---|---|
| **Grid DP** | the row | the column | [Unique Paths](lesson:grid-dp) |
| **Two-string DP** | how much of string A is considered | how much of string B is considered | [Longest Common Subsequence](lesson:two-string-dp) |
| **Knapsack / subset sum** | how many items are considered | the capacity or target left | [0/1 knapsack](lesson:knapsack-dp) |

- "A grid", "a matrix", "paths from the top-left to the bottom-right": grid DP.
- "Two strings", "convert one word into another", "common subsequence", "interleaving": two-string DP.
- "Items with weights and values", "split into two equal halves", "assign + or − to reach a target", with each item used at most once: knapsack.

## Worked example

**Longest Common Subsequence (LC 1143)** of `"abcde"` and `"ace"`, through the steps:

1. **Family:** two strings, so `i` and `j` are prefix lengths.
2. **State:** `dp[i][j]` = the LCS length of the first i characters of `text1` and the first j of `text2`.
3. **Last decision:** if the last characters match, both belong to the LCS: `dp[i−1][j−1] + 1`. Otherwise drop one of them, whichever is better: `max(dp[i−1][j], dp[i][j−1])`.
4. **Base row and column:** an empty prefix shares nothing: `dp[0][j] = dp[i][0] = 0`.
5. **Order:** every dependency is above, to the left, or diagonally above-left, so row by row works.
6. **Space:** only the previous row is read, so one rolling row (sized by the shorter string) suffices.

The answer, `dp[5][3]`, is 3: `"ace"`. The full code is in [two-string DP](lesson:two-string-dp).

## Common mistakes

- **A table of size m × n** when row and column 0 should mean "nothing yet": use `(m + 1) × (n + 1)`.
- **Swapping i and j** in some places: square test inputs hide it, so trace a rectangular one.
- **Assuming row-by-row always works**: check the dependencies; ranges and "survive the rest" problems need other orders.
- **Adding a dimension that isn't needed**: with unlimited reuse, the item dimension usually collapses back to 1-D.
- **Space-optimising before the full table works.**

## Key takeaways

- 2-D DP appears when a subproblem needs two independent quantities.
- Three families: grid (row, column), two strings (prefix lengths), knapsack (items, capacity).
- Single-use items are what add knapsack's second dimension; unlimited reuse removes it.
- Derive the fill order from the dependencies: row by row, by increasing range length, or backwards.
- The recurrence still comes from the last decision, in each family's vocabulary.

## Knowledge check

```quiz
? Why does 0/1 knapsack need dp[item][capacity] when Coin Change needs only dp[amount]?
+ Each knapsack item can be used once, so the state must record which items are still available; coins are unlimited
- Because knapsack items have values
! Coins could have values too; reuse is the difference.
- Because knapsack is harder to compute
! Difficulty isn't the reason for a dimension.
- It doesn't; both can be 1-D
! Knapsack's 1-D form still iterates over the items, in reverse.
> Unlimited use collapses the item dimension.

? dp[i][j] reads dp[i+1][j−1], dp[i+1][j] and dp[i][j−1]. Which fill order works?
+ i from the end backwards, and j forwards from i: by increasing range length
- Row by row, i from 0 upwards
! Row i would read row i + 1 before it's filled.
- Column by column
! dp[i+1][*] still isn't ready.
- Any order
! Some orders read cells that aren't computed yet.
> It's a range DP, like Longest Palindromic Subsequence.

? A grid DP passes every square test case but fails on a 2 × 5 grid. What's the likely bug?
+ i and j are swapped somewhere, which square inputs hide
- The grid is too small for DP
! DP works on any size.
- Integer overflow
! A 2 × 5 grid has tiny values.
- The base case is missing
! That would fail square grids too.
> Trace a rectangular example.

? In the two-string family, what do i and j mean?
+ How many characters of each string are being considered: two prefix lengths
- A row and a column of a grid
! That's grid DP.
- The start and end of one substring
! That's a range DP on one string.
- Items and capacity
! That's knapsack.
> dp[0][*] and dp[*][0] are empty prefixes.
```
