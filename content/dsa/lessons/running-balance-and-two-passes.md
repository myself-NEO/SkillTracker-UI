## The idea

Two greedy shapes that need only one or two linear passes:
- **A running balance:** add each element's gain or loss to a running total, and the moment it goes negative, give up on everything so far and restart after it. Gas Station finds its starting point this way, and Kadane's algorithm uses the same reset.
- **Two passes:** when each element is constrained by *both* neighbours, satisfy the left neighbour in a left-to-right pass and the right neighbour in a right-to-left pass, combining the two with `max`. Candy is the classic.

## When to use it

- A circular route or a running total that must never go negative: "find the starting point".
- A balance that mustn't dip below zero, such as unmatched parentheses.
- Each element has a rule involving its left *and* right neighbours: "more than a lower-rated neighbour", "the nearest X on either side".

## How it works

**Gas Station rests on two facts:**
1. If the **total** gain is negative, no start works. If it's non-negative, a valid start exists.
2. If you start at `s` and run dry before reaching `i + 1`, then *no* station in `s..i` works as a start. You arrived at each of them with a non-negative tank, so starting there with an empty tank only does worse. Jump straight to `i + 1`.

The start that survives the scan reaches the end of the array without running dry. Every block the scan skipped ended in a deficit, and those deficits add up to no more than the surviving start's surplus, because the total is non-negative. So it also gets back round to where it began.

**Candy's two passes:** pass 1 gives each child one more than a lower-rated left neighbour; pass 2 does the same for the right neighbour, taking `max` so that pass 1's guarantee survives. Each child ends up with exactly the larger of its two forced minimums (the length of the rising run that ends at it, from either side), so nobody gets more than they must, and the total is minimal.

## Java template

```java
// A running balance: drop everything so far the moment the balance goes negative.
int total = 0, balance = 0, start = 0;
for (int i = 0; i < n; i++) {
    total += gain[i];
    balance += gain[i];
    if (balance < 0) {           // nothing in start..i can work: restart after i
        start = i + 1;
        balance = 0;
    }
}

// Two passes: satisfy the left neighbour, then the right one without breaking the left.
for (int i = 1; i < n; i++)      if (rule(i, i - 1)) value[i] = value[i - 1] + 1;
for (int i = n - 2; i >= 0; i--) if (rule(i, i + 1)) value[i] = Math.max(value[i], value[i + 1] + 1);
```

## Worked examples

### Gas Station (LC 134)

```java
// LC 134 Gas Station: the start index that completes the circuit, or -1.
public int canCompleteCircuit(int[] gas, int[] cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < gas.length; i++) {
        int gain = gas[i] - cost[i];
        total += gain;
        tank += gain;
        if (tank < 0) {                  // can't get from 'start' to i + 1, and neither can
            start = i + 1;               // any station between them: try i + 1
            tank = 0;
        }
    }
    return total >= 0 ? start : -1;     // enough gas in total => the surviving start works
}
```

`gas = [1,2,3,4,5]` and `cost = [3,4,5,1,2]` give the gains −2, −2, −2, 3, 3. The tank goes negative at stations 0, 1 and 2, so the start moves to 3; the total is 0, so station 3 completes the circuit. One pass in O(1) space, where trying every start would be O(n²).

### Candy (LC 135)

```java
// LC 135 Candy: everyone gets >= 1, and a higher
// rating than a neighbour means more candy. Minimise.
public int candy(int[] ratings) {
    int n = ratings.length;
    int[] c = new int[n];
    Arrays.fill(c, 1);
    for (int i = 1; i < n; i++) {           // pass 1: beat a lower left neighbour
        if (ratings[i] > ratings[i - 1]) c[i] = c[i - 1] + 1;
    }
    for (int i = n - 2; i >= 0; i--) {      // pass 2: beat a lower right neighbour too
        if (ratings[i] > ratings[i + 1]) c[i] = Math.max(c[i], c[i + 1] + 1);
    }
    return Arrays.stream(c).sum();
}
```

```text
ratings      1   2   87  87  87   2   1
left pass    1   2   3   1   1    1   1     rising from the left
right pass   1   2   3   1   3    2   1     rising from the right; max keeps the left result
total = 13   equal neighbours have no constraint, so the middle 87 gets 1
```

### Minimum Add to Make Parentheses Valid (LC 921)

A running balance with a floor: count `(` as +1 and `)` as −1. A `)` that would take the balance below zero has no partner, so it needs an added `(`; every `(` still open at the end needs an added `)`.

```java
// LC 921: the fewest parentheses to add so that s is valid.
public int minAddToMakeValid(String s) {
    int balance = 0, added = 0;
    for (char ch : s.toCharArray()) {
        if (ch == '(') balance++;
        else if (balance > 0) balance--;     // it closes an open '('
        else added++;                        // an unmatched ')': add a '(' before it
    }
    return added + balance;                  // plus a ')' for each '(' still open
}
```

`"())"` needs 1 addition, and `"((("` needs 3.

## Complexity

| Problem | Time | Space |
|---|---|---|
| Gas Station | O(n) | O(1) |
| Candy | O(n) | O(n) |
| Minimum Add to Make Parentheses Valid | O(n) | O(1) |

## Variations

- **[Kadane's algorithm](lesson:maximum-subarray)** for the maximum subarray is the same "reset when the running sum goes negative" greedy, often presented as DP.
- **Best Time to Buy and Sell Stock (LC 121)** keeps a running minimum price instead of a running sum; it's in the same [lesson](lesson:maximum-subarray).
- **Trapping Rain Water (LC 42)** needs the highest bar on each side of every position: two passes, or one pass with [two pointers](lesson:two-pointers).
- **[Product of Array Except Self](lesson:prefix-sums)** multiplies a left-to-right prefix product by a right-to-left suffix product.
- **Shortest Distance to a Character (LC 821):** the distance to the nearest occurrence on the left, then on the right, keeping the minimum.
- **Candy in O(1) space** counts the lengths of the rising and falling runs instead of storing an array.

## Common mistakes

- **Returning `start` without checking the total**: when the total is negative, no start works.
- **Trying every start**: O(n²), when one pass is enough.
- **Doing Candy in one pass**: one direction can't see a lower-rated neighbour that comes later.
- **Overwriting instead of taking `max`** in the second pass, which breaks the first pass's guarantee.
- **Giving equal neighbours equal candy**: equal ratings impose no constraint at all.

## Practice

Gas Station (LC 134), Candy (LC 135), Minimum Add to Make Parentheses Valid (LC 921), Best Time to Buy and Sell Stock (LC 121), Shortest Distance to a Character (LC 821), Trapping Rain Water (LC 42).

## Key takeaways

- A running balance that goes negative rules out every start up to that point: restart after it.
- If the total is non-negative, the start that survives the Gas Station scan completes the circuit.
- For constraints with both neighbours, make one pass per direction and combine them with `max`.
- Both shapes are O(n), and a running balance needs only O(1) space.
- Kadane's algorithm, the stock problem and Trapping Rain Water are close relatives.

## Knowledge check

```quiz
? In Gas Station, the tank goes negative between station s and station i + 1. What follows?
+ No station from s to i can be a valid start, so the next candidate is i + 1
- Only s is ruled out, so try s + 1 next
! Every station between s and i was reached with a non-negative tank, so starting there with an empty tank does no better.
- No start works at all
! Only the total decides that.
- Restart the scan from station 0
! That turns the O(n) scan into O(n²).
> Jump straight past the point of failure.

? The gains around the circuit sum to −1. What is the answer?
+ −1: no start can complete the circuit
- The station with the largest gain
! No start can make up a negative total.
- The last start the scan found
! Only a non-negative total guarantees that start works.
- Station 0
! The total is what decides it.
> A negative total rules out every start.

? Why does Candy's second pass take max(c[i], c[i + 1] + 1) instead of just c[i + 1] + 1?
+ To keep the first pass's guarantee: c[i] may already need to be larger because of its left neighbour
- To avoid giving out zero candies
! Every child already starts with 1.
- It's only an optimisation
! Overwriting can break the left-neighbour rule.
- Because ratings can be equal
! Equal ratings impose no constraint.
> Each child gets the larger of its two forced minimums.

? ratings = [1, 0, 2]. What is the minimum total candy?
+ 5: candies [2, 1, 2]
- 3
! The children rated 1 and 2 each need more than the child rated 0.
- 4
! Both ends need 2.
- 6
! [2, 1, 2] is enough.
> This is LC 135's first example.
```
