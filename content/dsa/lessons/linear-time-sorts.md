## The idea

When values are integers in a known range, you can sort **without comparisons**: count how often each value occurs, distribute by digits, or drop values into buckets by range. The n log n lower bound only applies to algorithms that compare, so these can be linear.

## When to use it

- **Counting sort:** the value range k is small compared with n (ages, grades, characters, frequencies bounded by n).
- **Radix sort:** fixed-width integers or strings, where a few passes over the digits beat n log n.
- **Bucket sort / pigeonhole:** values spread over a range, or a question about gaps between neighbours in sorted order.
- Any "frequency ≤ n" problem, where the frequencies can index an array directly.

## How it works

- **Counting sort** tallies each value in an array indexed by value, then reads the tally back in order. To make it **stable** (needed inside radix sort), turn the counts into starting positions with a prefix sum, then place each element at its value's next free position.
- **Radix sort (LSD)** sorts by the least significant digit first, then the next, and so on, using a **stable** counting sort for each digit. Stability is what makes the earlier passes survive the later ones: after the last pass, numbers are ordered by their top digit, and ties keep the order of the lower digits.
- **Bucket sort** splits the value range into buckets, puts each value in its bucket, and sorts or inspects each bucket on its own.

## Java template

```java
// Counting sort. Values in [0, maxValue]: O(n + maxValue), no comparisons at all.
public int[] countingSort(int[] a, int maxValue) {
    int[] count = new int[maxValue + 1];
    for (int x : a) count[x]++;
    int[] out = new int[a.length];
    int k = 0;
    for (int v = 0; v <= maxValue; v++) {
        for (int c = 0; c < count[v]; c++) out[k++] = v;
    }
    return out;
}
```

## Worked examples

### Radix sort for any `int`

With base 256, 32-bit ints take 4 passes: O(4(n + 256)), linear in n.

```java
// LSD radix sort for any ints: 4 stable counting passes, one per byte. O(4 * (n + 256)).
public void radixSort(int[] a) {
    int[] buf = new int[a.length];
    for (int shift = 0; shift < 32; shift += 8) {
        int[] start = new int[257];
        for (int x : a) start[byteAt(x, shift) + 1]++;
        // start[d] = first slot for digit d
        for (int d = 0; d < 256; d++) start[d + 1] += start[d];
        // stable: keeps the previous pass's order
        for (int x : a) buf[start[byteAt(x, shift)]++] = x;
        System.arraycopy(buf, 0, a, 0, a.length);
    }
}

private int byteAt(int x, int shift) {
    // flipping the sign bit sorts negatives first
    return ((x ^ Integer.MIN_VALUE) >>> shift) & 0xFF;
}
```

**Why flip the sign bit:** in two's complement, negatives have the top bit set, so sorted as unsigned bytes they'd come *after* the positives. XOR-ing with `Integer.MIN_VALUE` maps signed order onto unsigned order.

### Maximum Gap (LC 164): buckets

The largest gap between neighbours in sorted order, in O(n):

```java
// LC 164: the largest gap between neighbours in sorted order, in O(n) with buckets.
public int maximumGap(int[] nums) {
    int n = nums.length;
    if (n < 2) return 0;
    int min = Arrays.stream(nums).min().getAsInt(), max = Arrays.stream(nums).max().getAsInt();
    if (min == max) return 0;
    int size = Math.max(1, (max - min) / (n - 1));   // the answer is at least this, so it never
    // lies inside one bucket: only bucket edges matter
    int buckets = (max - min) / size + 1;
    int[] lo = new int[buckets], hi = new int[buckets];
    Arrays.fill(lo, Integer.MAX_VALUE);
    Arrays.fill(hi, Integer.MIN_VALUE);
    for (int x : nums) {
        int b = (x - min) / size;
        lo[b] = Math.min(lo[b], x);
        hi[b] = Math.max(hi[b], x);
    }
    int best = 0, prevMax = min;
    for (int b = 0; b < buckets; b++) {
        if (lo[b] == Integer.MAX_VALUE) continue;    // empty bucket
        best = Math.max(best, lo[b] - prevMax);      // the gap from the previous non-empty bucket
        prevMax = hi[b];
    }
    return best;
}
```

**Why only bucket edges matter:** n values in `[min, max]` have n − 1 gaps summing to `max − min`, so the largest gap is at least `(max − min) / (n − 1)`. With buckets of that width, two values in the same bucket are closer than the answer, so the answer always lies between the maximum of one non-empty bucket and the minimum of the next.

## Complexity

| Sort | Time | Extra space | Stable? |
|---|---|---|---|
| Counting sort, values in [0, k] | O(n + k) | O(n + k) | yes, in the positional version |
| Radix sort, d digits in base b | O(d · (n + b)) | O(n + b) | yes |
| Bucket sort, evenly spread values | O(n) expected | O(n) | depends on the per-bucket sort |

## Variations

- **Buckets indexed by frequency.** Frequencies are at most n, so Top K Frequent Elements and Sort Characters By Frequency can bucket by frequency in O(n): see [top-k and two heaps](lesson:top-k-and-two-heaps).
- **Counting with a cap.** H-Index caps citation counts at n before counting: see [sorting as preprocessing](lesson:sorting-as-preprocessing).
- **Counting with an offset.** For values in `[min, max]`, index the count array by `x − min`.
- **Relative Sort Array (LC 1122):** count the values, then emit them in the order the second array gives, followed by the rest in ascending order.

## Common mistakes

- **Counting sort over a huge range**, such as values up to 10⁹: the count array is the problem. Use a comparison sort or radix sort instead.
- **Negative values** indexing the count array; shift by the minimum, or flip the sign bit in radix sort.
- **An unstable digit sort** inside radix sort, which scrambles the earlier passes.
- **A zero bucket width** when the range is smaller than n − 1; clamp it to at least 1.
- **Forgetting empty buckets** when scanning for gaps.

## Practice

Sort an Array (LC 912), Relative Sort Array (LC 1122), Maximum Gap (LC 164), Sort Characters By Frequency (LC 451), H-Index (LC 274), Top K Frequent Elements (LC 347).

## Key takeaways

- Comparison sorts are bounded by n log n; counting, radix and bucket sorts avoid it by not comparing.
- Counting sort is O(n + k) for values in a range of size k; it's only a win when k is small.
- Radix sort needs a stable sort for each digit, least significant first.
- Flip the sign bit to sort negative integers with unsigned digit passes.
- Buckets of width (max − min) / (n − 1) put the maximum gap between buckets, never inside one.

## Knowledge check

```quiz
? Why can counting sort run in O(n + k) when comparison sorts need Ω(n log n)?
+ It never compares elements; it uses each value as an array index
- Because it uses a better pivot
! There's no pivot in counting sort.
- Because the input is already partly sorted
! It works on any input in the range.
- It can't; the lower bound applies to every sort
! The bound applies only to comparison sorts.
> The cost moves to the range k instead.

? Why must radix sort use a stable sort for each digit?
+ So ties on the current digit keep the order produced by the earlier, less significant digits
- To make each pass faster
! Stability doesn't change the speed.
- Because counting sort is always unstable
! The positional version of counting sort is stable.
- It doesn't need to
! An unstable pass would scramble the lower digits.
> After the last pass, numbers are ordered by all digits at once.

? In the radix sort, why is each value XOR-ed with Integer.MIN_VALUE?
+ To flip the sign bit, so negative numbers sort before positive ones as unsigned bytes
- To make all values positive by subtracting MIN_VALUE
! XOR flips one bit; it's not a subtraction.
- To avoid overflow
! No arithmetic overflows here.
- To reverse the sort order
! Only negatives versus positives change places.
> Two's-complement negatives have the top bit set.

? In Maximum Gap, why can the answer never lie inside a single bucket?
+ The bucket width is at most the smallest possible maximum gap, so two values in one bucket are closer than the answer
- Because each bucket holds at most one value
! A bucket can hold several values.
- Because the buckets are sorted
! Only their minimums and maximums are tracked.
- Because empty buckets are skipped
! Skipping empty buckets is a consequence, not the reason.
> So only the gaps between neighbouring non-empty buckets matter.
```
