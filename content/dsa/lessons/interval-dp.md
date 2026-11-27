## The idea

In interval DP, `dp[i][j]` describes a **range** `[i, j]` of one sequence, and the recurrence asks: *where is the best place to split this range?* Try every split point k, combine `dp[i][k]` with `dp[k+1][j]` (or `dp[k][j]`), and add the cost of the split itself. That third loop, over k, is the new piece; the range state and the increasing-length fill order are [Longest Palindromic Subsequence's](lesson:two-string-dp), generalised.

## When to use it

- The best way to **parenthesise, order or merge** a sequence, where the cost depends on the grouping (matrix chains, merging stones).
- "**Burst / remove / merge one at a time**", where the reward depends on the current neighbours.
- Precomputing a property of every substring (is `s[i..j]` a palindrome?) for another DP to look up.

The constraints usually allow O(n³): n up to a few hundred.

## How it works

- **Fill by increasing range length.** `dp[i][j]` reads shorter ranges inside it, so compute all ranges of length 2, then 3, and so on. Row by row would read cells that aren't computed yet, and Java won't complain: it silently reads zeros.
- **Choose the split by the last decision.** For a matrix chain, the last multiplication joins `[i, k]` and `[k+1, j]`. For Burst Balloons the natural instinct (which balloon goes *first*?) tangles the subproblems, so ask which balloon goes **last** in the range: by then everything else inside is gone, so its neighbours are exactly the range's fixed walls.

## Java template

```java
for (int len = 2; len <= n; len++) {                 // shorter ranges first
    for (int i = 0; i + len - 1 < n; i++) {
        int j = i + len - 1;
        dp[i][j] = INITIAL;                          // +infinity for min, 0 or -infinity for max
        for (int k = i; k < j; k++) {                // every split point
            dp[i][j] = best(dp[i][j], dp[i][k] + dp[k + 1][j] + splitCost(i, k, j));
        }
    }
}
```

## Worked examples

### Matrix chain multiplication: the template

Matrix i has dimensions `dims[i−1] × dims[i]`. Multiplication is associative, but the cost depends on the parenthesisation. Find the fewest scalar multiplications.

- *State:* `dp[i][j]` = the minimum cost to multiply matrices i through j.
- *Recurrence:* `dp[i][j] = min over k in [i, j) of dp[i][k] + dp[k+1][j] + dims[i−1]·dims[k]·dims[j]`: the cost of each half, plus the one multiplication that joins them.
- *Base case:* `dp[i][i] = 0`.

```java
static int matrixChainOrder(int[] dims) {
    int n = dims.length - 1;              // number of matrices
    int[][] dp = new int[n + 1][n + 1];    // 1-indexed
    for (int len = 2; len <= n; len++) {
        for (int i = 1; i <= n - len + 1; i++) {
            int j = i + len - 1;
            dp[i][j] = Integer.MAX_VALUE;
            for (int k = i; k < j; k++) {
                int cost = dp[i][k] + dp[k + 1][j] + dims[i - 1] * dims[k] * dims[j];
                dp[i][j] = Math.min(dp[i][j], cost);
            }
        }
    }
    return dp[1][n];
}
```

`dims = [40, 20, 30, 10, 30]` (four matrices) gives 26000.

### Burst Balloons (LC 312)

Bursting balloon i earns `left · nums[i] · right`, where left and right are its *current* neighbours (a missing neighbour counts as 1). Maximise the total.

- *Setup:* pad the array with a 1 at each end.
- *State:* `dp[i][j]` = the most coins from bursting every balloon strictly **between** i and j, which stay standing as walls.
- *Recurrence:* `dp[i][j] = max over k between i and j of dp[i][k] + dp[k][j] + balloons[i]·balloons[k]·balloons[j]`, where k is the balloon burst **last** in the range, so its neighbours at that moment are the walls i and j.
- *Base case:* `dp[i][i+1] = 0`: nothing between adjacent walls.

```java
static int maxCoins(int[] nums) {
    int n = nums.length;
    int[] balloons = new int[n + 2];
    balloons[0] = 1; balloons[n + 1] = 1;
    for (int i = 0; i < n; i++) balloons[i + 1] = nums[i];
    int[][] dp = new int[n + 2][n + 2];
    for (int len = 2; len <= n + 1; len++) {
        for (int i = 0; i + len <= n + 1; i++) {
            int j = i + len;
            for (int k = i + 1; k < j; k++) {
                int coins = dp[i][k] + dp[k][j] + balloons[i] * balloons[k] * balloons[j];
                dp[i][j] = Math.max(dp[i][j], coins);
            }
        }
    }
    return dp[0][n + 1];
}
```

`[3, 1, 5, 8]` gives 167 (burst 1, 5, 3, 8: 15 + 120 + 24 + 8). The transferable move: **when "remove one at a time" subproblems won't decouple, reason about the last removal in a range instead of the first.**

### Palindrome Partitioning II (LC 132): an interval table feeding a 1-D DP

The fewest cuts so every piece is a palindrome, in two layers:
- **Layer 1:** `isPalin[i][j]` for every range, by increasing length: `s[i] == s[j] && (length ≤ 2 || isPalin[i+1][j−1])`.
- **Layer 2:** `cuts[i]` = the fewest cuts for `s[0..i]`: zero if `s[0..i]` is a palindrome, otherwise the best over every last piece `s[j+1..i]` that's a palindrome: `cuts[j] + 1`.

```java
static int minCut(String s) {
    int n = s.length();
    boolean[][] isPalin = new boolean[n][n];
    for (int len = 1; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            if (s.charAt(i) == s.charAt(j) && (len <= 2 || isPalin[i + 1][j - 1])) {
                isPalin[i][j] = true;
            }
        }
    }
    int[] cuts = new int[n];
    for (int i = 0; i < n; i++) {
        if (isPalin[0][i]) {
            cuts[i] = 0;
        } else {
            cuts[i] = Integer.MAX_VALUE;
            for (int j = 0; j < i; j++) {
                if (isPalin[j + 1][i]) cuts[i] = Math.min(cuts[i], cuts[j] + 1);
            }
        }
    }
    return cuts[n - 1];
}
```

`"aab"` needs 1 cut (`"aa" | "b"`). This shows that families **combine**: one DP's finished table becomes an O(1) lookup inside another. The [Manacher lesson](lesson:manacher-and-palindrome-partitioning) does the same in O(n) memory with center expansion.

## Complexity

Matrix chain and Burst Balloons are **O(n³)** time (O(n²) ranges, O(n) splits each) and O(n²) space. Palindrome Partitioning II is O(n²) time and space.

## Variations

- **Minimum Cost Tree From Leaf Values (LC 1130):** the matrix-chain split, with a cost built from the maximum leaf on each side.
- **Strange Printer (LC 664)** and **Remove Boxes (LC 546):** interval DP where the state needs extra information about what's been merged into the range's end.
- **Guess Number Higher or Lower II (LC 375):** a minimax interval DP: the cost of guessing k in `[i, j]` is `k + max(dp[i][k−1], dp[k+1][j])`, and you minimise over k.
- **Minimum Cost to Merge Stones (LC 1000):** merging k piles at a time adds the number of piles to the state.

## Common mistakes

- **Filling row by row** instead of by increasing length: it silently reads uncomputed zeros.
- **Choosing the first removal** in Burst Balloons, which doesn't decompose; choose the last.
- **Forgetting the padding** of 1s, or bursting the padding itself.
- **Off-by-one in the split range**: `k` in `[i, j)` for matrix chains, strictly between i and j for Burst Balloons.
- **`Integer.MAX_VALUE` as the starting minimum** where costs are added to it before comparing.

## Practice

Burst Balloons (LC 312), Minimum Cost Tree From Leaf Values (LC 1130), Guess Number Higher or Lower II (LC 375), Palindrome Partitioning II (LC 132), Minimum Score Triangulation of Polygon (LC 1039), Strange Printer (LC 664).

## Key takeaways

- `dp[i][j]` covers one range; the recurrence tries every split point k.
- Fill by increasing range length, never row by row.
- If "first" decisions tangle the subproblems, reason about the "last" decision in the range.
- Interval DP is usually O(n³) time and O(n²) space.
- One DP's table can serve as an O(1) lookup inside another.

## Knowledge check

```quiz
? Why does Burst Balloons choose the balloon burst LAST in each range?
+ When it's burst, everything else in the range is gone, so its neighbours are the range's fixed walls and the subproblems separate
- Because the last balloon earns the most coins
! It can earn little; the point is that its neighbours are known.
- To process the array from right to left
! It's about the order of bursting, not of the array.
- Choosing the first works just as well
! The first burst changes its neighbours' later rewards, tangling the subproblems.
> Reason about the last decision when the first one tangles.

? Why must interval DP be filled by increasing range length?
+ dp[i][j] reads shorter ranges inside it, which must be computed first
- Because longer ranges are more expensive
! It's about dependencies, not cost.
- To save memory
! Memory is O(n²) either way.
- Row by row works too
! It reads cells that aren't computed yet, silently as zeros.
> Length 2, then 3, then 4…

? What's the time complexity of matrix chain multiplication's DP?
+ O(n³): O(n²) ranges, each trying O(n) split points
- O(n²)
! Each range also loops over its split points.
- O(2ⁿ)
! That's trying every parenthesisation directly.
- O(n log n)
! Nothing here is logarithmic.
> The split-point loop is the third dimension of work.

? In Palindrome Partitioning II, what does the isPalin table contribute?
+ O(1) answers to "is s[j+1..i] a palindrome?" inside the 1-D cuts DP
- The number of cuts directly
! cuts is a separate, 1-D DP.
- The longest palindrome
! It's a yes/no table for every range.
- Nothing; it's optional
! Without it, each check costs O(n).
> DP families combine.
```
