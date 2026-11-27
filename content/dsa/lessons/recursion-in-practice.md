## The idea

Every recursive function is a base case plus a smaller call: the shapes differ in **how many** recursive calls each invocation makes, and **how much** each call shrinks the problem. Draw the call tree, and both the time and the space follow from it.

## When to use it

- **Linear recursion** (one call per invocation): processing a sequence one element at a time, or a list node by node.
- **Tree recursion** (several calls per invocation): Fibonacci-style recurrences, tree traversals, generating choices.
- **Halving** (one call on half the input): fast exponentiation, binary search, divide and conquer.

Whichever shape, design it with [the five steps](lesson:recursion-fundamentals).

## How it works

The reliable analysis: **draw the call tree, then count the total work across all its nodes.**

- **Time** is the number of nodes in the tree times the work done per node.
- **Space** is the **depth** of the tree, not its size: only the frames on the *current* path are on the stack at any moment; siblings that already returned have been popped.

That last point is the one beginners most often get backwards, so it's worth restating: a call tree with a million nodes but depth 20 is O(1,000,000) time but only O(20) space.

## Java template

```java
static Result solve(Input x) {
    if (/* x is a base case */) return /* the direct answer */;
    Result smaller = solve(/* a strictly smaller x */);      // the leap of faith
    return /* combine smaller with this level's work */;
}
```

## Worked examples

**Factorial** (linear recursion: one recursive call per invocation):

```java
static long factorial(int n) {
    if (n <= 1) return 1;              // base case
    return n * factorial(n - 1);       // trust factorial(n-1), use it
}
```

**Sum of an array:**

```java
static int sum(int[] arr, int i) {
    if (i == arr.length) return 0;             // base case: nothing left
    return arr[i] + sum(arr, i + 1);            // trust the rest, add my piece
}
```

**Fibonacci** (tree recursion: *several* recursive calls per invocation). This is the example that makes complexity visible, so it's worth sitting with:

```java
static int fib(int n) {
    if (n <= 1) return n;                        // base cases: fib(0)=0, fib(1)=1
    return fib(n - 1) + fib(n - 2);
}
```

The call tree for `fib(4)`:

```
fib(4)
├── fib(3)
│   ├── fib(2)
│   │   ├── fib(1) -> 1
│   │   └── fib(0) -> 0
│   └── fib(1) -> 1
└── fib(2)
    ├── fib(1) -> 1
    └── fib(0) -> 0
```

Notice that `fib(2)` is computed twice, from scratch, in two different branches. At larger `n` this redundancy compounds badly: that's exactly why naive recursive Fibonacci is exponential. This tree is also the single most useful picture for *any* recursion complexity question: draw the tree, count the nodes, and that's your time complexity.

**Power** (a trick: halve the problem instead of shrinking it by one):

```java
static double power(double x, int n) {
    if (n == 0) return 1;
    double half = power(x, n / 2);
    return (n % 2 == 0) ? half * half : half * half * x;
}
```

Instead of `power(x, n-1)`, which needs `n` calls, this halves `n` each time and needs only O(log n) calls. It's the same idea as binary search: asking "can I cut the problem in half instead of by one?" is a pattern worth having on hand.

## Complexity

| Shape | Time | Space |
|---|---|---|
| **One call on n − 1** (factorial, array sum): a chain of depth n | O(n) | O(n) |
| **One call on n / 2** (power by halving): a chain of depth log n | O(log n) | O(log n) |
| **Two calls, on n − 1 and n − 2** (naive Fibonacci): a tree that roughly doubles each time n grows by 1 | O(2ⁿ) | O(n) |

As recurrences, these are `T(n) = T(n−1) + O(1)`, `T(n) = T(n/2) + O(1)` and `T(n) = T(n−1) + T(n−2) + O(1)`. Naive Fibonacci's space is still only O(n): the space is the depth of one path, not the number of nodes.

## Variations

**Memoisation.** When the call tree has **repeated subtrees** (the same parameters appearing more than once, like `fib(2)` above), cache each result the first time it's computed:

```java
static long fib(int n, long[] memo) {            // memo filled with -1 to start
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];           // computed before: reuse it
    return memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
}
```

Each `n` is now computed once: O(n) time instead of O(2ⁿ). That's the doorway to [dynamic programming](lesson:what-is-dynamic-programming).

**Indexes instead of copies.** Pass `(arr, i)` or `(s, lo, hi)` rather than `Arrays.copyOfRange(...)` or `s.substring(...)`: copying is O(n) per call and turns an O(n) recursion into O(n²).

**Negative exponents.** For Pow(x, n) (LC 50), handle `n < 0` by computing `1 / power(x, -n)`, and widen `n` to `long` first: `-Integer.MIN_VALUE` overflows.

## Common mistakes

- **A missing or wrong base case**, so the recursion never stops and the stack overflows. Write the base case *first*, and check it's reachable.
- **Not shrinking the problem on every path.** It's easy to shrink on the "happy path" and forget a branch. With several recursive calls, check that *all* of them move toward a base case.
- **Redundant recomputation.** A call tree with repeated subtrees is the signal to memoise.
- **Assuming Java optimises tail calls.** It doesn't: deep "tail-recursive-looking" Java code still overflows the stack.
- **Copying arrays or strings into each call**, which hides an extra factor of n.

## Practice

Fibonacci Number (LC 509), Pow(x, n) (LC 50), Reverse Linked List (LC 206), recursively; Reverse String (LC 344), recursively; Merge Two Sorted Lists (LC 21), recursively; K-th Symbol in Grammar (LC 779).

## Key takeaways

- Draw the call tree: time is the number of nodes times the work per node; space is the depth.
- One call that shrinks by one is linear; two calls per level is exponential; halving is logarithmic.
- Repeated subtrees in the call tree mean memoisation will help: the start of dynamic programming.
- Pass indexes, not copies, or each call costs O(n) extra.
- Base case first, and every recursive path must shrink the problem.

## Knowledge check

```quiz
? Naive recursive Fibonacci is O(2ⁿ) time. What is its space complexity?
+ O(n): only the frames on the current path are on the stack at once
- O(2ⁿ), the same as its time
! Space follows depth, not the number of nodes.
- O(1)
! Each pending call keeps a frame.
- O(log n)
! The deepest path has n levels.
> Time counts all nodes; space counts the deepest path.

? Why is `power(x, n)` with `power(x, n / 2)` only O(log n)?
+ Each call halves n, so the chain of calls is only log n deep
- Because multiplication is O(1)
! That's true, but the depth is what matters.
- Because Java caches the results
! Nothing is cached here.
- Because x is a double
! The type of x doesn't affect the number of calls.
> Shrinking by half instead of by one turns a chain of n into a chain of log n.

? What's the signal that memoisation would speed up a recursive function?
+ The call tree contains repeated subtrees: the same parameters computed more than once
- The function has more than one base case
! Several base cases don't create repeated work.
- The recursion is deeper than 100 levels
! Depth is a stack issue; repetition is a time issue.
- The function returns a long
! The return type is irrelevant.
> Caching each result the first time makes every distinct call O(1) afterwards.

? A recursive function passes `s.substring(1)` to its recursive call. What does that cost?
+ An O(n) copy per call, which can turn an O(n) recursion into O(n²)
- Nothing; substring shares the original characters
! Since Java 7u6, substring copies its characters.
- It makes the recursion tail-recursive
! It doesn't change the call shape.
- It reduces the stack depth
! The depth is the same; each call is just slower.
> Pass an index instead of a copy.
```
