## The idea

A grid is the most common disguise a graph wears in interviews. Each cell `(r, c)` is a node, with edges to its neighbours: usually the 4 orthogonal directions, sometimes 8 with the diagonals. Traverse cells exactly like nodes; you just compute the neighbours with `(r ± 1, c)` and `(r, c ± 1)` instead of looking them up in an adjacency list.

## When to use it

- "Islands", "regions", "connected areas", flood fill: DFS or BFS over the cells.
- "The shortest path through a maze" (unweighted): [BFS on the grid](lesson:breadth-first-search).
- "Something spreads from several places at once" (rotting, fire, distance to the nearest X): [multi-source BFS](lesson:multi-source-and-0-1-bfs).
- "Which cells can reach the border?": search inwards from the border instead.

## How it works

- A **direction array** lists the moves, so one loop handles all of them: `{{0,1},{0,-1},{1,0},{-1,0}}`.
- Check the **bounds first**, then the cell's value: reading `grid[r][c]` out of bounds throws.
- Track visited cells with a `boolean[][]`, or **mutate the grid in place** (sink a land cell to water once it's visited), which saves the extra array when you're allowed to change the input.
- Counting regions is exactly [counting connected components](lesson:depth-first-search): the grid is just the graph's disguise.

## Java template

```java
int[][] directions = {{0,1},{0,-1},{1,0},{-1,0}}; // right, left, down, up

public void dfsGrid(int[][] grid, int r, int c, boolean[][] visited) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return;
    if (visited[r][c] || grid[r][c] == 0) return; // adapt the "blocked" condition to the problem
    visited[r][c] = true;

    for (int[] dir : directions) {
        dfsGrid(grid, r + dir[0], c + dir[1], visited);
    }
}
```

## Worked examples

### Number of Islands (LC 200)

```java
public int numIslands(char[][] grid) {
    int count = 0;
    int rows = grid.length, cols = grid[0].length;
    boolean[][] visited = new boolean[rows][cols];

    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == '1' && !visited[r][c]) {
                count++;
                dfsIsland(grid, r, c, visited);
            }
        }
    }
    return count;
}

private void dfsIsland(char[][] grid, int r, int c, boolean[][] visited) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return;
    if (visited[r][c] || grid[r][c] == '0') return;
    visited[r][c] = true;
    dfsIsland(grid, r + 1, c, visited);
    dfsIsland(grid, r - 1, c, visited);
    dfsIsland(grid, r, c + 1, visited);
    dfsIsland(grid, r, c - 1, visited);
}
```

### Max Area of Island (LC 695): sink as you go

Return the size of each island instead of a flag, and sink cells to mark them visited:

```java
private int area(int[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != 1) return 0;
    grid[r][c] = 0;                                   // sink it: this marks the cell visited
    return 1 + area(grid, r + 1, c) + area(grid, r - 1, c) + area(grid, r, c + 1) + area(grid, r, c - 1);
}
```

Call it from every land cell, and keep the maximum.

### Surrounded Regions (LC 130): start from the border

Capture every 'O' region that doesn't touch the border. Searching each region and asking "does it touch the border?" is awkward; it's simpler to mark everything reachable *from* the border, then flip the rest:

```java
public void solve(char[][] board) {
    int rows = board.length, cols = board[0].length;
    for (int r = 0; r < rows; r++) {
        keep(board, r, 0);
        keep(board, r, cols - 1);
    }
    for (int c = 0; c < cols; c++) {
        keep(board, 0, c);
        keep(board, rows - 1, c);
    }
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            board[r][c] = board[r][c] == '#' ? 'O' : 'X';   // '#' was safe; any 'O' left is surrounded
        }
    }
}

private void keep(char[][] b, int r, int c) {
    if (r < 0 || r >= b.length || c < 0 || c >= b[0].length || b[r][c] != 'O') return;
    b[r][c] = '#';
    keep(b, r + 1, c);
    keep(b, r - 1, c);
    keep(b, r, c + 1);
    keep(b, r, c - 1);
}
```

Pacific Atlantic Water Flow (LC 417) uses the same reversal: search uphill from each ocean's border, and answer with the cells both searches reach.

## Complexity

**O(rows × cols)** time: every cell is visited once, with 4 neighbour checks. Space is O(rows × cols) for the visited array, and the recursion can be that deep too, on a snake-shaped region.

## Variations

- **Eight directions:** add the four diagonals to the direction array when the problem says cells touching at corners are connected.
- **Shortest paths** in a grid are [BFS](lesson:breadth-first-search), and things spreading from many cells at once, such as Rotting Oranges (LC 994), are [multi-source BFS](lesson:multi-source-and-0-1-bfs).
- **Islands added one at a time** (Number of Islands II, LC 305): [union-find](lesson:union-find), since rerunning DFS after each addition would be too slow.
- **Backtracking on a grid** (Word Search) un-marks cells on the way back: see [backtracking choices](lesson:backtracking-choices).

## Common mistakes

- **Reading the cell before checking the bounds**: `grid[r][c]` throws when r or c is out of range.
- **Marking visited after recursing** instead of before, which recurses forever between two neighbours.
- **Deep recursion on large grids**: a 1000 × 1000 grid can produce a path of 10⁶ cells, far past Java's default stack. Use BFS or an explicit stack.
- **Comparing `char` cells with ints**: in LC 200 the cells are `'1'` and `'0'`, not 1 and 0.
- **Mutating the input** when the problem (or the interviewer) needs it unchanged.

## Practice

Flood Fill (LC 733), Number of Islands (LC 200), Max Area of Island (LC 695), Surrounded Regions (LC 130), Number of Closed Islands (LC 1254), Pacific Atlantic Water Flow (LC 417), Making A Large Island (LC 827).

## Key takeaways

- A grid is a graph: cells are nodes, and neighbours come from a direction array.
- Check the bounds, then the cell, then mark it visited, before recursing.
- Counting regions is counting connected components.
- To find what can reach the border, search inwards from the border.
- Large grids can overflow the recursion stack: prefer BFS or an explicit stack there.

## Knowledge check

```quiz
? In dfsGrid, why check the bounds before reading grid[r][c]?
+ Reading an out-of-range cell throws ArrayIndexOutOfBoundsException
- Because the bounds check is faster
! Order matters for correctness, not speed.
- To skip water cells
! That's the second check.
- It doesn't matter which comes first
! The cell read fails when r or c is out of range.
> Bounds, then the cell's value, then visited.

? Surrounded Regions starts its search from the border. Why?
+ The 'O' cells that survive are exactly those reachable from the border, so marking those first leaves only the surrounded ones
- Because the border cells are always 'X'
! Border cells can be 'O'.
- To save memory
! Memory is the same either way.
- Because DFS must start at a corner
! DFS can start anywhere.
> Reverse the question: what can reach the border?

? A 1000 × 1000 grid is entirely land. Why might recursive DFS crash?
+ The recursion can follow a path through all 10⁶ cells, overflowing Java's default stack
- Because 10⁶ cells don't fit in memory
! A million booleans is only about 1 MB.
- Because DFS can't handle grids
! It handles them; the depth is the problem.
- Because the island count overflows an int
! There's only one island.
> Use BFS or an explicit stack for big grids.

? Max Area of Island sets grid[r][c] = 0 when it visits a cell. What does that replace?
+ The visited array: a sunk cell no longer looks like land, so it's never counted again
- The bounds check
! Bounds still need checking.
- The return value
! The area is still returned.
- Nothing; it's a bug
! It's deliberate, when changing the input is allowed.
> Mutating in place saves O(rows × cols) memory.
```
