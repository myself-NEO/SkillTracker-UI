## The idea

Keep the stack **sorted** (increasing or decreasing) at all times. Before pushing a new element, pop everything that violates the order. **Each popped element has just found its answer**: the incoming element is its "next greater" or "next smaller". It's the highest-value stack pattern, and it looks like magic until you see the invariant.

## When to use it

Trigger phrases:
- "next greater / next smaller element";
- "previous greater / previous smaller element";
- "how many days until a warmer temperature";
- "largest rectangle", "maximal area", "span";
- "for each element, find the nearest element on the left/right that is bigger/smaller".

The brute force scans outward from every index, which is O(n²); the monotonic stack gets it to O(n).

## How it works

**The invariant that makes it click:** an element sitting in the stack is one *whose answer isn't known yet*. The moment something arrives that resolves it, it leaves. Each element is pushed once and popped once, so the total work is **O(n)**, even though there's a nested `while`: the inner loop's pops, added up over the whole run, can't exceed the n pushes.

**The four-way dial.** Every monotonic-stack problem is the same template with two knobs:

| Want | Direction of loop | Pop condition |
|---|---|---|
| Next **greater** right | left → right | `nums[stack.peek()] < nums[i]` |
| Next **smaller** right | left → right | `nums[stack.peek()] > nums[i]` |
| Previous **greater** left | left → right, read `stack.peek()` *before* pushing | `nums[stack.peek()] <= nums[i]` |
| Previous **smaller** left | left → right, read `stack.peek()` *before* pushing | `nums[stack.peek()] >= nums[i]` |

For the "next" variants you assign the answer when an element is popped; for the "previous" variants you read the surviving top just before pushing.

**`<` vs `<=` matters only with duplicates.** Decide deliberately: use strict `<` when equal elements should *not* resolve each other, `<=` when they should. For "count the subarrays where x is the minimum" you must use strict on one side and non-strict on the other to avoid double counting (see Sum of Subarray Minimums below).

**Store indexes, not values.** An index gives you the value (`nums[i]`) *and* the distance (`i − j`), and lets you write answers into a result array.

## Java template

```java
// Next Greater Element to the right, for every index.
// res[i] = value of first element to the right of i that is > nums[i], else -1
public int[] nextGreater(int[] nums) {
    int n = nums.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    Deque<Integer> stack = new ArrayDeque<>();   // holds INDICES, decreasing by value

    for (int i = 0; i < n; i++) {
        // current element resolves everything smaller sitting in the stack
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            res[stack.pop()] = nums[i];
        }
        stack.push(i);
    }
    return res;
}
```

```java
// Previous Smaller Element for each index: read the survivor before pushing.
public int[] previousSmaller(int[] nums) {
    int n = nums.length;
    int[] res = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();   // increasing by value
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] >= nums[i]) stack.pop();
        res[i] = stack.isEmpty() ? -1 : nums[stack.peek()];
        stack.push(i);
    }
    return res;
}
```

## Worked examples

### Daily Temperatures (LC 739)

```java
public int[] dailyTemperatures(int[] t) {
    int n = t.length;
    int[] res = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && t[stack.peek()] < t[i]) {
            int j = stack.pop();
            res[j] = i - j;            // distance, not value
        }
        stack.push(i);
    }
    return res;                        // 0 by default = no warmer day
}
```

The same template; the only change is storing `i - j` instead of `t[i]`. That's why you store indexes: they give you both value *and* distance.

### Largest Rectangle in Histogram (LC 84) ⭐⭐

The single most important hard stack problem, asked directly and as a subroutine.

**Approach.** For each bar `i`, the largest rectangle *with height exactly `h[i]`* extends left until a strictly shorter bar and right until a strictly shorter bar. So width = (nextSmallerRight − prevSmallerLeft − 1). That's two monotonic stacks, but you can do it in **one pass**: when bar `i` pops bar `j`, `i` *is* `j`'s next-smaller-right, and the new stack top *is* `j`'s previous-smaller-left.

```java
public int largestRectangleArea(int[] h) {
    int n = h.length, best = 0;
    Deque<Integer> stack = new ArrayDeque<>();   // increasing heights

    for (int i = 0; i <= n; i++) {
        int cur = (i == n) ? 0 : h[i];           // sentinel flushes the stack
        while (!stack.isEmpty() && h[stack.peek()] >= cur) {
            int height = h[stack.pop()];
            int left   = stack.isEmpty() ? -1 : stack.peek();
            int width  = i - left - 1;
            best = Math.max(best, height * width);
        }
        stack.push(i);
    }
    return best;
}
```

**Explanation:**
- The stack holds indexes of bars in increasing height. Anything still in the stack has no shorter bar to its right *yet*.
- When popping `j`: the right boundary is `i` (the first shorter bar), and the left boundary is the new top (the first shorter bar on the left, because everything between was taller and already popped). Width `i - left - 1` counts the bars strictly between the two boundaries.
- The **sentinel** `cur = 0` at `i == n` forces every remaining bar to pop, so you don't need a separate flush loop. Sentinels are the cleanest way to kill edge cases; use them.
- `stack.push(i)` also happens at `i == n`; that's harmless, since the loop ends.

## Complexity

O(n) time and O(n) space for every problem here: each index is pushed once and popped at most once.

## Variations

### Next Greater Element II (LC 503): a circular array

**Approach:** simulate the wrap-around by looping `2n` times and using `i % n`. Only push in the first pass; the second pass exists purely to resolve leftovers.

```java
public int[] nextGreaterElements(int[] nums) {
    int n = nums.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < 2 * n; i++) {
        int cur = nums[i % n];
        while (!stack.isEmpty() && nums[stack.peek()] < cur) res[stack.pop()] = cur;
        if (i < n) stack.push(i);
    }
    return res;
}
```

**The "double the array" trick for circular problems is worth generalising**: it shows up in circular DP and circular sliding windows too.

### Maximal Rectangle (LC 85)

The follow-up that always comes after the histogram. Build a histogram per row (`heights[c] = grid[r][c]=='1' ? heights[c]+1 : 0`) and call the histogram function for each row: O(rows × cols).

```java
public int maximalRectangle(char[][] matrix) {
    if (matrix.length == 0) return 0;
    int cols = matrix[0].length, best = 0;
    int[] heights = new int[cols];
    for (char[] row : matrix) {
        for (int c = 0; c < cols; c++)
            heights[c] = (row[c] == '1') ? heights[c] + 1 : 0;
        best = Math.max(best, largestRectangleArea(heights));
    }
    return best;
}
```

### Trapping Rain Water (LC 42), the stack version

**Approach.** Water is trapped in horizontal *layers*. Keep a decreasing stack of bar indexes; when a taller bar arrives, it closes a basin whose floor is the popped bar and whose walls are the new bar and the new stack top.

```java
public int trap(int[] h) {
    Deque<Integer> stack = new ArrayDeque<>();   // decreasing heights
    int water = 0;
    for (int i = 0; i < h.length; i++) {
        while (!stack.isEmpty() && h[stack.peek()] < h[i]) {
            int floor = stack.pop();
            if (stack.isEmpty()) break;          // no left wall → water escapes
            int left = stack.peek();
            int width = i - left - 1;
            int depth = Math.min(h[left], h[i]) - h[floor];
            water += width * depth;
        }
        stack.push(i);
    }
    return water;
}
```

**Interview note:** the [two-pointer solution](lesson:two-pointers) is O(n) time and **O(1) space**, and is the better answer here. Mention that you know both and that two pointers win on space: interviewers grade on exactly that kind of comparison.

### Sum of Subarray Minimums (LC 907): the counting variant

**Approach.** For each element, count how many subarrays it's the minimum of: `(i - prevSmaller) * (nextSmaller - i)`. Its contribution is `nums[i]` times that count.

```java
public int sumSubarrayMins(int[] a) {
    final int MOD = 1_000_000_007;
    int n = a.length;
    long sum = 0;
    Deque<Integer> stack = new ArrayDeque<>();   // increasing
    for (int i = 0; i <= n; i++) {
        while (!stack.isEmpty() && (i == n || a[stack.peek()] >= a[i])) {
            int mid   = stack.pop();
            int left  = stack.isEmpty() ? -1 : stack.peek();
            long count = (long)(mid - left) * (i - mid);
            sum = (sum + count % MOD * a[mid]) % MOD;
        }
        stack.push(i);
    }
    return (int) sum;
}
```

**The duplicate subtlety:** the pop condition uses `>=` (non-strict on the left side), and the right boundary is strict. If you used `>=` on both sides, subarrays with equal minimums would be counted twice. "Strict on one side, non-strict on the other" is *the* thing to remember for all monotonic **counting** problems.

**This "contribution technique" generalises:** instead of iterating over subarrays, iterate over elements and count how many subarrays each one dominates. It turns O(n²) into O(n).

### Related patterns

- **Greedy removals** such as Remove K Digits pop larger digits while a smaller one arrives: see [matching and simulation](lesson:matching-and-simulation).
- **The maximum or minimum of every window** needs elements to leave from the old end as well: a [monotonic deque](lesson:monotonic-deque).

## Common mistakes

- **Storing values instead of indexes**, which loses the distances and the positions to write answers to.
- **The wrong comparison with duplicates.** Strict or non-strict changes the result; for counting, use strict on one side and non-strict on the other.
- **Forgetting to flush the stack at the end.** Elements still on the stack have no answer (or need the sentinel to be processed, as in the histogram).
- **Reaching for a heap or a `TreeMap`** for "nearest greater element": that's O(n log n) where the monotonic stack is O(n).
- **Overflow in counting problems.** Multiply in `long` and take the modulus as you go.

## Practice

Next Greater Element I (LC 496), Daily Temperatures (LC 739), Next Greater Element II (LC 503), Online Stock Span (LC 901), Largest Rectangle in Histogram (LC 84), Maximal Rectangle (LC 85), Trapping Rain Water (LC 42), Sum of Subarray Minimums (LC 907), Remove K Digits (LC 402).

## Key takeaways

- Keep the stack sorted; before pushing, pop whatever the new element resolves. Each popped element has found its answer.
- Each index is pushed once and popped once: O(n), despite the nested loop.
- Two knobs, greater or smaller and next or previous, cover every variant; store indexes, not values.
- Largest Rectangle in Histogram finds both boundaries in one pass, with a sentinel to flush the stack.
- For counting problems, use strict on one side and non-strict on the other so duplicates aren't counted twice.

## Knowledge check

```quiz
? The monotonic stack has a `while` loop inside a `for` loop. Why is it still O(n)?
+ Each index is pushed once and popped at most once, so the inner loop does at most n pops in total
- The inner loop runs at most a constant number of times per iteration
! A single iteration can pop many elements.
- The stack never holds more than log n elements
! It can hold all n elements, e.g. for a decreasing array.
- It isn't; it's O(n²) in the worst case
! The total number of pops is bounded by the pushes.
> Amortised over the whole run, the work is linear.

? For "next greater element to the right", what does the stack hold while scanning left to right?
+ Indexes whose next greater element hasn't been found yet, in decreasing order of value
- Every index seen so far, in increasing order of value
! Smaller elements are popped as soon as a greater one arrives.
- The answers found so far
! Answers go into the result array; the stack holds pending indexes.
- Values only, in the order they arrived
! Without indexes you can't write answers back.
> An element leaves the stack exactly when its answer arrives.

? In Largest Rectangle in Histogram, when bar j is popped by bar i, what are the boundaries of the widest rectangle of height h[j]?
+ The new stack top on the left and i on the right, both excluded
- Index 0 and index n − 1
! The rectangle stops at the first shorter bar on each side.
- j − 1 and j + 1
! Taller bars on either side extend the rectangle.
- The previous popped bar and i
! The left boundary is the bar still on the stack.
> Everything between the new top and i is at least as tall as h[j].

? Sum of Subarray Minimums: what goes wrong if both boundaries use a non-strict comparison?
+ Subarrays whose minimum appears more than once are counted once for each copy of the minimum
- Some subarrays are never counted
! Using non-strict on both sides over-counts rather than missing subarrays.
- The answer overflows
! Overflow is handled separately with long and the modulus.
- The loop never terminates
! Termination doesn't depend on the comparison.
> Strict on one side and non-strict on the other gives each subarray exactly one owner.
```
