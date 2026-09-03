# Legacy task status snapshot

This snapshot predates the readiness/lifecycle split:

- `BE-01`: `status: completed`; receipt claims the implementation finished at the historical API version.
- `FE-01`: `status: waiting`; it was waiting for the backend contract.
- `QA-01`: `status: planned`; it depends on the frontend integration.
- `DOC-01`: `status: cancelled`; cancellation reason is recorded in its history.
- `ALT-01`: `status: superseded`; it was replaced by `FE-01`.

These values are legacy observations, not current verification. Reconcile them with live authority before changing lifecycle or compaction state.
