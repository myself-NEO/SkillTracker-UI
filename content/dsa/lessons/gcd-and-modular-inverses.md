## The idea

**Euclid's algorithm:** every common divisor of `a` and `b` also divides `a mod b`, so `gcd(a, b) = gcd(b, a mod b)`, and `gcd(a, 0) = a`. The numbers shrink fast.

**The extended version** also finds integers x and y with `a·x + b·y = gcd(a, b)` (Bézout's identity). When `gcd(a, m) = 1`, its x is the **modular inverse** of a: the number that "divides by a" modulo m.

## When to use it

- "Split into equal groups", fractions, ratios, "when do two cycles line up again?": gcd and lcm.
- "Measure exactly", combinations of two amounts: Bézout, multiples of the gcd.
- "Solve a·x ≡ 1 (mod m)", division under a modulus, the Chinese Remainder Theorem: the extended version.

## How it works

```text
gcd(48, 18)    48 = 2 * 18 + 12
gcd(18, 12)    18 = 1 * 12 + 6
gcd(12, 6)     12 = 2 * 6  + 0
gcd(6, 0)  =   6
```

- **Why it's fast:** every two steps at least halve the larger number, so Euclid takes O(log min(a, b)) steps. Consecutive Fibonacci numbers are the worst case.
- **The extended version** runs Euclid, and on the way back out of the recursion rewrites the coefficients: if `b·x' + (a mod b)·y' = g`, and `a mod b = a − ⌊a/b⌋·b`, then `a·y' + b·(x' − ⌊a/b⌋·y') = g`.
- **An inverse exists exactly when `gcd(a, m) = 1`.** Then `a·x + m·y = 1`, and reducing modulo m leaves `a·x ≡ 1`. If `gcd(a, m) > 1`, there is **no** inverse, and "dividing" by `a` modulo `m` is meaningless.

## Java template

```java
// Euclid: gcd(a, b) = gcd(b, a mod b), and gcd(a, 0) = a. O(log min(a, b)) steps.
static long gcd(long a, long b) {
    while (b != 0) {
        long t = a % b;
        a = b;
        b = t;
    }
    return Math.abs(a);
}

static long lcm(long a, long b) {
    return a / gcd(a, b) * b;             // divide FIRST: a * b can overflow even when the lcm fits
}

// Extended Euclid: returns {g, x, y} with a*x + b*y = g = gcd(a, b).
static long[] extGcd(long a, long b) {
    if (b == 0) return new long[] { a, 1, 0 };
    long[] r = extGcd(b, a % b);               // b*x' + (a mod b)*y' = g, and a mod b = a - (a/b)*b
    return new long[] { r[0], r[2], r[1] - (a / b) * r[2] };
}

// The inverse of a modulo m exists exactly when gcd(a, m) = 1. Works for any m, prime or not.
static long modInverse(long a, long m) {
    long[] r = extGcd(Math.floorMod(a, m), m);
    if (r[0] != 1) throw new ArithmeticException("no inverse: gcd(a, m) = " + r[0]);
    return Math.floorMod(r[1], m);
}
```

- `gcd(a, 0) = a`, so 0 is the neutral starting value when folding over an array: `g = 0; for (x : arr) g = gcd(g, x);`.
- `gcd(a, b) · lcm(a, b) = a · b`. Two cycles of lengths a and b line up every `lcm(a, b)` steps.
- Java has `BigInteger.gcd` but no `Math.gcd`: write the five-line loop.

## Worked examples

### X of a Kind in a Deck of Cards (LC 914)

```java
// LC 914 X of a Kind: equal groups of size >= 2 exist iff the gcd of all the counts is >= 2.
public boolean hasGroupsSizeX(int[] deck) {
    Map<Integer, Integer> count = new HashMap<>();
    for (int card : deck) count.merge(card, 1, Integer::sum);
    long g = 0;                                  // gcd(0, x) = x, so 0 is the starting value
    for (int c : count.values()) g = gcd(g, c);
    return g >= 2;
}
```

### Water and Jug Problem (LC 365): Bézout

```java
// LC 365 Water and Jug: by Bezout, the amounts you can measure are
// exactly the multiples of gcd(x, y) that fit in both jugs together.
public boolean canMeasureWater(int x, int y, int target) {
    if (target > (long) x + y) return false;
    return target % gcd(x, y) == 0;
}
```

**Bézout's identity** is behind it: the values `a·x + b·y` for integers x and y (fill = +, empty = −) are exactly the multiples of `gcd(a, b)`.

### An inverse by hand

```text
extGcd(240, 46) = {2, -9, 47}        240 * (-9) + 46 * 47 = -2160 + 2162 = 2
modInverse(3, 7) = 5                 3 * 5 = 15 = 2 * 7 + 1
```

## Complexity

`gcd`, `lcm` and `extGcd` take **O(log min(a, b))** steps; the recursion in `extGcd` is that deep too.

## Variations

**Three ways to invert:**

| Modulus | How to invert a | Cost |
|---|---|---|
| a prime p, such as 10⁹ + 7 | Fermat: `a^(p−2) mod p` | O(log p): just `modPow` ([fast exponentiation](lesson:fast-exponentiation)) |
| any m, with gcd(a, m) = 1 | extended Euclid (above) | O(log m) |
| all of 1..n modulo a prime | inverse factorials ([combinatorics](lesson:combinatorics)), or `inv[i] = (p − p / i) · inv[p mod i] mod p` | O(n) in total |

- **The Chinese Remainder Theorem** combines `x ≡ a (mod m)` and `x ≡ b (mod n)`, for coprime m and n, into a single residue modulo `m·n`, using one inverse.
- **Fractions:** reduce `p/q` by `gcd(p, q)`: Fraction Addition and Subtraction (LC 592), Simplified Fractions (LC 1447).
- **Rotate Array (LC 189)**, in place by cycles, moves `gcd(n, k)` cycles.
- **Counting multiples:** the numbers up to x divisible by a or b number `x/a + x/b − x/lcm(a, b)`. With [binary search on the answer](lesson:binary-search-on-the-answer), that finds the Nth Magical Number (LC 878).

## Common mistakes

- **Computing `a * b / gcd`**: `a * b` can overflow even when the lcm fits. Divide first.
- **Forgetting `Math.abs`** with negative inputs: the gcd is defined as non-negative.
- **"Dividing" under a modulus** instead of multiplying by the inverse.
- **Using Fermat with a modulus that isn't prime**: `a^(m−2)` is only the inverse when m is prime.
- **Assuming an inverse exists**: when `gcd(a, m) > 1`, there's none.

## Practice

Find Greatest Common Divisor of Array (LC 1979), X of a Kind in a Deck of Cards (LC 914), Water and Jug Problem (LC 365), Fraction Addition and Subtraction (LC 592), Simplified Fractions (LC 1447), Nth Magical Number (LC 878).

## Key takeaways

- Euclid: `gcd(a, b) = gcd(b, a mod b)`, in O(log min(a, b)) steps; `gcd(a, 0) = a`.
- `lcm(a, b) = a / gcd(a, b) · b`: divide first to avoid overflow.
- Bézout: `a·x + b·y` reaches exactly the multiples of `gcd(a, b)`.
- The extended version finds x and y; when `gcd(a, m) = 1`, x mod m is the inverse of a.
- Invert with Fermat when the modulus is prime, and with extended Euclid otherwise.

## Knowledge check

```quiz
? Why compute lcm(a, b) as a / gcd(a, b) * b rather than a * b / gcd(a, b)?
+ a * b can overflow even when the lcm itself fits
- Because division is faster
! Speed isn't the issue.
- The two give different answers
! Mathematically they're equal; only overflow differs.
- Because gcd can be 0
! gcd is 0 only when both are 0; dividing first doesn't fix that.
> Divide first, then multiply.

? Does 6 have an inverse modulo 9?
+ No: gcd(6, 9) = 3, and an inverse exists only when the gcd is 1
- Yes: 6 · 6 = 36 ≡ 0
! 0 isn't 1.
- Yes, by Fermat: 6^7 mod 9
! Fermat needs a prime modulus, and 9 isn't prime.
- Yes: every non-zero number has one
! Only numbers coprime to the modulus do.
> No x makes 6x ≡ 1 (mod 9).

? Jugs of 3 and 5 litres: can you measure exactly 4 litres?
+ Yes: gcd(3, 5) = 1 divides 4, and 4 ≤ 3 + 5
- No: 4 isn't a multiple of 3 or 5
! Combinations of filling and emptying reach every multiple of the gcd.
- Only with a third jug
! Two jugs are enough.
- No: 4 is even and both jugs are odd
! Parity doesn't limit the combinations here.
> Bézout: 3 · 3 − 5 = 4.

? How many steps does Euclid's algorithm take on numbers below 10⁹?
+ About 45 at most: O(log min(a, b)), with consecutive Fibonacci numbers the worst case
- About 10⁹
! That's subtracting one at a time.
- About 31 600, the square root
! That's trial division.
- Exactly 1
! Only when b divides a.
> Every two steps at least halve the larger number.
```
