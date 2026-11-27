## The idea

**0/1 knapsack:** n items, each with a weight and a value, and a bag of capacity W. Maximise the total value without exceeding the capacity, using each item **at most once**. The state is `dp[i][w]` = the best value using only the first i items with capacity w, and the last decision is about item i: leave it out (`dp[i−1][w]`), or, if it fits, take it (`dp[i−1][w − weight] + value`).

Many problems that never mention a bag are this recurrence in disguise: "can a subset reach this sum?", "split into two equal halves", "assign + or − to reach a target".

## When to use it

- Items with weights and values, a capacity, and each item usable once.
- "Partition the array into two subsets with equal sums" (or the smallest difference).
- "Assign a sign to each number to reach a target": an algebraic reduction to subset sum.
- If items can be reused without limit, it's the 1-D [Coin Change](lesson:coin-change) shape instead.

## How it works

**The one-row version, and why it runs backwards.** `dp[i][w]` only reads row `i − 1`, so a single array suffices, but **only if capacity is iterated from high to low**. Going downwards, when `dp[w]` reads `dp[w − weight]`, that lower slot hasn't been updated in this pass yet, so it still holds the previous item's row, exactly `dp[i−1][w − weight]`.

**Iterating forwards silently breaks it:** `dp[w − weight]` would already include item i, so the same item could be taken again and again. That solves **unbounded** knapsack (Coin Change) instead of 0/1. Concretely, one item of weight 2 and value 3 with capacity 6 gives the correct **3** backwards, but **9** forwards (the item used three times). Same lines of code, opposite direction, a silent bug.

It mirrors Coin Change II, where forwards was *correct* because reuse was *wanted*. **Whether an item can be reused decides which direction is safe:** reusable → forwards; once only → backwards.

## Java template

```java
static int knapsack01(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            dp[i][w] = dp[i - 1][w];
            if (weights[i - 1] <= w) {
                dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
            }
        }
    }
    return dp[n][capacity];
}
```

With `weights = [1, 3, 4, 5]`, `values = [1, 4, 5, 7]` and capacity 7, the answer is 9: the items of weight 3 and 4.

## Worked examples

### 0/1 knapsack in one row

```java
static int knapsack01Opt(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[] dp = new int[capacity + 1];
    for (int i = 0; i < n; i++) {
        for (int w = capacity; w >= weights[i]; w--) {   // REVERSE — high to low
            dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }
    return dp[capacity];
}
```

### Partition Equal Subset Sum (LC 416)

Can the array be split into two subsets with equal sums? If the total is odd, no. Otherwise the question is "can some subset sum to exactly `total / 2`?": knapsack where each number is both weight and value, the capacity is `total / 2`, and the combinator is OR instead of max.

```java
static boolean canPartition(int[] nums) {
    int total = 0;
    for (int num : nums) total += num;
    if (total % 2 != 0) return false;
    int target = total / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;
    for (int num : nums) {
        for (int s = target; s >= num; s--) {     // reverse: each number is used at most once
            dp[s] = dp[s] || dp[s - num];
        }
    }
    return dp[target];
}
```

`[1, 5, 11, 5]` → true: `{11}` and `{1, 5, 5}`. The moment you read "partition into two groups with equal sums", the reflex should be "0/1 knapsack, OR, target = total / 2".

### Target Sum (LC 494)

Assign + or − to each number to reach the target S; count the ways. The algebra reveals the knapsack: split the numbers into a positive group (sum P) and a negative group (sum N). Then `P − N = S` and `P + N = total`, so **`P = (S + total) / 2`**: count the subsets that sum to exactly P. If `S + total` is odd, or `|S| > total`, there are 0 ways.

```java
static int findTargetSumWays(int[] nums, int target) {
    int total = 0;
    for (int num : nums) total += num;
    if (Math.abs(target) > total || (total + target) % 2 != 0) return 0;
    int P = (total + target) / 2;
    int[] dp = new int[P + 1];
    dp[0] = 1;
    for (int num : nums) {
        for (int s = P; s >= num; s--) {           // reverse, as in 0/1 knapsack
            dp[s] += dp[s - num];
        }
    }
    return dp[P];
}
```

For five 1s and target 3: P = 4, and there are C(5, 4) = 5 ways. Three problems with different stories (a bag, two equal halves, plus and minus signs) share one recurrence; only the combinator changes.

## Complexity

**O(n · W)** time, for n items and capacity (or target) W, and O(W) space with one row. This is **pseudo-polynomial**: polynomial in the *value* of W, not in its number of digits. A capacity of 10⁹ makes it impractical, and knapsack is NP-hard in general.

## Variations

- **Last Stone Weight II (LC 1049):** smashing stones is splitting them into two groups and minimising the difference of their sums: find the subset sum closest to `total / 2`.
- **Ones and Zeroes (LC 474):** two capacities at once (zeros and ones), so `dp[z][o]`, both iterated backwards.
- **Bounded knapsack** (item i available `k_i` times): treat each copy separately, or split the copies into powers of two to keep it O(n · W · log k).
- **Reconstructing the chosen items:** keep the 2-D table, and walk back from `dp[n][W]`: wherever `dp[i][w] != dp[i−1][w]`, item i was taken.

## Common mistakes

- **Iterating capacity forwards** in the one-row 0/1 version, which silently allows reuse.
- **Iterating backwards** when reuse *is* allowed (Coin Change), which forbids it.
- **Missing the reduction**: Target Sum doesn't look like subset sum until you do the `P = (S + total) / 2` algebra.
- **Forgetting the parity and range checks** in Target Sum: an odd `S + total`, or `|S| > total`, means 0 ways.
- **`dp[0]` wrong for the question**: true for "can reach", 1 for "how many ways", 0 for "best value".

## Practice

Partition Equal Subset Sum (LC 416), Target Sum (LC 494), Last Stone Weight II (LC 1049), Ones and Zeroes (LC 474), Coin Change II (LC 518) for contrast.

## Key takeaways

- 0/1 knapsack: `dp[i][w] = max(dp[i−1][w], dp[i−1][w − weight] + value)`.
- In one row, iterate capacity from high to low, or each item can be taken repeatedly.
- Reusable items → forwards; single-use → backwards.
- Subset sum and Target Sum are knapsack with OR and counting, after a reduction.
- It's pseudo-polynomial: O(n · W) depends on the capacity's value.

## Knowledge check

```quiz
? One item of weight 2 and value 3, capacity 6. What do backward and forward iteration of the one-row 0/1 knapsack return?
+ 3 backwards (the item once), 9 forwards (the item reused three times)
- 3 both ways
! Forwards reads slots already updated with the same item.
- 9 both ways
! Backwards reads only the previous item's values.
- 6 both ways
! 6 is the capacity, not a value.
> Forwards silently solves the unbounded version.

? Why does Partition Equal Subset Sum use target = total / 2?
+ Two equal halves each sum to total / 2, so it's enough to find one subset reaching it
- Because the array must be sorted
! Order doesn't matter.
- To halve the running time
! It's about what's being searched for.
- Because each number can be used twice
! Each number is used once.
> And an odd total means it's impossible.

? Target Sum on [1, 1, 1, 1, 1] with target 3: how many ways?
+ 5: P = (3 + 5) / 2 = 4, and C(5, 4) = 5 subsets sum to 4
- 1
! Any of the five 1s can be the negative one.
- 4
! That's P, not the count.
- 10
! That's C(5, 2).
> The plus group must sum to P.

? Why is knapsack's O(n · W) called pseudo-polynomial?
+ It's polynomial in W's value, not in the number of digits needed to write W, so a huge capacity makes it slow
- Because it uses recursion
! The tabulated version has no recursion.
- Because it's approximately polynomial
! The bound is exact; it's measured in the wrong unit.
- Because n must be small
! The capacity is the issue.
> Knapsack is NP-hard in general.
```
