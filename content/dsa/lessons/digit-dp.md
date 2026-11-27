## The idea

Digit DP answers **"how many integers in [0, N] have some digit-level property?"** without enumerating them. Write N as a digit string and choose the digits of the counted number from left to right, carrying a **`tight`** flag: `tight = true` means every digit so far equals N's, so the next digit can't exceed N's digit at that position. The moment a smaller digit is placed, `tight` becomes false, and every later digit is free (0–9): the number is already guaranteed to be below N.

## When to use it

- "Count the numbers up to N (or in [L, R]) whose digits sum to S / contain no repeats / avoid a digit / have k nonzero digits."
- N up to 10⁹ or 10¹⁸, far too large to enumerate.
- Counting in a range: `count(R) − count(L − 1)`.

## How it works

- **State:** `(pos, tight, extra)`, where `extra` is the one problem-specific piece: a running digit sum, a mask of digits used, a count of some digit, or a "has a nonzero digit been placed yet?" flag for leading zeros.
- **Transition:** try every digit d up to the limit (N's digit if tight, else 9); the next state has `tight && d == limit`.
- **Memoize only the non-tight states.** There's exactly one tight path through the recursion (it follows N's digits), so caching it buys nothing; the non-tight states are the ones that recur across different earlier choices.
- **The hard part is choosing `extra`.** The `(pos, tight)` skeleton is always the same.

## Java template

The classic example: count the integers in [0, N] whose digits sum to exactly S.

```java
static int countWithDigitSum(int N, int targetSum) {
    String digits = Integer.toString(N);
    Integer[][] memo = new Integer[digits.length()][targetSum + 1];
    return dfs(digits, 0, targetSum, true, memo);
}

static int dfs(String digits, int pos, int remainingSum, boolean tight, Integer[][] memo) {
    if (remainingSum < 0) return 0;
    if (pos == digits.length()) return remainingSum == 0 ? 1 : 0;
    if (!tight && memo[pos][remainingSum] != null) return memo[pos][remainingSum];
    int limit = tight ? (digits.charAt(pos) - '0') : 9;
    int count = 0;
    for (int d = 0; d <= limit; d++) {
        count += dfs(digits, pos + 1, remainingSum - d, tight && (d == limit), memo);
    }
    if (!tight) memo[pos][remainingSum] = count;
    return count;
}
```

Here leading zeros are harmless (a 0 adds nothing to a sum), so "007" simply counts as 7.

## Worked examples

### Count the numbers with a given digit sum

The template above. For N = 23 and S = 5, it counts 5, 14 and 23: 3. Digit DP's edge cases (the exact moment `tight` flips, the boundary digit itself) are exactly what one hand-traced example can miss, so check your version against a brute-force loop over small N before trusting it.

### Numbers With Repeated Digits (LC 1012)

Count the numbers in [1, n] with at least one repeated digit. Count the complement instead, the numbers whose digits are **all different**, with a mask of the digits used as `extra`, plus a `started` flag so that leading zeros don't count as used zeros:

```java
public int numDupDigitsAtMostN(int n) {
    String digits = Integer.toString(n);
    return n - distinct(digits, 0, 0, true, false, new Integer[digits.length()][1 << 10]);
}

// Numbers in [1, n] whose digits are all different. mask = digits used; started = a nonzero digit placed.
private int distinct(String digits, int pos, int mask, boolean tight, boolean started, Integer[][] memo) {
    if (pos == digits.length()) return started ? 1 : 0;      // 0 itself isn't counted
    if (!tight && started && memo[pos][mask] != null) return memo[pos][mask];
    int limit = tight ? digits.charAt(pos) - '0' : 9;
    int count = 0;
    for (int d = 0; d <= limit; d++) {
        if (started && (mask & (1 << d)) != 0) continue;    // this digit is already used
        boolean nowStarted = started || d != 0;
        int nextMask = nowStarted ? mask | (1 << d) : mask; // leading zeros don't use up the 0
        count += distinct(digits, pos + 1, nextMask, tight && d == limit, nowStarted, memo);
    }
    if (!tight && started) memo[pos][mask] = count;
    return count;
}
```

For n = 20 there are 19 numbers with distinct digits, so 1 with a repeat (11). It combines digit DP with a [bitmask](lesson:bitmask-dp) of digits used.

## Complexity

The number of states times the work per state: **O(digits × extra-states × 10)**. For the digit sum, that's O(digits · S · 10); with a digit mask, O(digits · 2¹⁰ · 10), tiny either way compared with enumerating up to N.

## Variations

- **A range [L, R]:** `count(R) − count(L − 1)`.
- **Numbers At Most N Given Digit Set (LC 902):** the same skeleton, choosing digits only from the given set.
- **Number of Digit One (LC 233):** `extra` counts the 1s placed so far, and the answer sums them.
- **Non-negative Integers without Consecutive Ones (LC 600):** digit DP in **base 2**, with the previous bit as `extra`.
- **Very large N given as a string:** the template already works on the digit string; only the count may need `long` or a modulus.

## Common mistakes

- **Memoizing tight states** (or caching without `tight` in the key), which mixes up bounded and free states.
- **Forgetting leading zeros** when the property cares about them (repeated digits, nonzero counts).
- **Off-by-one in a range**: subtract `count(L − 1)`, not `count(L)`.
- **The wrong limit:** `tight ? N's digit : 9`, and the next state's tight is `tight && d == limit`.
- **Counting 0 by accident** when the problem starts at 1.

## Practice

Count Numbers with Unique Digits (LC 357), Numbers At Most N Given Digit Set (LC 902), Numbers With Repeated Digits (LC 1012), Number of Digit One (LC 233), Non-negative Integers without Consecutive Ones (LC 600).

## Key takeaways

- Digit DP counts the numbers up to N with a digit property, choosing digits left to right.
- `tight` caps the next digit at N's digit; once a smaller digit is placed, the rest are free.
- The state is `(pos, tight, extra)`; choosing `extra` is the real problem.
- Memoize only the non-tight states.
- Handle leading zeros explicitly when the property depends on them, and use `count(R) − count(L − 1)` for ranges.

## Knowledge check

```quiz
? N = 457. The first two digits chosen are 4 and 3. Is the state still tight, and what can the third digit be?
+ Not tight: 3 < 5, so the third digit can be anything from 0 to 9
- Still tight, so the third digit is at most 7
! Tight ended when 3 was placed below N's 5.
- Still tight, so the third digit must be 7
! Tight caps a digit; it never forces one.
- Not tight, and the third digit must be 0
! Once free, every digit 0–9 is allowed.
> Below N at any position means below N overall.

? Why does digit DP memoize only the non-tight states?
+ There's a single tight path (following N's digits), so tight states never repeat; the free states are the ones that recur
- Because tight states are always zero
! They can count many numbers.
- To save memory
! It's about states repeating, not memory.
- Because tight states can't be computed recursively
! They're computed the same way, just not reused.
> Caching tight states with a (pos, sum) key would also mix them up with free states.

? How do you count the numbers in [L, R] with a property?
+ count(R) − count(L − 1)
- count(R) − count(L)
! That would exclude L itself.
- count(R − L)
! The property depends on the actual numbers, not their distance.
- Run the digit DP from L to R directly
! The template counts from 0 up to a bound.
> Two calls to the same counting function.

? In Numbers With Repeated Digits, why is the "started" flag needed?
+ Leading zeros aren't real digits, so they mustn't mark the digit 0 as used
- Because numbers can't start with 1
! They can.
- To count the number 0
! The problem starts at 1.
- It isn't needed
! Without it, a short number such as 5, written 005, would seem to repeat the digit 0 and be wrongly rejected.
> Track whether a nonzero digit has been placed.
```
