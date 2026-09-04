---
schema_version: 2
id: owner-attention
status: active
default_execution_mode: steady
default_wip_limit: 4
default_verification_depth: targeted
---

# Existing context

Owner attention is an informational queue. A review is not an approval gate. Only a `queued` or `presented` `intent: decide` item can block the Task that explicitly lists `ref: review:RV-*` in its typed `blockers[]`.
