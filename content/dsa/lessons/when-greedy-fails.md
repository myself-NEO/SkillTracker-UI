## The idea

The same "biggest first" idea is optimal in one problem and wrong in its neighbour. This lesson collects the classic failures so that you recognise them: coin change with arbitrary coins, 0/1 knapsack, and weighted interval scheduling, each with the DP that replaces the greedy. It also shows the cheapest way to catch a wrong greedy: compare it with an exact answer on small random inputs.

## When to use it

Suspect a greedy whenever:
- choices are 0/1, and the items differ in weight and value;
- the values come from the input (any coin system, any weights), not from a fixed, friendly set;
- an early choice changes the cost or value of later ones;
- the question asks for the number of ways, or for a weighted optimum where the items interact.

## How it works

- **A single counterexample kills a greedy.** Look for one on tiny inputs: one big item that blocks two smaller ones, ties, a cheap first step that leads somewhere expensive.
- **The fix is usually DP over the same choice.** Greedy commits to one option, while DP tries them all and keeps the best (see [the greedy method](lesson:greedy-fundamentals)).
- **Some inputs make greedy right by accident.** US coins (1, 5, 10, 25) are *canonical*: greedy is optimal for them, but not for coin systems in general. If the interviewer lets the coin values vary, use DP.

## Java template

Before trusting a greedy, test it against an exact answer on many small random inputs. Here the greedy coin change (below) is checked against `coinChange`, the DP from [coin change](lesson:coin-change):

```java
// Compare a greedy with an exact answer on small random inputs: one mismatch disproves it.
static void checkCoinGreedy() {
    Random rnd = new Random(42);
    for (int trial = 0; trial < 10_000; trial++) {
        int[] coins = {1, 2 + rnd.nextInt(9), 2 + rnd.nextInt(9)};   // always includes 1
        int amount = rnd.nextInt(40);
        int greedy = coinChangeGreedy(coins, amount), exact = coinChange(coins, amount);
        if (greedy != exact) {
            System.out.println(Arrays.toString(coins) + ", amount " + amount
                    + ": greedy " + greedy + ", best " + exact);
            return;                                    // a counterexample
        }
    }
    System.out.println("no counterexample found: evidence, not proof");
}
```

Many of these random coin systems aren't canonical, so it soon prints a counterexample. A greedy that survives thousands of trials has good evidence on its side, and an exchange argument turns that evidence into a proof.

## Worked examples

### Coin change: canonical and arbitrary coins

```java
// "Take the largest coin that fits": optimal for 1, 5, 10, 25 ... but NOT for every coin system.
static int coinChangeGreedy(int[] coins, int amount) {
    int[] c = coins.clone();
    Arrays.sort(c);
    int count = 0;
    for (int i = c.length - 1; i >= 0 && amount > 0; i--) {
        count += amount / c[i];
        amount %= c[i];
    }
    return amount == 0 ? count : -1;
}
```

`coinChangeGreedy({1, 3, 4}, 6)` returns 3 (4 + 1 + 1), but 3 + 3 uses only two coins. The greedy commits to the 4, and nothing afterwards can undo it. The [coin change DP](lesson:coin-change) tries every last coin instead, `dp[a] = 1 + min over coins c of dp[a − c]`, and finds 2.

### Fractional versus 0/1 knapsack

```java
// Fractional knapsack: items may be split, so take
// the best value per weight first. Greedy IS optimal.
static double fractionalKnapsack(int[] weights, int[] values, int capacity) {
    Integer[] order = new Integer[weights.length];
    for (int i = 0; i < order.length; i++) order[i] = i;
    // Best value per weight first. Compare the ratios by cross-multiplying, so nothing is rounded.
    Arrays.sort(order, (a, b) ->
            Long.compare((long) values[b] * weights[a], (long) values[a] * weights[b]));
    double total = 0;
    int left = capacity;
    for (int i : order) {
        if (left == 0) break;
        int take = Math.min(left, weights[i]);
        total += (double) values[i] * take / weights[i];
        left -= take;
    }
    return total;
}
```

| | Fractional knapsack | 0/1 knapsack |
|---|---|---|
| items | can be split | all or nothing |
| greedy by value per weight | **optimal**: the last item is cut to fit exactly | **wrong**: a high-ratio item can waste capacity |
| solution | sort, O(n log n) | [DP over capacity](lesson:knapsack-dp), O(n · W) |

The counterexample for 0/1: capacity 50, items (10 kg, 60), (20 kg, 100) and (30 kg, 120). Greedy by ratio takes the first two for 160, but the last two give 220. With splitting allowed, greedy gets 60 + 100 + ⅔ · 120 = 240, which is optimal.

### Weighted interval scheduling (LC 1235)

Jobs have a start, an end and a profit; choose jobs that don't overlap (one may start exactly when another ends) to maximise the profit. Without profits this is [activity selection](lesson:non-overlapping-intervals), where "earliest end first" is optimal. With profits, every simple greedy breaks:
- **Earliest end first**, on [1,3]→50, [2,4]→10, [3,5]→40 and [3,6]→70, takes 50 + 40 = 90, but [1,3] and [3,6] give 120.
- **Highest profit first**, on [1,3]→20, [2,5]→20, [3,10]→100, [4,6]→70 and [6,9]→60, takes 100 + 20 = 120, but [1,3], [4,6] and [6,9] give 150.

The DP sorts the jobs by end time and decides, for each job, whether to skip it or to take it after the best schedule of the jobs that end by its start. [Binary search](lesson:binary-search-template) finds those jobs:

```java
// LC 1235 Maximum Profit in Job Scheduling.
public int jobScheduling(int[] startTime, int[] endTime, int[] profit) {
    int n = startTime.length;
    Integer[] order = new Integer[n];
    for (int i = 0; i < n; i++) order[i] = i;
    Arrays.sort(order, Comparator.comparingInt(i -> endTime[i]));       // by end time
    int[] ends = new int[n];
    for (int k = 0; k < n; k++) ends[k] = endTime[order[k]];
    int[] dp = new int[n + 1];                 // dp[k] = the best profit from the first k jobs by end time
    for (int k = 1; k <= n; k++) {
        int job = order[k - 1];
        int fit = countEndingBy(ends, k - 1, startTime[job]);   // earlier jobs that end by its start
        dp[k] = Math.max(dp[k - 1], dp[fit] + profit[job]);     // skip it, or take it
    }
    return dp[n];
}

// How many of ends[0..len) are <= x (ends is sorted).
private int countEndingBy(int[] ends, int len, int x) {
    int lo = 0, hi = len;
    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        if (ends[mid] <= x) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}
```

`dp[fit]` is the right subproblem because the jobs that end by the start time are exactly the first `fit` jobs in end-time order. On both job sets above it returns the optimum: 120 and 150.

## Complexity

| Approach | Time | Space |
|---|---|---|
| Greedy coin change | O(k log k) for k coins | O(k) |
| Coin change DP | O(amount · k) | O(amount) |
| Fractional knapsack | O(n log n) | O(n) |
| 0/1 knapsack DP | O(n · W) | O(W) |
| Weighted interval scheduling | O(n log n) | O(n) |

## Variations

- **Huffman coding** is a greedy that *works*: repeatedly merge the two smallest frequencies. Minimum Cost to Connect Sticks is the same algorithm ([greedy with a heap](lesson:greedy-with-a-heap)).
- **Dijkstra, Prim and Kruskal** are greedy algorithms on graphs ([shortest paths](lesson:shortest-paths), [minimum spanning trees](lesson:minimum-spanning-trees)). Dijkstra's greedy breaks with negative edge weights, which is why Bellman-Ford exists.
- **Wrong sort keys** for activity selection (earliest start, shortest first) fail on small counterexamples: see [non-overlapping intervals](lesson:non-overlapping-intervals).
- **When does greedy always work?** When the feasible choices form a *matroid*, the structure behind Kruskal's algorithm. Interviews rarely go that far, but it's the formal answer.

## Common mistakes

- **Trusting a greedy because it passes the examples**: examples tend to use friendly inputs, such as US coins.
- **Assuming coin change is greedy**: it is only for canonical coin systems.
- **Taking the best ratio first in 0/1 knapsack**: one high-ratio item can waste capacity.
- **Running Dijkstra on negative edge weights.**
- **Testing a greedy only by hand**: a short random comparison with an exact answer finds counterexamples you won't think of.

## Practice

Coin Change (LC 322), Coin Change II (LC 518), Partition Equal Subset Sum (LC 416), Last Stone Weight II (LC 1049), Maximum Profit in Job Scheduling (LC 1235), and Maximum Units on a Truck (LC 1710), where greedy *does* work.

## Key takeaways

- One counterexample is enough to reject a greedy; look for it on tiny inputs.
- Greedy coin change is optimal only for canonical coin systems; arbitrary coins need DP.
- Fractional knapsack is greedy; 0/1 knapsack is DP.
- Once intervals carry weights, scheduling needs DP plus binary search.
- Test a greedy against an exact answer on small random inputs before trusting it.

## Knowledge check

```quiz
? Coins {1, 3, 4}, amount 6. Why does the greedy fail?
+ Taking the 4 first leaves 2, which needs two 1s, while 3 + 3 uses only two coins
- Because 6 can't be made from these coins
! It can: 3 + 3.
- Because the coins aren't sorted
! The greedy sorts them.
- It doesn't fail
! It returns 3 coins instead of 2.
> The largest coin isn't always part of an optimal answer.

? Capacity 50; items (10 kg, 60), (20 kg, 100) and (30 kg, 120). What is the best 0/1 knapsack value?
+ 220: the 20 kg and 30 kg items
- 160: the two best ratios
! That's the greedy answer, and it isn't optimal.
- 240
! That needs part of an item, which 0/1 forbids.
- 280
! All three together weigh 60 kg, more than the capacity.
> Greedy by ratio wastes 20 kg of capacity.

? Why doesn't "earliest end first" solve weighted interval scheduling?
+ It maximises the number of jobs, not the profit, and one valuable job can be worth more than two cheap ones
- Because the jobs aren't sorted
! The greedy sorts them by end time.
- Because jobs can share an endpoint
! Touching is allowed in both versions.
- It does solve it
! [1,3]→50 with [3,5]→40 loses to [1,3]→50 with [3,6]→70.
> Weights turn it into DP plus binary search.

? A greedy passes 10,000 random trials against an exact answer. What has that shown?
+ Strong evidence that it's correct, though not a proof
- That it's correct for every input
! Random tests can miss rare counterexamples.
- Nothing useful
! Random comparisons catch most wrong greedies quickly.
- That it's faster than DP
! The trials checked answers, not speed.
> An exchange argument turns the evidence into a proof.
```
