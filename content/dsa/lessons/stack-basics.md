Stacks, queues and heaps answer the same question, **"which element do I process next?"**, and differ only in the answer. This module starts with the stack; queues and heaps follow.

## What it is

A stack is a linear collection with a single access point, the **top**. Three operations:

- `push(x)` puts x on top;
- `pop()` removes and returns the top;
- `peek()` looks at the top without removing it.

**LIFO**: Last In, First Out. A stack of plates, the browser's back button, an undo history, and the call stack your JVM already uses for every method invocation.

Where it sits among its relatives:

| Structure | Next element is… | Order | Core op cost |
|---|---|---|---|
| Stack | the **most recently** added | LIFO | O(1) |
| [Queue](lesson:queue-basics) | the **least recently** added | FIFO | O(1) |
| [Heap](lesson:heap-basics) | the **most extreme** (min or max) | by priority | O(log n) |

## How it works

A stack is the natural memory for **nested** structure. When you see `( [ { } ] )`, or nested folders, or nested function calls, or an expression like `2 * (3 + (4 - 1))`, the innermost thing must finish first: that's exactly LIFO.

The deeper insight for interviews: a stack is how you remember *"I'm not done with this yet, come back to it."* Nesting, undo, pending work, "the last thing still open". The sentence to say when the interviewer asks "why a stack?":

> *The problem has nested or pending structure, and the innermost unresolved thing must resolve first.*

Under the hood a stack is just an array plus an index (or a linked list whose head is the top), so every operation is O(1).

## Build it from scratch

**Approach.** Two choices of backing store: an array (fast, needs resizing) or a linked list (no resizing, extra node allocation). Know both; array-based is asked more.

### Array-based, with amortised O(1) growth

```java
public class ArrayStack<T> {
    private Object[] data;
    private int size;

    public ArrayStack() { this(16); }

    public ArrayStack(int capacity) {
        if (capacity <= 0) capacity = 1;
        data = new Object[capacity];
    }

    public void push(T x) {
        if (size == data.length) resize(data.length * 2);
        data[size++] = x;
    }

    @SuppressWarnings("unchecked")
    public T pop() {
        if (isEmpty()) throw new java.util.NoSuchElementException("stack is empty");
        T val = (T) data[--size];
        data[size] = null;                       // avoid loitering / memory leak
        if (size > 0 && size == data.length / 4) // shrink at 1/4, not 1/2
            resize(data.length / 2);
        return val;
    }

    @SuppressWarnings("unchecked")
    public T peek() {
        if (isEmpty()) throw new java.util.NoSuchElementException("stack is empty");
        return (T) data[size - 1];
    }

    public boolean isEmpty() { return size == 0; }
    public int size()        { return size; }

    private void resize(int newCap) {
        Object[] bigger = new Object[newCap];
        System.arraycopy(data, 0, bigger, 0, size);
        data = bigger;
    }
}
```

**The non-obvious parts:**

- `data[size] = null` on pop. Without it the array still holds a reference to a popped object, so the GC can't collect it. This is called *loitering*, and interviewers specifically look for it.
- **Doubling on grow** gives *amortised* O(1) push: n pushes cost 1+2+4+...+n ≈ 2n copies in total, so O(1) each on average. A single push can still be O(n); say "amortised O(1), worst case O(n)" and you sound precise.
- **Shrink at 1/4, halve to 1/2** (not shrink at 1/2). If you shrank at half-full, a push-pop-push-pop sequence at the boundary would resize on every single operation: O(n) per op. This is called *thrashing*, and avoiding it is a classic follow-up question.

### Linked-list based

```java
public class LinkedStack<T> {
    private static class Node<T> {
        T val; Node<T> next;
        Node(T val, Node<T> next) { this.val = val; this.next = next; }
    }

    private Node<T> head;   // head == top
    private int size;

    public void push(T x) { head = new Node<>(x, head); size++; }

    public T pop() {
        if (head == null) throw new java.util.NoSuchElementException();
        T val = head.val;
        head = head.next;
        size--;
        return val;
    }

    public T peek() {
        if (head == null) throw new java.util.NoSuchElementException();
        return head.val;
    }

    public boolean isEmpty() { return head == null; }
    public int size()        { return size; }
}
```

**The trade-off to state in an interview:** array-based has better cache locality and uses less memory per element, but has occasional O(n) resizes; linked-list based gives true worst-case O(1) per operation, but allocates a node per push (≈16–32 bytes of object overhead each) and chases pointers. For interview code, array-based wins unless worst-case latency matters.

## Java API

```java
// ❌ DON'T: java.util.Stack
Stack<Integer> s = new Stack<>();
```

`java.util.Stack` extends `Vector`. Three problems:
1. Every method is `synchronized`: pointless locking overhead in single-threaded code.
2. It's a `Vector`, so it exposes `get(i)`, `add(i, x)` and so on: it isn't really a stack.
3. **Its iteration order is bottom-to-top**, the *reverse* of pop order. This has silently broken a lot of interview code.

```java
// ✅ DO: ArrayDeque as a stack
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);          // addFirst
stack.push(2);
int top  = stack.peek();  // 2, peekFirst, null if empty
int out  = stack.pop();   // 2, removeFirst, throws NoSuchElementException if empty
boolean empty = stack.isEmpty();
int size = stack.size();
```

`ArrayDeque` is a growable circular array: faster than `LinkedList` (no node objects, cache friendly) and faster than `Stack` (no locks). **Iterating an `ArrayDeque` used via `push` goes top → bottom**, which is what you usually want. One gotcha: **`ArrayDeque` doesn't permit `null` elements.** If you need nulls, use `LinkedList`; you almost never do.

For `char`- or `int`-heavy problems where you care about constant factors, a plain array is fine and often clearer:

```java
int[] stack = new int[n];
int top = 0;                 // stack[top-1] is the top element
stack[top++] = x;            // push
int v = stack[--top];        // pop
boolean empty = (top == 0);
```

Interviewers like this: it shows you know a stack is just an array plus an index.

## Operations and complexity

| Operation | `ArrayDeque` / array stack | Linked stack |
|---|---|---|
| `push` | amortised O(1) (O(n) on a resize) | O(1) |
| `pop`, `peek` | O(1) | O(1) |
| `isEmpty`, `size` | O(1) | O(1) |
| Space | O(n), contiguous | O(n) plus a node object per element |

## Patterns

The stack lessons that follow are the patterns interviews actually use:

- **[Matching and simulation](lesson:matching-and-simulation)**: balanced brackets, and elements that cancel or collapse into what came before.
- **[Monotonic stack](lesson:monotonic-stack)**: "next greater/smaller element", histograms, spans. The highest-value stack pattern.
- **[Expression parsing](lesson:expression-parsing)**: calculators and nested strings: save the context on `(`, restore it on `)`.
- **[Augmented and explicit stacks](lesson:augmented-and-explicit-stacks)**: a min stack, and replacing recursion with your own stack.

Depth-first search is a stack too: recursion uses the call stack, and the iterative version uses an explicit one.

## Common mistakes

- **Using `java.util.Stack`**, with its locking overhead and bottom-to-top iteration order. Use `ArrayDeque`.
- **`pop()` on an empty stack.** `ArrayDeque.pop()` throws `NoSuchElementException`; check `isEmpty()` first, or use `poll()`, which returns `null`.
- **Pushing `null` into an `ArrayDeque`**, which throws a `NullPointerException`.
- **Not clearing popped slots** in an array-based stack, which keeps popped objects alive (loitering).
- **Shrinking at half-full**, which makes a push–pop sequence at the boundary resize every time.

## Key takeaways

- A stack gives the most recently added element first (LIFO), with O(1) push, pop and peek.
- Reach for one when the problem has nested or pending structure and the innermost thing must resolve first.
- In Java use `ArrayDeque` (`push`, `pop`, `peek`), never `java.util.Stack`.
- An array-based stack grows by doubling (amortised O(1)) and shrinks at a quarter full to avoid thrashing.
- Clear popped slots so the garbage collector can reclaim them.

## Knowledge check

```quiz
? Why should you use `ArrayDeque` instead of `java.util.Stack` in Java?
+ `Stack` is a synchronized `Vector` that iterates bottom to top; `ArrayDeque` is faster and iterates in pop order
- `Stack` can't hold objects
! It can hold any object.
- `ArrayDeque` allows null elements
! It doesn't; that's one of its few restrictions.
- `Stack` has no `peek` method
! It has push, pop and peek.
> Stack's locking and Vector API make it a poor stack.

? An array-based stack halves its capacity when it becomes half full. What goes wrong?
+ A push and pop sequence at the boundary resizes on every operation: O(n) each (thrashing)
- Popped elements are never garbage-collected
! That's loitering, a different bug.
- The stack can no longer grow
! It still doubles when full.
- Nothing; that's the standard policy
! The standard policy shrinks at a quarter full.
> Shrinking at 1/4 leaves room on both sides of every resize.

? Why does `pop` set `data[size] = null` in the array-based stack?
+ Otherwise the array keeps a reference to the popped object, which stops it being garbage-collected
- To mark the slot as free for the next push
! The size field already tracks which slots are free.
- To make `peek` return null on an empty stack
! peek throws on an empty stack.
- Java requires array slots to be cleared
! It doesn't; the reference just keeps the object alive.
> This leak is called loitering.

? Which problem is a stack the natural fit for?
+ Checking that brackets in a string are balanced
- Processing tasks in the order they arrived
! That's first in, first out: a queue.
- Repeatedly taking the smallest element from a changing set
! That's a heap.
- Looking up values by key
! That's a hash map.
> The most recently opened bracket must close first: last in, first out.
```
