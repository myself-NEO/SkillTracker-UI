Watch round robin spread requests, then skip a server that fails its health checks:

```viz name="load-balancer" mode="loop"
{ "servers": 3, "failing": 1 }
```
