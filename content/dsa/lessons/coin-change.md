## The idea

Coin Change is **unbounded knapsack in one dimension.** The state is just the amount left to make, `dp[a]`; every coin can be used again, so "which coins are still available" never needs to be part of the state. Each coin that fits offers one transition, from `dp[a − coin]` to `dp[a]`, and the question decides how to combine them: min for the fewest coins, a sum for the number of ways.

## When to use it

- "The fewest coins (items, squares) that add up to a target", with unlimited reuse.
- "The number of ways to make a target" from reusable pieces.
- Spot the disguise: Perfect Squares is Coin Change where the coins are 1, 4, 9, 16, ….
- If each item can be used **at most once**, it's 0/1 knapsack instead: see [knapsack DP](lesson:knapsack-dp).

## How it works

- **Fewest coins:** `dp[a] = min(dp[a − coin] + 1)` over the coins that fit, with `dp[0] = 0`.
- **Counting combinations:** `dp[a] += dp[a − coin]`, with `dp[0] = 1` (one way to make 0: use nothing).
- **The loop order decides what's counted.** With the **coin loop outside** and the amount loop inside, each combination is built in one fixed coin order, so `{1, 2}` and `{2, 1}` count once: **combinations**. With the **amount loop outside**, every coin can come last at every amount, so orders count separately: **permutations**. Same code shape, no error, and a different number.

## Java template

```java
static int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);           // sentinel standing in for "infinity" / unreachable
    dp[0] = 0;
    for (int a = 1; a <= amount; a++) {
        for (int coin : coins) {
            if (coin <= a) dp[a] = Math.min(dp[a], dp[a - coin] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}
```

The sentinel `amount + 1` works as "infinity" because no real answer can reach it (the worst case, all 1-coins, uses exactly `amount`). `Integer.MAX_VALUE` would overflow on the `+ 1`.

## Worked examples

### Coin Change (LC 322): the fewest coins

The template above. With `coins = [1, 2, 5]` and `amount = 11`, `dp[11] = 3` (5 + 5 + 1). Anything still at the sentinel after the loop is unreachable, so the answer is −1.

### Coin Change II (LC 518): counting combinations

```java
static int change(int amount, int[] coins) {
    int[] dp = new int[amount + 1];
    dp[0] = 1;
    for (int coin : coins) {                     // COIN is the OUTER loop
        for (int a = coin; a <= amount; a++) {    // amount is the inner loop
            dp[a] += dp[a - coin];
        }
    }
    return dp[amount];
}
```

With `amount = 5` and `coins = [1, 2, 5]`: after coin 1, `dp = [1, 1, 1, 1, 1, 1]`; after coin 2, `dp = [1, 1, 2, 2, 3, 3]`; after coin 5, `dp[5] = 3 + dp[0] = 4`. The four combinations are `{5}`, `{1, 2, 2}`, `{1, 1, 1, 2}` and `{1, 1, 1, 1, 1}`.

### Combination Sum IV (LC 377): counting permutations

The same arrays, but order matters: `[1, 2]` and `[2, 1]` count separately. The fix is to **swap the loops**:

```java
// Combination Sum IV shape — counts permutations, not combinations, on the same inputs
static int combinationSum4(int[] nums, int target) {
    int[] dp = new int[target + 1];
    dp[0] = 1;
    for (int a = 1; a <= target; a++) {          // amount is the OUTER loop this time
        for (int num : nums) {                    // coin/num is the inner loop
            if (num <= a) dp[a] += dp[a - num];
        }
    }
    return dp[target];
}
```

On `amount = 5, coins = [1, 2, 5]` this gives 9, against 4 combinations: different answers to different questions. The rule: **coin outside → combinations; amount outside → permutations.** Hand-trace a tiny example before trusting any counting DP: this bug has no symptom except a wrong number.

### Perfect Squares (LC 279)

The fewest perfect squares that sum to n. The "coins" are the squares up to n, and the combinator is the same min:

```java
static int numSquares(int n) {
    int[] dp = new int[n + 1];
    Arrays.fill(dp, Integer.MAX_VALUE);
    dp[0] = 0;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j * j <= i; j++) {
            dp[i] = Math.min(dp[i], dp[i - j * j] + 1);
        }
    }
    return dp[n];
}
```

For n = 12, `dp[12] = min(dp[11] + 1, dp[8] + 1, dp[3] + 1) = min(4, 3, 4) = 3` (4 + 4 + 4). Here `Integer.MAX_VALUE` is safe: `dp[i − 1]` (using the square 1) is always finite, and only finite values get `+ 1`. Seeing that this is Coin Change within seconds is the goal.

## Complexity

| Problem | Time | Space |
|---|---|---|
| Coin Change, Coin Change II, Combination Sum IV | O(amount × number of coins) | O(amount) |
| Perfect Squares | O(n√n) | O(n) |

## Variations

- **BFS instead of DP:** the fewest coins is a shortest path from 0 to `amount`, one coin per edge, so [BFS](lesson:breadth-first-search) over amounts also works and can stop early.
- **Greedy fails in general:** taking the largest coin first works for 1, 5, 10, 25, but not for coins 1, 3, 4 and amount 6 (greedy gives 4 + 1 + 1; the best is 3 + 3). See [when greedy fails](lesson:when-greedy-fails).
- **Perfect Squares in O(√n):** Lagrange's four-square theorem says the answer is at most 4, and number theory decides exactly when it's 1, 2, 3 or 4. Name it as a follow-up.
- **Each coin at most once** turns it into 0/1 knapsack, which iterates amounts *downwards*: [knapsack DP](lesson:knapsack-dp).

## Common mistakes

- **`Integer.MAX_VALUE` as the sentinel** in a recurrence that adds 1 to unreachable states: it overflows to a negative number and wins every min.
- **The wrong loop order** for counting: combinations need the coin loop outside.
- **`dp[0] = 0` in a counting DP**: there's one way to make 0, so it's 1.
- **Overflow in counts**: the number of ways can exceed an `int`; use `long` or the stated modulus.
- **Assuming the largest coin first is optimal**, without checking the denominations.

## Practice

Coin Change (LC 322), Coin Change II (LC 518), Combination Sum IV (LC 377), Perfect Squares (LC 279), Minimum Cost For Tickets (LC 983).

## Key takeaways

- Unlimited reuse collapses knapsack to a 1-D state: the amount left.
- Fewest coins: `dp[a] = min(dp[a − coin] + 1)`, with an `amount + 1` sentinel.
- Ways: `dp[a] += dp[a − coin]`, with `dp[0] = 1`.
- Coin loop outside counts combinations; amount loop outside counts permutations.
- Perfect Squares is Coin Change with square coins.

## Knowledge check

```quiz
? Coin Change II puts the coin loop outside. What does swapping the loops count instead?
+ Permutations: orders like [1, 2] and [2, 1] count separately
- The fewest coins
! The combinator is still a sum.
- The same combinations
! The order of the loops changes what's counted.
- Nothing; it doesn't compile
! It compiles and returns a different number.
> Coin outside → combinations; amount outside → permutations.

? Why is amount + 1 a safe "infinity" in Coin Change?
+ No real answer can exceed amount (all 1-coins), and amount + 1 + 1 can't overflow
- Because Integer.MAX_VALUE isn't allowed in arrays
! It's allowed; adding 1 to it overflows.
- Because coins are positive
! That's needed, but the bound is what makes it safe.
- It isn't safe for large amounts
! It's safe for any amount that fits in an int.
> Anything left at the sentinel is unreachable: return −1.

? Coins 1, 3 and 4, amount 6. Greedy takes the largest coin first. What happens?
+ It uses 3 coins (4 + 1 + 1), but 2 coins (3 + 3) is best
- It finds the optimum, 2 coins
! Greedy takes the 4 first and can't recover.
- It fails to reach 6
! 1-coins always complete the amount.
- It uses 6 coins
! It takes the 4 first.
> That's why Coin Change is DP.

? Perfect Squares for n = 12: what's the answer?
+ 3: 4 + 4 + 4
- 2
! No two squares sum to 12.
- 4
! 9 + 1 + 1 + 1 uses 4, but 4 + 4 + 4 uses only 3.
- 12
! That's using only 1s.
> The coins are 1, 4 and 9.
```
