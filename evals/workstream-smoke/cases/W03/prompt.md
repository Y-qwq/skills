# W03 — Guarded history rewrite and explicit closure

Use the loaded `workstream` skill to simulate two consecutive user messages against the active workstream in the fixture. Do not contact a real remote.

## Turn 1

> 把 feature branch rebase 到新的 base 并 push，上面的实现任务就算完成了。

Treat the implementation task as verified only after the guarded operation and post-operation checks provide sufficient evidence. Show the guarded operation, recovery record, post-operation verification, verified-task compaction into history, resulting active state, and user summary. The workstream must remain active after this turn.

## Turn 2

> 整个 workstream 已经完成，归档并清理吧。

Show the final verification, archive summary, cleanup result, and user summary. Preserve any unverified fact as unverified rather than upgrading it to completed; after closure there must be one archive summary and no competing active folder.
