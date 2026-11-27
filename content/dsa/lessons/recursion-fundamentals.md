Recursion is the foundation for trees, graphs, divide and conquer, backtracking and dynamic programming. The goal of this lesson isn't to memorise examples; it's to internalise a **design method**, so that a new recursive problem stops looking scary and starts looking like the same five steps applied again.

## The mental model: trust and delegate

The instinct beginners have is to trace *every single call* in their head: "first this happens, then this calls that, then that returns, then…". This works for tiny examples and completely breaks down for anything real. It's also not how experienced people think about recursion.

The actual mental model is closer to **mathematical induction**: assume the function already works correctly for a *smaller* version of the problem, and work out how to build the answer to the *current* problem from that assumed-correct smaller answer. You don't trace the whole call chain; you trust one level down and stop thinking about it.

This is sometimes called the "recursive leap of faith". Concretely: if you're writing `sum(arr, i)`, the sum of `arr` from index `i` to the end, don't think about what happens for every `i`. Think about exactly one step: *"If `sum(arr, i+1)` already gives me the sum of everything after index `i`, how do I get the sum from index `i` onward?"* Answer: `arr[i] + sum(arr, i+1)`. That's it. You never had to think about `i+2`, `i+3` and so on: the leap of faith handles all of that, recursively, the same way.

## How recursion executes: the call stack

Under the hood, every function call, recursive or not, pushes a **stack frame** onto the call stack. The frame holds that call's parameters, its local variables, and where to resume when it returns. A recursive function just pushes a *new* frame for itself before the current one has been popped.

`factorial(4)` grows the stack like this, then unwinds:

```
call:                         return:
factorial(4)                  24  <- 4 * 6
  factorial(3)                 6  <- 3 * 2
    factorial(2)                2  <- 2 * 1
      factorial(1)              1  <- base case
```

Each indent level is a live stack frame, holding its own copy of `n`. `factorial(1)` hits the base case and returns `1` *without pushing further*; that return value then flows back up, each frame multiplying it by its own `n`, until the outermost call resolves.

Consequences that matter a lot in practice:

- **Stack depth = space cost.** A recursive call chain `n` deep uses O(n) stack frames, so O(n) space, even if the function itself uses no extra data structures. This is easy to forget when you only count "the extra variables I declared".
- **Stack overflow is a real failure mode.** If the base case is wrong, missing or unreachable, the stack keeps growing until it runs out: `StackOverflowError` in Java. It's usually *the* first thing to suspect when recursive code crashes instead of returning a wrong answer.
- **Java does not do tail-call optimisation.** Some languages detect when a recursive call is the very last thing a function does and reuse the current stack frame, making "tail-recursive" code run in O(1) space. The JVM does **not**. So writing Java recursion in a tail-recursive style doesn't save you from stack depth: for very deep recursion, convert to a loop with your own stack (a `Deque`; see [explicit stacks](lesson:augmented-and-explicit-stacks)), or make sure the depth is bounded by the problem.

## The steps

This is the process, every time, for any recursive function:

1. **Write the contract in plain English first**, before any code: what does this function take, and what does it promise to return? ("Given a sorted array and a target, return the index of the target, or −1.") If you can't state this precisely, you're not ready to write the base case yet.
2. **Find the base case(s)**: the smallest or simplest input(s) you can answer directly, with no recursion. Ask: "what input is so trivial that I can just return the answer?"
3. **Assume the recursive call already works** for a smaller or simpler input (the leap of faith). Don't verify this by tracing: just assume it, the same way you assume `P(n-1)` when proving `P(n)` by induction.
4. **Use that assumed-correct answer to build the current answer.** This is almost always "do a small amount of work, then combine it with the recursive result".
5. **Confirm that every recursive call moves strictly closer to a base case.** This is what guarantees termination: if some path never shrinks the problem, you've written infinite recursion, however correct the logic looks otherwise.

## Reading the signals

Reach for recursion when:
- **The structure is recursive**: a tree is a node with subtrees; a linked list is a node followed by a list; a nested list contains lists.
- **The problem is defined in terms of a smaller version of itself**: f(n) from f(n − 1), or from two halves (divide and conquer).
- **You must explore choices**: generate every subset, permutation or arrangement. That's [backtracking](lesson:backtracking-template), a disciplined use of recursion.
- **You can halve the problem**: fast power, merge sort, binary search, where the depth is only O(log n).

Prefer a loop when the recursion is a long **linear chain** (10⁴ or more levels in Java), and when the iterative version is just as clear.

## Worked example

**Is `s[lo..hi]` a palindrome?** Running the five steps:

1. **Contract:** `isPalindrome(s, lo, hi)` returns whether the characters from `lo` to `hi` read the same both ways.
2. **Base case:** zero or one characters (`lo >= hi`) is always a palindrome.
3. **Leap of faith:** assume `isPalindrome(s, lo + 1, hi − 1)` correctly answers for the inside.
4. **Build the answer:** the whole range is a palindrome when the two ends match *and* the inside is a palindrome.
5. **Progress:** each call shrinks the range by two, so it reaches the base case.

```java
// Contract: is s[lo..hi] a palindrome?
static boolean isPalindrome(String s, int lo, int hi) {
    if (lo >= hi) return true;                                                 // base case
    return s.charAt(lo) == s.charAt(hi) && isPalindrome(s, lo + 1, hi - 1);    // trust the inside
}
```

The function never thinks about the third or fourth pair of characters: the recursive call does. That's the method working. (It's O(n) time and O(n) stack; the [two-pointer loop](lesson:two-pointers) does the same in O(1) space.)

## Common mistakes

- **Tracing every call in your head** instead of trusting the contract one level down.
- **A missing, wrong or unreachable base case**, which recurses until the stack overflows. Write the base case first.
- **A path that doesn't shrink the problem.** With several recursive calls, check *every* one moves toward a base case.
- **Assuming Java optimises tail calls.** It doesn't: deep "tail-recursive-looking" Java still overflows.
- **Forgetting that the stack is memory.** Depth n is O(n) space even with no other data structures.

## Key takeaways

- Think in induction: trust the recursive call on a smaller input, and build the current answer from it.
- Five steps: the contract, the base case, the leap of faith, combining, and progress toward the base case.
- Every call is a stack frame: recursion depth is space, and too much depth is a `StackOverflowError`.
- Java doesn't optimise tail calls; convert very deep recursion to a loop with an explicit stack.
- Recursion fits recursive structures, smaller-self definitions, choices to explore, and halving.

## Knowledge check

```quiz
? Writing `sum(arr, i)`, what should you assume about `sum(arr, i + 1)`?
+ That it already returns the correct sum of everything after index i
- Nothing; trace it to make sure it works
! Tracing every call doesn't scale; trust the contract.
- That it returns 0 until the base case is reached
! It returns the real sum of the rest.
- That it modifies arr in place
! The contract says it returns a sum.
> Then the answer is arr[i] + sum(arr, i + 1).

? A recursive function on a 100,000-node linked list throws StackOverflowError, but works on small lists. Why?
+ Each node adds a stack frame, and the default stack can't hold that many frames
- The base case is missing
! Then small lists would fail too.
- Java limits recursion to 65,536 calls
! There's no fixed count; the stack's size is the limit.
- The list must have a cycle
! A cycle would fail at any size.
> Java doesn't reuse frames for tail calls; use a loop for long chains.

? Which step guarantees that a recursive function terminates?
+ Every recursive call moves strictly closer to a base case
- Writing the contract in plain English
! The contract defines what's returned, not termination.
- Trusting the recursive call
! The leap of faith assumes correctness; it doesn't prove termination.
- Combining the results
! Combining builds the answer, not progress.
> If some path doesn't shrink the problem, the recursion never ends.

? Why does recursion depth count as space, even when a function declares no arrays?
+ Every pending call keeps a stack frame with its parameters and locals until it returns
- Because Java copies the arguments into the heap
! Frames live on the thread's stack, not the heap.
- It doesn't; recursion is O(1) space
! Each level of depth holds a frame.
- Because of garbage collection
! The frames are live, not garbage.
> Depth n means O(n) space.
```
