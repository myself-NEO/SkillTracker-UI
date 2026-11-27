## The idea

Abstract the [lower-bound template](lesson:binary-search-template) once more: search for the **first `x` where a monotonic predicate becomes true**. Binary search doesn't need a sorted *array*; it needs a yes/no question whose answers switch from false to true exactly once, or at least a way to tell **which side is guaranteed to contain an answer**.

## When to use it

- A **yes/no check on a candidate value** that's monotonic: "is version x bad?", "is r² > x?", "can it be done with capacity c?".
- **Peaks and unimodal arrays**: the slope tells you which side holds a peak.
- **Roots**, integer or real, without `Math.sqrt`.
- The rest of this module is the same function with different predicates: [rotated arrays](lesson:rotated-sorted-arrays), [the answer itself](lesson:binary-search-on-the-answer), and [matrices](lesson:binary-search-in-matrices).

## How it works

- The predicate's values look like `false false … false true true … true`; the search finds the boundary in O(log(range)) predicate calls.
- **The last `true`** of a `true … true false … false` predicate is the first `true` of its negation, minus one.
- Use `long` everywhere: answer ranges like `[1, 10⁹]` and sums of weights overflow `int` fast.
- **The hard part isn't the loop; it's proving the predicate is monotonic.** Say it out loud: "if speed k works, any faster speed also works".

## Java template

```java
// The general form: the smallest x in [lo, hi] with ok(x) == true, for a predicate shaped like
// false false ... false true true ... true. Returns hi + 1 if ok is never true.
public long firstTrue(long lo, long hi, LongPredicate ok) {
    long left = lo, right = hi + 1;          // search [left, right); right means "none found yet"
    while (left < right) {
        long mid = left + (right - left) / 2;
        if (ok.test(mid)) right = mid;       // mid works: the first true is mid or before it
        else left = mid + 1;                 // mid fails: the first true is after it
    }
    return left;
}
```

## Worked examples

### Find Peak Element (LC 162)

Binary search works without a sorted array: you only need to know which side is guaranteed to contain an answer.

```java
// LC 162: any index whose value is bigger than both neighbours (outside the array = -infinity).
public int findPeakElement(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;   // uphill to the right: a peak exists there
        // downhill: mid or something left of it is a peak
        else hi = mid;
    }
    return lo;
}
```

**Why it's correct:** if `nums[mid] < nums[mid + 1]`, walking right from `mid` goes uphill. Since the array ends at `-∞`, the climb must turn into a peak somewhere to the right. The same reasoning finds the top of a mountain array (LC 852).

### Sqrt(x) (LC 69): an integer root

```java
// LC 69: floor(sqrt(x)) with integers only: the first r whose square exceeds x, minus one.
public int mySqrt(int x) {
    long first = firstTrue(0, (long) x + 1, r -> r * r > x);
    return (int) (first - 1);
}
```

Search for the first `r` with `r² > x` using `long` arithmetic (`r * r` overflows `int` from about 46,341). Avoid `Math.sqrt` in interviews unless it's allowed: floating point also has edge cases near perfect squares.

## Complexity

O(log(range)) calls to the predicate, so O(log(range) × cost of one check). For an index search that's O(log n); for an answer range of 10⁹ it's about 30 checks.

## Variations

### Real-valued search

```java
// On doubles, don't loop "until equal": run a fixed number of halvings instead.
public double cubeRoot(double x) {
    double lo = Math.min(-1, x), hi = Math.max(1, x);     // the root lies in here, even for |x| < 1
    for (int iter = 0; iter < 100; iter++) {             // 100 halvings: far below double precision
        double mid = (lo + hi) / 2;
        if (mid * mid * mid < x) lo = mid;
        else hi = mid;
    }
    return (lo + hi) / 2;
}
```

**Never loop `while (hi - lo > eps)` with an absolute epsilon.** On large values it can spin forever, because doubles can't represent the midpoint. A fixed number of iterations (about 60–100) always terminates, and each halving gains one bit of precision.

### More predicate searches

- **First Bad Version (LC 278):** the predicate is given to you as an API call; the work is not calling it more than O(log n) times.
- **Peak Index in a Mountain Array (LC 852)** and **Find in Mountain Array (LC 1095):** find the peak by slope, then binary search each side, the second one in descending order.
- **Unimodal functions with plateaus:** use ternary search, or binary search on the slope.

## Common mistakes

- **A predicate that isn't monotonic**, which makes the result meaningless; prove it before you search.
- **`int` overflow inside the predicate**, as in `r * r`; use `long`.
- **An epsilon loop on doubles**, which may never terminate; use a fixed iteration count.
- **Misreading `hi + 1`**: `firstTrue` returns one past the range when the predicate is never true.
- **Reading `nums[mid + 1]` when `mid` can be the last index**; the peak loop keeps `mid < hi`, so it's safe there.

## Practice

First Bad Version (LC 278), Sqrt(x) (LC 69), Valid Perfect Square (LC 367), Find Peak Element (LC 162), Peak Index in a Mountain Array (LC 852), Find in Mountain Array (LC 1095).

## Key takeaways

- Binary search needs a monotonic yes/no question, not a sorted array.
- `firstTrue` finds the first `x` where the predicate holds; the last true is first-false minus one.
- Prove monotonicity out loud before you search.
- Use `long` for ranges and products, and a fixed number of halvings for real numbers.
- For peaks, follow the uphill side: the boundary at −∞ guarantees a peak there.

## Knowledge check

```quiz
? Find Peak Element: `nums[mid] < nums[mid + 1]`. Why is it safe to discard everything up to mid?
+ Going uphill to the right, and with −∞ past the end, a peak must exist to the right of mid
- Because the array is sorted
! It isn't sorted.
- Because mid is the global maximum
! mid has a larger neighbour, so it's not a peak.
- It isn't safe; you must search both sides
! One side is guaranteed to hold a peak, so one is enough.
> Any peak will do, which is what makes the slope a valid predicate.

? Why does mySqrt compute `r * r` in a `long`?
+ For r above about 46,341, r² overflows an int and gives a wrong comparison
- Because `long` multiplication is faster
! Speed isn't the reason.
- Because the answer can exceed the int range
! √x fits easily; the intermediate square doesn't.
- To avoid floating point
! Integers avoid floating point either way.
> Overflow inside a predicate silently breaks its monotonicity.

? Why run a fixed number of iterations instead of looping while `hi − lo > 1e-9`?
+ For large values, doubles can't represent a midpoint that small, so the gap may never shrink and the loop never ends
- Because a fixed count is more precise
! Both reach full precision when they end; one may not end.
- Because epsilon comparisons are slow
! Speed isn't the problem.
- Because binary search can't use doubles
! It can, with a bounded number of halvings.
> Each halving gains one bit; about 100 iterations always suffice.

? A predicate is `true true true false false`. How do you find the last true with `firstTrue`?
+ Search for the first index where the predicate is false, and subtract one
- Call firstTrue directly
! It finds the first true, which is index 0.
- Reverse the array first
! Negating the predicate is all that's needed.
- It can't be done with binary search
! The negation is monotonic false → true.
> That's how "maximise the minimum" problems are solved.
```
