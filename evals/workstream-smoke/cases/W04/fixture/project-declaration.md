# Project declaration

The project explicitly declares the following workstream placement:

- Canonical context owner: `client-workspace`
- Active context root: `/tmp/workstream-eval/project/client-workspace/.agents/workstreams`
- User-level archive root: `/tmp/workstream-eval/user/.agents/workstreams/archive`
- Default WIP limit: `2`
- Default execution mode: `capture`
- Pre-ready policy: `explicit_only`
- The supplied temporary harness root is only the isolation boundary; it is not a competing context owner.
- The project has one lead writer for shared context. Other workspaces return receipts.
