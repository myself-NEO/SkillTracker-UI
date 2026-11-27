## The idea

- **Fisher–Yates shuffle:** fill the positions from the end. Position i receives a uniformly random element from those not yet placed, which is the same as swapping `a[i]` with a random `a[j]`, `0 ≤ j ≤ i`. Every one of the n! orders is equally likely.
- **Reservoir sampling:** to pick k items uniformly from a stream of unknown length in one pass, keep the first k, then keep the i-th item with probability k/i, in place of a random slot.

## When to use it

- "Shuffle", "a random permutation", "every permutation equally likely": Fisher–Yates.
- "A random k-subset": Fisher–Yates stopped after k steps.
- "Pick random items from a stream, or a linked list, of *unknown* length, with O(k) memory": reservoir sampling (Linked List Random Node, LC 382; Random Pick Index, LC 398).

## How it works

- **Why Fisher–Yates is uniform:** the last position receives each of the n elements with probability 1/n, the next one each of the remaining n − 1 with probability 1/(n − 1), and so on: every order has probability 1/n!.
- **Why reservoir sampling is uniform (k = 1):** item i is chosen when it arrives with probability 1/i, and survives each later item j with probability 1 − 1/j. The product telescopes:

```text
item           1      2      3      4
keep prob      1     1/2    1/3    1/4
P(item 1 is the final pick) = 1 * (1/2) * (2/3) * (3/4) = 1/4
P(item 3 is the final pick) =             (1/3) * (3/4) = 1/4
```

### Java's random toolbox

| API | Use it for |
|---|---|
| `new Random()`, `new Random(seed)` | general use; a fixed seed makes runs reproducible (tests) |
| `ThreadLocalRandom.current()` | multithreaded code: no contention between threads |
| `SecureRandom` | tokens, passwords, anything security-related |
| `Math.random()` | a quick double in [0, 1) |
| `Collections.shuffle(list)` | Fisher–Yates on a list |

- `rng.nextInt(n)` is uniform on `[0, n)`. **`Math.abs(rng.nextInt()) % n` is wrong twice:** it's biased when n doesn't divide 2³², and `Math.abs(Integer.MIN_VALUE)` is negative.
- Pass a `Random` in (or seed it) when you need to test randomized code.

## Java template

```java
// Fisher-Yates: position i takes a uniformly random element of a[0..i].
for (int i = a.length - 1; i > 0; i--) {
    int j = rng.nextInt(i + 1);              // uniform in [0, i], i itself included
    int t = a[i];
    a[i] = a[j];
    a[j] = t;
}
```

## Worked examples

### Shuffle an Array (LC 384), and the biased version

```java
// LC 384 Shuffle an Array: Fisher-Yates. Every one
// of the n! orders comes out with probability 1/n!.
class ShuffleArray {
    private final int[] original;
    private final Random rng = new Random();

    public ShuffleArray(int[] nums) {
        original = nums.clone();
    }

    public int[] reset() {
        return original.clone();
    }

    public int[] shuffle() {
        int[] a = original.clone();
        for (int i = a.length - 1; i > 0; i--) {
            int j = rng.nextInt(i + 1);              // uniform in [0, i], i itself included
            int t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
        return a;
    }

    // WRONG: swapping with ANY index gives n^n equally
    // likely runs, and n! doesn't divide n^n evenly.
    public int[] biasedShuffle() {
        int[] a = original.clone();
        for (int i = 0; i < a.length; i++) {
            int j = rng.nextInt(a.length);
            int t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
        return a;
    }
}
```

**Why the naive version is biased:** it makes n independent choices of n options, so nⁿ equally likely runs. For n = 3 that's 27 runs spread over 6 orders, and 27 isn't divisible by 6, so some orders must come up more often (5/27 against 4/27).

### Reservoir sampling

```java
// Reservoir sampling: k items chosen uniformly from a stream of unknown length, in O(k) memory.
static int[] sample(Iterator<Integer> stream, int k, Random rng) {
    int[] reservoir = new int[k];
    int seen = 0;
    while (stream.hasNext()) {
        int x = stream.next();
        seen++;
        if (seen <= k) {
            reservoir[seen - 1] = x;                 // the first k items fill the reservoir
        } else {
            int j = rng.nextInt(seen);               // keep x with probability k / seen ...
            if (j < k) reservoir[j] = x;             // ... in place of a uniformly random slot
        }
    }
    return seen < k ? Arrays.copyOf(reservoir, seen) : reservoir;
}
```

### Random Pick Index (LC 398)

```java
// LC 398 Random Pick Index: a uniformly random index of target, with O(1) extra memory (k = 1).
class RandomPickIndex {
    private final int[] nums;
    private final Random rng = new Random();

    public RandomPickIndex(int[] nums) {
        this.nums = nums;
    }

    public int pick(int target) {
        int chosen = -1, count = 0;
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] != target) continue;
            count++;
            // replace the choice with probability 1 / count
            if (rng.nextInt(count) == 0) chosen = i;
        }
        return chosen;
    }
}
```

A `HashMap<value, List<index>>` makes each pick O(1), but needs O(n) memory; reservoir sampling is O(n) per pick with O(1) memory. Ask which one the interviewer wants. Linked List Random Node (LC 382) is the same loop over a list's nodes.

## Complexity

- **Fisher–Yates:** O(n) time, in place.
- **Reservoir sampling:** O(n) time for a stream of n items, O(k) memory, one random number per item after the first k.

## Variations

- **A random k-subset:** stop Fisher–Yates after k steps; the last k positions are a uniform sample.
- **`Collections.shuffle`** is Fisher–Yates on a `List`; pass your own `Random` to make it reproducible.
- **Weighted reservoir sampling:** give each item the key `u^(1/w)` for a uniform u and weight w, and keep the k largest keys (with a [heap](lesson:top-k-and-two-heaps)).
- **Proportional picks** (by weight, not uniformly) are prefix sums and binary search: see [weighted sampling](lesson:weighted-and-rejection-sampling).

## Common mistakes

- **`rng.nextInt(n)` instead of `rng.nextInt(i + 1)`** in the shuffle: the biased version.
- **`Math.abs(rng.nextInt()) % n`** instead of `rng.nextInt(n)`.
- **Shuffling the stored array in place** and returning it, so `reset()` can no longer restore the original: work on a copy.
- **An off-by-one in the reservoir:** the i-th item (counting from 1) must be kept with probability k/i, so draw `nextInt(i)` after counting it.
- **Creating a new `Random` on every call** in a hot loop: keep one.

## Practice

Shuffle an Array (LC 384), Linked List Random Node (LC 382), Random Pick Index (LC 398).

## Key takeaways

- Fisher–Yates: for i from n − 1 down to 1, swap `a[i]` with `a[nextInt(i + 1)]`: every order has probability 1/n!.
- Swapping with any index gives nⁿ runs over n! orders: biased.
- Reservoir sampling keeps the i-th item with probability k/i, in O(k) memory, for a stream of unknown length.
- Use `rng.nextInt(n)`, never `Math.abs(rng.nextInt()) % n`.
- Seed or inject the `Random` to test randomized code.

## Knowledge check

```quiz
? Why is the shuffle that swaps each a[i] with a[nextInt(n)] biased for n = 3?
+ It has 3³ = 27 equally likely runs spread over 6 orders, and 27 isn't divisible by 6
- Because it never leaves an element in place
! It can; that's not the problem.
- Because nextInt(n) isn't uniform
! nextInt is uniform; the swap scheme isn't.
- It isn't biased
! Some orders come up 5/27 of the time, others 4/27.
> Fisher–Yates draws from [0, i] instead.

? Reservoir sampling with k = 1 over 4 items: what's the probability that item 3 is the final pick?
+ 1/4: it's taken with probability 1/3 and survives item 4 with probability 3/4
- 1/3
! It must also survive item 4.
- 1/2
! That would favour later items.
- 1/12
! The survival probability is 3/4, not 1/4.
> Every item ends up with probability 1/n.

? What's wrong with Math.abs(rng.nextInt()) % n?
+ It's biased when n doesn't divide 2³², and Math.abs(Integer.MIN_VALUE) is negative
- Nothing; it's the standard idiom
! rng.nextInt(n) is the correct call.
- It's too slow
! Speed isn't the problem.
- It never returns 0
! It can return 0.
> Use rng.nextInt(n).

? In Fisher–Yates, why is the random index drawn from [0, i] rather than [0, i − 1]?
+ The element already at position i must be able to stay there
- To avoid an index out of bounds
! [0, i − 1] would be in bounds too.
- Because nextInt excludes its bound
! That's why the call is nextInt(i + 1).
- It makes no difference
! Excluding i gives Sattolo's algorithm, which produces only single cycles.
> Every remaining element, including a[i], must be equally likely.
```
