## The idea

Interview geometry rarely goes beyond axis-aligned rectangles, the cross product and comparing distances, and all of it can be done **exactly, with integers**:
- an axis-aligned rectangle is two independent intervals, one per axis;
- the **cross product** tells you which way three points turn;
- a direction is a reduced `(dx, dy)` pair, not a floating-point slope;
- distances are compared by their squares.

## When to use it

- Rectangle overlap, the area covered by rectangles: per-axis interval overlap.
- "Are these points collinear?", "which side of a line?", polygon area, convex hull: the cross product.
- "The most points on one line": reduced directions as hash keys.
- "The closest points", comparing distances: squared distances.

## How it works

- **Rectangles.** Two rectangles overlap when their intervals overlap on x **and** on y ([intervals](lesson:interval-basics)), and the overlap's width is `max(0, min(rights) − max(lefts))`.
- **The cross product** of OA and OB is `(A − O) × (B − O)`. It's positive when O → A → B turns left (counter-clockwise), negative when it turns right, and 0 when the three points are collinear. It's exact on integers.

```text
            B                   cross(O, A, B) > 0:   B is LEFT of O -> A  (counter-clockwise turn)
           /
          O --------> A         cross(O, A, B) = 0:   O, A, B are collinear
           \
            B'                  cross(O, A, B') < 0:  B' is RIGHT of O -> A  (clockwise turn)
```

- **No doubles.** Different slopes can round to the same double, vertical lines need a special case, and `0.0` and `-0.0` are *different* keys in a `HashMap<Double, …>`. A reduced `(dx, dy)` pair with one sign convention is exact.

## Java template

```java
// The cross product of OA and OB: > 0 when O -> A -> B turns left (counter-clockwise),
// < 0 when it turns right, and 0 when the three points are collinear. Exact on integers.
static long cross(int[] o, int[] a, int[] b) {
    return (long) (a[0] - o[0]) * (b[1] - o[1]) - (long) (a[1] - o[1]) * (b[0] - o[0]);
}
```

Cast to `long` before multiplying. Coordinates up to 10⁴ keep the products below 10⁹, but at 10⁵ an `int` overflows.

## Worked examples

### Rectangle Overlap and Rectangle Area (LC 836, LC 223)

```java
// LC 836 Rectangle Overlap, rectangles as [x1, y1, x2, y2]: a positive-area overlap needs the
// projections to overlap on BOTH axes.
public boolean isRectangleOverlap(int[] a, int[] b) {
    return Math.max(a[0], b[0]) < Math.min(a[2], b[2])
        && Math.max(a[1], b[1]) < Math.min(a[3], b[3]);
}

// LC 223 Rectangle Area: the area covered by two rectangles = A + B - their intersection.
public int computeArea(int ax1, int ay1, int ax2, int ay2, int bx1, int by1, int bx2, int by2) {
    int overlapW = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
    int overlapH = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
    return (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - overlapW * overlapH;
}
```

LC 836 wants a *positive-area* overlap, so the comparisons are strict: rectangles that only touch along an edge don't count.

### Check If It Is a Straight Line (LC 1232)

```java
// LC 1232: every point must be collinear with the first two (the points are distinct).
public boolean checkStraightLine(int[][] c) {
    for (int i = 2; i < c.length; i++) {
        if (cross(c[0], c[1], c[i]) != 0) return false;
    }
    return true;
}
```

### Max Points on a Line (LC 149)

```java
// LC 149 Max Points on a Line: from each anchor, group the later points by their reduced direction.
public int maxPoints(int[][] points) {
    int n = points.length, best = Math.min(n, 1);
    for (int i = 0; i < n; i++) {
        Map<Long, Integer> directions = new HashMap<>();
        for (int j = i + 1; j < n; j++) {
            int dx = points[j][0] - points[i][0], dy = points[j][1] - points[i][1];
            int g = (int) gcd(dx, dy);           // the points are distinct, so g > 0
            dx /= g;
            dy /= g;
            // one sign convention: (1, 2) and (-1, -2) are one line
            if (dx < 0 || (dx == 0 && dy < 0)) {
                dx = -dx;
                dy = -dy;
            }
            long key = ((long) dx << 32) | (dy & 0xFFFFFFFFL);   // pack the pair into one long
            best = Math.max(best, 1 + directions.merge(key, 1, Integer::sum));
        }
    }
    return best;
}
```

`gcd` is from [GCD and modular inverses](lesson:gcd-and-modular-inverses). Only points after the anchor need checking, because every line is counted from its first point.

### Valid Square (LC 593): squared distances

```java
// LC 593 Valid Square: four equal sides and two equal diagonals, twice as long (squared).
public boolean validSquare(int[] p1, int[] p2, int[] p3, int[] p4) {
    int[][] p = { p1, p2, p3, p4 };
    long[] d = new long[6];
    int k = 0;
    for (int i = 0; i < 4; i++) {
        for (int j = i + 1; j < 4; j++) d[k++] = squaredDistance(p[i], p[j]);
    }
    Arrays.sort(d);
    return d[0] > 0 && d[0] == d[3] && d[4] == d[5] && d[4] == 2 * d[0];
}

static long squaredDistance(int[] a, int[] b) {
    long dx = a[0] - b[0], dy = a[1] - b[1];
    return dx * dx + dy * dy;
}
```

## Complexity

The rectangle checks and the cross product are O(1); Max Points on a Line checks O(n²) pairs; the convex hull below is O(n log n), for the sort.

## Variations

- **Area:** `cross(O, A, B)` is twice the signed area of triangle OAB, and a polygon's area is half the sum of `x[i]·y[i+1] − x[i+1]·y[i]` around its vertices (the shoelace formula).
- **Segment intersection:** segments AB and CD cross when C and D lie on opposite sides of AB, *and* A and B lie on opposite sides of CD.
- **The convex hull**, by Andrew's monotone chain: sort the points, then build the lower and upper hulls, popping while the last turn isn't a left turn.

  ```java
  static List<int[]> convexHull(int[][] pts) {
      int[][] p = pts.clone();
      Arrays.sort(p, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
      int n = p.length, k = 0;
      if (n < 3) return new ArrayList<>(Arrays.asList(p));
      int[][] hull = new int[2 * n][];
      for (int i = 0; i < n; i++) {                                   // lower hull
          while (k >= 2 && cross(hull[k - 2], hull[k - 1], p[i]) <= 0) k--;
          hull[k++] = p[i];
      }
      for (int i = n - 2, lower = k + 1; i >= 0; i--) {               // upper hull
          while (k >= lower && cross(hull[k - 2], hull[k - 1], p[i]) <= 0) k--;
          hull[k++] = p[i];
      }
      return new ArrayList<>(Arrays.asList(hull).subList(0, k - 1));   // the last point repeats the first
  }
  ```

  Popping on `<= 0` drops points that lie on the hull's edges. Erect the Fence (LC 587) keeps them: pop only on a strict right turn, and remove the duplicates at the end.
- **The union of many rectangles**, Rectangle Area II (LC 850), needs coordinate compression plus a sweep line.
- **Manhattan distance** `|dx| + |dy|` is the grid-move distance. The identity `|x₁ − x₂| + |y₁ − y₂| = max over the sign choices of (±x ± y) differences` turns "the maximum Manhattan distance" into four max-minus-min scans (LC 1131).
- **The k closest points:** sort, heap or quickselect on `x² + y²` (K Closest Points to Origin, LC 973; see [top k](lesson:top-k-and-two-heaps)).

## Common mistakes

- **Multiplying `int` coordinates in the cross product** without widening to `long`.
- **Storing slopes as doubles**: rounding, vertical lines, and `0.0` versus `-0.0` keys.
- **Forgetting the sign convention** for directions, so `(1, 2)` and `(−1, −2)` count as different lines.
- **Counting edge contact as an overlap** in LC 836: the comparisons must be strict.
- **Taking square roots to compare distances**: compare the squares, exactly.

## Practice

Rectangle Overlap (LC 836), Rectangle Area (LC 223), Check If It Is a Straight Line (LC 1232), Valid Square (LC 593), K Closest Points to Origin (LC 973), Max Points on a Line (LC 149), Erect the Fence (LC 587), Rectangle Area II (LC 850).

## Key takeaways

- An axis-aligned rectangle is two intervals: overlap needs both axes, and the overlap width is `max(0, min(rights) − max(lefts))`.
- The cross product's sign gives the turn: positive left, negative right, zero collinear. Widen to `long`.
- Represent directions as reduced `(dx, dy)` pairs with one sign convention, never as doubles.
- Compare distances by their squares.
- Area, segment intersection and the convex hull all come from the cross product.

## Knowledge check

```quiz
? Rectangles [0, 0, 1, 1] and [1, 0, 2, 1]: do they overlap, by LC 836's definition?
+ No: they only touch along the edge x = 1, which has zero area
- Yes: they share an edge
! LC 836 needs a positive-area overlap.
- Yes: their y-ranges are identical
! Both axes must overlap with positive length.
- It depends on the order of the arguments
! Overlap is symmetric.
> Strict comparisons exclude touching edges.

? What does cross(O, A, B) > 0 mean?
+ O → A → B turns left (counter-clockwise)
- O → A → B turns right
! That's a negative cross product.
- The three points are collinear
! That's a cross product of 0.
- B is farther from O than A
! The cross product measures turning, not distance.
> It's also twice the signed area of triangle OAB.

? Why does Max Points on a Line avoid storing slopes as doubles?
+ Different slopes can round to the same double, vertical lines need a special case, and 0.0 and −0.0 are different keys
- Doubles are too slow to hash
! Speed isn't the problem; correctness is.
- Because the slopes are always integers
! Most slopes are fractions.
- Java can't put doubles in a HashMap
! It can, which is how the bug happens.
> A reduced (dx, dy) pair is exact.

? Why compare dx² + dy² instead of the actual distances?
+ The squares are exact integers, and squaring preserves the order of non-negative distances
- Square roots are wrong in Java
! They're approximate, not wrong; exactness is the point.
- Because distances are always integers
! √2 isn't.
- To make the numbers smaller
! Squares are larger.
> Use long: dx² + dy² can exceed an int.
```
