# W07 — Present owner attention in Lead closeout

Use the loaded `workstream` skill to simulate a Lead work cycle after a Task has completed in an isolated temporary workstreams root. The fixture contains small and large owner-facing review items. Do not contact a real repository or remote.

1. Verify the completed Task using its current attempt evidence, then derive the current task status and owner attention for the closeout.
2. Present the small queued `inspect` item inline; it is informational and may be resolved in the same closeout because its content was fully shown.
3. Keep the presented non-blocking `advise` item compact and allow Lead progress under its recorded reversible assumption.
4. Highlight the queued `decide` item because `T-202` explicitly references `review:RV-003` in its canonical Task `blockers[]`. Derive the blocking scope from Task records, not from a review-owned `blocks` list.
5. Because the queued content is large, show an index, reading costs, and recommended order, and let the owner choose which review to explain. Do not persist a session status or count reviews toward WIP.
6. Reject the invalid blocker candidates in the fixture that point at `inspect` or `advise` reviews. Only an active `decide` review can be the target of a `review:RV-*` Task blocker.

The closeout must include mode/WIP, backlog readiness counts, hot tasks, this-turn changes, Task blockers, and owner attention. Show how unrelated work can continue while only the narrow Task blocked by `RV-003` waits.
