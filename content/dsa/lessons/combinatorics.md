## The idea

When a problem asks for "the number of ways", count with a formula instead of enumerating. Most counts reduce to factorials, **binomial coefficients** C(n, k) and a few named sequences, and the real work is computing them without overflow.

## When to use it

- "The number of ways" to choose, arrange or build something.
- Grid paths, committees, distributing identical items into bins.
- Counting binary search trees, balanced parentheses or triangulations: the Catalan numbers.
- "Modulo 10⁹ + 7" alongside a count: factorials and inverse factorials.

## How it works

| Count | Formula | Example |
|---|---|---|
| orderings of n items | n! | permutations |
| ordered choices of k from n | n! / (n − k)! | podium finishes |
| subsets of size k | C(n, k) = n! / (k! (n − k)!) | committees |
| all subsets | 2ⁿ | bitmask enumeration |
| k items from n types, repeats allowed | C(n + k − 1, k) | stars and bars |
| monotone paths in an a × b grid | C(a + b, a) | Unique Paths (62) |
| Catalan number Cₙ | C(2n, n) / (n + 1) | BSTs with n nodes, balanced parentheses with n pairs |

Three ways to compute C(n, k):

| Method | When | Cost |
|---|---|---|
| Pascal's triangle, `C(n, k) = C(n−1, k−1) + C(n−1, k)` | n up to a few thousand; no division, so any modulus works | O(n²) table |
| multiplicative, `r = r · (n − k + i) / i` | one exact value that fits in a `long` | O(k) |
| factorials and inverse factorials mod p | many queries modulo a prime | O(n) once, then O(1) each |

## Java template

```java
// C(n, r) mod a prime: n! / (r! (n - r)!) with precomputed
// factorials and inverse factorials. O(1) per query.
class Binomial {
    private final long[] fact, invFact;

    Binomial(int n) {
        fact = new long[n + 1];
        invFact = new long[n + 1];
        fact[0] = 1;
        for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % MOD;
        // One Fermat inverse for n!, then walk down with 1/(i-1)! = i * (1/i!).
        invFact[n] = modPow(fact[n], MOD - 2, MOD);
        for (int i = n; i > 0; i--) invFact[i - 1] = invFact[i] * i % MOD;
    }

    long choose(int n, int r) {
        if (r < 0 || r > n) return 0;
        return fact[n] * invFact[r] % MOD * invFact[n - r] % MOD;
    }
}
```

`MOD` and `modPow` come from [fast exponentiation](lesson:fast-exponentiation). One Fermat inverse for n! is enough: each smaller inverse factorial follows with one multiplication.

## Worked examples

### Unique Paths (LC 62)

```java
// LC 62 Unique Paths: choose which (m - 1) of the (m + n - 2) moves go down.
// That's C(m+n-2, m-1), computed without factorials.
public int uniquePaths(int m, int n) {
    int moves = m + n - 2, downs = Math.min(m, n) - 1;
    long result = 1;
    for (int i = 1; i <= downs; i++) {
        // exact: after step i, result = C(moves - downs + i, i)
        result = result * (moves - downs + i) / i;
    }
    return (int) result;
}
```

It stays exact at every step: each partial result is itself a binomial coefficient, so the division never leaves a remainder.

### Unique Binary Search Trees (LC 96): the Catalan numbers

```java
// LC 96 Unique Binary Search Trees: the Catalan numbers. Try every root; the two sides multiply.
public int numTrees(int n) {
    long[] trees = new long[n + 1];
    trees[0] = 1;
    for (int nodes = 1; nodes <= n; nodes++) {
        for (int root = 1; root <= nodes; root++) {
            trees[nodes] += trees[root - 1] * trees[nodes - root];    // left x right shapes
        }
    }
    return (int) trees[n];
}
```

Choosing root `r` leaves `r − 1` nodes on the left and `n − r` on the right, giving `Cₙ = Σ Cᵣ₋₁ · Cₙ₋ᵣ`. The same recurrence counts the outputs of Generate Parentheses (LC 22).

### Factorial Trailing Zeroes (LC 172)

```java
// LC 172 Factorial Trailing Zeroes: count the factors
// of 5 in n! (there are always more 2s than 5s).
public int trailingZeroes(int n) {
    int zeros = 0;
    while (n > 0) {
        n /= 5;                                  // multiples of 5, then of 25, 125, ...
        zeros += n;
    }
    return zeros;
}
```

This is Legendre's formula: the power of a prime p in n! is `⌊n/p⌋ + ⌊n/p²⌋ + ⌊n/p³⌋ + …`.

## Complexity

| Method | Time | Space |
|---|---|---|
| `Binomial` setup, then each query | O(n + log MOD), then O(1) | O(n) |
| multiplicative C(n, k) | O(k) | O(1) |
| Pascal's triangle | O(n²) | O(n²), or O(n) row by row |
| Catalan by the recurrence | O(n²) | O(n) |

## Variations

- **Pascal's triangle (LC 118)** needs no division, so it works with any modulus, including one that isn't prime:

  ```java
  long[][] c = new long[n + 1][n + 1];
  for (int i = 0; i <= n; i++) {
      c[i][0] = 1;
      for (int k = 1; k <= i; k++) c[i][k] = (c[i - 1][k - 1] + c[i - 1][k]) % mod;
  }
  ```

- **Stars and bars:** Count Sorted Vowel Strings (LC 1641) picks n vowels from 5 types with repeats, in sorted order: C(n + 4, 4).
- **Inclusion–exclusion:** the numbers up to x divisible by a or b are `x/a + x/b − x/lcm(a, b)` ([GCD and LCM](lesson:gcd-and-modular-inverses)).
- **The Catalan closed form** `C(2n, n) / (n + 1)` is O(n) with the `Binomial` class.
- **A small prime modulus** (p below n): factorials hit 0, and Lucas' theorem splits the binomial digit by digit in base p.

## Common mistakes

- **Computing n! directly**: 21! already overflows a `long`.
- **Dividing under a modulus**: multiply by the inverse instead.
- **Dividing before multiplying** in the multiplicative formula, which loses the remainder.
- **Off-by-one in stars and bars**: k items into n bins is C(n + k − 1, k), not C(n + k, k).
- **Mixing up ordered and unordered choices**: permutations count orders, combinations don't.

## Practice

Unique Paths (LC 62), Pascal's Triangle (LC 118), Unique Binary Search Trees (LC 96), Factorial Trailing Zeroes (LC 172), Count Sorted Vowel Strings (LC 1641), Count All Valid Pickup and Delivery Options (LC 1359), Number of Ways to Reorder Array to Get Same BST (LC 1569).

## Key takeaways

- Count with formulas: n!, C(n, k), 2ⁿ, stars and bars, and the Catalan numbers.
- For many binomials modulo a prime, precompute factorials and inverse factorials: O(1) per query.
- For one exact value, multiply then divide step by step; every partial result is a whole binomial.
- Pascal's triangle avoids division and works with any modulus.
- The power of p in n! is `⌊n/p⌋ + ⌊n/p²⌋ + …`.

## Knowledge check

```quiz
? How many monotone paths cross a 3 × 7 grid (LC 62 with m = 3, n = 7)?
+ 28: C(8, 2), choosing which 2 of the 8 moves go down
- 21
! That's C(7, 2); there are 8 moves in all.
- 56
! That's C(8, 3).
- 10
! That undercounts the moves.
> m − 1 downs and n − 1 rights, in any order.

? Which is the first factorial that overflows a long?
+ 21!, about 5.1 × 10¹⁹
- 13!
! That's the first to overflow an int.
- 20!
! 20! ≈ 2.4 × 10¹⁸ still fits.
- 25!
! It overflows well before that.
> Use factorials modulo a prime, or the multiplicative formula.

? How many trailing zeroes does 100! have?
+ 24: 100/5 + 100/25 = 20 + 4
- 20
! The multiples of 25 contribute a second 5.
- 10
! Counting multiples of 10 misses the 5s paired with 2s.
- 2
! That's only the zeroes of 100 itself.
> Legendre's formula counts the factors of 5.

? How many structurally different BSTs hold the keys 1, 2 and 3?
+ 5, the Catalan number C₃
- 6
! That's 3!, the orderings; different orders can give the same tree.
- 3
! Each of the 3 roots allows more than one shape.
- 8
! That's 2³.
> Cₙ = Σ Cᵣ₋₁ · Cₙ₋ᵣ over the possible roots r.
```
