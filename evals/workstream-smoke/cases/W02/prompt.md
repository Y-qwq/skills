# W02 — Resume and coordinate after contract drift

Use the loaded `workstream` skill to resume the existing `inbox-refresh` workstream represented by the fixture:

> 继续做。BE 已经改好了接口，你让前端接上，并检查整体是不是可以交付。

The harness cannot create an independent session, but it can run an internal worker. The fixture contains historical context, legacy single-status task records, a newer live authority snapshot, and an interrupted v1-to-v2 migration in which the destination attempt receipt already exists. Resume the migration idempotently before acting: preserve an equivalent destination, never overwrite a divergent collision, and write `schema_version: 2` only after legacy residue and references validate. Then map `planned` to backlog pending readiness review, `waiting` to backlog with an explicit blocker, and `completed`/receipt claims to reported until current Lead verification. Do not mutate a real repository or remote. Show how you reconcile state, dispatch or execute the frontend work, update context, verify integration, and report status without automatically upgrading historical completion to verified.
