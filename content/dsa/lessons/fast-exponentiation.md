## The idea

Write the exponent in binary: `a^13 = a^8 · a^4 · a^1`. Square the base at every step (a, a², a⁴, a⁸, …), and multiply it into the result whenever the current bit of the exponent is 1. That's O(log b) multiplications instead of b.

## When to use it

- `a^b` with b up to 10⁹ or 10¹⁸, usually "modulo 10⁹ + 7"; Pow(x, n).
- **A modular inverse** modulo a prime: `a^(p−2)` by Fermat.
- **Anything "applied n times"** that composes associatively: matrices for linear recurrences with n up to 10¹⁸, permutations, function composition.

## How it works

```text
exp = 13 = 0b1101       base      result
bit 0 = 1               a         a
bit 1 = 0               a^2       a            (bit not set: skip)
bit 2 = 1               a^4       a^5
bit 3 = 1               a^8       a^13
```

The same loop works for anything you can multiply associatively, with an identity to start from: numbers modulo m (identity 1), doubles, and matrices (the identity matrix).

## Java template

```java
// base^exp mod m by square-and-multiply, O(log exp).
// Safe for m up to about 3 * 10^9 (products < 2^63).
static long modPow(long base, long exp, long mod) {
    long result = 1 % mod;                       // 1 % 1 == 0
    base = Math.floorMod(base, mod);
    while (exp > 0) {
        if ((exp & 1) == 1) result = result * base % mod;  // this bit of exp is set: multiply it in
        base = base * base % mod;                          // base, base^2, base^4, base^8, ...
        exp >>= 1;
    }
    return result;
}
```

## Worked examples

### Pow(x, n) (LC 50)

The same loop on doubles:

```java
// LC 50 Pow(x, n): square-and-multiply on doubles.
// Widen n to long: -Integer.MIN_VALUE overflows an int.
public double myPow(double x, int n) {
    long e = n;
    if (e < 0) {
        x = 1 / x;
        e = -e;
    }
    double result = 1;
    while (e > 0) {
        if ((e & 1) == 1) result *= x;
        x *= x;
        e >>= 1;
    }
    return result;
}
```

`long e = n` matters: for `n = Integer.MIN_VALUE`, `-n` is still negative in an `int`. The recursive version, halving the exponent, is in [recursion in practice](lesson:recursion-in-practice).

### Answers modulo 10⁹ + 7

"Return the answer modulo 10⁹ + 7" means the true answer is astronomically large, so you reduce after **every** addition and multiplication:

```java
// prime; (MOD - 1)^2 < 2^63, so a product of two residues fits
static final long MOD = 1_000_000_007L;

// Every input is already in [0, MOD); every output stays there.
static long addMod(long a, long b) { return (a + b) % MOD; }
// % can go negative: add MOD back
static long subMod(long a, long b) { return ((a - b) % MOD + MOD) % MOD; }
static long mulMod(long a, long b) { return a * b % MOD; }

// Division = multiplying by the inverse. MOD is prime,
// so by Fermat a^(MOD-1) = 1 and a^(MOD-2) = 1/a.
static long divMod(long a, long b) { return a * modPow(b, MOD - 2, MOD) % MOD; }
```

| Operation | Safe form | Why |
|---|---|---|
| a + b | `(a + b) % MOD` | two values below MOD sum to less than 2·MOD |
| a − b | `((a - b) % MOD + MOD) % MOD` | Java's `%` keeps the sign, so the result can be negative |
| a · b | `a * b % MOD` on `long`s | (MOD − 1)² < 2⁶³; an `int * int` overflows *before* the `%` |
| a / b | `a * inverse(b) % MOD` | `%` doesn't distribute over division; multiply by the [inverse](lesson:gcd-and-modular-inverses) |
| comparisons | don't | after reducing, order means nothing; compare the true values (or their logarithms) |

The classic bug is taking `% MOD` only at the end: by then the intermediate values have already overflowed.

### Linear recurrences: matrix exponentiation

Write one step of the recurrence as a matrix multiplication, then raise the matrix to the n-th power with the same square-and-multiply loop:

```text
| F(n+1) |   | 1  1 |   | F(n)   |                | 1  1 |^n   | F(n+1)  F(n)   |
| F(n)   | = | 1  0 | * | F(n-1) |       so       | 1  0 |   = | F(n)    F(n-1) |
```

```java
// Linear recurrences in O(k^3 log n). For Fibonacci:
// [[1, 1], [1, 0]]^n = [[F(n+1), F(n)], [F(n), F(n-1)]].
static long[][] matMul(long[][] a, long[][] b) {
    int rows = a.length, cols = b[0].length, inner = b.length;
    long[][] c = new long[rows][cols];
    for (int i = 0; i < rows; i++) {
        for (int k = 0; k < inner; k++) {
            for (int j = 0; j < cols; j++) c[i][j] = (c[i][j] + a[i][k] * b[k][j]) % MOD;
        }
    }
    return c;
}

static long[][] matPow(long[][] m, long exp) {
    long[][] result = new long[m.length][m.length];
    for (int i = 0; i < m.length; i++) result[i][i] = 1;   // the identity matrix
    while (exp > 0) {                                      // the same square-and-multiply as modPow
        if ((exp & 1) == 1) result = matMul(result, m);
        m = matMul(m, m);
        exp >>= 1;
    }
    return result;
}

static long fibMod(long n) {                                 // F(n) mod MOD, for n up to 10^18
    return matPow(new long[][] { { 1, 1 }, { 1, 0 } }, n)[0][1];
}
```

A recurrence with k terms needs a k × k matrix. For n up to about 10⁷, a plain loop is simpler; mention matrix power when n is astronomically large, for example in follow-ups to Fibonacci Number (LC 509), Climbing Stairs (LC 70), N-th Tribonacci Number (LC 1137), Knight Dialer (LC 935) or Count Vowels Permutation (LC 1220).

## Complexity

- `modPow` and `myPow`: **O(log b)** multiplications, at most two per bit of the exponent.
- Matrix power: **O(k³ log n)** for a k × k matrix.

## Variations

- **Super Pow (LC 372)** computes `a^b mod 1337` with b given as an array of digits, using `a^(10q + d) = (a^q)^10 · a^d`.
- **Count Good Numbers (LC 1922):** 5 choices at even positions and 4 at odd ones give `5^⌈n/2⌉ · 4^⌊n/2⌋`, with n up to 10¹⁵.
- **Fermat's inverse** of a modulo a prime p is `modPow(a, p − 2, p)`; for other moduli, use the [extended Euclidean algorithm](lesson:gcd-and-modular-inverses).
- **Moduli near 2⁶³:** `base * base` overflows a `long` once the modulus passes about 3 × 10⁹. Use `Math.multiplyHigh`, or `BigInteger.modPow`, which exists but isn't what interviewers want to see.
- `Math.pow` is fine for doubles, but useless for exact large integers.

## Common mistakes

- **Taking `% MOD` only at the end**, after the intermediate values have overflowed.
- **`int * int` before the `%`**: the product overflows first. Use `long`s.
- **Negating an `int` exponent**: `-Integer.MIN_VALUE` is still negative.
- **Returning 1 for modulus 1**: anything modulo 1 is 0, hence `1 % mod` as the starting value.
- **Comparing residues** as if they were the true values.

## Practice

Pow(x, n) (LC 50), Super Pow (LC 372), Count Good Numbers (LC 1922), Fibonacci Number (LC 509) with matrix power, N-th Tribonacci Number (LC 1137), Knight Dialer (LC 935), Count Vowels Permutation (LC 1220).

## Key takeaways

- Square the base every step, and multiply it in when the exponent's bit is 1: O(log b).
- Under a modulus, reduce after every addition and multiplication, on `long`s, and add M back after subtracting.
- Divide by multiplying by the inverse: `a^(p−2)` for a prime p.
- Matrix power turns a k-term linear recurrence into O(k³ log n).
- Widen exponents to `long` before negating them.

## Knowledge check

```quiz
? About how many multiplications does modPow do for an exponent of 10⁹?
+ About 60: two per bit, and 10⁹ has about 30 bits
- About 10⁹
! That's multiplying one factor at a time.
- About 31 600, the square root
! Fast power is logarithmic, not square-root.
- Exactly 1
! One multiplication only squares the base once.
> O(log b) multiplications.

? Why does myPow copy n into a long before negating it?
+ For n = Integer.MIN_VALUE, −n doesn't fit in an int and stays negative
- To make the multiplication faster
! The exponent's type doesn't affect speed.
- Because doubles need long exponents
! The type of x doesn't matter here.
- It doesn't need to
! LC 50 tests n = −2³¹.
> Widen before negating.

? "Return the count modulo 10⁹ + 7." When should you take the modulo?
+ After every addition and multiplication, so no intermediate value overflows
- Only at the end
! By then the intermediate values have overflowed.
- Only when the value exceeds 10⁹ + 7
! Checking first costs as much as reducing, and is easy to miss.
- Never; long is big enough
! Products of residues fit, but repeated products don't.
> Reduce early and often.

? You need F(10¹⁸) mod 10⁹ + 7. Which approach works?
+ Raise the matrix [[1, 1], [1, 0]] to the n-th power with square-and-multiply
- A loop from 2 to n
! 10¹⁸ iterations would take centuries.
- Memoised recursion
! That's still n states.
- Binet's formula with doubles
! Doubles lose all precision for such n.
> O(log n) 2 × 2 matrix multiplications.
```
