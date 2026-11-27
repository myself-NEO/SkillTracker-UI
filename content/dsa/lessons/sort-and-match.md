## The idea

When two groups must be paired up (children and cookies, people and boats), or items split between two bins, **sort, then match the extremes with two pointers**. The exchange argument is usually: "if an optimal pairing does it differently, swap two partners, and nothing gets worse."

## When to use it

- Pair items from two groups, where each pair must satisfy a size or capacity rule: "the most children content", "the most workers assigned".
- Pair items within one group under a capacity: "at most two people per boat, at most `limit` weight".
- Send each item to one of two bins, n to each, at minimum total cost.

## How it works

- **The smallest that works:** give each child the *smallest* cookie that satisfies them. A bigger cookie is never more useful to a less greedy child, so saving the big ones can only help.
- **The heaviest first:** the heaviest person must go in *some* boat. If anyone fits with them, the lightest person does, and pairing them uses up the person who is least useful to anyone else.
- **Sort by the difference:** when each item goes to bin A or bin B, what matters is how much cheaper A is, `a − b`. Send the n items with the biggest savings to A.

## Java template

```java
// Match two sorted groups: each a[i] needs some b[j] that fits it, and each item is used once.
Arrays.sort(a);
Arrays.sort(b);
int i = 0, matched = 0;
for (int j = 0; j < b.length && i < a.length; j++) {
    if (fits(a[i], b[j])) {     // the smallest b that fits the smallest a left
        i++;
        matched++;
    }                           // otherwise b[j] is too small for every a left: skip it
}
```

## Worked examples

### Assign Cookies (LC 455)

```java
// LC 455 Assign Cookies: the most children content (cookie size >= greed).
public int findContentChildren(int[] greed, int[] cookies) {
    int[] g = greed.clone(), s = cookies.clone();
    Arrays.sort(g);
    Arrays.sort(s);
    int child = 0;
    for (int cookie = 0; cookie < s.length && child < g.length; cookie++) {
        // the smallest cookie that satisfies the least greedy child
        if (s[cookie] >= g[child]) child++;
    }
    return child;
}
```

Greed `[1, 2, 3]` with cookies `[1, 1]` contents 1 child; greed `[1, 2]` with cookies `[1, 2, 3]` contents 2.

### Boats to Save People (LC 881)

```java
// LC 881 Boats to Save People: each boat carries at most 2 people and at most 'limit' weight.
public int numRescueBoats(int[] people, int limit) {
    int[] p = people.clone();
    Arrays.sort(p);
    int boats = 0;
    // Each boat takes the heaviest person left, plus the lightest one if they fit too.
    for (int light = 0, heavy = p.length - 1; light <= heavy; heavy--) {
        if (p[light] + p[heavy] <= limit) light++;
        boats++;
    }
    return boats;
}
```

`people = [3, 2, 2, 1]` with `limit = 3` sorts to `[1, 2, 2, 3]`, and the boats carry {3}, {1, 2} and {2}: 3 boats.

### Two City Scheduling (LC 1029)

```java
// LC 1029 Two City Scheduling: send n people to A and n to B at minimum total cost.
public int twoCitySchedCost(int[][] costs) {
    int[][] c = costs.clone();
    // how much cheaper A is (costs are small)
    Arrays.sort(c, Comparator.comparingInt(x -> x[0] - x[1]));
    int n = c.length / 2, total = 0;
    for (int i = 0; i < c.length; i++) total += (i < n) ? c[i][0] : c[i][1];
    return total;
}
```

For `[[10,20],[30,200],[400,50],[30,20]]` the differences are −10, −170, 350 and 10. The two people with the biggest savings go to A (10 + 30 = 40) and the other two to B (50 + 20 = 70): 110 in total. Sorting by a difference is the general trick for "each item goes to one of two bins, n each".

`comparingInt(x -> x[0] - x[1])` is safe here because the costs are small (at most 1000), so the key can't overflow. Never compare with `(a, b) -> a[0] - b[0]` when values can be large or negative.

## Complexity

All three are O(n log n) for the sorting, then O(n) for the matching pass. The copies take O(n) space; sorting the inputs in place would avoid them, at the cost of changing the caller's arrays.

## Variations

- **Minimize Maximum Pair Sum in Array (LC 1877):** pair the smallest with the largest, as in Boats.
- **Array Partition (LC 561):** to maximise the sum of the pairs' minimums, sort and pair neighbours.
- **Most Profit Assigning Work (LC 826):** sort jobs by difficulty and workers by ability, and keep the best profit unlocked so far as the pointer moves.
- **Advantage Shuffle (LC 870):** beat each value in B with the smallest value in A that beats it, and give the leftovers to the values nothing can beat.
- **Bag of Tokens (LC 948):** play the cheapest token face up for score, and the most valuable face down for power.

## Common mistakes

- **Pairing the wrong extremes**: Boats pairs the lightest with the heaviest, while Array Partition pairs neighbours. Work out which items go together from the constraint.
- **Forgetting the "at most two" rule:** with any number of people per boat, Boats becomes bin packing, which is NP-hard.
- **Overflowing comparators** on large or negative values: use `Integer.compare`.
- **Sorting the caller's arrays** when they're expected to stay untouched: clone them first.

## Practice

Assign Cookies (LC 455), Boats to Save People (LC 881), Two City Scheduling (LC 1029), Minimize Maximum Pair Sum in Array (LC 1877), Most Profit Assigning Work (LC 826), Advantage Shuffle (LC 870), Bag of Tokens (LC 948).

## Key takeaways

- Sort both groups, then match the extremes with two pointers.
- Give each demand the smallest supply that satisfies it.
- The heaviest item must go somewhere: pair it with the lightest if they fit.
- For "n to each of two bins", sort by the difference between the two costs.
- Justify the pairing with an exchange argument: swapping partners never helps.

## Knowledge check

```quiz
? In Assign Cookies, why give each child the smallest cookie that satisfies them?
+ A bigger cookie is never more useful to a less greedy child, so saving the bigger cookies can only help
- Because the smallest cookies run out first
! What matters is what the remaining children can still use.
- Because children prefer small cookies
! Only the size rule matters.
- It doesn't matter which cookie a child gets
! Spending a big cookie early can leave a greedier child unsatisfied.
> The exchange argument: swap the cookies, and nobody loses.

? people = [1, 2, 2, 3], limit = 3, at most two per boat. How many boats?
+ 3: {3}, {1, 2} and {2}
- 2
! The 3 can't share, and 2 + 2 exceeds the limit.
- 4
! 1 and 2 can share a boat.
- 1
! The total weight is 8.
> The heaviest goes first, with the lightest if they fit.

? In Two City Scheduling, what should the costs be sorted by?
+ The cost to A minus the cost to B
- The cost to A
! A cheap A cost can still be a poor choice if B is even cheaper.
- The sum of the two costs
! Each person pays only one of them.
- The smaller of the two costs
! What matters is how much is saved, not the cheaper price.
> Send the n people with the biggest savings to A.

? Why is (a, b) -> a[0] - b[0] a risky comparator?
+ The subtraction can overflow when values are large or negative, giving the wrong sign
- It sorts in descending order
! It sorts in ascending order, when it doesn't overflow.
- It isn't allowed for arrays
! It compiles; it's just unsafe.
- It's slower than Integer.compare
! The problem is correctness, not speed.
> Use Integer.compare or Comparator.comparingInt.
```
