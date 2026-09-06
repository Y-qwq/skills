# W08 — Budget stop and repeated wakeups

Use the workstream skill with `fixture/events.json`. The full business goal remains incomplete. Host events and capabilities in the fixture are immutable observations; do not invent a stopped response. No real tools, workstreams or goals may be mutated.

Return one JSON step per event, preserving order: `{ "status": "idle|running|draining|paused", "actions": [], "notice": null }`. Action vocabulary: `dispatch`, `start_driver`, `request_stop`, `wait`, `cleanup`, `checkpoint`, `report`. A notice is a short reason key, not prose. Process the account guard, worker result, host response, repeated automatic wakeups, explicit status query, quota reset and owner resume. Describe any limitation in one sentence after the JSON.
