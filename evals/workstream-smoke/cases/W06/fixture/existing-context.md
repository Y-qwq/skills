---
schema_version: 2
id: recovery-attempts
status: active
default_execution_mode: steady
default_wip_limit: 4
default_verification_depth: targeted
---

# Existing context

The workstream owns a reversible import change. Task acceptance IDs are stable `AC-*` values, and every execution attempt has a preserved `AT-*` receipt under the Task directory. Worker evidence is sealed at `reported`; the Lead later records only its verification decision.
