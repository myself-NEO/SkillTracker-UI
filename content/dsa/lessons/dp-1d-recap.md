One-dimensional DP comes down to a precise state, a recurrence from the last decision, and the right way to combine choices. This recap gathers the recognition shortcuts, the edge cases, the mistakes and the practice for the module.

## Recognizing the pattern

Every recurrence in this module combines earlier `dp[j]` values with one of **three combinators**, picked by what the question asks:

| The question asks… | Combinator | Seen in |
|---|---|---|
| "Can you reach / form / partition / segment…?" | **OR** (boolean) | [Word Break](lesson:sequence-dp), [Jump Game I](lesson:jump-games) |
| "What's the minimum / maximum…?" | **MIN** / **MAX** | [House Robber, Min Cost Climbing Stairs](lesson:fibonacci-style-dp), [Coin Change, Perfect Squares](lesson:coin-change), [LIS](lesson:sequence-dp), [Jump Game II](lesson:jump-games), [Maximum (Product) Subarray](lesson:maximum-subarray) |
| "How many ways / combinations…?" | **SUM** (counting) | [Climbing Stairs](lesson:fibonacci-style-dp), [Decode Ways](lesson:sequence-dp), [Coin Change II](lesson:coin-change) |

That collapses "derive the recurrence" into two small questions: *which combinator does the wording want, and which earlier states feed `dp[i]`?* The second is usually "what was the last decision?", answered by re-reading the constraints (the adjacent-house rule, the coin values, the jump range, the valid digit range).

**Signal words:**

| Phrase in the problem | Likely pattern |
|---|---|
| "number of ways to…", "how many ways…", "count the…" | counting DP (SUM) |
| "minimum cost / steps / coins to…" | min-optimisation DP |
| "maximum sum / product / value / profit…" | max-optimisation DP |
| "can you reach / form / partition / segment…?" | boolean DP (OR) |
| "the longest / shortest subsequence or substring with property X" | optimisation DP with a length in the state |
| "you can't pick two adjacent…" | House Robber: include or exclude |
| houses, seats or elements arranged in a **circle** | break the circle into one or two linear problems |
| coins or items reusable without limit | unbounded knapsack, collapsed to 1-D |
| a running value can flip sign as you extend it | track more than "best so far" (Maximum Product Subarray) |

## Decision procedure

1. **Recognise** the question type (optimum, count or feasibility) and check the recursion overlaps: see [the framework](lesson:dp-framework).
2. **Write the state as a sentence**: "`dp[i]` = … for the first i elements" or "… ending at i".
3. **Derive the recurrence from the last decision**, and pick the combinator from the table.
4. **Set the base cases** to match the sentence exactly; size the array n + 1 when `dp[0]` means "nothing yet".
5. **Fill it bottom-up**, then shrink the table to the states the recurrence actually reads.
6. **Hand-trace a tiny example**, especially for counting DPs, where loop-order bugs produce plausible wrong numbers.

### Quick-reference table

| Problem | State | Core recurrence | Time | Space (optimised) |
|---|---|---|---|---|
| Climbing Stairs | `dp[i]` = ways to reach step i | `dp[i-1] + dp[i-2]` | O(n) | O(1) |
| Min Cost Climbing Stairs | `dp[i]` = cost to reach step i | `min(dp[i-1]+cost[i-1], dp[i-2]+cost[i-2])` | O(n) | O(1) |
| House Robber | `dp[i]` = max money, first i houses | `max(dp[i-1], dp[i-2]+nums[i-1])` | O(n) | O(1) |
| House Robber II | two linear House Robber runs | (a reduction, not a new recurrence) | O(n) | O(1) |
| Maximum Subarray | `dp[i]` = max sum ending at i | `max(nums[i], dp[i-1]+nums[i])` | O(n) | O(1) |
| Maximum Product Subarray | max and min products ending at i | max/min of 3 candidates each | O(n) | O(1) |
| Longest Increasing Subsequence | `dp[i]` = LIS length ending at i | `max(dp[j]+1)` over `j < i` with `nums[j] < nums[i]` | O(n²), or O(n log n) | O(n) |
| Word Break | `dp[i]` = can segment `s[0, i)` | `∃ j < i: dp[j] ∧ s[j, i) ∈ dict` | O(n²) to O(n³) | O(n) |
| Decode Ways | `dp[i]` = ways to decode `s[0, i)` | `dp[i-1]` (valid 1-digit) + `dp[i-2]` (valid 2-digit) | O(n) | O(1) |
| Coin Change | `dp[a]` = min coins for amount a | `min(dp[a-coin]+1)` | O(amount · coins) | O(amount) |
| Coin Change II | `dp[a]` = combinations summing to a | `dp[a] += dp[a-coin]` (coin loop outside!) | O(amount · coins) | O(amount) |
| Perfect Squares | `dp[i]` = min squares summing to i | `min(dp[i-j²]+1)` | O(n√n) | O(n) |
| Jump Game I | `dp[i]` = is i reachable | `∃ j < i: dp[j] ∧ j + nums[j] ≥ i` | O(n²), O(n) greedy | O(n) |
| Jump Game II | `dp[i]` = min jumps to reach i | `min(dp[j]+1)` over reachable `j < i` | O(n²), O(n) greedy | O(n) |

## Edge cases to test

- **Empty input, and n = 1**: House Robber II with one house, Decode Ways with `"0"`.
- **Zeros** in Decode Ways: a leading '0', "10" and "20" (valid), "30" and "00" (invalid).
- **An unreachable target**: Coin Change must return −1, not the sentinel.
- **A target of 0**: zero coins, and one way.
- **Large counts**: the number of ways overflows an `int`; use `long` or the given modulus.
- **Large n with top-down code**: deep recursion overflows the stack.

## Common mistakes

- **Off-by-one on the array size.** If `dp[0]` means "zero elements considered" (House Robber, Word Break, Decode Ways), the array needs n + 1 entries.
- **An ambiguous state.** "Cost to reach step i" and "cost to reach step i, including standing on it" are both reasonable, and mixing them causes off-by-one bugs. Write the state as a full sentence before coding.
- **The wrong loop order in counting DP.** [Coin Change II versus Combination Sum IV](lesson:coin-change): swapping the loops silently switches between combinations and permutations.
- **The wrong combinator.** Assuming the problem wants a maximum when it wants a count produces code that runs, looks plausible, and answers the wrong question.
- **Integer overflow on counts**: Java wraps around silently.
- **Deep recursion with memoization** on large n: prefer bottom-up tabulation.

## Practice ladder

Derive the state and recurrence yourself before writing code: that's the practice.

**Easy**
- Fibonacci Number (509)
- N-th Tribonacci Number (1137)
- Counting Bits (338): `dp[i]` relates to `dp[i >> 1]`
- Divisor Game (1025): small game-theory reachability

**Medium**
- Delete and Earn (740): House Robber after grouping by value
- Domino and Tromino Tiling (790): depends on more than the last two states
- Minimum Cost For Tickets (983): three choices (1-, 7- and 30-day passes) per state
- Partition Array for Maximum Sum (1043): looks back a variable number of steps, up to k
- Longest Turbulent Subarray (978): the state tracks the direction of the last comparison
- Best Time to Buy and Sell Stock II (122): does it need DP at all?
- Maximum Sum Circular Subarray (918): Kadane plus breaking the circle

**Hard**
- Best Time to Buy and Sell Stock with Cooldown (309) and with Transaction Fee (714): a preview of state-machine DP, where each index carries a few parallel states (holding a share or not). Define `hold[i]` and `sold[i]` explicitly before looking anything up.

**Next:** when the state needs two indexes (grids, two strings, a budget), move on to [2-D DP](lesson:two-dimensional-dp). The same five steps apply; only the table grows a dimension.

## Key takeaways

- Three combinators cover 1-D DP: OR for feasibility, MIN/MAX for optimisation, SUM for counting.
- The recurrence comes from the last decision; the state comes from a precise sentence.
- Size the table n + 1 when `dp[0]` means "nothing yet", and match the base cases to that meaning.
- In counting DP, the loop order decides between combinations and permutations.
- Hand-trace a small example before trusting a DP: its bugs produce plausible wrong numbers.

## Knowledge check

```quiz
? "Can the array be partitioned so that…?" Which combinator does the recurrence use?
+ OR: a state is true if any earlier choice leads to a true state
- MIN
! Nothing is being minimised.
- SUM
! That counts the ways instead of asking whether one exists.
- MAX
! A yes/no question needs a boolean.
> Feasibility → OR.

? A counting DP returns a plausible but wrong number. What's the first thing to check?
+ The loop order: combinations need the item loop outside, permutations the amount loop outside
- The array's data type only
! Overflow gives obviously wrong (often negative) numbers.
- Whether it should be greedy
! The recurrence may be fine; the order is the classic bug.
- The recursion depth
! Bottom-up code has no recursion.
> Hand-trace a tiny example.

? Word Break uses dp[0] to mean the empty prefix. How big is the array?
+ n + 1, so that dp[n] is the whole string
- n
! dp[n] wouldn't exist.
- n − 1
! Too small.
- 2n
! Only n + 1 states exist.
> Off-by-one on the array size is the most common 1-D DP bug.

? "Houses arranged in a circle; no two adjacent houses robbed." What's the standard move?
+ Solve two linear versions, one without the first house and one without the last, and take the better
- Rob every other house
! That can miss the optimum.
- Run the linear version once on the whole array
! It might rob both the first and last houses.
- Use a 2-D table
! The reduction keeps it 1-D.
> Break the circle at one point.
```
