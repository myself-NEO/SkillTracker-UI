## The idea

In sequence DP, `dp[i]` describes the answer for a **prefix** of the input (or for the subsequence ending at index i), and computing it can look back at **any** earlier state, not just the last one or two. The recurrence becomes a loop over the earlier index j: "if `dp[j]` holds and the piece from j to i fits, then `dp[i]` follows."

## When to use it

- "The longest increasing (or otherwise ordered) subsequence."
- "Can the string be split into dictionary words?", "how many ways to split or decode it?"
- Any question where the last piece of a prefix can start at many different places.

## How it works

The three problems below share one shape: **choose where the last piece starts.**
- **Longest Increasing Subsequence:** `dp[i]` = the length of the longest increasing subsequence that **ends exactly at i**. It can extend any earlier `j` with `nums[j] < nums[i]`, so `dp[i] = 1 + max(dp[j])` over those j.
- **Word Break:** `dp[i]` = whether the prefix `s[0, i)` can be split into words. It's true when some earlier cut j has `dp[j]` true and `s[j, i)` is a word.
- **Decode Ways:** `dp[i]` = the number of ways to decode `s[0, i)`. The last letter used one digit or two, so at most two earlier states feed `dp[i]`.

Because `dp[i]` can depend on *every* earlier state, the inner loop makes these O(n²) in general, unless the "piece" has a bounded length.

## Java template

```java
for (int i = 1; i <= n; i++) {
    for (int j = 0; j < i; j++) {                     // where the last piece starts
        if (/* dp[j] is usable and the piece s[j, i) fits */) {
            dp[i] = combine(dp[i], dp[j]);            // max for LIS, OR for Word Break, + for counting
        }
    }
}
```

## Worked examples

### Longest Increasing Subsequence (LC 300)

```java
static int lengthOfLIS(int[] nums) {
    int n = nums.length;
    int[] dp = new int[n];
    Arrays.fill(dp, 1);
    int maxLen = 1;
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
        }
        maxLen = Math.max(maxLen, dp[i]);
    }
    return maxLen;
}
```

For `nums = [10, 9, 2, 5, 3, 7, 101, 18]`, `dp = [1, 1, 1, 2, 2, 3, 4, 4]`, so the answer is 4 (`[2, 3, 7, 101]`, for example). The answer is the maximum over all i, not `dp[n − 1]`: the longest subsequence needn't end at the last element.

**The O(n log n) follow-up (patience sorting):** keep an array `tails`, where `tails[k]` is the smallest possible last value of an increasing subsequence of length k + 1 found so far. For each number, binary-search for the first tail that's at least as big, and overwrite it (keeping every length's tail as small as possible leaves the most room to grow); append when the number beats every tail. The final size of `tails` is the answer:

```java
static int lengthOfLIS_NLogN(int[] nums) {
    int[] tails = new int[nums.length];
    int size = 0;
    for (int num : nums) {
        int lo = 0, hi = size;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (tails[mid] < num) lo = mid + 1; else hi = mid;
        }
        tails[lo] = num;
        if (lo == size) size++;
    }
    return size;
}
```

Be honest about what this is: a greedy-plus-[binary-search](lesson:binary-search-template) technique that solves the same problem, not an optimisation of the DP above. `tails` isn't itself an increasing subsequence of the input. Lead with the O(n²) DP as the answer you can justify, and offer this when asked to do better.

### Word Break (LC 139)

```java
static boolean wordBreak(String s, List<String> wordDict) {
    Set<String> dict = new HashSet<>(wordDict);
    int n = s.length();
    boolean[] dp = new boolean[n + 1];
    dp[0] = true;
    for (int i = 1; i <= n; i++) {
        for (int j = 0; j < i; j++) {
            if (dp[j] && dict.contains(s.substring(j, i))) {
                dp[i] = true;
                break;
            }
        }
    }
    return dp[n];
}
```

For `s = "leetcode"` with `{"leet", "code"}`: `dp[4]` becomes true from j = 0 ("leet"), and `dp[8]` from j = 4 ("code"). The empty prefix is the base case: `dp[0] = true`, zero words needed.

**The honest cost:** the double loop is O(n²), but `s.substring(j, i)` copies O(length) characters and the `HashSet` lookup hashes them, so it's closer to **O(n³)** in the worst case. Limiting `i − j` to the longest dictionary word, or walking a [trie](lesson:tries-with-backtracking-and-dp) from each reachable j, avoids most of that. Mentioning this unprompted is a strong signal.

### Decode Ways (LC 91)

A digit string encodes letters (`'A'` → 1, …, `'Z'` → 26). Count the ways to decode it. The last letter of `s[0, i)` used one digit (valid unless it's '0') or two digits (valid when they form 10 to 26), and both can be valid at once:

```java
static int numDecodings(String s) {
    int n = s.length();
    if (s.charAt(0) == '0') return 0;
    int[] dp = new int[n + 1];
    dp[0] = 1; dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        char first = s.charAt(i - 2), second = s.charAt(i - 1);
        if (second != '0') dp[i] += dp[i - 1];
        int twoDigit = (first - '0') * 10 + (second - '0');
        if (twoDigit >= 10 && twoDigit <= 26) dp[i] += dp[i - 2];
    }
    return dp[n];
}
```

For `"226"`: `dp[2] = 2` ("2 2", "22"), and `dp[3] = 3` ("2 2 6", "22 6", "2 26"). This problem is almost entirely edge cases: **'0' can't stand alone**, but it can end a two-digit code (10 and 20 are valid). Say both conditions out loud before coding.

## Complexity

| Problem | Time | Space |
|---|---|---|
| LIS, DP | O(n²) | O(n) |
| LIS, patience sorting | O(n log n) | O(n) |
| Word Break | O(n²) checks, about O(n³) with substring copies | O(n) |
| Decode Ways | O(n) | O(n), or O(1) with two variables |

## Variations

- **Word Break II (LC 140)** returns every segmentation: backtracking that uses the `dp` array to prune positions from which no split exists.
- **Number of Longest Increasing Subsequence (LC 673):** alongside each `dp[i]`, count how many subsequences reach that length.
- **Russian Doll Envelopes (LC 354):** sort by width ascending (and height descending for equal widths), then take the LIS of the heights with patience sorting.
- **Longest Divisible Subset (LC 368):** sort, then LIS where "increasing" means "divisible", keeping parent pointers to rebuild the set.

## Common mistakes

- **Returning `dp[n − 1]` for LIS** instead of the maximum over all i.
- **Treating '0' as a valid single digit** in Decode Ways, or rejecting "10" and "20" as two-digit codes.
- **Forgetting `dp[0] = true` (or 1)**: the empty prefix is what lets the first piece start at 0.
- **Claiming Word Break is O(n²)** without accounting for substring creation and hashing.
- **Presenting patience sorting's `tails` array** as the actual subsequence.

## Practice

Longest Increasing Subsequence (LC 300), Word Break (LC 139), Decode Ways (LC 91), Number of Longest Increasing Subsequence (LC 673), Longest Divisible Subset (LC 368), Russian Doll Envelopes (LC 354), Word Break II (LC 140).

## Key takeaways

- Sequence DP asks where the last piece starts, looking back over every earlier index.
- LIS: `dp[i]` = the longest increasing subsequence ending at i; the answer is the maximum over all i.
- Word Break: `dp[i]` is true when some cut j has `dp[j]` true and `s[j, i)` is a word.
- Decode Ways: one digit (not '0') plus two digits (10 to 26) feed each state.
- Patience sorting gives LIS in O(n log n), but `tails` isn't the subsequence itself.

## Knowledge check

```quiz
? LIS on [1, 3, 5, 2] fills dp = [1, 2, 3, 2]. What's the answer?
+ 3: the maximum over all i, from [1, 3, 5]
- 2, which is dp[n − 1]
! dp[i] is the longest subsequence ending at i, and the longest one needn't end at the last element.
- 4
! 2 can't follow 5.
- 1
! [1, 3, 5] is increasing.
> Track the maximum as you go.

? How many ways can "226" be decoded?
+ 3: "2 2 6", "22 6" and "2 26"
- 2
! "2 26" is valid too.
- 4
! "226" isn't a valid letter code.
- 1
! Several splits are valid.
> One digit (not '0') or two digits (10 to 26).

? Why does Word Break set dp[0] = true?
+ The empty prefix needs zero words, which lets the first word start at index 0
- Because s always starts with a word
! Not every s can be split.
- To skip the first character
! dp[0] is about the empty prefix.
- It's arbitrary
! With false, nothing could ever become true.
> The base case seeds every split.

? What does tails[k] mean in the O(n log n) LIS?
+ The smallest last value of any increasing subsequence of length k + 1 seen so far
- The k-th element of the longest subsequence
! tails isn't itself a subsequence of the input.
- The number of subsequences of length k
! It stores values, not counts.
- dp[k] from the O(n²) version
! dp[k] is the length ending at index k.
> Its final size is the answer.
```
