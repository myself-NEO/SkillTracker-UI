## What it is

Interview math is a small toolkit. Most "math" questions test whether you can:
1. **keep integers from overflowing**, silently and at every step;
2. **apply one of about six classic algorithms**: Euclid, the sieve, fast power, the modular inverse, binomial coefficients, and a few randomized tricks;
3. **spot the structure** (a gcd, a modulus, a count) hiding inside a story.

This lesson covers the first skill: how Java's number types behave, and how to take a number apart digit by digit.

## How it works

| Type | Range | Roughly | What it means in practice |
|---|---|---|---|
| `int` | −2³¹ … 2³¹ − 1 | ±2.1 × 10⁹ | the product of two values above 46,340 overflows |
| `long` | −2⁶³ … 2⁶³ − 1 | ±9.2 × 10¹⁸ | the product of two values below 3 × 10⁹ fits |
| `double` | 53-bit mantissa | exact integers up to 2⁵³ ≈ 9 × 10¹⁵ | never compare with `==` |
| `1_000_000_007` | a prime | (10⁹ + 7)² ≈ 10¹⁸ fits a `long` | the standard "answer modulo" value |

- **Overflow is silent.** Java wraps around without an error. Widen *before* the operation: `(long) a * b`, not `(long) (a * b)`.
- **Integer division rounds toward zero**, and `%` takes the sign of the dividend: `-7 / 2` is −3, and `-7 % 2` is −1.
- **`Math.abs(Integer.MIN_VALUE)` and `-Integer.MIN_VALUE` are still negative**: +2³¹ doesn't exist in an `int`. Widen to `long` first.
- **Doubles are binary fractions.** 0.1 has no exact representation, so `0.1 + 0.2 == 0.3` is false, and integers are exact only up to 2⁵³.

## Build it from scratch

**Digits:** `x % 10` is the last digit, `x / 10` drops it, and `result * 10 + d` appends one. The only hard part is overflow.

```java
// LC 7 Reverse Integer: return 0 if the result doesn't fit in an int, without using a long.
public int reverse(int x) {
    int result = 0;
    while (x != 0) {
        int digit = x % 10;                     // negative when x is: the sign takes care of itself
        // result * 10 would overflow
        if (result > Integer.MAX_VALUE / 10 || result < Integer.MIN_VALUE / 10) return 0;
        result = result * 10 + digit;
        x /= 10;
    }
    return result;
}

// LC 9 Palindrome Number, without a string: reverse only the second half of the digits.
public boolean isPalindrome(int x) {
    if (x < 0 || (x % 10 == 0 && x != 0)) return false;    // "-121" and "10" can't be palindromes
    int half = 0;
    while (x > half) {
        half = half * 10 + x % 10;
        x /= 10;
    }
    return x == half || x == half / 10;                     // odd length: drop the middle digit
}
```

- **Why `reverse` doesn't check the digit:** the test `result > MAX / 10` catches every overflowing `* 10`. When `result` equals `MAX / 10` (214748364) exactly, overflow would need a final digit above 7. But that digit is the *first* digit of a 10-digit `int`, so it's 1 or 2.
- **Palindrome:** reversing only half of the digits can't overflow. Numbers ending in 0 (other than 0) can't be palindromes, because nothing starts with 0.

## Java API

The rules that cause the most bugs:

```java
static void integerRules() {
    int q = -7 / 2;                              // -3: integer division rounds toward zero
    int r = -7 % 2;                              // -1: the remainder takes the sign of the dividend
    int down = Math.floorDiv(-7, 2);             // -4: rounds toward negative infinity
    int mod = Math.floorMod(-7, 3);              //  2: always in [0, 3) for a positive divisor
    // 1410065408: the int product overflowed BEFORE widening
    long wrong = 100_000 * 100_000;
    long right = 100_000L * 100_000;             // 10000000000: make one operand long first
    int abs = Math.abs(Integer.MIN_VALUE);       // -2147483648: +2^31 doesn't exist in an int
    int ceil = (7 + 3 - 1) / 3;                  // 3: the ceiling of 7 / 3 (non-negative values)
    boolean same = 0.1 + 0.2 == 0.3;             // false: compare doubles with a tolerance
    try {
        // throws ArithmeticException instead of wrapping around
        Math.multiplyExact(1 << 20, 1 << 12);
    } catch (ArithmeticException overflow) {
        // handle it, or move to long / BigInteger
    }
}
```

| Method | What it gives you |
|---|---|
| `Math.floorDiv(a, b)`, `Math.floorMod(a, b)` | division that rounds down, and a remainder in `[0, b)` for a positive `b` |
| `Math.addExact`, `Math.multiplyExact`, `Math.toIntExact` | an `ArithmeticException` instead of a silent wrap-around |
| `Integer.MAX_VALUE`, `Long.MIN_VALUE` | the limits |
| `BigInteger`, `BigDecimal` | exact numbers of any size: slower, but fine in real code |

## Operations and complexity

| Operation | Cost |
|---|---|
| `+`, `−`, `*`, `/`, `%` on `int` or `long` | O(1) |
| a loop over the digits of x | O(log x): 10 steps for an `int`, 19 for a `long` |
| `BigInteger` addition, multiplication | O(d), and about O(d²) for interview-sized d-digit numbers |

## Patterns

The rest of this module, at a glance:
- **gcd, lcm, modular inverses**: [GCD and modular inverses](lesson:gcd-and-modular-inverses).
- **Primes and factorisation**: [primes and sieves](lesson:primes-and-sieves).
- **Huge powers, "modulo 10⁹ + 7", linear recurrences**: [fast exponentiation](lesson:fast-exponentiation).
- **Counting the ways**: [combinatorics](lesson:combinatorics).
- **Numbers as strings, base conversion**: [big numbers and bases](lesson:big-numbers-and-bases).
- **Rectangles, lines, distances**: [geometry](lesson:geometry-essentials).
- **Randomness**: [shuffling and reservoir sampling](lesson:shuffling-and-reservoir-sampling), [weighted and rejection sampling](lesson:weighted-and-rejection-sampling).

### Digit puzzles

- **Add Digits (LC 258)** has the closed form `1 + (n − 1) % 9` for n > 0: the digital root.
- **Happy Number (LC 202)** repeatedly replaces n by the sum of the squares of its digits. The values must eventually repeat, so it's cycle detection with [fast and slow pointers](lesson:fast-and-slow-pointers).
- **Avoid doubles** whenever an integer formulation exists: compare fractions by cross-multiplying, distances by their squares, and slopes as reduced `(dx, dy)` pairs ([geometry](lesson:geometry-essentials)).

## Common mistakes

- **Widening after the overflow:** `(long) (a * b)` instead of `(long) a * b`.
- **Checking for overflow after the operation**, when the value has already wrapped around: check before, as `reverse` does.
- **Negative remainders:** `-7 % 3` is −1 in Java; use `Math.floorMod` for an index or a residue.
- **`Math.abs(Integer.MIN_VALUE)`**, and `-n` on `Integer.MIN_VALUE`.
- **`(lo + hi) / 2`**, which overflows for large indexes: use `lo + (hi − lo) / 2` ([binary search](lesson:binary-search-template)).
- **Comparing doubles with `==`**, or using doubles where an integer formulation exists.

## Key takeaways

- `int` holds about ±2.1 × 10⁹, `long` about ±9.2 × 10¹⁸; a product of two `int`s above 46,340 overflows.
- Overflow is silent: widen one operand *before* multiplying, or use the `Math.*Exact` methods.
- `/` rounds toward zero and `%` keeps the dividend's sign; `Math.floorMod` gives a true residue.
- Digit loops: `x % 10`, `x / 10`, `result * 10 + d`, with the overflow check before the multiply.
- Prefer exact integer formulations to doubles.

## Knowledge check

```quiz
? What does `long x = 100_000 * 100_000;` store?
+ 1410065408: the multiplication overflows as an int before the result is widened
- 10000000000
! That needs one operand to be a long: 100_000L * 100_000.
- It throws ArithmeticException
! Plain multiplication wraps silently; only multiplyExact throws.
- It doesn't compile
! It compiles, which is the trap.
> Widen before the operation, not after.

? What do `-7 % 3` and `Math.floorMod(-7, 3)` return in Java?
+ −1 and 2
- 2 and 2
! % keeps the sign of the dividend.
- −1 and −1
! floorMod returns a value in [0, 3).
- 1 and 2
! −7 = −2 · 3 − 1, so % gives −1.
> Use floorMod for array indexes and residues.

? In Reverse Integer, why check `result > Integer.MAX_VALUE / 10` before `result * 10`?
+ Once the multiplication overflows, the wrapped value can't be detected reliably, so the check must come first
- Because division is faster than multiplication
! Speed isn't the reason.
- To skip negative numbers
! The check covers both signs with MIN_VALUE / 10.
- It's optional; Java throws on overflow
! Java doesn't throw on int overflow.
> Check before the operation that could overflow.

? What does `Math.abs(Integer.MIN_VALUE)` return?
+ −2147483648, because +2³¹ doesn't fit in an int
- 2147483648
! That value doesn't exist as an int.
- 2147483647
! abs doesn't clamp.
- It throws ArithmeticException
! Math.abs wraps silently; Math.absExact throws.
> Widen to long first: Math.abs((long) n).
```
