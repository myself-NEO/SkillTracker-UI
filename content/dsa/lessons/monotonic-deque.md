## The idea

A deque of *indexes* whose values stay monotonic: decreasing to track the maximum, increasing to track the minimum. It's the [monotonic stack](lesson:monotonic-stack) plus an expiry rule at the other end:

- remove from the **front** when an index falls out of the window;
- remove from the **back** while those values are ≤ the incoming value: they can never be the maximum again, because the newcomer is bigger *and* stays in the window longer;
- the **front** is always the window's maximum.

## When to use it

Trigger phrases: "the maximum/minimum of every window of size k", "the longest subarray where max − min ≤ limit", "constrained subsequence sum".

More generally: *"I need the maximum or minimum of a [sliding window](lesson:sliding-window) in O(1)."*

## How it works

The front of the deque is always the maximum of the current window. Anything smaller that arrived *before* a bigger element can never become the answer while that bigger, more recent element is still in range, so it's safe to discard it for good. Each index enters the deque once and leaves at most once, so the whole scan is **O(n)**.

**Why indexes and not values:** the front check needs to know *when* an element entered to tell whether it has expired. Values alone can't tell you that.

**Why `<=` and not `<` when evicting from the back:** with `<=` you also drop equal elements, keeping the deque smaller. Correctness is unaffected, because the newer equal element expires later. Either works; `<=` is tidier.

## Java template

```java
Deque<Integer> dq = new ArrayDeque<>();                  // indexes, values decreasing (for max)
for (int i = 0; i < n; i++) {
    while (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();          // expired
    while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();    // dominated
    dq.offerLast(i);
    // nums[dq.peekFirst()] is the maximum of the window ending at i
}
```

## Worked examples

### Sliding Window Maximum (LC 239)

```java
public int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] res = new int[n - k + 1];
    Deque<Integer> dq = new ArrayDeque<>();   // indices, values decreasing

    for (int i = 0; i < n; i++) {
        // 1. evict indices that have slid out of the window
        while (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();

        // 2. evict smaller values from the back — they're dominated
        while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();

        dq.offerLast(i);

        // 3. once the window is full, the front is the answer
        if (i >= k - 1) res[i - k + 1] = nums[dq.peekFirst()];
    }
    return res;
}
```

### Longest Continuous Subarray With Absolute Diff ≤ Limit (LC 1438)

Two monotonic deques, one for the maximum and one for the minimum, inside a variable-size sliding window:

```java
public int longestSubarray(int[] nums, int limit) {
    Deque<Integer> maxDq = new ArrayDeque<>();   // decreasing
    Deque<Integer> minDq = new ArrayDeque<>();   // increasing
    int left = 0, best = 0;

    for (int right = 0; right < nums.length; right++) {
        while (!maxDq.isEmpty() && nums[maxDq.peekLast()] < nums[right]) maxDq.pollLast();
        maxDq.offerLast(right);
        while (!minDq.isEmpty() && nums[minDq.peekLast()] > nums[right]) minDq.pollLast();
        minDq.offerLast(right);

        while (nums[maxDq.peekFirst()] - nums[minDq.peekFirst()] > limit) {
            if (maxDq.peekFirst() == left) maxDq.pollFirst();
            if (minDq.peekFirst() == left) minDq.pollFirst();
            left++;                              // shrink from the left
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
}
```

Here the window shrinks by moving `left`, so an index expires when it equals `left`, not by a fixed size.

## Complexity

O(n) time: each index enters and leaves each deque at most once. O(k) space for a fixed window (O(n) for a variable one).

## Variations

- **A heap instead of a deque.** A max-heap of `{value, index}` with lazy deletion (pop the top while its index has expired) gives O(n log k). The deque gives O(n). Say both; the deque is the "right" answer.
- **The minimum of every window**: flip the comparison, keeping the deque increasing.
- **DP with a sliding maximum.** Constrained Subsequence Sum (LC 1425) computes `dp[i] = nums[i] + max(0, max of dp[i−k..i−1])`, keeping that window maximum in a monotonic deque.
- **Shortest Subarray with Sum at Least K (LC 862)**: a monotonic deque over prefix sums handles negative numbers, where a plain sliding window fails.

## Common mistakes

- **Storing values instead of indexes**, which makes it impossible to tell when an element has expired.
- **Forgetting the expiry check at the front**, so the "maximum" comes from outside the window.
- **Reading the answer before the first window is full**: only from `i ≥ k − 1`.
- **Mixing up the deque's direction**: decreasing for the maximum, increasing for the minimum.
- **Reaching for a heap** and settling for O(n log k) when O(n) is expected.

## Practice

Sliding Window Maximum (LC 239), Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit (LC 1438), Constrained Subsequence Sum (LC 1425), Shortest Subarray with Sum at Least K (LC 862), Jump Game VI (LC 1696).

## Key takeaways

- A monotonic deque is a monotonic stack that also lets elements expire from the front.
- Evict expired indexes from the front and dominated values from the back; the front is the window's maximum.
- Store indexes, so you can tell when an element leaves the window.
- Each index enters and leaves once: O(n), better than a heap's O(n log k).
- Two deques (one for the maximum, one for the minimum) answer "max − min" window constraints.

## Knowledge check

```quiz
? In Sliding Window Maximum, why is it safe to drop smaller values from the back when a new value arrives?
+ The newcomer is larger and will stay in the window longer, so the smaller values can never be the maximum again
- Because the window only holds k elements
! The window size isn't why they're dropped.
- Because the deque must stay sorted in increasing order
! For the maximum the deque is decreasing.
- They're kept; only the front is ever removed
! Removing dominated values from the back is what keeps the scan O(n).
> Dominated values are discarded for good.

? Why does the deque store indexes instead of values?
+ The front check must know when an element entered, to tell whether it has left the window
- Because Java deques can't hold integers
! They hold Integer objects.
- To sort the elements by position
! Index order is the arrival order; nothing is sorted.
- To save memory
! An index takes the same space as a value.
> nums[index] still gives the value when you need it.

? What's the time complexity of Sliding Window Maximum with a monotonic deque, and with a max-heap?
+ O(n) with the deque; O(n log k) with the heap
- O(n log k) for both
! The deque has no log factor.
- O(n·k) for both
! Neither rescans the window.
- O(n) for both
! Heap operations cost O(log k).
> Each index enters and leaves the deque once.

? When can you first read an answer from the front of the deque?
+ Once the first window is complete, at i = k − 1
- At i = 0
! The first window isn't complete until k elements have arrived.
- At i = k
! That would skip the first window.
- Only after the whole array has been scanned
! Each window's maximum is available as soon as the window is full.
> That's why the result array has n − k + 1 entries.
```
