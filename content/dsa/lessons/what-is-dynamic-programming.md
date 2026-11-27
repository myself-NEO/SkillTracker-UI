## The idea

Strip away the mystique and dynamic programming is **recursion, plus a memory.**

You already know how to solve problems recursively: break a problem into smaller versions of itself, solve those, and combine the answers. DP starts exactly there. The only new idea is: *if you're about to solve a subproblem you've already solved, don't; look the answer up.*

That's the whole trick. The hard part is never "what is DP"; it's recognising *when* a problem qualifies, and *how* to define the subproblems cleanly. The [five-step framework](lesson:dp-framework) is the repeatable way to do that.

## When to use it

A problem is a genuine DP problem when it has two properties:

- **Optimal substructure:** the optimal answer to the whole problem can be built from optimal answers to its subproblems. If the best way to rob a street of houses depends on the best way to rob a shorter street, that's optimal substructure. Most recursive problems have it: it's necessary, but not sufficient.
- **Overlapping subproblems:** a plain recursive solution solves the *exact same* subproblem many times. This is the property that makes memoization pay off. Merge sort is recursive and has optimal substructure, but the left and right halves of an array never overlap, so there's nothing to cache. That's why merge sort is divide and conquer, not DP: DP is the special case of divide and conquer where the pieces keep colliding.

The questions DP answers are usually an **optimum** ("the minimum cost", "the maximum value"), a **count** ("the number of ways"), or **feasibility** ("can you reach / form / partition…?").

**DP versus greedy:** a greedy algorithm also makes a sequence of choices, but it commits to the locally best one at each step and never looks back. That's fast, but only *correct* when the problem has a special structure (the greedy-choice property) guaranteeing that local choices add up to the global optimum. DP doesn't take that risk: it effectively considers every choice, and avoids redoing work by caching. So DP is the safe default, and greedy is the optimisation you reach for once you've shown it applies ([when greedy fails](lesson:when-greedy-fails)).

## How it works

Every recursive function has a **base case** (an input simple enough to answer directly) and a **recursive case** (the answer in terms of the same function on a smaller input). Fibonacci is the cleanest illustration:

```java
static int fib(int n) {
    if (n <= 1) return n;              // base case
    return fib(n - 1) + fib(n - 2);    // recursive case
}
```

Draw the call tree for `fib(5)`: it calls `fib(4)` and `fib(3)`, and `fib(4)` calls `fib(3)` and `fib(2)`. `fib(3)` has now been requested twice, as a *completely separate* subtree that gets recomputed from scratch. Keep expanding, and `fib(2)` is requested 3 times and `fib(1)` five times. The tree roughly doubles with each unit of n, giving **O(2ⁿ)** time: over a trillion calls for `fib(40)`, a value you could compute with 40 additions.

The fix is obvious once you see the picture: the same `fib(3)` subtree is drawn twice, as if it were unknown territory both times. If the first computation writes the answer down, the second request becomes a lookup. **Store, then look up before recomputing**: that's 90% of dynamic programming. The other 10% is deciding exactly what to store and how to index it.

## Java template

Memoized recursion: the natural recursive solution, plus a cache checked before any real work.

```java
static long fib(int n, long[] memo) {        // memo filled with -1 before the first call
    if (n <= 1) return n;                    // base case
    if (memo[n] != -1) return memo[n];       // solved before: just look it up
    return memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
}
```

## Worked examples

### Fibonacci, from O(2ⁿ) to O(n)

With the cache, each `fib(k)` is computed once, and every later request is an O(1) lookup: n distinct subproblems, O(1) work each, **O(n)** in total. The [framework lesson](lesson:dp-framework) turns the same recurrence into a bottom-up loop and then into two variables.

### Merge sort: recursion without DP

Merge sort splits an array into halves, sorts each, and merges them. Its subproblems are *disjoint* (every element belongs to exactly one half at each level), so no subproblem is ever requested twice, and a cache would never be hit. Recognising this is as important as recognising DP: overlapping subproblems are what make a cache worth having.

### Climbing Stairs, spotted as Fibonacci

"You can climb 1 or 2 steps at a time; how many ways reach step n?" The last move was either from step n − 1 or from step n − 2, so `ways(n) = ways(n − 1) + ways(n − 2)`: Fibonacci in a word problem. The repeated subproblems (`ways(n − 2)` is needed by both `ways(n)` and `ways(n − 1)`) are what make it DP. It's worked through in [Fibonacci-style DP](lesson:fibonacci-style-dp).

## Complexity

A DP's time is **(number of distinct states) × (work per state)**: Fibonacci has n states with O(1) work each, so O(n). Space is the size of the cache, plus the recursion depth for top-down code.

## Variations

- **Top-down or bottom-up:** memoized recursion and an iterative table compute the same values; see [the framework](lesson:dp-framework).
- **Space optimisation:** when each state only needs the last few, keep just those, as in [Fibonacci-style DP](lesson:fibonacci-style-dp).
- **More dimensions:** when one index can't describe a subproblem, the state grows: [2-D DP](lesson:two-dimensional-dp).

## Common mistakes

- **Memoizing a recursion with no overlapping subproblems**, such as merge sort: the cache adds memory and never helps.
- **Caching on the wrong key**, one that doesn't capture everything the answer depends on.
- **Using greedy without proving the greedy-choice property**: when it doesn't hold, the answer is silently wrong.
- **Forgetting that memoized recursion still recurses**: deep inputs can overflow Java's stack.

## Practice

Fibonacci Number (LC 509), Climbing Stairs (LC 70), N-th Tribonacci Number (LC 1137), Pascal's Triangle (LC 118).

## Key takeaways

- DP is recursion plus a memory: solve each subproblem once, and look it up afterwards.
- It needs optimal substructure *and* overlapping subproblems; divide and conquer has only the first.
- DP questions ask for an optimum, a count, or feasibility.
- Time is the number of states times the work per state.
- Greedy is faster, but only correct when its special structure holds; DP is the safe default.

## Knowledge check

```quiz
? Why is merge sort divide and conquer rather than dynamic programming?
+ Its subproblems never overlap: each half is sorted once, so a cache would never be hit
- It doesn't have optimal substructure
! It does: sorted halves combine into a sorted whole.
- Because it's O(n log n)
! Running time doesn't decide it.
- Because it isn't recursive
! It is recursive.
> DP needs overlapping subproblems.

? What makes naive recursive Fibonacci take O(2ⁿ) time?
+ The same subproblems, like fib(3), are recomputed from scratch in separate branches of the call tree
- The base case is wrong
! The base case is correct.
- Integer overflow
! Overflow affects values, not time.
- The recursion is too deep
! The depth is only n.
> Caching each fib(k) makes it O(n).

? A problem asks "how many ways…?". What kind of DP answer is that?
+ A count, combined by adding the ways from smaller subproblems
- An optimum, combined with max
! Max picks one way; counting adds them.
- Feasibility, combined with OR
! OR says whether any way exists.
- It can't be DP
! Counting is one of DP's three question types.
> Optimum, count, feasibility: max/min, sum, or.

? When is a greedy algorithm safe to use instead of DP?
+ When the greedy-choice property holds: locally best choices provably lead to the global optimum
- Whenever it's faster
! Fast but wrong is still wrong.
- When the input is sorted
! Sorting helps some greedy algorithms, but doesn't prove them correct.
- Never
! Many problems have the greedy-choice property.
> Prove it, or find a counterexample.
```
