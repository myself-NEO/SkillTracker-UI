Follow one request hop by hop; the picture changes as you scroll:

````scrolly name="request-journey"
{ "rttMs": 30, "cacheHit": false }
---
**DNS.** The browser needs an IP address for `api.example.com`. A resolver answers from its cache or asks the authoritative servers, and returns the load balancer's address. The answer is cached for its TTL, so this cost is usually paid once.
---
**TCP.** The browser opens a connection to the load balancer with the three-way handshake (SYN, SYN-ACK, ACK): one full round trip before any data is sent.
---
**TLS.** With TLS 1.3 the browser and the load balancer agree on keys in one more round trip, and the browser checks the certificate. The load balancer *terminates* TLS: it decrypts the request so it can route it.
---
**Load balancer to app server.** The request takes half a round trip to reach the load balancer, which picks a healthy app server and forwards it over a connection it keeps open, so no new handshake is needed inside the data centre.
---
**Cache.** The app server looks in the cache first. A hit answers in about a millisecond and the request is nearly done.
---
**Database.** On a miss the app server queries the database, usually the slowest hop inside the data centre, and writes the result back to the cache for the next request.
---
**The way back.** The response returns through the same hops. Add it up: the handshakes and the distance cost more than the servers' work, which is why connection reuse, HTTP/2 and caching close to users matter so much.
````
