Step through a few `put` calls on a small table, then watch a resize split the chains:

```viz name="hashmap-put"
{ "capacity": 4, "keys": ["cat", "dog", 1, 5] }
```

The same steps on the default 16-bucket table:
