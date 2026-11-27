## The idea

- **One number:** a composite n has a factor no bigger than √n, so test the divisors up to √n (**trial division**).
- **All the primes up to n:** instead of testing each number, cross out the multiples of each prime (**the sieve of Eratosthenes**).
- **Many factorisations:** a sieve that records each number's **smallest prime factor** turns factorising into repeated division.

## When to use it

- "Is n prime?", "the prime factors of n": trial division, O(√n).
- "Count the primes below n", "all primes up to n": the sieve.
- Factorise *many* numbers up to about 10⁶–10⁷, count divisors, or group numbers by shared prime factors: the smallest-prime-factor sieve.
- "Numbers whose only prime factors are…", "the n-th number of a sequence built by multiplying": merge sorted streams (ugly numbers).

## How it works

- **Why √n:** if `n = a · b` with `a ≤ b`, then `a ≤ √n`. So if nothing up to √n divides n, n is prime.
- **6k ± 1:** every prime above 3 has that form, because 6k, 6k + 2, 6k + 3 and 6k + 4 are divisible by 2 or 3. Checking only those skips two thirds of the candidates.
- **Why the sieve starts at `i * i`:** a smaller multiple `i · k` with `k < i` has a prime factor smaller than `i`, so it was crossed out already.

```text
n = 30                      new numbers crossed out
i = 2    from 4:   4 6 8 10 12 14 16 18 20 22 24 26 28
i = 3    from 9:   9 15 21 27                       (12, 18, 24 were already gone)
i = 4    composite: skip
i = 5    from 25:  25
i = 6    6 * 6 = 36 >= 30: stop
primes:  2 3 5 7 11 13 17 19 23 29   -> 10
```

## Java template

```java
// Trial division: a composite n has a factor <= sqrt(n).
// Checking 6k - 1 and 6k + 1 skips multiples of 2 and 3.
static boolean isPrime(long n) {
    if (n < 2) return false;
    if (n < 4) return true;                      // 2 and 3
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (long i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}
```

Write the loop as `i * i <= n` with a `long i`, not `i <= Math.sqrt(n)`: no floating point, and no overflow on `i * i`.

## Worked examples

### Prime factorisation by trial division

```java
// Prime factorisation by trial division, O(sqrt n): 360 -> [2, 2, 2, 3, 3, 5].
static List<Long> primeFactors(long n) {
    List<Long> factors = new ArrayList<>();
    for (long p = 2; p * p <= n; p++) {
        while (n % p == 0) {
            factors.add(p);
            n /= p;
        }
    }
    if (n > 1) factors.add(n);                   // what's left is one prime bigger than sqrt(n)
    return factors;
}
```

### Count Primes (LC 204): the sieve

```java
// LC 204 Count Primes (strictly below n): the sieve of Eratosthenes, O(n log log n).
public int countPrimes(int n) {
    if (n < 3) return 0;
    boolean[] composite = new boolean[n];
    int count = n - 2;                           // 2 .. n - 1, minus each composite crossed out
    for (int i = 2; (long) i * i < n; i++) {
        if (composite[i]) continue;
        // smaller multiples were crossed out by smaller primes
        for (int j = i * i; j < n; j += i) {
            if (!composite[j]) {
                composite[j] = true;
                count--;
            }
        }
    }
    return count;
}
```

### Factorising many numbers: the smallest-prime-factor sieve

```java
// Smallest-prime-factor sieve: O(n log log n) once, then any x <= n factorises in O(log x).
class Factorizer {
    private final int[] spf;                     // spf[x] = the smallest prime dividing x

    Factorizer(int n) {
        spf = new int[n + 1];
        for (int i = 2; i <= n; i++) {
            if (spf[i] != 0) continue;           // not prime: a smaller prime already claimed it
            for (int j = i; j <= n; j += i) {
                if (spf[j] == 0) spf[j] = i;
            }
        }
    }

    List<Integer> factorize(int x) {
        List<Integer> factors = new ArrayList<>();
        while (x > 1) {
            factors.add(spf[x]);
            x /= spf[x];
        }
        return factors;
    }

    // x = p1^a1 * p2^a2 * ... has (a1 + 1)(a2 + 1)... divisors.
    int countDivisors(int x) {
        int result = 1;
        while (x > 1) {
            int p = spf[x], exponent = 0;
            while (x % p == 0) {
                x /= p;
                exponent++;
            }
            result *= exponent + 1;
        }
        return result;
    }
}
```

From a factorisation `x = p₁^a₁ · p₂^a₂ ⋯` you get the number of divisors `(a₁ + 1)(a₂ + 1)⋯`, the sum of divisors, and Euler's totient `φ(x) = x · ∏(1 − 1/p)`.

### Ugly Number II (LC 264): numbers built from given primes

```java
// LC 264 Ugly Number II: the n-th number whose only prime factors are 2, 3 and 5.
// Every ugly number is a smaller one times 2, 3 or 5: merge those three sorted streams.
public int nthUglyNumber(int n) {
    int[] ugly = new int[n];
    ugly[0] = 1;
    int i2 = 0, i3 = 0, i5 = 0;
    for (int k = 1; k < n; k++) {
        int next = Math.min(ugly[i2] * 2, Math.min(ugly[i3] * 3, ugly[i5] * 5));
        ugly[k] = next;
        if (next == ugly[i2] * 2) i2++;      // advance EVERY stream that produced it: 6 = 3*2 = 2*3
        if (next == ugly[i3] * 3) i3++;
        if (next == ugly[i5] * 5) i5++;
    }
    return ugly[n - 1];
}
```

```text
x2 stream:   2  4  6  8  10  12 ...
x3 stream:   3  6  9  12  15 ...
x5 stream:   5  10  15  20 ...
merged:   1  2  3  4  5  6  8  9  10  12 ...      6 comes from x2 and x3: advance both, no duplicate
```

Every ugly number except 1 is a smaller ugly number times 2, 3 or 5, so the sequence is the merge of three sorted streams, each a pointer into the sequence itself. That's O(n).

## Complexity

| Task | Time | Space |
|---|---|---|
| Trial division, factorising one number | O(√n) | O(1) |
| The sieve up to n | O(n log log n), effectively linear | n booleans (10⁷ of them is 10 MB; a `BitSet` cuts that by 8) |
| The smallest-prime-factor sieve | O(n log log n) once, then O(log x) per factorisation | n ints |
| Ugly numbers | O(n) | O(n) |

## Variations

- **Listing the divisors of one n:** loop `i` up to √n and take both `i` and `n / i`: O(√n).
- **Grouping by shared prime factors:** Largest Component Size by Common Factor (LC 952) unions every number with each of its prime factors, using [union-find](lesson:union-find).
- **k primes instead of three:** Super Ugly Number (LC 313) uses k pointers, or a min-heap. Ugly Number (LC 263) just divides out 2, 3 and 5 and checks that 1 is left.
- **The linear sieve** crosses out each composite exactly once, through its smallest prime factor, for O(n). It builds the smallest-prime-factor table as a by-product.
- **Huge single numbers** (up to 10¹⁸): trial division is too slow. Miller–Rabin with a fixed set of bases is deterministic for 64-bit numbers; name it if asked.

## Common mistakes

- **`i <= Math.sqrt(n)`**: floating-point rounding can skip the last divisor, and with `i < Math.sqrt(n)` prime squares such as 49 pass as prime.
- **An `int i` in `i * i <= n`**, which overflows for n near 2³¹.
- **`isPrime(1)` returning true**: 1 isn't prime.
- **LC 204 counts primes strictly below n**: an off-by-one at n itself is a classic.
- **Advancing only one stream** in Ugly Number II, which produces duplicates like 6 twice.

## Practice

Count Primes (LC 204), Ugly Number (LC 263), Ugly Number II (LC 264), Super Ugly Number (LC 313), Four Divisors (LC 1390), Closest Prime Numbers in Range (LC 2523), Largest Component Size by Common Factor (LC 952).

## Key takeaways

- Trial division to √n decides one number in O(√n); check 2, 3, then 6k ± 1.
- The sieve crosses out multiples of each prime from i², in O(n log log n).
- A smallest-prime-factor table factorises any number up to n in O(log x).
- Divisor counts, divisor sums and the totient all follow from a factorisation.
- Sequences built by multiplying are merges of sorted streams; advance every pointer that matches.

## Knowledge check

```quiz
? Why can trial division stop at √n?
+ If n = a · b with a ≤ b, then a ≤ √n, so any composite n has a factor no bigger than √n
- Because primes are rare above √n
! The argument is about factors, not density.
- Because √n is always prime
! It usually isn't even an integer.
- It can't; it must test up to n / 2
! That's correct but far slower.
> Loop with i * i <= n on a long.

? Why does the sieve start crossing out the multiples of i at i · i?
+ Any smaller multiple i · k with k < i has a smaller prime factor, so it's already crossed out
- Because i · i is the first even multiple
! Evenness isn't the reason.
- To avoid crossing out i itself
! Starting at 2i would also skip i; i · i saves more work.
- It must start at 2i, or composites are missed
! Every composite below i · i has a smaller prime factor.
> The outer loop can also stop once i · i passes n.

? In Ugly Number II, why advance every pointer whose product equals the new number?
+ The same number can come from several streams (6 = 2 · 3 = 3 · 2); advancing only one would add it twice
- To keep the three pointers equal
! They move at different speeds.
- Because each stream is used only once
! Each pointer walks the whole sequence.
- It doesn't matter which pointer moves
! Leaving a matching pointer behind produces a duplicate next round.
> The merge must skip equal heads together.

? With a smallest-prime-factor table up to n, how long does factorising x ≤ n take?
+ O(log x): every division by spf[x] at least halves x
- O(√x)
! That's trial division without the table.
- O(1)
! There's one division per prime factor, with repeats.
- O(n log log n)
! That's the one-time cost of building the table.
> Build once, then factorise many numbers cheaply.
```
