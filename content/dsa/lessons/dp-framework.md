These five steps work on every DP problem. Say them out loud in an interview: it signals you're deriving the solution, not pattern-matching from memory.

## The steps

1. **Recognise.** Does the problem ask for an optimal value (min or max), a count (the number of ways), or feasibility ("can you achieve X")? And does the natural recursive breakdown revisit the same subproblems? If both hold, it's DP.
2. **Define the state.** This is the step people rush and regret. Ask: *what is the smallest set of variables that, once fixed, fully determines the answer to a subproblem?* For 1-D DP that's usually one index: "the first `i` elements", "up to position `i`", or "for target value `i`". Write it as a sentence before writing any code: *"`dp[i]` = the [min cost / max value / number of ways / can-I-do-it] for [a precise description involving i]."* If you can't write that sentence precisely, you're not ready for the recurrence.
3. **Find the recurrence.** Ask: *if I already knew the answer to every smaller subproblem, how would I combine them into `dp[i]`?* The answer almost always comes from asking "what was the *last* decision made to arrive at state `i`?": the last step climbed (1 or 2?), the last house robbed or skipped, the last coin used, the last word matched. Enumerate the choices at that last step, and combine their outcomes with min, max, sum or OR, as the question asks.
4. **Set the base cases.** What's the smallest, self-evidently correct instance, `dp[0]` or `dp[1]`, that doesn't rely on the recurrence? Get it wrong and every other value silently inherits the error.
5. **Choose the order of computation, then implement.** Top-down (memoized recursion) or bottom-up (filling a table iteratively), then write it. Once it works, ask whether you need the *whole* table, or just the last few entries.

With these five steps, "how do I even start?" stops being the hard part. The hard part becomes executing steps 2 and 3 well, which is exactly what practice across varied problems builds.

## Top-down versus bottom-up

Both implement the *same* recurrence; they only differ in the direction they fill the table.

**Top-down (memoization):** write the natural recursive solution, then add a cache. Before doing real work, check whether this exact input has been solved; if so, return the cached answer.

```java
static int fibMemo(int n, int[] memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];          // already solved — just look it up
    memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    return memo[n];
}
```

**Bottom-up (tabulation):** skip the recursion. Start from the base cases, and fill the table in an order that guarantees every value you need is already computed.

```java
static int fibTab(int n) {
    if (n <= 1) return n;
    int[] dp = new int[n + 1];
    dp[0] = 0; dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
    return dp[n];
}
```

Both run in O(n): the cache guarantees each subproblem is solved once either way. Which to reach for?

- **Top-down** mirrors how you *think* about the breakdown, so it's often the fastest path from "I understand the recurrence" to working code, especially when the recursion isn't a straight line (Word Break and Decode Ways read naturally top-down). The cost is real recursion: tens of thousands of levels risk a `StackOverflowError` in Java, a common way to fail an otherwise-correct solution on a large test.
- **Bottom-up** avoids the recursion overhead and the stack risk, and makes space optimisation mechanical. Many interviewers consider it the complete answer for 1-D DP, and ask you to convert a memoized solution as a follow-up.

**Space optimisation.** Ask: to compute `dp[i]`, how far back do I ever look? Fibonacci looks only at `dp[i-1]` and `dp[i-2]`; everything before them is dead weight once `dp[i]` is computed. So keep two rolling variables instead of an array:

```java
static int fibOpt(int n) {
    if (n <= 1) return n;
    int prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

That drops the space from O(n) to O(1) without changing the logic. Whenever `dp[i]` depends only on the last k states, you need only k variables.

## Reading the signals

- **The question type picks the combinator:** "minimum/maximum" → min or max; "how many ways" → sum; "can you…?" → OR.
- **Overlap:** sketch two or three levels of the recursion. If the same arguments appear in different branches, a cache will pay off.
- **The last decision** usually reveals the recurrence: which step, which item, which coin, which word came last?

### What makes a problem one-dimensional

A DP problem is **1-D** when one changing quantity captures its state: most often a position in an array or string (`dp[i]` = "considering the elements up to index i"), sometimes a target value (`dp[amount]`, `dp[n]`). The table is a single row, and each box depends on a small set of boxes to its left.

That's the whole test: if "what does `dp[i]` mean?" has an answer mentioning **one** varying index, you're in 1-D. The moment the state needs *two* independent quantities (two positions in two strings, or an index *and* a remaining budget), the table becomes a grid, `dp[i][j]`: [2-D DP](lesson:two-dimensional-dp). The five steps, top-down versus bottom-up, and space optimisation all carry over unchanged.

## Worked example

**House Robber (LC 198):** houses in a row, each with some money; you can't rob two adjacent houses. Maximise the total. Running the steps:

1. **Recognise:** a maximum, and the "rob the first i houses" subproblems overlap.
2. **State:** `dp[i]` = the most money from the first i houses.
3. **Recurrence:** the last decision is about house i: skip it (`dp[i − 1]`), or rob it, which means house i − 1 was skipped (`dp[i − 2] + nums[i − 1]`). So `dp[i] = max(dp[i − 1], dp[i − 2] + nums[i − 1])`.
4. **Base cases:** `dp[0] = 0` (no houses), `dp[1] = nums[0]`.
5. **Order:** i increasing; only the last two values are needed, so two variables suffice.

```java
static int rob(int[] nums) {
    int prev2 = 0, prev1 = 0;               // dp[i - 2], dp[i - 1]
    for (int num : nums) {
        int curr = Math.max(prev1, prev2 + num);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

[Fibonacci-style DP](lesson:fibonacci-style-dp) works through this and its circular variant in detail.

## Common mistakes

- **A vague state.** "Cost at step i" could mean "to reach it" or "including standing on it"; write the full sentence before coding.
- **Base cases that don't match the state's meaning**, such as `dp[0]` for "zero elements" with an array of size n instead of n + 1.
- **Recurrences that look at the wrong earlier states**: re-derive them from "what was the last decision?".
- **Deep top-down recursion on large inputs**: switch to bottom-up.
- **Optimising space before the solution works**: get the full table right first, then shrink it.

## Key takeaways

- Recognise, define the state, find the recurrence, set the base cases, choose the order: five steps for any DP.
- Write the state as a precise sentence; the recurrence comes from "what was the last decision?".
- Top-down mirrors the thinking; bottom-up avoids deep recursion and makes space savings easy.
- Keep only as many previous states as the recurrence reads.
- One varying index is 1-D DP; two independent quantities make a 2-D table.

## Knowledge check

```quiz
? Which step do people most often rush, causing off-by-one bugs later?
+ Defining the state precisely, as a sentence
- Recognising that it's DP
! Recognition is usually quick.
- Choosing top-down or bottom-up
! Both work once the state is right.
- Space optimisation
! That comes last, after a working solution.
> If you can't say what dp[i] means, you can't write the recurrence.

? A memoized solution is correct but throws StackOverflowError on n = 100,000. What's the fix?
+ Convert it to bottom-up tabulation, which uses no recursion
- Use a bigger cache
! The cache isn't what overflows.
- Switch to a HashMap for the memo
! The recursion depth is the problem.
- Add more base cases
! Base cases don't reduce the depth.
> Each recursive call uses a stack frame.

? dp[i] depends only on dp[i − 1] and dp[i − 2]. How much space does the optimised version need?
+ O(1): two rolling variables
- O(n)
! The full table isn't needed.
- O(log n)
! There's nothing logarithmic here.
- O(n²)
! That's a 2-D table.
> Keep only the states the recurrence reads.

? Is "the longest common subsequence of two strings" a 1-D DP?
+ No: its state needs two positions, one in each string, so the table is 2-D
- Yes: it only asks for one number
! The answer's size doesn't decide the state's dimensions.
- Yes, with a HashMap
! A map doesn't remove a dimension.
- It isn't DP at all
! It's a classic DP.
> Count the independent quantities a subproblem needs.
```
