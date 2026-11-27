## The idea

Backtracking is recursion used in a specific, disciplined way: to explore *every* candidate in a space of possible configurations, building each candidate one decision at a time, and abandoning ("pruning") a partial candidate the moment you can prove it can't lead anywhere valid.

The whole technique compresses into three words: **choose → explore → un-choose.**

- **Choose**: commit to one option at the current step (add it to your in-progress state).
- **Explore**: recurse, now one decision deeper.
- **Un-choose**: before trying the *next* sibling option, undo exactly what you just did, so the state is clean for the next attempt.

That "un-choose" step is where the name comes from, and it's the piece that's easy to forget when you first translate the idea into code.

## When to use it

- The problem asks for **all** solutions: "generate", "list every", "all possible", "find every arrangement".
- The problem asks you to **find one valid configuration** under constraints: N-Queens, Sudoku, a path through a grid.
- The input is **small**: n up to about 10 for permutations, about 20 for subsets. The output itself is exponential, so nothing faster exists.
- If it only asks you to **count** the ways, and the same sub-states repeat, [dynamic programming](lesson:what-is-dynamic-programming) is usually better.

## How it works

Backtracking is a depth-first walk over an implicit **decision tree**: each node is a partial state, each edge is one choice. Choose-explore-un-choose walks the tree with a single mutable state, so only O(depth) memory is used however large the tree is.

Every solution has four moving parts:

1. **Base case**: when is the state a finished, valid answer?
2. **The choice loop**: what are the options at this exact point?
3. **Pruning**: what disqualifies a choice before you waste time recursing into it?
4. **Choose / un-choose**: how you change the state, and its exact inverse.

**The four questions for *any* backtracking problem.** When you see a new one, don't look first for which pattern it resembles. Answer these, in order, and the code falls out almost mechanically:

> 1. **What does a complete, valid solution look like?** → your base case.
> 2. **At any partial state, what are the possible next choices?** → what you loop over.
> 3. **What makes a choice invalid right now?** → your pruning condition, checked *before* recursing.
> 4. **How do I make a choice, and exactly how do I undo it?** → your state change and its inverse.

## Java template

```java
void backtrack(List<Integer> currentState /* + whatever else you're tracking */) {
    if (isCompleteSolution(currentState)) {
        result.add(new ArrayList<>(currentState));  // COPY — the #1 bug is adding the live list
        return;
    }
    for (Choice choice : choicesAvailableRightNow()) {
        if (!isValid(choice, currentState)) continue;   // pruning: skip dead ends early

        currentState.add(choice);        // choose
        backtrack(currentState);         // explore
        currentState.remove(currentState.size() - 1);  // un-choose
    }
}
```

## Worked examples

Each example answers the same four questions, on purpose: the point is to see the *same questions*, answered differently, produce completely different-looking solutions.

### Subsets (LC 78): the power set

*Given `[1,2,3]`, return all possible subsets, including `[]` and the full array.*

1. Complete solution? Every state is valid, at every step (a subset can stop growing at any point). So there's no single base-case check: record the current state *every time you enter the function*, not just at the end.
2. Choices? The next number to *include*, from the numbers after the last one you used. This ordering, from `start` onward, is what stops `[2,1]` being generated separately from `[1,2]`.
3. Invalid? Nothing to check: every remaining number is a valid next choice.
4. Choose/un-choose? Add `nums[i]` to `current`; after recursing, remove the last element.

```java
static void subsets(int[] nums, int start, List<Integer> current, List<List<Integer>> result) {
    result.add(new ArrayList<>(current));           // record at every node, not just leaves
    for (int i = start; i < nums.length; i++) {
        current.add(nums[i]);                       // choose
        subsets(nums, i + 1, current, result);       // explore (i+1, not i or 0 — no reuse, no going back)
        current.remove(current.size() - 1);          // un-choose
    }
}
```

For `[1,2,3]` the output is `[[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]]`: 8 subsets, matching 2³.

### Permutations (LC 46)

*Given `[1,2,3]`, return all orderings.*

1. Complete solution? `current.size() == nums.length`.
2. Choices? Any number *not yet used* in this branch. Order matters here, unlike subsets, so a `start` pointer can't work: we need to track which elements are already placed.
3. Invalid? A number that's already in `current` for this branch, tracked with a `used[]` array.
4. Choose/un-choose? Mark `used[i] = true` and add to `current`; after recursing, remove it and mark `used[i] = false`.

```java
static void permute(int[] nums, List<Integer> current, boolean[] used, List<List<Integer>> result) {
    if (current.size() == nums.length) {
        result.add(new ArrayList<>(current));
        return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;                       // pruning
        used[i] = true;
        current.add(nums[i]);                        // choose
        permute(nums, current, used, result);         // explore
        current.remove(current.size() - 1);           // un-choose
        used[i] = false;
    }
}
```

For `[1,2,3]` this gives 6 permutations, matching 3!.

### Combination Sum (LC 39)

*Given `[2,3,6,7]` and target `7`, return all combinations that sum to the target. The same number can be reused any number of times.*

1. Complete solution? `remaining == 0`; and `remaining < 0` is a dead branch, so prune it.
2. Choices? Any candidate from `start` onward.
3. Invalid? Anything that would push `remaining` below 0. Here it's checked at the top of the next call rather than before choosing, which keeps the code simpler.
4. Choose/un-choose? Add the candidate; recurse **with the same `start` index** (not `start + 1`), because reuse is allowed; then remove it.

```java
static void combinationSum(int[] candidates, int remaining, int start, List<Integer> current, List<List<Integer>> result) {
    if (remaining == 0) {
        result.add(new ArrayList<>(current));
        return;
    }
    if (remaining < 0) return;                        // pruning
    for (int i = start; i < candidates.length; i++) {
        current.add(candidates[i]);                    // choose
        combinationSum(candidates, remaining - candidates[i], i, current, result);  // i, not i+1: reuse allowed
        current.remove(current.size() - 1);             // un-choose
    }
}
```

For `[2,3,6,7]` and target `7` the output is `[[2,2,3], [7]]`.

The one line that decides "reuse allowed or not" across all three examples is worth noticing: **subsets and permutations move the index forward (`i+1`) or track `used[]`; combination sum with reuse passes `i` again.** That single choice is almost the entire difference between these variants; [backtracking choices](lesson:backtracking-choices) turns it into a decision table.

## Complexity

Count the leaves of the decision tree and multiply by the cost of handling one:

| Problem | Results (leaves) | Cost per result | Total |
|---|---|---|---|
| Subsets | 2ⁿ | O(n) to copy | O(n · 2ⁿ) |
| Permutations | n! | O(n) to copy | O(n · n!) |
| Combination Sum | depends on the input | O(target / min) to copy | exponential, cut down by pruning |

Space is O(depth) for the recursion and the current state, plus the output itself.

## Variations

### N-Queens (LC 51)

*Place `n` queens on an `n×n` board so that none attack each other (no shared row, column or diagonal). Return all solutions.*

It looks intimidating, but it's the same four questions with a fancier validity check:

1. Complete solution? A queen has been placed in every row (`row == n`).
2. Choices? For the current row, which column to place the queen in.
3. Invalid? The column is already used, or the cell is on a diagonal that's already occupied. Two queens share a diagonal when `row - col` is equal, or when `row + col` is equal, so two boolean arrays replace scanning the board.
4. Choose/un-choose? Place `'Q'` and mark the column and diagonals; after recursing, clear the cell and unmark them.

```java
static void solveNQueens(char[][] board, int row, boolean[] cols, boolean[] diag1, boolean[] diag2,
                          List<List<String>> result, int n) {
    if (row == n) {
        List<String> snapshot = new ArrayList<>();
        for (char[] r : board) snapshot.add(new String(r));
        result.add(snapshot);
        return;
    }
    for (int col = 0; col < n; col++) {
        int d1 = row + col, d2 = row - col + n;         // shift d2 by +n so it's never negative (array index)
        if (cols[col] || diag1[d1] || diag2[d2]) continue;   // pruning

        board[row][col] = 'Q';                                    // choose
        cols[col] = diag1[d1] = diag2[d2] = true;
        solveNQueens(board, row + 1, cols, diag1, diag2, result, n);  // explore

        board[row][col] = '.';                                    // un-choose
        cols[col] = diag1[d1] = diag2[d2] = false;
    }
}
```

n = 4 gives exactly 2 solutions and n = 8 gives exactly 92, matching the known values.

### More of the same shape

- **Generate Parentheses (LC 22):** choices are `(` or `)`; prune when there are more `)` than `(`, or more than n of either.
- **Letter Combinations of a Phone Number (LC 17):** the choices are the letters of the current digit.
- **Sudoku Solver (LC 37):** the choices are the digits 1–9 for the next empty cell; prune with row, column and box sets.

## Common mistakes

- **Adding the live list to the results.** `result.add(current)` stores a reference to the one list you keep changing, so every entry ends up equal to its final state (usually empty). Always add `new ArrayList<>(current)`.
- **Forgetting to un-choose**, or skipping it on an early return, so a choice leaks into the sibling branches.
- **Pruning too late**, after recursing into a dead branch: still correct, but it times out on larger inputs.
- **The wrong loop start or recursion index**: `i` vs `i + 1` vs `0` decides between combinations, combinations with reuse, and permutations.

## Practice

Subsets (LC 78), Permutations (LC 46), Combination Sum (LC 39), Letter Combinations of a Phone Number (LC 17), Generate Parentheses (LC 22), N-Queens (LC 51), N-Queens II (LC 52), Sudoku Solver (LC 37).

## Key takeaways

- Backtracking is choose → explore → un-choose over a decision tree, with pruning to skip dead branches.
- Answer four questions: what's complete, what are the choices, what's invalid, and how to make and undo a choice.
- Copy the current state when recording a result; never add the live list.
- The recursion index decides the problem: `i + 1` for subsets, `i` for reuse, a `used[]` scan from 0 for permutations.
- The cost is roughly the number of results times the cost of building one: O(n · 2ⁿ) for subsets, O(n · n!) for permutations.

## Knowledge check

```quiz
? A subsets solution adds `current` (not a copy) to `result`. For [1, 2, 3], what does `result` contain at the end?
+ 8 references to the same list, which is empty when the recursion finishes
- The 8 correct subsets
! Without a copy, every entry is the same list object.
- One subset, [1, 2, 3]
! There are 8 entries; they're just all the same list.
- An exception is thrown
! Nothing crashes, which is why the bug is sneaky.
> Always record new ArrayList<>(current).

? Why does the subsets loop start at `start` and recurse with `i + 1`?
+ Each number is used at most once, and only numbers after the last one chosen are considered, so no set appears twice in another order
- To generate the permutations
! Permutations need a used[] scan from 0.
- To allow numbers to be reused
! Reuse would recurse with i, not i + 1.
- To make the recursion end sooner
! It's about correctness: avoiding duplicate sets.
> Moving forward only is what makes [1, 2] and [2, 1] the same result.

? Combination Sum allows each candidate to be reused. Which recursive call reflects that?
+ Recursing with `i`, so the same candidate can be chosen again
- Recursing with `i + 1`
! That allows each candidate once.
- Recursing with `0`
! Scanning from 0 would produce the same combination in different orders.
- Recursing with `start + 1`
! That skips candidates rather than reusing them.
> One index decides reuse.

? In N-Queens, why do two boolean arrays indexed by `row + col` and `row − col + n` replace scanning the board?
+ Every cell on one diagonal shares `row + col`, and every cell on the other diagonal shares `row − col`, so each diagonal is one array slot
- Because queens can't be on the same row
! Rows are handled by placing one queen per row.
- To store the board's contents
! The board array does that.
- Because the board is symmetric
! Symmetry isn't used here.
> The + n shift keeps row − col from going negative.
```
