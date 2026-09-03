# W02 — Resume and coordinate after contract drift

Use the loaded `workstream` skill to resume the existing `inbox-refresh` workstream represented by the fixture:

> 继续做。BE 已经改好了接口，你让前端接上，并检查整体是不是可以交付。

The harness cannot create an independent session, but it can run an internal worker. The fixture contains historical context, legacy single-status task records, and a newer live authority snapshot. Migrate legacy statuses before acting: `planned` becomes backlog pending readiness review, `waiting` becomes backlog with an explicit blocker, and `completed`/receipt claims become reported until current lead verification. Do not mutate a real repository or remote. Show how you reconcile state, dispatch or execute the frontend work, update context, verify integration, and report status without automatically upgrading historical completion to verified.
