## The idea

- **Weighted choice:** lay the weights end to end, draw a uniform number in `[0, total)`, and find which weight's stretch it lands in. With prefix sums, that's a [binary search](lesson:binary-search-template).
- **Rejection sampling:** draw from a bigger uniform space, throw away what doesn't fit, and try again. What's left is uniform, because every accepted outcome was equally likely.
- **O(1) random access:** a set that supports insert, delete *and* a uniformly random element keeps its values in an array, and a map from each value to its position.

## When to use it

- "Pick index i with probability proportional to w[i]": prefix sums plus binary search.
- "Build one random source from another" (rand10 from rand7), "a uniform random point inside a shape": rejection sampling.
- "Insert, delete and getRandom, each in O(1)": a list plus a map.

## How it works

```text
w         1    3      6         10            total = 20
prefix    1    4     10         20
target    0 | 1-3 | 4-9  |    10-19           -> index 0 | 1 | 2 | 3
```

- **Weighted choice:** draw `target` uniformly from `[0, total)`. The answer is the first prefix sum greater than it: a lower-bound search. Index i owns exactly `w[i]` of the `total` possible targets.
- **Rejection sampling:** if an attempt succeeds with probability p, it takes 1/p attempts on average. Keep p high by choosing a tight outer space.
- **Las Vegas vs Monte Carlo:** a Las Vegas algorithm is always right but its running time is random (rejection sampling, randomized quicksort). A Monte Carlo algorithm has a fixed running time but is only *probably* right (Miller–Rabin, comparing strings by hash, estimating π).

## Java template

```java
// The first index whose prefix sum is greater than target, for a target uniform in [0, total).
int pick(int[] prefix, Random rng) {
    int target = rng.nextInt(prefix[prefix.length - 1]);
    int lo = 0, hi = prefix.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (prefix[mid] > target) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
```

## Worked examples

### Random Pick with Weight (LC 528)

```java
// LC 528 Random Pick with Weight: index i with
// probability w[i] / sum(w). Prefix sums + binary search.
class WeightedPicker {
    private final int[] prefix;           // prefix[i] = w[0] + ... + w[i] (LC: the sum fits an int)
    private final Random rng = new Random();

    public WeightedPicker(int[] w) {
        prefix = new int[w.length];
        int sum = 0;
        for (int i = 0; i < w.length; i++) {
            sum += w[i];
            prefix[i] = sum;
        }
    }

    public int pickIndex() {
        int target = rng.nextInt(prefix[prefix.length - 1]);  // uniform in [0, total)
        int lo = 0, hi = prefix.length - 1;                   // the first i with prefix[i] > target
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (prefix[mid] > target) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
```

If the total can exceed an `int`, use `long` prefix sums and `rng.nextLong(bound)` (Java 17+).

### Implement Rand10() Using Rand7() (LC 470)

```java
// LC 470 Implement Rand10() Using Rand7(): rejection sampling. rand7() is given by the problem.
class Rand10 {
    public int rand10() {
        while (true) {
            int n = (rand7() - 1) * 7 + rand7();    // uniform on 1..49
            if (n <= 40) return (n - 1) % 10 + 1;   // 1..40 maps 4-to-1 onto 1..10; retry on 41..49
        }
    }
}
```

Each attempt uses two rand7 calls and succeeds with probability 40/49, so it takes 2 · 49/40 = 2.45 calls on average. **`rand7() + rand7()` is not uniform**: sums of two dice pile up in the middle.

### Generate Random Point in a Circle (LC 478)

```java
// LC 478 Generate Random Point in a Circle: sample the
// bounding square, keep the points inside the circle.
class CirclePoint {
    private final double radius, cx, cy;
    private final Random rng = new Random();

    public CirclePoint(double radius, double xCenter, double yCenter) {
        this.radius = radius;
        this.cx = xCenter;
        this.cy = yCenter;
    }

    public double[] randPoint() {
        while (true) {                               // accepted with probability pi/4, about 0.785
            double dx = (2 * rng.nextDouble() - 1) * radius;
            double dy = (2 * rng.nextDouble() - 1) * radius;
            if (dx * dx + dy * dy <= radius * radius) return new double[] { cx + dx, cy + dy };
        }
    }
}
```

**The polar trap:** picking a random angle and the radius `R · rand()` crowds points near the center, because the area within radius r grows like r². The correct radius is `R · sqrt(rand())`: then half the points fall within R/√2, which holds half the area.

### Insert Delete GetRandom O(1) (LC 380)

An `ArrayList` gives O(1) random access, and a `HashMap` gives O(1) lookup of an element's position. To delete from the middle of the list in O(1), move the last element into the hole.

```java
// LC 380 Insert Delete GetRandom O(1): a list for random
// access plus a map from each value to its index.
class RandomizedSet {
    private final List<Integer> values = new ArrayList<>();
    private final Map<Integer, Integer> indexOf = new HashMap<>();
    private final Random rng = new Random();

    public boolean insert(int val) {
        if (indexOf.containsKey(val)) return false;
        indexOf.put(val, values.size());
        values.add(val);
        return true;
    }

    public boolean remove(int val) {
        Integer i = indexOf.remove(val);
        if (i == null) return false;
        int last = values.remove(values.size() - 1);     // removing from the END of a list is O(1)
        // val wasn't last: move the last value into its slot
        if (i < values.size()) {
            values.set(i, last);
            indexOf.put(last, i);
        }
        return true;
    }

    public int getRandom() {
        return values.get(rng.nextInt(values.size()));
    }
}
```

## Complexity

| Technique | Setup | Per draw or operation |
|---|---|---|
| Weighted choice | O(n) prefix sums | O(log n) |
| Rejection sampling | — | 1/p attempts on average, for acceptance probability p |
| Insert Delete GetRandom | — | O(1) average for each operation |

## Variations

- **The alias method** (Vose) picks a weighted index in O(1) after O(n) setup. Name it if you're asked for faster picks.
- **Random Point in Non-overlapping Rectangles (LC 497):** weight each rectangle by the number of integer points it contains, pick one by weight, then pick a point inside it uniformly.
- **Random Pick with Blacklist (LC 710):** draw from the n − b allowed slots, and remap the blacklisted numbers among them to allowed numbers above that range.
- **Duplicates (LC 381):** map each value to a *set* of indexes.
- **Randomness elsewhere:** a random pivot defeats adversarial inputs in [quicksort and quickselect](lesson:quicksort-and-quickselect), and a random base makes [rolling-hash](lesson:rabin-karp) collisions unlikely.

## Common mistakes

- **`rand7() + rand7()`** as a "bigger" uniform source: sums aren't uniform.
- **A uniform radius** for random points in a circle, which crowds the center.
- **`int` prefix sums** that overflow when the weights are large.
- **The wrong comparison in the search:** the answer is the first prefix sum strictly greater than the target.
- **Removing from the middle of an `ArrayList`** in LC 380, which is O(n): swap with the last element first.

## Practice

Random Pick with Weight (LC 528), Implement Rand10() Using Rand7() (LC 470), Generate Random Point in a Circle (LC 478), Insert Delete GetRandom O(1) (LC 380), Insert Delete GetRandom O(1) - Duplicates allowed (LC 381), Random Point in Non-overlapping Rectangles (LC 497), Random Pick with Blacklist (LC 710).

## Key takeaways

- Weighted choice: prefix sums, a uniform target in `[0, total)`, then the first prefix sum greater than it.
- Rejection sampling: draw from a bigger uniform space and retry on misses; it costs 1/p attempts on average.
- For a random point in a circle, the radius is `R · sqrt(rand())`, or reject points from the bounding square.
- O(1) insert, delete and getRandom: a list plus a map, deleting by moving the last element into the hole.
- Rejection sampling is Las Vegas (always right); hashing and Miller–Rabin are Monte Carlo (probably right).

## Knowledge check

```quiz
? With weights [1, 3, 6, 10], what's the probability of picking index 2?
+ 0.3: it owns 6 of the 20 possible targets
- 0.25
! That treats the indexes as equally likely.
- 0.6
! That's 6 out of 10, not out of the total of 20.
- 0.5
! Index 3 is the most likely, with 0.5.
> Each index owns exactly w[i] targets.

? In rand10 from rand7, why are the values 41 to 49 rejected?
+ 49 outcomes don't split evenly into 10; keeping 40 gives each digit exactly 4
- Because rand7 can't produce them
! They come out of the 1..49 construction.
- To make it faster
! Rejection makes it slightly slower; it's needed for uniformity.
- They're kept and mapped with % 10
! That would favour 1 to 9.
> On average 2.45 calls to rand7.

? To pick a uniform random point in a circle using polar coordinates, what should the radius be?
+ R · sqrt(u), for u uniform in [0, 1)
- R · u
! That crowds points near the center.
- R · u²
! That crowds them even more.
- R
! That only picks points on the circle's edge.
> The area within radius r grows like r².

? How does Insert Delete GetRandom remove a value in O(1)?
+ It moves the last element into the removed value's slot, updates that element's index, and removes from the end
- It removes the value from the middle of the list
! ArrayList removal from the middle is O(n).
- It marks the slot as deleted
! Then getRandom could pick a deleted slot.
- It rebuilds the list
! That's O(n).
> The map makes finding the slot O(1).
```
