# W06 — Preserve attempts and choose a recovery lifecycle

Use the loaded `workstream` skill to simulate a Lead handling failed and blocked execution attempts in an isolated temporary workstreams root. The fixture is a schema v2 workstream with multiple current receipts. Do not contact a real repository or remote.

1. `T-101` returned a failed `AT-001`. Decide whether the evidence supports a retry, keep the Task lifecycle in the canonical Task record, and do not overwrite `AT-001`.
2. `T-102` returned a blocked `AT-001` because its environment dependency is unavailable. Return it to `backlog` with an active typed `blockers[]` entry; do not invent a `blocked` lifecycle.
3. `T-103` is no longer needed because a replacement Task exists. Mark it `superseded` with a replacement pointer.
4. After the retry is explicitly scheduled, create `AT-002` for `T-101`, process its successful receipt, and accept it only after Lead evidence checks. Show both attempts and the final Task lifecycle.

Report the recovery decisions, stable `AC-*` mappings, current attempt pointer, lifecycle changes, active blockers, WIP impact, and the user-facing closeout. Do not treat a worker result or receipt alone as `verified`.
