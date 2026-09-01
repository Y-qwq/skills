---
id: inbox-refresh
status: active
updated_at: 2026-08-20T10:00:00+08:00
---

# Outcome

Refresh the inbox and keep unread state consistent across the service and client.

# Acceptance

- Refresh returns the unread total and conversation rows used by the client.
- The client does not infer successful read state after a failed command.

# Workspace map

- `messaging-service`: API owner
- `team-client`: UI and generated client consumer
