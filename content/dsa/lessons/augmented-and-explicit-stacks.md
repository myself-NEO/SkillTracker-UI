## The idea

Two ways to get more out of a stack than push and pop:

- **Augment it.** If an extra query is about everything *below* an element (the minimum so far, the sum so far), store the answer alongside each element. The stack only grows and shrinks at the top, so the answer for "everything below me" never changes while I'm on the stack.
- **Make it explicit.** Every recursive function is a stack machine. Replace the call stack with your own, holding the local state a stack frame would hold.

## When to use it

- **"Design a stack that also supports X in O(1)"**: `getMin`, `getMax`, a running sum.
- **"Solve it iteratively"**, "without recursion".
- **Deep recursion that would overflow**: a tree or graph 10⁵ levels deep.
- Traversals where you need control over the order or want to pause and resume (iterators).

## How it works

**Augmented stacks.** Push a pair: the value, and the answer for the stack up to and including it. Popping restores the previous answer for free, because it's stored in the element below.

**Explicit stacks.** A recursive call does three things: it remembers where to come back to, it keeps its local variables, and it processes the children. An explicit stack holds the same information: push the work you'd recurse on, pop to process the next item. Children pushed last are processed first, so push them in reverse if order matters.

## Java template

```java
// Augmented: store the answer for "this element and everything below it".
Deque<int[]> stack = new ArrayDeque<>();                        // {value, minSoFar}
stack.push(new int[] {val, stack.isEmpty() ? val : Math.min(val, stack.peek()[1])});
```

```java
// Recursion -> explicit stack: push the work a recursive call would do.
Deque<Node> stack = new ArrayDeque<>();
stack.push(start);
while (!stack.isEmpty()) {
    Node node = stack.pop();
    // process node, then push its "recursive calls" (in reverse if order matters)
}
```

## Worked examples

### Min Stack (LC 155): O(1) `getMin()`

```java
class MinStack {
    private final Deque<int[]> stack = new ArrayDeque<>();  // {value, minSoFar}

    public void push(int val) {
        int min = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
        stack.push(new int[]{val, min});
    }
    public void pop()      { stack.pop(); }
    public int  top()      { return stack.peek()[0]; }
    public int  getMin()   { return stack.peek()[1]; }
}
```

O(1) for everything, O(n) extra space.

### Iterative inorder traversal (LC 94)

```java
public List<Integer> inorderTraversal(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) { stack.push(cur); cur = cur.left; }  // dive left
        cur = stack.pop();
        out.add(cur.val);                                          // visit
        cur = cur.right;                                           // then right
    }
    return out;
}
```

### Iterative DFS on a graph

```java
void dfsIterative(int start, List<List<Integer>> adj, boolean[] visited) {
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(start);
    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (visited[node]) continue;      // mark on POP, not on push
        visited[node] = true;
        // process node
        for (int nb : adj.get(node)) if (!visited[nb]) stack.push(nb);
    }
}
```

**The classic bug:** marking visited on *push* and marking it on *pop* give different traversal orders, and marking only on push can stop a node being reached the way a true depth-first order would reach it. Marking on pop with a `continue` guard is the safe default. Iterative DFS also visits children in *reverse* order compared with recursion (the last child pushed pops first), so push them in reverse if order matters. More in [depth-first search](lesson:depth-first-search).

## Complexity

- Min stack: O(1) per operation; O(n) extra space, or O(1) extra with the encoding below.
- Iterative traversals: O(n) time; O(h) stack space for a tree of height h, O(V) for a graph.

## Variations

### Min Stack with O(1) extra space

**Follow-up: can you do O(1) extra space?** Yes: encode the old minimum into the pushed value using `2*val - min`. Careful with overflow (use `long`):

```java
class MinStackO1 {
    private final Deque<Long> stack = new ArrayDeque<>();
    private long min;

    public void push(int val) {
        if (stack.isEmpty()) { min = val; stack.push((long) val); return; }
        if (val < min) { stack.push(2L * val - min); min = val; }  // encoded marker
        else stack.push((long) val);
    }
    public void pop() {
        long top = stack.pop();
        if (top < min) min = 2 * min - top;   // decode previous min
    }
    public int top() {
        long top = stack.peek();
        return (int) (top < min ? min : top);
    }
    public int getMin() { return (int) min; }
}
```

**Explanation:** when a new minimum arrives, we store `2*val - min`, which is strictly less than `val` and therefore less than the new `min`: that's the flag. On pop, if the stored value is below `min`, it's an encoded entry, and the previous minimum is recovered as `2*min - stored`. Show the O(n)-space version first, then offer this as the optimisation. Leading with the clever one and getting it wrong is worse than leading with the simple one.

**The same pattern** gives a max stack, a stack with an O(1) sum, or a stack with an O(1) "count of elements > k".

### Iterative postorder: the reversed-preorder trick (LC 145)

Postorder is Left-Right-Root. Do a modified preorder (Root-Right-Left) and reverse it:

```java
public List<Integer> postorderTraversal(TreeNode root) {
    LinkedList<Integer> out = new LinkedList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    if (root != null) stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode n = stack.pop();
        out.addFirst(n.val);                       // prepend == reverse
        if (n.left  != null) stack.push(n.left);
        if (n.right != null) stack.push(n.right);
    }
    return out;
}
```

### Sort a stack using only stack operations

```java
public void sortStack(Deque<Integer> s) {
    Deque<Integer> tmp = new ArrayDeque<>();
    while (!s.isEmpty()) {
        int cur = s.pop();
        while (!tmp.isEmpty() && tmp.peek() > cur) s.push(tmp.pop());
        tmp.push(cur);
    }
    while (!tmp.isEmpty()) s.push(tmp.pop());   // back to original, now sorted
}
```

O(n²) time, O(n) space: it's insertion sort with stacks. A classic warm-up question.

## Common mistakes

- **Recomputing the minimum on pop** by scanning the stack, which makes `pop` O(n). Store it with each element.
- **Overflow in the O(1)-space min stack.** `2 * val - min` can exceed `int`; use `long`.
- **Leading with the clever encoding** before showing the simple version.
- **Marking nodes visited on push** in iterative DFS when you need a true depth-first order; mark on pop with a guard.
- **Forgetting that children come out reversed**: push them in reverse order when the visiting order matters.

## Practice

Min Stack (LC 155), Design a Stack With Increment Operation (LC 1381), Binary Tree Inorder Traversal (LC 94), Binary Tree Preorder Traversal (LC 144), Binary Tree Postorder Traversal (LC 145), Max Stack (LC 716).

## Key takeaways

- If a query is about everything below an element, store the answer with the element: it never changes while the element is on the stack.
- A min stack is O(1) for every operation with pairs, or O(1) extra space with the `2·val − min` encoding.
- Any recursion can become a loop over an explicit stack holding the state a call frame would keep.
- An explicit stack visits children in reverse; push them in reverse if order matters.
- In iterative DFS, marking visited on pop with a guard is the safe default.

## Knowledge check

```quiz
? Why can a min stack store the minimum alongside each element instead of recomputing it?
+ Elements only leave from the top, so the minimum of everything below an element never changes while it's there
- Because the elements are sorted
! A stack isn't sorted.
- Because getMin is called rarely
! It must be O(1) however often it's called.
- Because the minimum is always the bottom element
! The minimum can be anywhere in the stack.
> Popping simply reveals the stored minimum of the element below.

? In the O(1)-space min stack, how does `pop` know that the popped value was an encoded marker?
+ An encoded value is always smaller than the current minimum, which no real value can be
- Encoded values are negative
! They're below the current minimum, which may be any sign.
- A separate boolean stack records it
! That would use O(n) extra space.
- Every second entry is encoded
! Only pushes of a new minimum are encoded.
> When top < min, the previous minimum is recovered as 2·min − top.

? Iterative DFS on a graph pushes neighbours in their adjacency-list order. In what order are they visited, compared with recursive DFS?
+ In reverse, because the last neighbour pushed is popped first
- In the same order
! A stack returns the most recent push first.
- In sorted order
! Nothing sorts the neighbours.
- In random order
! The order is deterministic: reversed.
> Push neighbours in reverse if you need the recursive order.

? Why rewrite a recursive tree traversal with an explicit stack?
+ To avoid a StackOverflowError on very deep trees, and to control or pause the traversal
- Because recursion is slower asymptotically
! Both are O(n) time.
- Because recursion can't visit every node
! Recursion visits every node; depth is the limit.
- To use less memory in every case
! The explicit stack holds the same O(h) state.
> The explicit stack lives on the heap, which is far larger than the thread's call stack.
```
