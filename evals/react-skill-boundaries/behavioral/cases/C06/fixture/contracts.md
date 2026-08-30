# Service facts

`GET /reservations/:id` returns a monotonic `version`. `POST /cancellation-quote` returns the `reservationVersion` it evaluated and a `policyRevision`. The confirm endpoint rejects any version mismatch. A reservation update can arrive between either read; two individually successful responses are not necessarily a coherent pair.
