## The idea

In the simplest DP problems, `dp[i]` depends only on the **last one or two states**: `dp[i] = f(dp[i − 1], dp[i − 2])`, just like Fibonacci. Find what the last decision was (one step or two? rob this house or skip it?), and the recurrence follows. Since only two earlier values are ever read, two rolling variables replace the whole table.

## When to use it

- "How many ways to climb, tile or step", with moves of fixed small sizes.
- "Choose elements, but never two adjacent ones" (House Robber and its disguises).
- A cost to land on or leave each position, choosing between one and two steps.
- The same, arranged in a **circle**: break the circle into two linear problems.

## How it works

Each problem below is the [five-step framework](lesson:dp-framework) applied:
- **Climbing Stairs:** `dp[i]` = the ways to reach step i; the last move came from `i − 1` or `i − 2`, so `dp[i] = dp[i − 1] + dp[i − 2]`, with `dp[0] = dp[1] = 1`. It's exactly Fibonacci in a word problem; spotting that instantly is the most valuable pattern-match in this lesson.
- **House Robber:** `dp[i]` = the most money from the first i houses; skip house i (`dp[i − 1]`) or rob it, having skipped i − 1 (`dp[i − 2] + nums[i − 1]`).
- **A circle** forbids taking both the first and the last element. Solve the straight line twice (once without the last element, once without the first) and take the better.

## Java template

```java
int prev2 = base0, prev1 = base1;             // dp[i - 2], dp[i - 1]
for (int i = 2; i <= n; i++) {
    int curr = combine(prev1, prev2, i);      // the recurrence, reading only the last two states
    prev2 = prev1;
    prev1 = curr;
}
return prev1;                                  // dp[n]
```

## Worked examples

### Climbing Stairs (LC 70): from brute force to O(1) space

Each step climbs 1 or 2 stairs; how many distinct ways reach the top of n stairs? The full progression, shown once here because every later problem follows the same transformation:

```java
// Brute force — O(2^n) time, mirrors the recurrence directly
static int climbStairsBrute(int n) {
    if (n <= 1) return 1;
    return climbStairsBrute(n - 1) + climbStairsBrute(n - 2);
}

// Top-down memoization — O(n) time, O(n) space (+ recursion stack)
static int climbStairsMemo(int n, int[] memo) {
    if (n <= 1) return 1;
    if (memo[n] != -1) return memo[n];
    memo[n] = climbStairsMemo(n - 1, memo) + climbStairsMemo(n - 2, memo);
    return memo[n];
}

// Bottom-up tabulation — O(n) time, O(n) space, no recursion
static int climbStairsTab(int n) {
    if (n <= 1) return 1;
    int[] dp = new int[n + 1];
    dp[0] = 1; dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
    return dp[n];
}

// Space-optimized — O(n) time, O(1) space
static int climbStairsOpt(int n) {
    if (n <= 1) return 1;
    int prev2 = 1, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

For n = 5, `dp = [1, 1, 2, 3, 5, 8]`: 8 distinct sequences of 1s and 2s.

### Min Cost Climbing Stairs (LC 746)

You may start at index 0 or 1 for free; from step i you climb 1 or 2 steps, paying `cost[i]` when you leave step i. Find the minimum cost to get past the last step.

- *State:* `dp[i]` = the minimum cost to *reach* step i (not counting `cost[i]`, which is paid on leaving it). Being precise about "reach" versus "leave" is exactly the ambiguity that causes off-by-one bugs here: say the definition out loud.
- *Recurrence:* you arrived from `i − 1` (paying `cost[i − 1]`) or from `i − 2` (paying `cost[i − 2]`): `dp[i] = min(dp[i − 1] + cost[i − 1], dp[i − 2] + cost[i − 2])`.
- *Base cases:* `dp[0] = dp[1] = 0`, since both starting points are free.

```java
static int minCostClimbingStairs(int[] cost) {
    int n = cost.length;
    int prev2 = 0, prev1 = 0;              // dp[0], dp[1]
    for (int i = 2; i <= n; i++) {
        int curr = Math.min(prev1 + cost[i - 1], prev2 + cost[i - 2]);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;                           // dp[n] = cost to reach just past the top
}
```

For `cost = [10, 15, 20]`: `dp[2] = min(0 + 15, 0 + 10) = 10`, and `dp[3] = min(10 + 20, 0 + 15) = 15`. Start at step 1 for free, pay 15, and jump past the top.

### House Robber (LC 198)

Houses in a row, each with some money; you can't rob two adjacent houses. Maximise the total.

```java
static int rob(int[] nums) {
    int prev2 = 0, prev1 = 0;               // dp[i - 2], dp[i - 1] before seeing any house
    for (int num : nums) {
        int curr = Math.max(prev1, prev2 + num);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

For `nums = [2, 7, 9, 3, 1]`, the best after each house is 2, 7, 11, 11, 12: rob the houses worth 2, 9 and 1. "Take it and skip the neighbour, or leave it" is one of the most recycled DP shapes in interviews.

### House Robber II (LC 213): houses in a circle

The first and last houses are now adjacent too. The new idea isn't a recurrence but a **reduction**: they can't both be robbed, so take the better of two linear problems, houses `[0, n − 2]` (without the last) and houses `[1, n − 1]` (without the first).

```java
static int robCircular(int[] nums) {
    int n = nums.length;
    if (n == 1) return nums[0];             // a single house has no neighbor conflict at all
    return Math.max(robLinear(nums, 0, n - 2), robLinear(nums, 1, n - 1));
}

static int robLinear(int[] nums, int start, int end) {
    int prev2 = 0, prev1 = 0;
    for (int i = start; i <= end; i++) {
        int curr = Math.max(prev1, prev2 + nums[i]);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

For `nums = [2, 3, 2]`, both options give 3. The `n == 1` case matters: without it, both ranges are empty and return 0 instead of `nums[0]`.

## Complexity

Every problem here is **O(n)** time and **O(1)** space once optimised (O(n) with the full table).

## Variations

- **Steps of 1, 2 or 3:** `dp[i] = dp[i − 1] + dp[i − 2] + dp[i − 3]`, with one more rolling variable (N-th Tribonacci Number, LC 1137).
- **Delete and Earn (LC 740)** is House Robber in disguise: taking a value v earns every copy of v but deletes v − 1 and v + 1. Sum the points per value, then rob adjacent *values* like adjacent houses:

  ```java
  public int deleteAndEarn(int[] nums) {
      int max = 0;
      for (int x : nums) max = Math.max(max, x);
      int[] points = new int[max + 1];
      for (int x : nums) points[x] += x;            // taking value v earns every copy of v
      int prev2 = 0, prev1 = 0;                     // House Robber over the values 0..max
      for (int p : points) {
          int curr = Math.max(prev1, prev2 + p);
          prev2 = prev1;
          prev1 = curr;
      }
      return prev1;
  }
  ```

- **Breaking a circle** works elsewhere too: Maximum Sum Circular Subarray (LC 918) combines it with [Kadane's algorithm](lesson:maximum-subarray).
- **Huge n:** a linear recurrence like Fibonacci's can be computed in O(log n) with [matrix exponentiation](lesson:fast-exponentiation).

## Common mistakes

- **Mixing "cost to reach i" with "cost including i"** in Min Cost Climbing Stairs: decide, write it down, and index `cost` accordingly.
- **Forgetting the single-house case** in House Robber II.
- **Updating the rolling variables in the wrong order**, overwriting `prev1` before it's copied into `prev2`.
- **Wrong base cases:** `dp[0] = 1` for counting (one way to do nothing), but 0 for money robbed.
- **Overflow** when counts grow: the number of ways can exceed an `int` quickly; use `long` or a modulus.

## Practice

Climbing Stairs (LC 70), Min Cost Climbing Stairs (LC 746), N-th Tribonacci Number (LC 1137), House Robber (LC 198), House Robber II (LC 213), Delete and Earn (LC 740), Domino and Tromino Tiling (LC 790).

## Key takeaways

- When `dp[i]` reads only the last one or two states, two rolling variables give O(1) space.
- Climbing Stairs is Fibonacci: the last move came from one or two steps back.
- House Robber: skip this element (`dp[i − 1]`) or take it after skipping its neighbour (`dp[i − 2] + value`).
- A circle becomes two linear problems, each excluding one end.
- Write the state as a sentence to avoid "reach" versus "leave" off-by-one errors.

## Knowledge check

```quiz
? Climbing Stairs with steps of 1 or 2: how many ways reach step 5?
+ 8
- 5
! That's dp[4].
- 10
! Listing them gives 8: 11111, four with one 2, and three with two 2s.
- 13
! That's dp[6].
> dp = 1, 1, 2, 3, 5, 8.

? House Robber on [2, 7, 9, 3, 1]: what's the maximum?
+ 12: houses 2, 9 and 1
- 11
! That's the best after four houses.
- 10
! 7 + 3 isn't the best.
- 22
! That robs adjacent houses.
> dp[i] = max(dp[i − 1], dp[i − 2] + nums[i − 1]).

? How does House Robber II handle the circle?
+ It takes the better of two linear runs: one without the last house, one without the first
- It runs House Robber twice around the circle
! Going around again would allow the first and last together.
- It always skips the first house
! The best answer might use the first house.
- It doubles the array
! That's a trick for other circular problems, not this one.
> The first and last houses can't both be robbed.

? In Min Cost Climbing Stairs, why do dp[0] and dp[1] both start at 0?
+ You may start at either step for free, so reaching them costs nothing
- Because cost[0] and cost[1] are always 0
! They can be any values.
- Because arrays start at 0
! It's about the problem's rules, not indexing.
- They shouldn't; dp[1] should be cost[0]
! You can start directly on step 1.
> The cost is paid when you leave a step.
```
