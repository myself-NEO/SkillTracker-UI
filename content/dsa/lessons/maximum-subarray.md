## The idea

Kadane's algorithm is the classic O(n) solution to "maximum sum contiguous subarray". At each index you have exactly two choices: **extend** the best subarray ending at the previous index, or **start fresh** at the current element. Keep a running "best sum ending here" and a global best.

## When to use it

- The answer is the **maximum (or minimum) sum of a contiguous subarray**, with no other constraint on the subarray.
- A problem reduces to the best contiguous run: the best single buy-and-sell stock profit is the maximum run of day-over-day price changes.
- Variants that fold differently over the array: the **maximum product** (track the minimum too) and the **circular** maximum (use the total minus the minimum).

If the subarray must also satisfy a condition, such as a length limit or a sum at most k, plain Kadane doesn't apply; look at [sliding window](lesson:sliding-window) or [prefix sums](lesson:prefix-sums).

## How it works

Kadane's algorithm is a 1-D dynamic programming recurrence (see [what dynamic programming is](lesson:what-is-dynamic-programming)), compressed to O(1) space:

- *State:* `dp[i]` = the maximum sum of a contiguous subarray that **ends exactly at index `i`**. Not "the best subarray somewhere in the first `i` elements": specifically one that ends at `i`. This precision is what makes the recurrence work.
- *Recurrence:* a subarray ending at `i` either extends the best subarray ending at `i−1` (`dp[i−1] + nums[i]`), or abandons everything before it and starts fresh at `i` (`nums[i]` alone), whichever is bigger: `dp[i] = max(nums[i], dp[i−1] + nums[i])`.
- *Answer:* the maximum over *all* `dp[i]`, not just `dp[n−1]`, since the best subarray might end anywhere.
- *Base case:* `dp[0] = nums[0]`.

Each `dp[i]` needs only `dp[i−1]`, so two variables replace the array.

**Walkthrough.** `nums = [-2,1,-3,4,-1,2,1,-5,4]`. `currMax` walks: -2, 1, -2, 4, 3, 5, 6, 1, 5. `globalMax` peaks at 6, for the subarray `[4,-1,2,1]`.

## Java template

```java
static int maxSubArray(int[] nums) {                 // LC 53
    int currMax = nums[0], globalMax = nums[0];
    for (int i = 1; i < nums.length; i++) {
        currMax = Math.max(nums[i], currMax + nums[i]);   // extend, or start fresh
        globalMax = Math.max(globalMax, currMax);
    }
    return globalMax;
}
```

## Worked examples

**Returning the subarray itself.** A frequent follow-up: track where the current run started, and save the `(start, end)` pair whenever the global best improves.

```java
static int[] maxSubArrayRange(int[] nums) {          // {start, end} of a best subarray
    int currMax = nums[0], globalMax = nums[0];
    int start = 0, bestStart = 0, bestEnd = 0;
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] > currMax + nums[i]) {            // starting fresh beats extending
            currMax = nums[i];
            start = i;
        } else {
            currMax += nums[i];
        }
        if (currMax > globalMax) {
            globalMax = currMax;
            bestStart = start;
            bestEnd = i;
        }
    }
    return new int[] {bestStart, bestEnd};
}
```

On the walkthrough array it returns `{3, 6}`: the subarray `[4,-1,2,1]`.

**Best Time to Buy and Sell Stock (LC 121).** Given daily prices, maximise the profit from one buy and one sell. The standard solution tracks a running minimum price and the best profit against it:

```java
static int maxProfit(int[] prices) {
    int minSoFar = prices[0], best = 0;
    for (int i = 1; i < prices.length; i++) {
        best = Math.max(best, prices[i] - minSoFar);
        minSoFar = Math.min(minSoFar, prices[i]);
    }
    return best;
}
```

Here's the connection worth having in your back pocket: if you build an array of **day-over-day price changes** (`diffs[i] = prices[i] − prices[i−1]`), the best single buy-and-sell profit is *exactly* the maximum subarray sum of `diffs`, clamped at 0 since you can always choose not to trade. Buying low and selling later is the same as capturing the biggest run of daily changes in a row, which is what Kadane's algorithm finds. Both formulations give a profit of 5 on `prices = [7,1,5,3,6,4]`. Interviewers like this connection because it tests whether you can *transfer* a pattern to a differently worded problem, not just recall code.

## Complexity

O(n) time, O(1) space, against O(n²) for trying every subarray (O(n³) if each sum is recomputed). Kadane's algorithm shows that not every DP solution needs a visible array: the recurrence is still DP even when you never materialise `dp[]`.

## Variations

### Maximum Product Subarray (LC 152)

Addition is monotonic: adding a bigger number always helps. Multiplication isn't: multiplying by a negative number *flips* the ranking, turning your best-so-far into your worst-so-far and vice versa. So one running value isn't enough.

- *State:* two values for each index `i`: `maxProd` (the largest product of a subarray ending at `i`) and `minProd` (the smallest, most negative one). It's still 1-D DP; it just tracks two numbers per index.
- *Recurrence:* the new maximum and minimum each come from one of three candidates: `nums[i]` alone (restart), `maxProd * nums[i]`, or `minProd * nums[i]`. The last one matters when `nums[i]` is negative, since the previous minimum times a negative can become the new maximum.

```java
static int maxProduct(int[] nums) {
    int maxProd = nums[0], minProd = nums[0], result = nums[0];
    for (int i = 1; i < nums.length; i++) {
        int curr = nums[i];
        int candMax = Math.max(curr, Math.max(maxProd * curr, minProd * curr));
        int candMin = Math.min(curr, Math.min(maxProd * curr, minProd * curr));
        maxProd = candMax;
        minProd = candMin;
        result = Math.max(result, maxProd);
    }
    return result;
}
```

**Walkthrough.** `nums = [-2,3,-4]`. Start: maxProd = minProd = result = −2. At `3`: the candidates are 3, −6 and −6, so max = 3 and min = −6; result = 3. At `−4`: the candidates are −4, −12 and 24, so max = 24 and min = −12; result = 24. The answer is the whole array, `−2 × 3 × −4 = 24`: the double negative is exactly why tracking the running *minimum* mattered.

An equivalent shortcut swaps `maxProd` and `minProd` whenever `nums[i]` is negative, then updates each with two candidates. The general lesson: **whenever the operation you're folding over isn't monotonic, ask whether "worst so far" might flip into "best so far" one step later.**

### Maximum Circular Subarray Sum (LC 918)

Either the best subarray doesn't wrap, and plain Kadane finds it, or it wraps around the end. A wrapping subarray is everything *except* some middle subarray, so its sum is `total − minSubarraySum`. Compute both and take the larger, except when every element is negative: then `total − minSubarraySum` describes an empty subarray, so fall back to plain Kadane.

```java
static int maxSubarraySumCircular(int[] nums) {
    int total = 0, curMax = 0, curMin = 0, best = nums[0], worst = nums[0];
    for (int x : nums) {
        curMax = Math.max(x, curMax + x);
        best = Math.max(best, curMax);
        curMin = Math.min(x, curMin + x);
        worst = Math.min(worst, curMin);
        total += x;
    }
    return best < 0 ? best : Math.max(best, total - worst);   // all negative: no wrapping answer
}
```

### Maximum absolute sum

Maximum Absolute Sum of Any Subarray (LC 1749) runs Kadane twice in one pass, once for the maximum and once for the minimum, and returns the larger absolute value.

## Common mistakes

- **Starting from 0 instead of `nums[0]`.** `currMax = globalMax = 0` returns 0 for an all-negative array, but the answer is its largest element, because the subarray can't be empty.
- **Returning the last `dp` value instead of the maximum over all of them.** The best subarray can end anywhere.
- **Tracking only the maximum for products.** A negative times the running minimum can produce the new maximum.
- **Forgetting the all-negative case in the circular version**, where `total − minSubarraySum` would describe an empty subarray.

## Practice

Maximum Subarray (LC 53), Maximum Product Subarray (LC 152), Maximum Sum Circular Subarray (LC 918), Best Time to Buy and Sell Stock (LC 121), Maximum Absolute Sum of Any Subarray (LC 1749).

## Key takeaways

- At each index, either extend the best run ending at the previous index or start fresh: `cur = max(x, cur + x)`.
- The state is "best subarray ending *here*"; the answer is the maximum over all positions.
- It's DP compressed to O(1) space: O(n) time, two variables.
- For products, track the minimum as well, because a negative flips the order.
- Circular maximum = max(plain Kadane, total − minimum subarray), unless every element is negative.

## Knowledge check

```quiz
? What does `currMax` hold after processing index i in Kadane's algorithm?
+ The largest sum of a subarray that ends exactly at index i
- The largest sum of any subarray within the first i + 1 elements
! That's globalMax; currMax must end at i for the recurrence to work.
- The sum of all elements up to i
! That's a prefix sum.
- The largest single element seen so far
! currMax can be the sum of a long run.
> "Ending exactly here" is what lets dp[i] be built from dp[i − 1].

? `nums = [-3, -1, -2]`. A version that starts with `currMax = globalMax = 0` returns what, and what is correct?
+ It returns 0, but the answer is −1, because the subarray can't be empty
- It returns −1, which is correct
! Starting from 0 lets the empty subarray win.
- It returns −6, which is correct
! −6 is the whole array, not the best subarray.
- It throws an exception
! Nothing in the loop can throw.
> Initialise from nums[0] so that an all-negative array still returns its largest element.

? Why does Maximum Product Subarray track a running minimum?
+ Multiplying the most negative product by a negative number can produce the new maximum
- To detect zeros in the array
! Zeros are handled by the restart candidate.
- To keep the product from overflowing
! Tracking the minimum doesn't prevent overflow.
- The minimum is the answer when every number is negative
! The answer is still a maximum; e.g. [−2, −3] gives 6.
> Multiplication isn't monotonic: the worst so far can flip into the best one step later.

? How does the circular version find a best subarray that wraps around the end?
+ As the total sum minus the minimum subarray sum
- By running Kadane on the array concatenated with itself
! That allows subarrays longer than n, which use some elements twice.
- By running Kadane starting from every index
! That's O(n²) and unnecessary.
- By sorting the array first
! Sorting destroys the order the subarray depends on.
> A wrapping subarray is everything except one contiguous middle part.
```
