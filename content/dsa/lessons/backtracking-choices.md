## The idea

Picking the right loop shape for a backtracking problem comes down to two yes/no questions, not four things to memorise:

1. **Does the output care about order?** Is `[1,2]` a different result from `[2,1]`, or the same one?
2. **Can the same element be reused later in the same result?**

The two answers combine into four cases, and each one maps to exactly one loop shape.

## When to use it

Every time you write a [backtracking](lesson:backtracking-template) loop. Read the problem statement for the tell:
- "permutations", "arrangements", "orderings", "all sequences" → **order matters**;
- "subsets", "combinations", "subsequences" → **order doesn't matter**, so use `start`;
- "each number may be used an unlimited number of times" → **reuse is allowed**.

## How it works

| Order matters? | Reuse allowed? | Problem | Loop starts at | Needs `visited[]`? |
|---|---|---|---|---|
| No | No | Subsets, Combination Sum II | `start`, recurse `i+1` | No |
| No | Yes | Combination Sum I | `start`, recurse `i` | No |
| Yes | No | Permutations | `0`, every call | Yes |
| Yes | Yes | All length-k strings from an alphabet (rare) | `0`, every call | No |

**Why `start` physically can't produce permutations.** `start`-based traversal only ever moves forward: once you pass index 0 without picking it, `start` becomes 1 or higher, and index 0 is unreachable for the rest of that path. But a permutation like `[2,1,3]` needs index 1's value placed *before* index 0's value: after already being past index 0, you'd need to come back for it. `start` can never do that; only a full scan from `i = 0` with `visited[]` can, because it re-examines every index in every call and just filters out the ones already committed.

That's also exactly why `visited[]` is dead weight in a subsets-style solution: `start` never needs to ask "have I used this before?", because the index itself guarantees it can't be revisited. `visited[]` only earns its keep when the loop starts from `0` every time.

**Reuse is independent of order.** Reuse allowed means nothing is ever excluded, so you don't need `visited[]` whether or not order matters. With reuse in the combination-style loop, recursing with `i` lets you pick the same index again; with reuse *and* order mattering, scanning from `0` every time already lets you pick anything, so there's nothing to track at all.

## Java template

```java
// order doesn't matter, no reuse — Subsets / Combination Sum II
void bt(int[] nums, int start, List<Integer> curr) {
    for (int i = start; i < nums.length; i++) {
        curr.add(nums[i]);
        bt(nums, i + 1, curr);   // i+1: this index is gone for good
        curr.remove(curr.size() - 1);
    }
}
```

```java
// order doesn't matter, reuse allowed — Combination Sum I
void bt(int[] nums, int start, List<Integer> curr) {
    for (int i = start; i < nums.length; i++) {
        curr.add(nums[i]);
        bt(nums, i, curr);       // i, not i+1: this index can come up again
        curr.remove(curr.size() - 1);
    }
}
```

```java
// order matters, no reuse — Permutations
void bt(int[] nums, boolean[] visited, List<Integer> curr) {
    for (int i = 0; i < nums.length; i++) {   // always 0: any unused index qualifies
        if (visited[i]) continue;
        visited[i] = true;
        curr.add(nums[i]);
        bt(nums, visited, curr);
        curr.remove(curr.size() - 1);
        visited[i] = false;
    }
}
```

```java
// order matters, reuse allowed — e.g. all length-k strings from a fixed alphabet
void bt(char[] alphabet, int k, StringBuilder curr) {
    if (curr.length() == k) { /* record */ return; }
    for (int i = 0; i < alphabet.length; i++) {  // always 0, no visited[] needed either
        curr.append(alphabet[i]);
        bt(alphabet, k, curr);
        curr.deleteCharAt(curr.length() - 1);
    }
}
```

## Worked examples

### Word Search (LC 79)

Word Search is a good stress test for the framework because it adds one wrinkle the table doesn't cover on its own: the search space is a grid, not a flat array.

**Mapped onto the framework:** it's "order matters, no reuse", the same row as permutations, except that the *choices* at each step aren't "any unused index" but "the up to 4 grid neighbours of where I am". And since the word can start at any cell, the whole search is wrapped in a loop that tries every `(r, c)` as a starting point.

```java
class Solution {
    public boolean exist(char[][] board, String word) {
        int rows = board.length, cols = board[0].length;
        boolean[][] visited = new boolean[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (dfs(board, word, r, c, 0, visited)) return true;
            }
        }
        return false;
    }

    private boolean dfs(char[][] board, String word, int r, int c, int idx, boolean[][] visited) {
        if (idx == word.length()) return true;                                   // matched the whole word
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return false;
        if (visited[r][c] || board[r][c] != word.charAt(idx)) return false;       // pruning

        visited[r][c] = true;                                                     // choose
        boolean found = dfs(board, word, r + 1, c, idx + 1, visited)
                      || dfs(board, word, r - 1, c, idx + 1, visited)
                      || dfs(board, word, r, c + 1, idx + 1, visited)
                      || dfs(board, word, r, c - 1, idx + 1, visited);            // explore all 4 directions
        visited[r][c] = false;                                                    // un-choose
        return found;
    }
}
```

It handles the classic example (`"ABCCED"` → true, `"SEE"` → true, `"ABCB"` → false, since it would need to reuse a cell) and a small diagonal case (`"AD"` on a 2×2 board → false).

## Complexity

- The four loop shapes produce O(2ⁿ) subsets, O(n!) permutations, and kᴸ strings of length L from k letters; each result costs O(n) to copy.
- Word Search is O(rows · cols · 4ᴸ) for a word of length L: one search from every cell, branching up to 4 ways at each of the L steps. The `board[r][c] != word.charAt(idx)` check prunes almost every branch immediately in practice.

## Variations

### Duplicates in the input: Subsets II (LC 90) and Combination Sum II (LC 40)

When the input has repeated values, the same result can be built from different copies of a value. Sort the input, then skip a value that equals the previous one **at the same depth**:

```java
// Call after Arrays.sort(nums).
static void subsetsWithDup(int[] nums, int start, List<Integer> current, List<List<Integer>> result) {
    result.add(new ArrayList<>(current));
    for (int i = start; i < nums.length; i++) {
        if (i > start && nums[i] == nums[i - 1]) continue;   // same value at the same depth: same subsets
        current.add(nums[i]);
        subsetsWithDup(nums, i + 1, current, result);
        current.remove(current.size() - 1);
    }
}
```

`i > start` is what makes it "the same depth": the first copy of a value may still be chosen, and deeper levels may choose the next copy, but two siblings never start with the same value. Permutations II (LC 47) uses the same idea with `used[]`: skip `nums[i]` when it equals `nums[i − 1]` and `nums[i − 1]` isn't in use.

### Permutations without `visited[]`

Swap `nums[start]` with `nums[i]` before recursing on `start + 1`, then swap back. Everything before `start` is placed; everything from `start` on is still available. It's the `start` idea applied to permutations by physically reordering the array, and it uses O(1) extra space instead of the `visited[]` array.

### Grids without `visited[][]`

In Word Search, temporarily overwrite `board[r][c]` with a sentinel such as `'#'` (it can't match any letter) before recursing, and restore it afterwards: the same choose/un-choose, reusing the board instead of allocating O(rows · cols) extra space. The four-direction calls are often written as a loop over a direction array, the standard skeleton for grid DFS (islands, flood fill): see [grids as graphs](lesson:grids-as-graphs).

## Common mistakes

- **Reaching for `visited[]` on a combinations or subsets problem.** It's a sign you're overcomplicating it: `start` alone does the same job more simply.
- **Solving a permutations problem with `start`.** It won't crash; it silently produces *fewer* permutations than expected (only those whose indexes happen to increase), which is a nasty bug to spot because the output looks plausible.
- **Skipping duplicates with `i > 0` instead of `i > start`**, which also skips the legitimate use of a repeated value at a deeper level.
- **Forgetting to restore the grid cell or the `visited` flag**, which blocks other paths through that cell.

## Practice

Subsets (LC 78), Subsets II (LC 90), Combination Sum (LC 39), Combination Sum II (LC 40), Permutations (LC 46), Permutations II (LC 47), Word Search (LC 79), Palindrome Partitioning (LC 131).

## Key takeaways

- Two questions pick the loop: does order matter, and can elements be reused?
- Order doesn't matter: loop from `start`; recurse with `i + 1`, or with `i` for reuse.
- Order matters: loop from 0 every call, with `visited[]` unless reuse is allowed.
- With duplicates in the input, sort and skip `nums[i] == nums[i − 1]` when `i > start`.
- On a grid, the choices are the neighbours, and the cell itself can serve as the visited marker.

## Knowledge check

```quiz
? A problem asks for every arrangement of n distinct letters. Which loop shape?
+ Scan from 0 in every call, skipping letters already marked in visited[]
- Loop from `start`, recursing with i + 1
! That produces each set once, in one order only.
- Loop from `start`, recursing with i
! That allows reuse and still fixes the order.
- Scan from 0 with no visited[]
! That allows reusing a letter.
> Arrangements mean order matters, and each letter is used once.

? Why can't a `start`-based loop generate the permutation [2, 1, 3] of [1, 2, 3]?
+ Once the loop moves past index 0, it can never come back to place 1 after 2
- Because start must begin at 1
! It begins at 0; the problem is that it only moves forward.
- Because the input must be sorted
! Sorting doesn't let it go back.
- It can, if you recurse with i instead of i + 1
! That allows reuse, not going back.
> Only a scan from 0 can place a later element before an earlier one.

? Subsets II sorts the input and skips `nums[i] == nums[i − 1]`. Why only when `i > start`?
+ So two siblings never start with the same value, while a deeper level may still use the next copy
- Because i − 1 is out of range when i == start
! It's out of range only when i == 0.
- To skip every repeated value entirely
! Subsets like [2, 2] must still be generated.
- It makes no difference
! With i > 0, valid subsets containing repeated values are lost.
> "At the same depth" is the whole rule.

? In Word Search, why must `visited[r][c]` be reset to false after exploring?
+ Other paths may legitimately pass through that cell; leaving it marked would block them
- To free memory
! A boolean array doesn't shrink.
- Because Java resets arrays between calls
! Nothing is reset automatically.
- It doesn't need resetting; each cell is used once overall
! Each cell is used once per path, not once overall.
> Un-choose restores the state for sibling branches.
```
