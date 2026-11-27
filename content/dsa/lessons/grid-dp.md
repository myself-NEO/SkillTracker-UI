## The idea

In grid DP, `dp[i][j]` is the answer for reaching (or, in one case, leaving) cell `(i, j)`. When moves only go **right or down**, the last move into `(i, j)` came from directly above or directly left, so `dp[i][j]` combines `dp[i−1][j]` and `dp[i][j−1]`: added for counting paths, min'd for the cheapest path.

## When to use it

- "A robot moves only right or down: how many paths / the cheapest path / can it reach?"
- "The largest square (or other shape) of 1s" ending at each cell.
- "The minimum starting resource to survive to the end": fill **backwards** from the destination.
- Moves in all four directions make it a graph instead: [grids as graphs](lesson:grids-as-graphs) or [shortest paths](lesson:shortest-paths).

## How it works

- **Base row and column:** the top row and the left column have only one way in (straight across or straight down), so they're filled first.
- **Order:** row by row, left to right: above and left are always ready.
- **One rolling row:** `dp[i][j]` reads only the row above and the current row so far, so one array of length n is enough. Iterating j **forwards**, `dp[j]` still holds the row above (not yet overwritten) while `dp[j − 1]` already holds the current row.
- **Backwards** when what a cell needs depends on the rest of the path, not on the path so far (Dungeon Game).

## Java template

```java
int[][] dp = new int[m][n];
// fill the base row and column
for (int i = 1; i < m; i++) {
    for (int j = 1; j < n; j++) {
        dp[i][j] = combine(dp[i - 1][j], dp[i][j - 1]) /* + this cell's own contribution */;
    }
}
return dp[m - 1][n - 1];
```

## Worked examples

### Unique Paths (LC 62)

```java
static int uniquePaths(int m, int n) {
    int[][] dp = new int[m][n];
    for (int i = 0; i < m; i++) dp[i][0] = 1;
    for (int j = 0; j < n; j++) dp[0][j] = 1;
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = dp[i-1][j] + dp[i][j-1];
        }
    }
    return dp[m-1][n-1];
}
```

For a 3 × 7 grid, `dp[2][6] = 28`. With one rolling row:

```java
static int uniquePathsOpt(int m, int n) {
    int[] dp = new int[n];
    Arrays.fill(dp, 1);
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[j] = dp[j] + dp[j-1];   // dp[j] is still last row's value; dp[j-1] is already this row's
        }
    }
    return dp[n-1];
}
```

Before the assignment, `dp[j]` still holds row i − 1 (nobody has touched it this pass), and `dp[j − 1]` already holds row i. That works because j runs **forwards**, a detail that becomes crucial in [knapsack DP](lesson:knapsack-dp). (Unique Paths also has a closed form, C(m + n − 2, m − 1): see [combinatorics](lesson:combinatorics).)

### Unique Paths II (LC 63): obstacles

Same state and recurrence, with one override: an obstacle cell has zero paths through it, which also starves everything downstream that would route through it.

```java
static int uniquePathsWithObstacles(int[][] obstacleGrid) {
    int m = obstacleGrid.length, n = obstacleGrid[0].length;
    int[][] dp = new int[m][n];
    dp[0][0] = obstacleGrid[0][0] == 1 ? 0 : 1;
    for (int j = 1; j < n; j++) dp[0][j] = (obstacleGrid[0][j] == 1) ? 0 : dp[0][j-1];
    for (int i = 1; i < m; i++) dp[i][0] = (obstacleGrid[i][0] == 1) ? 0 : dp[i-1][0];
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = (obstacleGrid[i][j] == 1) ? 0 : dp[i-1][j] + dp[i][j-1];
        }
    }
    return dp[m-1][n-1];
}
```

A new constraint often needs **no** change to the state, just an override layered onto the recurrence. Saying that out loud is faster than re-deriving from scratch.

### Minimum Path Sum (LC 64)

```java
static int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dp = new int[m][n];
    dp[0][0] = grid[0][0];
    for (int j = 1; j < n; j++) dp[0][j] = dp[0][j-1] + grid[0][j];
    for (int i = 1; i < m; i++) dp[i][0] = dp[i-1][0] + grid[i][0];
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = grid[i][j] + Math.min(dp[i-1][j], dp[i][j-1]);
        }
    }
    return dp[m-1][n-1];
}
```

For `[[1,3,1],[1,5,1],[4,2,1]]` it's 7, along 1 → 3 → 1 → 1 → 1. It's Unique Paths with min in place of the sum: the same table, a different combinator.

### Maximal Square (LC 221)

The largest all-`'1'` square, as an area.

- *State:* `dp[i][j]` = the side of the largest all-1 square whose **bottom-right corner** is `(i, j)`.
- *Recurrence:* a square of side s ending at `(i, j)` needs squares of side s − 1 ending above, to the left and diagonally above-left; the new square is only as big as its weakest neighbour allows: `dp[i][j] = 1 + min(dp[i−1][j], dp[i][j−1], dp[i−1][j−1])` when the cell is `'1'`.

```java
static int maximalSquare(char[][] matrix) {
    int m = matrix.length, n = matrix[0].length;
    int[][] dp = new int[m][n];
    int maxSide = 0;
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (matrix[i][j] == '1') {
                dp[i][j] = (i == 0 || j == 0) ? 1
                        : 1 + Math.min(dp[i-1][j], Math.min(dp[i][j-1], dp[i-1][j-1]));
                maxSide = Math.max(maxSide, dp[i][j]);
            }
        }
    }
    return maxSide * maxSide;
}
```

A rolling row works here too, but needs a temporary variable: the diagonal `dp[i−1][j−1]` is overwritten one step before it's read.

### Dungeon Game (LC 174): filling backwards

A knight crosses a grid (right and down only) to the bottom-right cell; each cell adds or removes health, and health must never drop to 0. Find the **minimum starting health**.

Forward filling breaks here. "The most health on arrival at `(i, j)`" doesn't compose: the path that has gathered the most health so far isn't necessarily the one best placed for what's ahead (a big potion early can lead into a brutal demon later). What composes is defined from the far end: **the minimum health needed on entering this cell to survive everything from here on.** That's computed backwards from the destination.

- *State:* `dp[i][j]` = the minimum health needed on entering `(i, j)`.
- *Recurrence:* the next move goes right or down, needing `dp[i][j+1]` or `dp[i+1][j]`; take the easier one, then account for this cell: `dp[i][j] = max(1, min(dp[i][j+1], dp[i+1][j]) − dungeon[i][j])`, floored at 1 because health must stay positive.
- *Base case:* pad the table with an extra row and column of "infinity", except the two cells next to the destination, which are 1. Then the destination falls out of the general recurrence.

```java
static int calculateMinimumHP(int[][] dungeon) {
    int m = dungeon.length, n = dungeon[0].length;
    int[][] dp = new int[m + 1][n + 1];
    for (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE);
    dp[m][n - 1] = 1;
    dp[m - 1][n] = 1;
    for (int i = m - 1; i >= 0; i--) {
        for (int j = n - 1; j >= 0; j--) {
            int need = Math.min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j];
            dp[i][j] = Math.max(1, need);
        }
    }
    return dp[0][0];
}
```

For `[[-2,-3,3],[-5,-10,1],[10,30,-5]]`, it's 7. Whenever "the best choice now" depends on information only available later in the path, ask whether the problem reads more naturally backwards from a known endpoint.

## Complexity

All of these are **O(m · n)** time. Space is O(m · n) for the table, or O(n) with a rolling row (Dungeon Game too, filling rows from the bottom).

## Variations

- **Triangle (LC 120):** fill from the bottom row up, `dp[j] = triangle[i][j] + min(dp[j], dp[j + 1])`, so the answer ends at `dp[0]` with no edge cases.
- **Maximal Rectangle (LC 85):** for each row, build the histogram of consecutive 1s above it and take the largest rectangle with a [monotonic stack](lesson:monotonic-stack).
- **Two walkers at once** (Cherry Pickup, LC 741): both move together, so the state grows to their two positions.
- **Counting paths modulo 10⁹ + 7**: reduce after every addition.

## Common mistakes

- **Forgetting the base row and column**, or filling them with the recurrence (they have only one way in).
- **Overwriting the diagonal** in a rolling-row Maximal Square without saving it first.
- **Filling Dungeon Game forwards**, or forgetting the floor of 1.
- **`Integer.MAX_VALUE − dungeon[i][j]`** overflows when the cell is negative: the padding is only ever combined through `min` with a real neighbour, which is why the two seeded cells matter.
- **Treating 4-directional movement as grid DP**: with cycles possible, it's a graph search.

## Practice

Unique Paths (LC 62), Unique Paths II (LC 63), Minimum Path Sum (LC 64), Triangle (LC 120), Maximal Square (LC 221), Dungeon Game (LC 174), Maximal Rectangle (LC 85).

## Key takeaways

- With right and down moves only, `dp[i][j]` combines the cell above and the cell to the left.
- The base row and column have one way in each; fill row by row after them.
- One rolling row suffices, iterating j forwards; save the diagonal if the recurrence reads it.
- A new constraint (obstacles) is often just an override on the same recurrence.
- When what a cell needs depends on the path ahead, fill backwards from the destination.

## Knowledge check

```quiz
? How many paths cross a 3 × 7 grid moving only right and down?
+ 28
- 21
! That's C(7, 2); there are 8 moves in all.
- 10
! Far too few.
- 36
! That's C(9, 2).
> dp[i][j] = dp[i−1][j] + dp[i][j−1], or C(8, 2).

? In the rolling-row Unique Paths, why does dp[j] = dp[j] + dp[j−1] work?
+ Before the update, dp[j] still holds the row above, while dp[j−1] already holds the current row
- Because the grid is square
! It works for any shape.
- Because j runs backwards
! It runs forwards; backwards would read the old dp[j−1].
- It doesn't; a 2-D table is required
! One row is enough here.
> The order of the inner loop decides which row each slot holds.

? Why is Dungeon Game filled backwards?
+ The health needed at a cell depends on the rest of the path, which is only known from the destination's side
- Because the knight starts at the bottom-right
! He starts at the top-left.
- To save memory
! Forwards would use the same memory.
- Because negative cells must come last
! Cell values are fixed; the dependency direction is what matters.
> "Most health so far" doesn't compose; "least health needed from here" does.

? In Maximal Square, why take the minimum of the three neighbours?
+ A square ending at (i, j) needs squares of side s − 1 above, left and diagonally; the smallest of them limits s
- Because the matrix is binary
! Binary values define the 1s, not the min.
- To count all squares
! It finds the largest square ending at each cell.
- The maximum would also work
! The maximum overestimates when one neighbour is small.
> The answer is the largest side, squared.
```
