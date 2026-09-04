---
schema_version: 2
id: "{{review_id}}"
workstream_id: "{{workstream_id}}"
intent: inspect
status: queued
title: "{{review_title}}"
created_at: "{{created_at}}"
presented_at: null
resolved_at: null
related_tasks: []
context_refs: []
reading:
  estimated_minutes: null
  content_size: small
  recommendation: "{{review_recommendation}}"
  summary: "{{review_summary}}"
resolution: null
---

# Attention item

{{review_question_or_artifact}}

# Intent and autonomy

- Read `intent` and `status` from frontmatter; do not duplicate their current values in this body.
- Valid intents are `inspect`, `advise`, and `decide`; valid statuses are `queued`, `presented`, `resolved`, `waived`, and `superseded`.
- Related tasks are informational references; they do not block work by themselves.
- This record is an owner-facing attention item, not an approval gate. It does not count toward WIP.

# Blocking scope (derived)

Do not maintain a `blocks` field or derived blocking list here. The Lead derives blocking scope in the closeout by scanning open Tasks for `blockers[].ref: review:{{review_id}}`. Only an active `decide` review may be referenced this way. A blocker that references an `inspect`, `advise`, or terminal review is a schema error and must not affect scheduling; promote the review to active `decide` with a recorded reason before adding such a blocker.

# Reading guide

- Read estimated time, content size and recommendation from frontmatter.
- If queued content is large or there are many queued items, show an index and let the owner choose which review to explain. Do not wait for an optional review before continuing unrelated work.

# Resolution

Read the resolution and timestamps from frontmatter. When the review reaches a terminal status, promote durable conclusions and compact the active record according to the lifecycle reference.
