## The idea

**The most important binary-search variant at medium and hard level.** You're not searching an array at all: you're searching a **range of possible answers**. When the problem asks for the minimum (or maximum) value of something, and checking whether a *given* value works is easy, binary search for the boundary where the check starts passing.

## When to use it

The recognition signal is almost always one of these shapes:
- **"Minimise the maximum X"**, such as the largest sum of a part, or the heaviest day;
- **"Maximise the minimum X"**, such as the smallest gap between chosen points;
- **"Find the smallest/largest value such that [some condition] holds"**.

The moment you see that shape, ask: *is the feasibility of a candidate answer monotonic?* If yes, binary search on it. Constraints like n ≤ 10⁵ with values up to 10⁹ are a strong hint: O(n log 10⁹) is about 30 linear passes.

## How it works

The recipe:
1. **Range:** the smallest and largest possible answers. Use real bounds, not `[0, Integer.MAX_VALUE]`.
2. **Check:** a function `feasible(x)`, usually a greedy O(n) pass.
3. **Monotonic?** If `x` works, does every bigger `x` work too? Then search for the first `true` (for a minimum). For a maximum, search for the first `false` and subtract one.

**Why the greedy checks are optimal:** for "ship within D days", putting each package on the current day whenever it fits never hurts; delaying a package can only increase the number of days needed. Say that sentence: interviewers want the justification, not just the code.

## Java template

Minimising the feasible value, with the [predicate search](lesson:binary-search-on-predicates) written out:

```java
long lo = minPossibleAnswer, hi = maxPossibleAnswer;
while (lo < hi) {
    long mid = lo + (hi - lo) / 2;
    if (isFeasible(mid)) hi = mid;        // mid works: try to do even better
    else lo = mid + 1;                     // mid doesn't work: need a bigger value
}
return lo;
```

The examples below call `firstTrue(lo, hi, check)` from [binary search on a predicate](lesson:binary-search-on-predicates), which is this loop.

## Worked examples

### Koko Eating Bananas (LC 875)

The smallest eating speed that finishes all the piles within `h` hours.

```java
// LC 875 Koko Eating Bananas: the smallest speed that finishes within h hours.
public int minEatingSpeed(int[] piles, int h) {
    int max = Arrays.stream(piles).max().getAsInt();
    return (int) firstTrue(1, max, k -> hoursNeeded(piles, k) <= h);   // faster is never worse
}

private long hoursNeeded(int[] piles, long k) {
    long hours = 0;
    for (int p : piles) hours += (p + k - 1) / k;      // ceil(p / k) without floating point
    return hours;
}
```

### Capacity to Ship Packages Within D Days (LC 1011)

```java
// LC 1011: the least ship capacity that ships every package, in order, within 'days'.
public int shipWithinDays(int[] weights, int days) {
    long lo = Arrays.stream(weights).max().getAsInt();       // it must carry the heaviest package
    long hi = Arrays.stream(weights).asLongStream().sum();   // everything in one day
    return (int) firstTrue(lo, hi, cap -> daysNeeded(weights, cap) <= days);
}

private int daysNeeded(int[] weights, long capacity) {   // greedy: fill each day as far as possible
    int needed = 1;
    long load = 0;
    for (int w : weights) {
        if (load + w > capacity) {
            needed++;
            load = 0;
        }
        load += w;
    }
    return needed;
}
```

### Magnetic Force Between Two Balls (LC 1552): maximise the minimum

Place `m` balls to **maximise** the minimum distance between any two. "Gap d is achievable" is true for small gaps and false for large ones, so find the first gap that fails and subtract one:

```java
// LC 1552: place m balls to MAXIMISE the minimum distance: the last value where the check passes.
public int maxDistance(int[] position, int m) {
    int[] pos = position.clone();
    Arrays.sort(pos);
    long span = pos[pos.length - 1] - pos[0];
    long firstFail = firstTrue(1, span + 1, d -> !canPlace(pos, m, d));
    return (int) (firstFail - 1);                           // the largest distance that still works
}

// greedy: place each ball as early as allowed
private boolean canPlace(int[] pos, int m, long minGap) {
    int placed = 1;
    long last = pos[0];
    for (int i = 1; i < pos.length && placed < m; i++) {
        if (pos[i] - last >= minGap) {
            placed++;
            last = pos[i];
        }
    }
    return placed >= m;
}
```

## Complexity

O(n · log(range)): about log₂(range) checks, each an O(n) greedy pass. With a range of 10⁹ that's roughly 30 passes. Sorting first (as in LC 1552) adds O(n log n).

## Variations

### Split Array Largest Sum (LC 410)

Exactly the same check as shipping packages, with k pieces:

```java
// LC 410 Split Array Largest Sum: exactly the same check with k pieces.
public int splitArray(int[] nums, int k) {
    long lo = Arrays.stream(nums).max().getAsInt();
    long hi = Arrays.stream(nums).asLongStream().sum();
    return (int) firstTrue(lo, hi, cap -> daysNeeded(nums, cap) <= k);
}
```

### The family

| Problem | Answer range | Feasibility check (greedy) |
|---|---|---|
| Koko (875) | speed `[1, max pile]` | hours = Σ ⌈pile / k⌉ ≤ h |
| Ship packages (1011) | capacity `[max weight, total]` | fill each day greedily; days ≤ D |
| Split array (410) | largest sum `[max, total]` | the same greedy; pieces ≤ k |
| Magnetic balls (1552) | min gap `[1, span]` | place greedily from the left; count ≥ m (find the *last* true) |
| Bouquets (1482) | day `[min, max]` | count runs of bloomed flowers |
| Smallest divisor (1283) | divisor `[1, max]` | Σ ⌈x / d⌉ ≤ threshold |

**Counting instead of a greedy check:** the k-th smallest element of a sorted matrix, or of a multiplication table (LC 668), binary searches on the value and *counts* how many entries are ≤ it: see [binary search in matrices](lesson:binary-search-in-matrices).

**Real-valued answers:** Minimize Max Distance to Gas Station (LC 774) searches over doubles; use a fixed number of halvings, not an epsilon loop.

## Common mistakes

- **Not proving monotonicity** before searching; a non-monotonic check makes the result meaningless.
- **A loose or wrong range**, such as a lower bound below the largest single item in Ship Packages, where no capacity below it can ever work.
- **`int` overflow in the check**: sums of weights and hour counts need `long`.
- **Finding the first true when the question wants the last** (maximise the minimum); search for the first false and subtract one.
- **Floating-point ceilings** such as `Math.ceil(p / k)` with integer division; use `(p + k − 1) / k`.

## Practice

Koko Eating Bananas (LC 875), Capacity To Ship Packages Within D Days (LC 1011), Find the Smallest Divisor Given a Threshold (LC 1283), Minimum Number of Days to Make m Bouquets (LC 1482), Magnetic Force Between Two Balls (LC 1552), Split Array Largest Sum (LC 410), Minimize Max Distance to Gas Station (LC 774), Find K-th Smallest Pair Distance (LC 719).

## Key takeaways

- "Minimise the maximum" or "maximise the minimum" with an easy yes/no check means binary search on the answer.
- Three parts: a real range, a feasibility check (usually a greedy O(n) pass), and a proof that it's monotonic.
- Minimum: first value that passes. Maximum: first value that fails, minus one.
- O(n · log(range)): about 30 linear passes for a range of 10⁹.
- Use `long` in checks, and justify the greedy check out loud.

## Knowledge check

```quiz
? Koko Eating Bananas: why can you binary search on the eating speed?
+ If speed k finishes in time, every faster speed also does, so feasibility is monotonic in k
- Because the piles are sorted
! The piles needn't be sorted.
- Because the answer is always the largest pile
! The answer can be much smaller.
- Because hours needed is a linear function of k
! It's monotonic, not linear; monotonic is what matters.
> Monotonic feasibility is the one requirement.

? In Ship Packages, why is the lower bound of the search the heaviest single package?
+ Any smaller capacity can't carry that package at all, so no smaller answer is feasible
- Because the average weight is too small
! The average isn't a bound on anything here.
- To make the loop terminate
! Any finite range terminates.
- Because the answer is always the heaviest package
! The answer is often larger.
> The upper bound is the total weight: everything shipped in one day.

? Magnetic balls: the question asks for the MAXIMUM minimum gap. How do you search for it?
+ Find the first gap that fails, then subtract one, because gaps that work form a prefix
- Find the first gap that works
! Every small gap works, so that would return 1.
- Binary search on the number of balls
! The number of balls is fixed.
- Use the largest gap between adjacent positions
! That ignores how many balls must be placed.
> Maximising flips the predicate: true … true, false … false.

? Why does the greedy `daysNeeded` check give the true minimum number of days for a capacity?
+ Filling the current day as far as possible never hurts; moving a package later can only add days
- Because the packages are sorted
! Packages must ship in their given order, unsorted.
- Because it tries every split
! It makes one pass; that's the point of the greedy.
- It doesn't; it can overestimate
! The exchange argument shows greedy is optimal here.
> State this justification; the code alone isn't enough.
```
