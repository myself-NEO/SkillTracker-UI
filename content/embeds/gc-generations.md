Scroll through a young-generation collection step by step:

````scrolly name="gc-generations"
{ "tenuringThreshold": 3 }
---
**Allocation.** A new object goes into **Eden**, the largest part of the young generation. Each thread allocates from its own buffer by bumping a pointer, so `new` costs only a few instructions.
---
**Eden fills up.** A **minor GC** pauses the application briefly and marks every object reachable from the roots: local variables, static fields, and old objects that point into the young generation (tracked by the card table). Most young objects are already dead.
---
**Copying.** The live objects are **copied** into the empty survivor space and their **age** goes up by one. Eden and the other survivor space are then wiped in one go, so the cost depends on what survives, not on how much garbage there was.
---
**Taking turns.** Eden fills again, and the next minor GC copies the live objects from Eden *and* the occupied survivor space into the other one. The two survivor spaces take turns being empty.
---
**Promotion.** An object that keeps surviving reaches the **tenuring threshold** and is copied to the **old generation** instead. Long-lived caches and configuration end up there.
---
**Major GC.** The old generation fills slowly. When it is full, a **major (full) GC** marks and compacts the whole heap: far rarer than a minor GC, but each one takes much longer. Collectors such as G1 and ZGC do much of this work concurrently to keep pauses short.
````

The same story in one diagram:
