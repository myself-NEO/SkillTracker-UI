A greedy algorithm builds the answer one irrevocable choice at a time, always taking the option that looks best right now: no backtracking, no table of subproblems. Greedy code is short and fast, usually a sort plus one pass in O(n log n). It's also the easiest kind of solution to get *wrong*, because a greedy that looks obviously right can fail on an input you didn't think of. This lesson is the method: decide whether a greedy is allowed, then prove it or break it.

## The mental model: greedy versus DP

Greedy works when two things hold:
1. **Greedy-choice property:** some optimal solution starts with the greedy choice.
2. **Optimal substructure:** after making that choice, what remains is a smaller instance of the same problem.

[Dynamic programming](lesson:dp-framework) needs only the second: it tries every choice and keeps the best. Greedy commits to one. So **greedy is DP where you can prove only one choice ever matters.**

```text
DP: try every choice and keep the best

  state --+-- choice 1 --> subproblem
          +-- choice 2 --> subproblem
          +-- choice 3 --> subproblem

Greedy: commit to one choice; the others provably never do better

  state ---- best choice --> subproblem ---- best choice --> ...
```

## The steps

1. **Name the choice.** What single decision does each step make? Which interval to keep next, which box to load, where to jump, which station to stop at.
2. **Pick the order.** Most greedies are "sort by the right key, then sweep once", and the key is the real decision: end time, deadline, value per weight, the difference between two costs. The common keys are listed under Reading the signals.
3. **Hunt for a counterexample, for a minute.** Try small inputs that would fool the greedy: ties, one big item that blocks two smaller ones, a cheap first step that leads somewhere expensive. If one turns up, the problem needs DP or search; [when greedy fails](lesson:when-greedy-fails) collects the classic cases.
4. **Prove it** with an exchange argument or "greedy stays ahead" (below). In an interview, one or two sentences is enough, but you should be able to say them.
5. **Implement, and state the cost.** Usually a sort plus one pass, O(n log n). If the best choice changes as you go, keep the options in a [heap](lesson:greedy-with-a-heap).

## Proving a greedy, or breaking it

Interviewers often ask "why does this work?" Two arguments cover almost every case.

### The exchange argument

Take any optimal solution that differs from the greedy one. Show you can swap one of its choices for the greedy choice without making it worse. Repeat until it *is* the greedy solution: so greedy is optimal too.

> *Activity selection* ([non-overlapping intervals](lesson:non-overlapping-intervals)): let X be the first interval in an optimal solution, and G the interval that ends earliest overall. G ends no later than X, so replacing X with G can't overlap anything that X didn't. The count is unchanged, and now the optimal solution starts like greedy.

### Greedy stays ahead

Show that after every step, greedy is at least as far along as any other solution: it has covered more, reached further or finished earlier. Then it can't finish behind.

> *[Jump Game II](lesson:jump-games):* after k jumps, the greedy layer reaches the farthest index that any k-jump path can reach.

### Breaking a greedy

One counterexample settles it. Coin change with coins {1, 3, 4} and amount 6: "largest coin first" takes 4 + 1 + 1, three coins, but 3 + 3 uses two. That's why [Coin Change](lesson:coin-change) is a DP problem.

## Reading the signals

| Signs that greedy is **safe** | Signs that greedy is **unsafe** |
|---|---|
| items can be split (fractional), or every item has the same size | 0/1 choices with different weights and values |
| a choice only affects what's *left*, not the price of later choices | an early choice changes the cost of later ones |
| the exchange argument fits in one sentence | you can't say why the local best is globally best |
| "max number of …" / "min number of …" with intervals or deadlines | "number of ways", or minimum cost over arbitrary weights |

**The sort key is usually the whole algorithm.** Intervals are greedy's home ground: almost every interval problem is "sort, then sweep once".

| Goal | Sort by | Lesson |
|---|---|---|
| combine overlapping intervals (merge, insert, coverage) | start | [interval basics](lesson:interval-basics) |
| keep the most non-overlapping intervals | end | [non-overlapping intervals](lesson:non-overlapping-intervals) |
| count how many overlap at once (rooms, platforms) | the start and end events, separately | [meeting rooms](lesson:meeting-rooms) |
| fit the most tasks before their deadlines | deadline | [greedy with a heap](lesson:greedy-with-a-heap) |
| pair two groups (cookies and children, people and boats) | size, in both groups | [sort and match](lesson:sort-and-match) |
| send n items to each of two bins | the difference between the two costs | [sort and match](lesson:sort-and-match) |
| fill a capacity with divisible items | value per weight | [when greedy fails](lesson:when-greedy-fails) |

## Worked example

**Maximum Units on a Truck (LC 1710):** `boxTypes[i] = [numberOfBoxes, unitsPerBox]`, and the truck holds at most `truckSize` boxes. Maximise the units loaded. Running the steps:

1. **The choice:** which box to load next.
2. **The order:** the most units per box first.
3. **Counterexample hunt:** every box takes exactly one slot, so there's no "big item blocks two small ones" trap: a box with more units is never worse than one with fewer. (Give the boxes different sizes and it becomes [0/1 knapsack](lesson:knapsack-dp), where this greedy fails.)
4. **Proof (exchange):** if an optimal load leaves out a box with u units but carries one with fewer, swap them: the same number of slots, and at least as many units. Repeat until the load is the greedy one.
5. **Implement:** sort, then take as many boxes of each type as still fit. O(n log n).

```java
// LC 1710 Maximum Units on a Truck: boxTypes[i] = [boxes, unitsPerBox], at most truckSize boxes.
public int maximumUnits(int[][] boxTypes, int truckSize) {
    int[][] types = boxTypes.clone();
    Arrays.sort(types, (a, b) -> Integer.compare(b[1], a[1]));   // most units per box first
    int units = 0, left = truckSize;
    for (int[] t : types) {
        if (left == 0) break;
        int take = Math.min(left, t[0]);
        units += take * t[1];
        left -= take;
    }
    return units;
}
```

`[[1,3],[2,2],[3,1]]` with `truckSize = 4` loads 1 × 3 + 2 × 2 + 1 × 1 = 8 units.

## Common mistakes

- **Trusting a greedy because it passes the examples.** Spend the minute on a counterexample hunt first.
- **Sorting by the wrong key**: by start when the goal is the most non-overlapping intervals, or by value when it should be value per weight.
- **Using greedy on 0/1 choices** with different weights and values: that's knapsack, and it needs DP.
- **Ignoring ties.** Decide how ties are broken, and check whether the choice matters.
- **Overflowing comparators**: `(a, b) -> a[0] - b[0]` breaks when values can be large or negative; use `Integer.compare` or `Comparator.comparingInt`.

## Key takeaways

- Greedy commits to the locally best choice and never revisits it: it's DP where only one choice matters.
- It needs the greedy-choice property and optimal substructure.
- Prove it with an exchange argument or "greedy stays ahead"; break it with one counterexample.
- The sort key usually *is* the algorithm: end time, deadline, ratio, difference.
- If you can't say why the local best is globally best, reach for DP.

## Knowledge check

```quiz
? What is the difference between greedy and dynamic programming?
+ DP tries every choice at each step and keeps the best; greedy commits to one choice it can prove is safe
- Greedy is always faster and always correct
! It's faster, but only correct when the greedy-choice property holds.
- DP only works on arrays
! DP works on any state space with overlapping subproblems.
- Greedy uses memoization
! Greedy never revisits a choice, so there's nothing to memoize.
> Greedy is DP where only one choice ever matters.

? Coins {1, 3, 4}, amount 6. What does "largest coin first" do?
+ It uses 3 coins (4 + 1 + 1), but 2 coins (3 + 3) is optimal
- It finds the optimum, 2 coins
! Taking the 4 first leads it astray.
- It fails to make 6 at all
! It does make 6, just with too many coins.
- It uses 2 coins (4 + 2)
! There's no 2 coin.
> One counterexample is enough to reject a greedy.

? In an exchange argument, what do you show?
+ Any optimal solution can be changed, one swap at a time, into the greedy solution without getting worse
- The greedy solution is the only optimal solution
! There may be many optimal solutions; greedy just has to be one of them.
- The greedy runs in O(n log n)
! That's its cost, not its correctness.
- The greedy works on the given examples
! Examples are evidence, not proof.
> Activity selection: swap the first interval for the one that ends earliest.

? Which feature most suggests that greedy is unsafe?
+ 0/1 choices where items have different weights and values
- Every item has the same size
! That's a sign greedy is safe, as in Maximum Units on a Truck.
- Items can be split
! Fractional problems are greedy's home ground.
- The question asks for the most non-overlapping intervals
! That's activity selection, which greedy solves.
> That's 0/1 knapsack, which needs DP.
```
