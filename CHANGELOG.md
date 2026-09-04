# Changelog

This file records user-visible changes to the installed skill collection. Git commits and pull requests remain the source for implementation history.

## [0.3.0] - 2026-09-04

### Workstream

- Introduced context schema v2. Task lifecycle is now the single current execution truth, while readiness, typed dependencies, and typed blockers remain independent scheduling inputs.
- Replaced overwriteable delivery receipts with per-Task, per-attempt `AT-*` records. Retries preserve earlier evidence instead of rewriting it.
- Added the `RV-*` owner-attention queue with `inspect`, `advise`, and `decide` intents. Reviews do not consume WIP or block execution unless an active `decide` review is explicitly referenced by a Task blocker.
- Added evidence-first Lead verification with explicit acceptance and integration coverage. Sufficient worker evidence is reused; independent rework is reserved for declared depth or escalation signals.
- Added a derived six-section Lead closeout covering mode/WIP, backlog counts, hot Tasks, current-turn changes, blockers, and owner attention.
- Kept the default operating policy at `capture + wip_limit: 4`. WIP counts `scheduled`, `in_progress`, and `reported` Tasks only.
- Expanded the smoke corpus with retry, blocked, superseded, accepted, owner-attention, closeout, and interrupted-migration scenarios.

### Migrating existing workstreams

A newly started or resumed Lead using this version should detect a missing or v1 `schema_version`, an incomplete migration marker, or legacy residue and run the skill's resumable v1-to-v2 context migration automatically. The migration changes coordination records only: it must not execute backlog Tasks or treat historical claims as newly verified evidence.

The changelog is explanatory, not the migration contract. The canonical rules are in `skills/workstream/references/context-lifecycle.md`; an AI should load and follow those rules instead of deriving a migration procedure from this summary.

No prompt is required for a new Lead session. For a long-running Lead session that may still hold instructions from an older installed version, start a fresh session or send this one-time prompt after upgrading:

> 请重新加载当前安装的 `workstream` skill，并恢复 `<workstream-name>`。先只读检查 canonical context 的 `schema_version`、未完成 migration marker 和 legacy residue；如需升级，严格按 skill 的 Context migration 规则执行可重入的 v1→v2 迁移。迁移不得执行 backlog 中的业务 Task，也不得把历史 claim 自动视为已验证；遇到 source/target 内容冲突时停止覆盖并向我报告。完成后重建 `state.md` projection，并按新版六段 closeout 汇报迁移结果、未重新验证的历史 claims、active blockers 和 owner attention。
