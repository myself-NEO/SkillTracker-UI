## The idea

A matrix is an array of rows, and most matrix problems come down to **visiting cells in the right order** (row by row, layer by layer, along diagonals) or **transforming the grid in place** with index arithmetic. Get the indexes right and the rest is bookkeeping.

## When to use it

- **Traversal orders:** spiral, diagonal or zigzag output.
- **In-place transforms:** rotating, transposing or flipping a square matrix; setting rows and columns to zero.
- **Neighbour walks:** visiting the up/down/left/right cells of a grid, which leads into [grids as graphs](lesson:grids-as-graphs) for flood fill and BFS.
- **Sorted matrices:** searching a matrix whose rows or columns are sorted is binary search: see [binary search in matrices](lesson:binary-search-in-matrices).
- **Submatrix sums:** use [2-D prefix sums](lesson:prefix-sums).

## How it works

- **Indexes.** `matrix.length` is the number of rows and `matrix[0].length` the number of columns; cell `(r, c)` is `matrix[r][c]`.
- **Boundaries for layers.** Keep four boundaries (`top`, `bottom`, `left`, `right`), walk the outer layer, then move all four inward. This handles spirals and layer-by-layer rotation.
- **Transpose** swaps `(i, j)` with `(j, i)`, the reflection across the main diagonal. Only swap the cells above the diagonal (`j > i`); swapping every cell undoes each swap.
- **Rotation as two reflections.** Rotating 90° clockwise sends `old[i][j]` to `new[j][n−1−i]`. Transposing, then reversing each row, gives exactly that. Reversing each row first, then transposing, rotates counter-clockwise.
- **Direction arrays** turn "the four neighbours" into a loop instead of four copies of the same code.

## Java template

```java
int rows = grid.length, cols = grid[0].length;
int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};          // up, down, left, right
for (int[] d : dirs) {
    int r = row + d[0], c = col + d[1];
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue;   // off the grid
    // visit grid[r][c]
}
```

## Worked examples

**Spiral traversal (LC 54).** Maintain four shrinking boundaries (`top`, `bottom`, `left`, `right`); traverse the top row left→right, the right column top→bottom, the bottom row right→left, and the left column bottom→top, then shrink all four boundaries inward and repeat.

```java
public List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> result = new ArrayList<>();
    if (matrix.length == 0) return result;
    int top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
    while (top <= bottom && left <= right) {
        for (int j = left; j <= right; j++) result.add(matrix[top][j]);
        top++;
        for (int i = top; i <= bottom; i++) result.add(matrix[i][right]);
        right--;
        if (top <= bottom) {
            for (int j = right; j >= left; j--) result.add(matrix[bottom][j]);
            bottom--;
        }
        if (left <= right) {
            for (int i = bottom; i >= top; i--) result.add(matrix[i][left]);
            left++;
        }
    }
    return result;
}
```

The two `if` guards (before the bottom-row and left-column passes) matter for non-square matrices and odd or even dimensions: without them you can double-count a row or column when the spiral collapses to a single line.

**In-place 90° rotation (LC 48).** Transpose (swap across the diagonal), then reverse each row: two clean O(n²) passes, O(1) extra space.

```java
public void rotate(int[][] matrix) {
    int n = matrix.length;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {
            int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t;
        }
    for (int[] row : matrix)
        for (int l = 0, r = n - 1; l < r; l++, r--) {
            int t = row[l]; row[l] = row[r]; row[r] = t;
        }
}
```

## Complexity

Visiting every cell is O(rows · cols) time. Spiral order needs O(1) extra space besides the output; rotation and Set Matrix Zeroes run in place with O(1) extra space.

## Variations

**Set Matrix Zeroes (LC 73) in O(1) extra space.** If a cell is 0, its whole row and column must become 0. Changing cells while you scan corrupts the scan, and a separate set of rows and columns costs O(rows + cols). Instead, use the first row and first column as the markers, and remember separately whether they themselves held a zero:

```java
public void setZeroes(int[][] m) {
    int rows = m.length, cols = m[0].length;
    boolean firstRowZero = false, firstColZero = false;
    for (int j = 0; j < cols; j++) if (m[0][j] == 0) firstRowZero = true;
    for (int i = 0; i < rows; i++) if (m[i][0] == 0) firstColZero = true;
    for (int i = 1; i < rows; i++)                       // mark in the first row and column
        for (int j = 1; j < cols; j++)
            if (m[i][j] == 0) { m[i][0] = 0; m[0][j] = 0; }
    for (int i = 1; i < rows; i++)                       // apply the marks
        for (int j = 1; j < cols; j++)
            if (m[i][0] == 0 || m[0][j] == 0) m[i][j] = 0;
    if (firstRowZero) for (int j = 0; j < cols; j++) m[0][j] = 0;
    if (firstColZero) for (int i = 0; i < rows; i++) m[i][0] = 0;
}
```

**Search a 2D Matrix (LC 74)** treats a matrix whose rows continue one another as one sorted array of `rows · cols` elements, with cell `k` at `(k / cols, k % cols)`: see [binary search in matrices](lesson:binary-search-in-matrices).

**Grids as graphs.** Number of Islands, flood fill and shortest paths on a grid use the direction array with BFS or DFS: see [grids as graphs](lesson:grids-as-graphs).

**Word Search (LC 79)** walks a grid with backtracking, which is a different technique family: see [backtracking choices](lesson:backtracking-choices).

## Common mistakes

- **Mixing up rows and columns.** `matrix.length` is rows and `matrix[0].length` is columns; non-square inputs expose any swap.
- **Transposing every cell.** Looping `j` from 0 swaps each pair twice and leaves the matrix unchanged. Start `j` at `i + 1`.
- **Reading cells you've already changed.** In-place updates (Set Matrix Zeroes, Game of Life) need markers or a second pass, not a single sweep.
- **Forgetting the spiral's guards** for a single remaining row or column.
- **Not handling an empty matrix**, where `matrix[0]` doesn't exist.

## Practice

Spiral Matrix (LC 54), Rotate Image (LC 48), Set Matrix Zeroes (LC 73), Search a 2D Matrix (LC 74), Diagonal Traverse (LC 498), Game of Life (LC 289), Word Search (LC 79, backtracking on a grid).

## Key takeaways

- `matrix.length` is rows, `matrix[0].length` is columns, and cell `(r, c)` is `matrix[r][c]`.
- Four shrinking boundaries handle spiral and layer-by-layer traversal; guard the last single row or column.
- Rotating 90° clockwise is transpose, then reverse each row: O(n²) time, O(1) extra space.
- A direction array turns neighbour visits into a loop with one bounds check.
- To change cells in place based on other cells, mark first and apply afterwards.

## Knowledge check

```quiz
? How do you rotate an n × n matrix 90° clockwise in place?
+ Transpose it, then reverse each row
- Reverse each row, then transpose
! That rotates it counter-clockwise.
- Transpose it twice
! Transposing twice gives back the original matrix.
- Swap the first and last rows, then the second and second-to-last, and so on
! That flips the matrix vertically.
> Transposing reflects across the diagonal, and reversing the rows reflects left to right; together they make a quarter turn clockwise.

? Your transpose loops `j` from 0 to n − 1 for every `i`. What goes wrong?
+ Every pair is swapped twice, so the matrix ends up unchanged
- Cells on the diagonal are lost
! Swapping a diagonal cell with itself changes nothing.
- It throws an ArrayIndexOutOfBoundsException
! The indexes stay in range for a square matrix.
- Nothing; it's just slower
! The second swap undoes the first.
> Only swap above the diagonal: j starts at i + 1.

? Why does the spiral traversal need the `if (top <= bottom)` and `if (left <= right)` guards?
+ Without them a single remaining row or column is traversed twice
- To avoid an infinite loop on square matrices
! The while condition already ends the loop.
- To handle negative numbers in the matrix
! Values are irrelevant to the traversal.
- To make the traversal go counter-clockwise
! The guards don't change the direction.
> After the top row and right column, the remaining region can collapse to a line.

? Set Matrix Zeroes in O(1) extra space: where does the algorithm record which rows and columns to clear?
+ In the first row and first column, with two booleans for whether they held a zero themselves
- In a HashSet of row and column indexes
! That works, but it uses O(rows + cols) extra space.
- By setting cells to −1 as it scans
! −1 may be a real value, and changing cells mid-scan corrupts the scan.
- Nowhere; it clears rows and columns as soon as it finds a zero
! New zeros would then trigger more clearing.
> Marking first and applying afterwards avoids reading cells that were already changed.
```
