Interview math is a small toolkit hidden inside stories. This recap gathers the signals, the overflow checklist, the edge cases and the mistakes for the module.

## Recognizing the pattern

| The problem says… | Reach for |
|---|---|
| reverse digits, a palindromic number, "return 0 on overflow" | a digit loop with an overflow check ([math basics](lesson:math-basics)) |
| equal groups, fractions, cycles lining up | gcd and lcm ([GCD](lesson:gcd-and-modular-inverses)) |
| "measure exactly", combinations of two amounts | Bézout: multiples of the gcd ([GCD](lesson:gcd-and-modular-inverses)) |
| divide under a modulus | a modular inverse: Fermat if the modulus is prime, extended Euclid if not ([inverses](lesson:gcd-and-modular-inverses)) |
| "is prime", "the prime factors" of one number | trial division to √n ([primes](lesson:primes-and-sieves)) |
| "count the primes", all primes up to n | the sieve of Eratosthenes ([primes](lesson:primes-and-sieves)) |
| factorise many numbers, count divisors | the smallest-prime-factor sieve ([primes](lesson:primes-and-sieves)) |
| "only prime factors 2, 3, 5" | merge the multiplied streams ([ugly numbers](lesson:primes-and-sieves)) |
| `a^b` with a huge b, Pow(x, n) | square-and-multiply ([fast exponentiation](lesson:fast-exponentiation)) |
| "modulo 10⁹ + 7" | reduce after every operation ([modular arithmetic](lesson:fast-exponentiation)) |
| "the number of ways" to choose or arrange | binomial coefficients, Catalan numbers ([combinatorics](lesson:combinatorics)) |
| a linear recurrence with n up to 10¹⁸ | matrix exponentiation ([fast exponentiation](lesson:fast-exponentiation)) |
| numbers as long strings | schoolbook arithmetic with carries ([big numbers](lesson:big-numbers-and-bases)) |
| base conversion, Excel columns | a `%` and `/` loop, Horner's rule ([bases](lesson:big-numbers-and-bases)) |
| rectangles | per-axis interval overlap ([geometry](lesson:geometry-essentials)) |
| orientation, collinear points, polygon area, a hull | the cross product ([geometry](lesson:geometry-essentials)) |
| the closest points, comparing distances | squared distances ([geometry](lesson:geometry-essentials)) |
| shuffle, a random permutation | Fisher–Yates ([shuffling](lesson:shuffling-and-reservoir-sampling)) |
| a random item from a stream or list of unknown length | reservoir sampling ([reservoir](lesson:shuffling-and-reservoir-sampling)) |
| a random index proportional to a weight | prefix sums + binary search ([weighted choice](lesson:weighted-and-rejection-sampling)) |
| build one random source from another, a random point in a shape | rejection sampling ([rejection](lesson:weighted-and-rejection-sampling)) |
| O(1) insert, delete and getRandom | a list + a map, swapping with the last element ([GetRandom](lesson:weighted-and-rejection-sampling)) |

## Decision procedure

1. **Find the structure hiding in the story:** digits, a gcd, primes, a power, a count, a modulus, a shape, or randomness.
2. **Read the sizes.** n or an exponent up to 10¹⁸ needs O(log n): fast power, matrix power, binary search. Values up to 10⁶–10⁷ allow a sieve. A single number up to 10¹² allows trial division to √n.
3. **Prefer exact integer formulations** to doubles: cross-multiply fractions, square distances, reduce directions.
4. **Go through the overflow checklist** before you submit.

### The overflow checklist

Go through every `*`, `+` and `-`:
1. **Can either operand exceed 46,340 when you multiply two `int`s?** Then cast one operand to `long` first.
2. **Are you summing many values?** n · max must fit in the type of the sum.
3. **Is there a `% MOD` after *every* multiplication**, with both operands already reduced?
4. **Can a subtraction go negative before a `%`?** Add `MOD` back.
5. **Do you negate or `Math.abs` a value that can be `Integer.MIN_VALUE`?**
6. **Is there a `(lo + hi) / 2`?** Use `lo + (hi - lo) / 2`.
7. **Are you comparing doubles with `==`, or using a double as a map key?** Find the integer formulation.

## Edge cases to test

| Input | What it breaks |
|---|---|
| 0 and 1 | `isPrime(1)`, `gcd(0, 0)`, `lcm` with 0, `convertToBase7(0)`, `multiply("0", x)` |
| negative numbers | `%` signs, digit loops, base conversion |
| `Integer.MIN_VALUE` / `MAX_VALUE` | `-n`, `Math.abs`, `reverse`, `myPow(x, MIN_VALUE)` |
| perfect squares and prime squares (4, 9, 25, 49) | `i * i < n` versus `i * i <= n` in trial division and the sieve |
| exponent 0, modulus 1 | `modPow(a, 0, m)` must be `1 % m`; anything mod 1 is 0 |
| huge exponents, or n up to 10¹⁸ | loops that should have been O(log n) |
| duplicate points, vertical lines | slopes as doubles, a zero gcd |
| a single element | `nextInt(0)` throws; an empty reservoir |

## Common mistakes

1. **Widening after the overflow:** `(long) (a * b)` instead of `(long) a * b`.
2. **Taking `% MOD` only at the end**, after the intermediate values have already overflowed.
3. **Negative remainders:** `(a - b) % MOD` and `-7 % 3` are negative in Java.
4. **`Math.abs(Integer.MIN_VALUE)`** and `-n` on `Integer.MIN_VALUE`.
5. **Dividing under a modulus** instead of multiplying by the inverse.
6. **Using doubles for slopes, square roots or exact comparisons**, including double keys in a `HashMap`.
7. **Trial division with `i < Math.sqrt(n)`**, which misses prime squares.
8. **The biased shuffle**, swapping with any index instead of one in `[0, i]`.
9. **`Math.abs(rng.nextInt()) % n`** instead of `rng.nextInt(n)`.
10. **Picking a random point in a circle with a uniform radius**, which crowds the center.

## Practice ladder

**Number theory: warm-up**
- Palindrome Number (9)
- Reverse Integer (7)
- Plus One (66) and Add Binary (67)
- Excel Sheet Column Number (171) and Title (168)
- Power of Two (231), Power of Three (326)
- Add Digits (258)

**Number theory: core**
- Count Primes (204)
- Pow(x, n) (50)
- Factorial Trailing Zeroes (172)
- Ugly Number II (264)
- Add Strings (415) and Multiply Strings (43)
- X of a Kind in a Deck of Cards (914)
- Water and Jug Problem (365)
- Unique Paths (62), Unique Binary Search Trees (96)
- Fraction to Recurring Decimal (166)
- Happy Number (202)

**Geometry**
- Rectangle Overlap (836) and Rectangle Area (223)
- Check If It Is a Straight Line (1232)
- Valid Square (593)
- K Closest Points to Origin (973)
- Max Points on a Line (149)

**Randomized**
- Shuffle an Array (384)
- Linked List Random Node (382) and Random Pick Index (398)
- Random Pick with Weight (528)
- Implement Rand10() Using Rand7() (470)
- Generate Random Point in a Circle (478)
- Insert Delete GetRandom O(1) (380)

**Hard**
- Super Pow (372)
- Largest Component Size by Common Factor (952)
- Nth Magical Number (878): binary search on the answer, counting with `x/a + x/b − x/lcm(a, b)`
- Erect the Fence (587)
- Insert Delete GetRandom O(1) - Duplicates allowed (381)
- Rectangle Area II (850)

## The one-page summary

```text
LIMITS        int ~2.1e9 (a*b overflows past 46,340); long ~9.2e18; double exact to 2^53
              widen BEFORE the operation: (long) a * b; floorMod for residues; MIN_VALUE has no abs
DIGITS        d = x % 10; x /= 10; r = r * 10 + d; check r > MAX/10 before * 10
GCD           while (b != 0) { t = a % b; a = b; b = t; }   lcm = a / gcd * b
EXT GCD       {g, x, y} with ax + by = g; inverse mod m exists iff gcd(a, m) = 1
PRIMES        trial division i*i <= n (6k +- 1); sieve from i*i, O(n log log n)
              smallest-prime-factor sieve to factorise many numbers in O(log x) each
FAST POWER    while (e > 0) { if (e & 1) r = r*b % m; b = b*b % m; e >>= 1; }   long e for MIN_VALUE
MODULAR       reduce after EVERY + and *; (a - b) % M + M; divide = multiply by a^(M-2) (M prime)
COMBINATORICS C(n,k): Pascal (any mod) | multiplicative (exact) | fact + invFact (mod prime)
              Catalan = C(2n,n)/(n+1); trailing zeros = n/5 + n/25 + ...
MATRIX POWER  linear recurrence, n up to 1e18: k x k matrix, square-and-multiply, O(k^3 log n)
BIG NUMBERS   right to left with carry; multiply: a[i]*b[j] -> pos[i+j+1], carry -> pos[i+j]
BASES         to: % b, / b, reverse; from: Horner; Excel: subtract 1 first

GEOMETRY      rectangles = two 1D overlaps; cross(o,a,b) > 0 left turn, 0 collinear (cast to long)
              slopes as reduced (dx, dy) with a sign rule; compare squared distances

RANDOM        nextInt(n), never abs(nextInt()) % n
SHUFFLE       for i = n-1..1: swap(i, nextInt(i + 1))      (not nextInt(n): biased)
RESERVOIR     item i replaces a slot with probability k / i; k = 1 -> nextInt(count) == 0
WEIGHTED      prefix sums; target = nextInt(total); first prefix > target
REJECTION     sample a bigger uniform space, retry on misses; circle radius needs sqrt(rand)
GETRANDOM     list + map(value -> index); delete = move the last element into the hole
```

## Key takeaways

- Most interview math is overflow care plus a handful of algorithms: Euclid, sieves, fast power, inverses, binomials, and randomized picks.
- Read the sizes first: 10¹⁸ means O(log n); 10⁷ allows a sieve.
- Widen before multiplying, reduce after every modular operation, and use `floorMod` for residues.
- Stay in integers: cross-multiply, square distances, reduce directions.
- Randomized answers need a uniformity argument: Fisher–Yates, k/i reservoirs, and rejection to fix uneven spaces.

## Knowledge check

```quiz
? "How many ways to climb n stairs, modulo 10⁹ + 7, for n up to 10¹⁸?" Which tool?
+ Matrix exponentiation of the Fibonacci-style recurrence, O(log n)
- A DP loop from 1 to n
! 10¹⁸ iterations is far too many.
- The sieve of Eratosthenes
! There are no primes involved.
- Reservoir sampling
! Nothing random is asked.
> A 2 × 2 matrix raised to the n-th power.

? "Divide the count by k, modulo 10⁹ + 7." What do you do?
+ Multiply by k's inverse, k^(10⁹ + 5) mod 10⁹ + 7, since the modulus is prime
- Divide the reduced count by k with /
! Division doesn't survive reduction modulo M.
- Take the modulo only at the end
! The intermediate values would overflow first.
- Use doubles
! They can't hold exact residues.
> Fermat's little theorem gives the inverse.

? A solution multiplies two int values up to 10⁵ and stores the product in a long. It fails on large tests. Why?
+ The product overflows as an int before it's widened; one operand must be cast to long first
- long can't hold 10¹⁰
! long holds about 9.2 × 10¹⁸.
- Multiplying ints throws on overflow
! It wraps silently.
- 10⁵ is above Integer.MAX_VALUE
! It's far below.
> (long) a * b, not (long) (a * b).

? "Pick a random line from a huge log file you can read only once." Which technique?
+ Reservoir sampling: keep the i-th line with probability 1/i
- Fisher–Yates
! That needs the whole file in memory.
- Weighted choice with prefix sums
! The lines are equally likely, and their count is unknown.
- Rejection sampling
! There's no bigger space to sample from.
> One pass, O(1) memory.
```
